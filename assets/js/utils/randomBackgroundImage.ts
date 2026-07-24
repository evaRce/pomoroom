const BACKGROUND_IMAGE_COUNT = 5;

export function getRandomBackgroundImageNumber(): number {
  return Math.floor(Math.random() * BACKGROUND_IMAGE_COUNT) + 1;
}
