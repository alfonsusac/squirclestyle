import { IAtom, createAtom } from "mobx";
import {
  SpringConfig,
  SpringConfigInput,
  resolveSpringConfigInput,
  validateSpringConfig,
} from "./config";
import { getSpringSettleTime, stepSpring } from "./step";

function getIsValidNumber(input: number) {
  if (typeof input !== "number") return false;

  if (!isFinite(input)) return false;

  if (isNaN(input)) return false;

  return true;
}

export function calculatePrecission(
  from: number,
  to: number,
  precisionBase: number
) {
  if (from === to) {
    return 1;
  }

  const diff = Math.max(1, Math.abs(from - to));

  const precisionDividre = 1 / precisionBase;

  return Math.max(diff, 1) / precisionDividre;
}

/**
 * Physics based spring, that is not based on browser timers, but instead requires manually advancing time.
 *
 * This allows generating animation in-advance, while being able to modify target values at any point, which is not possible with one-shoot "generateSpringFrames" libs
 *
 * Note: this will be called extremely often and needs to be well optimized
 */
export class NumberSpring {
  public config: SpringConfig;

  public time: number = 0; // Current time along the spring curve in ms (zero-based)
  private lastTargetChangeTime: number = 0;

  private _value: number; // the current value of the spring

  readonly valueChangeAtom: IAtom | null;

  get value() {
    this.valueChangeAtom?.reportObserved();

    return this._value;
  }

  set value(value: number) {
    this._value = value;

    this.valueChangeAtom?.reportChanged();
  }

  public currentVelocity: number = 0; // the current velocity of the spring

  public targetValue: number;

  /**
   * Precission is automatically set basing on offset between from<>to
   */
  private precission: number = 1;

  constructor(
    initialValue: number,
    input: SpringConfigInput = {},
    observable = false
  ) {
    this._value = initialValue;
    this.targetValue = initialValue;
    this.config = resolveSpringConfigInput(input);

    validateSpringConfig(this.config);

    this.valueChangeAtom = observable ? createAtom("NumberSpring.value") : null;
  }

  /**
   * If the spring has reached its `toValue`, or if its velocity is below the
   * `restVelocityThreshold`, it is considered at rest. If `stop()` is called
   * during a simulation, both `isAnimating` and `isAtRest` will be false.
   */
  get isAtRest(): boolean {
    return this.targetValue === this.value && this.currentVelocity === 0;
  }

  snapToTarget(target = this.targetValue) {
    this._value = target;
    this.targetValue = target;
    this.currentVelocity = 0;

    this.valueChangeAtom?.reportChanged();
  }

  setTargetValue(targetValue: number) {
    if (this.targetValue === targetValue) return;

    if (!getIsValidNumber(targetValue)) {
      throw new Error("Invalid target value");
    }

    this.lastTargetChangeTime = this.time;

    this.precission = calculatePrecission(
      this.value,
      targetValue,
      this.config.precision
    );

    this.targetValue = targetValue;
  }

  private lastConfigUpdate?: SpringConfigInput;

  /**
   * Updates the spring config with the given values.  Values not explicitly
   * supplied will be reused from the existing config.
   */
  updateConfig(updatedConfig: Partial<SpringConfig>) {
    if (this.lastConfigUpdate === updatedConfig) return;

    const newConfig: SpringConfig = {
      ...this.config,
      ...updatedConfig,
    };

    validateSpringConfig(newConfig);

    this.config = newConfig;
    this.lastConfigUpdate = updatedConfig;

    this.cachedSettleTime = null;
  }

  private cachedSettleTime: number | null = null;

  get settleTime() {
    if (this.cachedSettleTime !== null) {
      return this.cachedSettleTime;
    }

    this.cachedSettleTime = getSpringSettleTime(this.config);

    return this.cachedSettleTime;
  }

  advanceTimeTo(time: number) {
    const dt = time - this.time;

    this.advanceTimeBy(dt);
  }

  advanceTimeBy(dt: number) {
    if (dt === 0) return;
    if (dt < 0) throw new Error("Can't go back in time");

    this.time += dt;

    if (this.isAtRest) {
      return;
    }

    if (dt >= this.settleTime) {
      this.snapToTarget();
      return;
    }

    // Hello, Einstein!
    if (this.config.mass === 0) {
      this.snapToTarget();
      return;
    }

    // if (this.time - this.lastTargetChangeTime > this.settleTime * 2) {
    // log.warnOnce("Spring is not settling, snapping to target");
    // this.snapToTarget();
    // }

    [this.value, this.currentVelocity] = stepSpring(
      dt,
      this._value,
      this.currentVelocity,
      this.targetValue,
      this.config.stiffness,
      this.config.damping,
      this.config.mass,
      this.config.clamp,
      this.precission
    );
  }

  stop() {
    this.setTargetValue(this._value);
    this.snapToTarget();
  }
}
