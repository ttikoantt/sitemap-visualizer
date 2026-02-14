// Client-side image comparison using perceptual hashing and pixel comparison
// No external dependencies - uses Canvas API

// --- Perceptual Hash (pHash) ---
// Simplified DCT-based perceptual hash for browser use

export async function computePerceptualHash(imageDataUrl: string): Promise<string> {
  const img = await loadImage(imageDataUrl);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Resize to 32x32 grayscale for hash computation
  const SIZE = 32;
  canvas.width = SIZE;
  canvas.height = SIZE;
  ctx.drawImage(img, 0, 0, SIZE, SIZE);
  const pixels = ctx.getImageData(0, 0, SIZE, SIZE);

  // Convert to grayscale
  const gray: number[] = [];
  for (let i = 0; i < pixels.data.length; i += 4) {
    gray.push(
      0.299 * pixels.data[i] +
      0.587 * pixels.data[i + 1] +
      0.114 * pixels.data[i + 2]
    );
  }

  // Compute average (excluding top-left which holds the DC component)
  const avg = gray.reduce((a, b) => a + b, 0) / gray.length;

  // Generate hash: 1 if pixel > average, 0 otherwise
  let hash = '';
  for (const val of gray) {
    hash += val > avg ? '1' : '0';
  }

  // Convert binary string to hex
  let hex = '';
  for (let i = 0; i < hash.length; i += 4) {
    hex += parseInt(hash.slice(i, i + 4), 2).toString(16);
  }

  return hex;
}

// --- Hamming Distance ---
export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return Infinity;

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    const a = parseInt(hash1[i], 16);
    const b = parseInt(hash2[i], 16);
    // Count differing bits
    let xor = a ^ b;
    while (xor > 0) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
}

// --- Perceptual Hash Similarity ---
export function pHashSimilarity(hash1: string, hash2: string): number {
  const totalBits = hash1.length * 4;
  const distance = hammingDistance(hash1, hash2);
  if (distance === Infinity) return 0;
  return 1 - distance / totalBits;
}

// --- SSIM (Structural Similarity) ---
// Simplified SSIM implementation for browser

export async function computeSSIM(
  imageDataUrl1: string,
  imageDataUrl2: string,
  windowSize: number = 8,
): Promise<number> {
  const SIZE = 128; // Resize both images to 128x128 for comparison

  const data1 = await getGrayscaleData(imageDataUrl1, SIZE);
  const data2 = await getGrayscaleData(imageDataUrl2, SIZE);

  const L = 255; // Dynamic range
  const k1 = 0.01;
  const k2 = 0.03;
  const c1 = (k1 * L) ** 2;
  const c2 = (k2 * L) ** 2;

  let ssimSum = 0;
  let windowCount = 0;

  for (let y = 0; y <= SIZE - windowSize; y += windowSize) {
    for (let x = 0; x <= SIZE - windowSize; x += windowSize) {
      let sum1 = 0, sum2 = 0;
      let sq1 = 0, sq2 = 0;
      let cross = 0;
      const n = windowSize * windowSize;

      for (let wy = 0; wy < windowSize; wy++) {
        for (let wx = 0; wx < windowSize; wx++) {
          const idx = (y + wy) * SIZE + (x + wx);
          const v1 = data1[idx];
          const v2 = data2[idx];
          sum1 += v1;
          sum2 += v2;
          sq1 += v1 * v1;
          sq2 += v2 * v2;
          cross += v1 * v2;
        }
      }

      const mu1 = sum1 / n;
      const mu2 = sum2 / n;
      const sigma1sq = sq1 / n - mu1 * mu1;
      const sigma2sq = sq2 / n - mu2 * mu2;
      const sigma12 = cross / n - mu1 * mu2;

      const num = (2 * mu1 * mu2 + c1) * (2 * sigma12 + c2);
      const den = (mu1 * mu1 + mu2 * mu2 + c1) * (sigma1sq + sigma2sq + c2);

      ssimSum += num / den;
      windowCount++;
    }
  }

  return windowCount > 0 ? ssimSum / windowCount : 0;
}

// --- Pixel Diff ---
export async function computePixelDiff(
  imageDataUrl1: string,
  imageDataUrl2: string,
): Promise<{ diffRatio: number; diffCount: number }> {
  const SIZE = 128;
  const data1 = await getGrayscaleData(imageDataUrl1, SIZE);
  const data2 = await getGrayscaleData(imageDataUrl2, SIZE);

  const threshold = 25; // pixel difference threshold
  let diffCount = 0;
  const total = data1.length;

  for (let i = 0; i < total; i++) {
    if (Math.abs(data1[i] - data2[i]) > threshold) {
      diffCount++;
    }
  }

  return {
    diffRatio: diffCount / total,
    diffCount,
  };
}

// --- Helpers ---
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

async function getGrayscaleData(imageDataUrl: string, size: number): Promise<number[]> {
  const img = await loadImage(imageDataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, size, size);
  const pixels = ctx.getImageData(0, 0, size, size);

  const gray: number[] = [];
  for (let i = 0; i < pixels.data.length; i += 4) {
    gray.push(
      0.299 * pixels.data[i] +
      0.587 * pixels.data[i + 1] +
      0.114 * pixels.data[i + 2]
    );
  }
  return gray;
}
