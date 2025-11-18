export async function raf(targetWindow: Window = window) {
  return new Promise<number>((resolve) => {
    requestAnimationFrame((time) => {
      resolve(time);
    });
  });
}
