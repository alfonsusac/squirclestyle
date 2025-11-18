/**
 * Actual physics emulation happens here. This is heavily optimized for performance.
 *
 * Note: for better precision we sample steps in 1ms intervals, but we only return the last step, so if we calculate 1 frame in 60fps (16ms) - we'll actually perform 16 steps.
 * This is because it is possible that spring will move over 'central' point in one 16fps step, so force should change direction in the meanwhile, otherwise spring would keep accelerating on the other side.
 * It would be not a 'critical' bug as spring would still settle, but it would ignore subtle 'wiggle' at the end of the animation.
 */

import { SECOND_MS } from "../utils/time";
import { SpringConfig } from "./config";
import { calculatePrecission } from "./NumberSpring";

/**
 * Each step returns new x and new velocitiy. As those are called thousands of times per second, we reuse the same array to avoid GC and constant array creation.
 * Important: as a result of this, result of this function should instantly be destructured and never mutated, eg const [newX, newV] = stepSpringOne(...)
 */
let reusedResult: [number, number] = [0, 0];

function returnReused(x: number, v: number) {
  reusedResult[0] = x;
  reusedResult[1] = v;
  return reusedResult;
}

const USE_PRECISE_EMULATION = true;

function stepSpringBy(
  deltaMS: number,
  currentX: number,
  currentVelocity: number,
  targetX: number,
  stiffness: number,
  damping: number,
  mass: number,
  clamp: boolean,
  precision: number
): [newX: number, newV: number] {
  const deltaS = deltaMS / 1000;

  /**
   * The further we are from target, the more force spring tension will apply
   */
  const springTensionForce = -(currentX - targetX) * stiffness;
  /**
   * The faster we are moving, the more force friction force will be applied
   */
  const frictionForce = -currentVelocity * damping;

  // the bigger the mass, the less 'raw' force will actually affect the movement
  const finalForce = (springTensionForce + frictionForce) / mass;

  const newVelocity = currentVelocity + finalForce * deltaS;
  const newX = currentX + newVelocity * deltaS;

  if (clamp) {
    if (currentX < targetX && newX > targetX) {
      return returnReused(targetX, 0);
    }

    if (currentX > targetX && newX < targetX) {
      return returnReused(targetX, 0);
    }
  }

  const newDistanceToTarget = Math.abs(newX - targetX);

  // When both velocity and distance to target are under the precision, we 'snap' to the target and stop the spring
  // Otherwise - spring would keep moving, slower and slower, forever as it's energy would never fall to 0
  if (Math.abs(newVelocity) < precision && newDistanceToTarget < precision) {
    return returnReused(targetX, 0);
  }

  return returnReused(newX, newVelocity);
}

export function stepSpring(
  deltaMS: number,
  currentX: number,
  currentV: number,
  targetX: number,
  stiffness: number,
  damping: number,
  mass: number,
  clamp: boolean,
  precision: number
): [newX: number, newV: number] {
  if (!USE_PRECISE_EMULATION) {
    return stepSpringBy(
      deltaMS,
      currentX,
      currentV,
      targetX,
      stiffness,
      damping,
      mass,
      clamp,
      precision
    );
  }

  const upperDeltaMS = Math.ceil(deltaMS);

  if (upperDeltaMS > 10_000) {
    throw new Error("Spring emulation is too long, finishing simulation");
  }

  for (let i = 1; i <= upperDeltaMS; i++) {
    // Last, sub-1ms step - do precise emulation
    if (i > deltaMS) {
      [currentX, currentV] = stepSpringBy(
        i - deltaMS,
        currentX,
        currentV,
        targetX,
        stiffness,
        damping,
        mass,
        clamp,
        precision
      );
    } else {
      // Emulate in 1ms steps
      [currentX, currentV] = stepSpringBy(
        1,
        currentX,
        currentV,
        targetX,
        stiffness,
        damping,
        mass,
        clamp,
        precision
      );
    }
  }

  return returnReused(currentX, currentV);
}

const MAX_SPRING_TEST_SETTLE_TIME = 20 * SECOND_MS;

export function getSpringSettleTime({
  stiffness,
  damping,
  mass,
  clamp,
  precision: precisionBase,
}: SpringConfig) {
  if (mass === 0) {
    return 0;
  }

  let x = 0;
  let velocity = 0.000001;

  const targetX = 1000;

  const precision = calculatePrecission(x, targetX, precisionBase);

  let springDuration = 0;

  const step = 1000 / 60;

  while (x !== targetX && velocity !== 0) {
    [x, velocity] = stepSpringBy(
      step,
      x,
      velocity,
      targetX,
      stiffness,
      damping,
      mass,
      clamp,
      precision
    );

    if (isNaN(x) || isNaN(velocity)) {
      // console.warn("Spring simulation returned NaN, finishing simulation", {
      //   stiffness,
      //   damping,
      //   mass,
      //   x,
      //   velocity,
      //   targetX,
      //   precision,
      //   springDuration,
      // });
      break;
    }
    springDuration += step;

    if (springDuration > MAX_SPRING_TEST_SETTLE_TIME) {
      // console.warn("Spring settle time is too long, finishing simulation", {
      //   MAX_SPRING_TEST_SETTLE_TIME,
      //   stiffness,
      //   damping,
      //   mass,
      //   x,
      //   velocity,
      //   targetX,
      // });

      break;
    }
  }

  return springDuration;
}
