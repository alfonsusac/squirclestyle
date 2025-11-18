import { createFunctionWithProps } from "./function";

export function createCleanup() {
  const cleanupFunctions = new Set<() => void>();

  function clean() {
    const functions = Array.from(cleanupFunctions);
    cleanupFunctions.clear();
    functions.forEach((fn) => fn());
  }

  return createFunctionWithProps(clean, {
    set next(fn: () => void) {
      cleanupFunctions.add(fn);
    },
  });
}
