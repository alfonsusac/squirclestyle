import { SpringConfig, SpringConfigInput } from "./config";

import { NumberSpring } from "./NumberSpring";
import { raf } from "../utils/raf";

export class AutoNumberSpring extends NumberSpring {
  constructor(
    initialValue: number,
    config?: SpringConfigInput,
    readonly targetWindow?: Window | null,
    observable = false
  ) {
    super(initialValue, config, observable);
  }

  setTargetValue(value: number, velocity?: number) {
    const wasAtRest = this.isAtRest;

    super.setTargetValue(value);

    if (velocity !== undefined) {
      this.currentVelocity = velocity;
    }

    this.framesSinceTargetChange = 0;

    if (wasAtRest && !this.isAtRest && !this.isAnimating) {
      this.animateWhileNotAtRest();
    }
  }

  private framesSinceTargetChange = 0;

  snapToTarget(target = this.targetValue): void {
    super.snapToTarget(target);
  }

  private isAnimating = false;

  private async animateWhileNotAtRest() {
    if (this.isAnimating) {
      console.warn("Spring is already animating");
      return;
    }

    this.isAnimating = true;

    const targetWindow = this.targetWindow ?? window;
    this.valueChangeAtom?.reportChanged();

    // Get initial frame time
    let lastFrameTime = await raf(targetWindow);

    while (!this.isAtRest) {
      if (!this.isAnimating) break;

      const time = await raf(targetWindow);

      if (!this.isAnimating) break;

      const deltaTime = time - lastFrameTime;

      lastFrameTime = time;

      super.advanceTimeBy(deltaTime);

      if (this.framesSinceTargetChange++ > 2000) {
        console.warn("Spring is not settling");
        super.snapToTarget();
        break;
      }
    }

    this.isAnimating = false;
  }

  destroy() {
    this.isAnimating = false;
    this.stop();
  }
}
