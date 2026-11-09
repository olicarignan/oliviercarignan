// Resolves once the page's CSS entrance animation has finished.
export function entranceFinished() {
  const entrance = document
    .getAnimations()
    .filter((animation) => animation.animationName?.startsWith("enter-"));
  return Promise.allSettled(entrance.map((animation) => animation.finished));
}
