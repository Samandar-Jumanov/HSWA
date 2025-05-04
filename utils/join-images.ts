import sharp from 'sharp';

export async function joinImages(
  leftImageBuffer: Buffer,
  rightImageBuffer: Buffer
): Promise<Buffer> {
  // Set a target height (same for both)
  const targetHeight = 512;

  const leftResized = await sharp(leftImageBuffer)
    .resize({ height: targetHeight })
    .toBuffer();

  const rightResized = await sharp(rightImageBuffer)
    .resize({ height: targetHeight })
    .toBuffer();

  const leftMeta = await sharp(leftResized).metadata();
  const rightMeta = await sharp(rightResized).metadata();

  const totalWidth = (leftMeta.width || 0) + (rightMeta.width || 0);

  const joined = await sharp({
    create: {
      width: totalWidth,
      height: targetHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      { input: leftResized, top: 0, left: 0 },
      { input: rightResized, top: 0, left: leftMeta.width || 0 },
    ])
    .png()
    .toBuffer();

  return joined;
}
