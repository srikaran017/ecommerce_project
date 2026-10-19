const sharp = require('sharp');
const fs = require('fs');

async function generateMasterLogo() {
  console.log('--- Step 1: Loading original card image at 2048x2048 ---');
  const { data: origData, info: origInfo } = await sharp('public/images/logo-original-card.jpg')
    .resize(2048, 2048, { fit: 'fill', kernel: 'lanczos3' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = origInfo.width;
  const h = origInfo.height;

  // Step 2: Sample background border to fit 2D polynomial surface
  console.log('--- Step 2: Fitting background lighting surface ---');
  const bgSamples = [];
  for (let y = 0; y < h; y += 32) {
    for (let x = 0; x < w; x += 32) {
      if (x >= 140 && x <= 1860 && y >= 400 && y <= 1650) continue;
      const idx = (y * w + x) * 3;
      bgSamples.push({ x, y, r: origData[idx], g: origData[idx+1], b: origData[idx+2] });
    }
  }

  function fitChannel(ch) {
    const N = 6;
    const ATA = Array.from({length: N}, () => new Float64Array(N));
    const ATb = new Float64Array(N);
    for (const s of bgSamples) {
      const nx = s.x / w, ny = s.y / h;
      const basis = [1, nx, ny, nx*nx, ny*ny, nx*ny];
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) ATA[i][j] += basis[i] * basis[j];
        ATb[i] += basis[i] * s[ch];
      }
    }
    const A = ATA.map((row, i) => [...row, ATb[i]]);
    for (let i = 0; i < N; i++) {
      let maxR = i;
      for (let k = i + 1; k < N; k++) if (Math.abs(A[k][i]) > Math.abs(A[maxR][i])) maxR = k;
      const tmp = A[i]; A[i] = A[maxR]; A[maxR] = tmp;
      const piv = A[i][i];
      for (let j = i; j <= N; j++) A[i][j] /= piv;
      for (let k = 0; k < N; k++) {
        if (k === i) continue;
        const factor = A[k][i];
        for (let j = i; j <= N; j++) A[k][j] -= factor * A[i][j];
      }
    }
    return A.map(row => row[N]);
  }

  const rCoeff = fitChannel('r');
  const gCoeff = fitChannel('g');
  const bCoeff = fitChannel('b');

  function evalBg(coeff, x, y) {
    const nx = x / w, ny = y / h;
    return coeff[0] + coeff[1]*nx + coeff[2]*ny + coeff[3]*nx*nx + coeff[4]*ny*ny + coeff[5]*nx*ny;
  }

  // Step 3: Pure Foil Extraction
  console.log('--- Step 3: Extracting pure gold foil without drop shadows ---');
  const rawAlpha = new Float32Array(w * h);
  const rawR = new Float32Array(w * h);
  const rawG = new Float32Array(w * h);
  const rawB = new Float32Array(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 3;
      const pIdx = y * w + x;

      const r = origData[idx];
      const g = origData[idx+1];
      const b = origData[idx+2];

      const bgR = evalBg(rCoeff, x, y);
      const bgG = evalBg(gCoeff, x, y);
      const bgB = evalBg(bCoeff, x, y);

      const bgLum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const deltaLum = lum - bgLum;

      const inZone = (x >= 180 && x <= 1820 && y >= 450 && y <= 1620);

      if (inZone && deltaLum > 6.0 && r > (bgR - 2) && g > (bgG - 4)) {
        const a = Math.min(1.0, (deltaLum - 6.0) / 12.0);
        rawAlpha[pIdx] = a;
        rawR[pIdx] = r;
        rawG[pIdx] = g;
        rawB[pIdx] = b;
      }
    }
  }

  // Step 4: Dilation for Bolder Cursive Strokes
  console.log('--- Step 4: Morphological dilation (radius 3.2px) ---');
  const boldAlpha = new Float32Array(w * h);
  const boldR = new Float32Array(w * h);
  const boldG = new Float32Array(w * h);
  const boldB = new Float32Array(w * h);

  const radius = 3.2;
  const iRad = Math.ceil(radius);
  const kernelOffsets = [];
  for (let dy = -iRad; dy <= iRad; dy++) {
    for (let dx = -iRad; dx <= iRad; dx++) {
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d <= radius) {
        const weight = 1.0 - (d / (radius + 0.5)) * 0.25;
        kernelOffsets.push({ dx, dy, weight });
      }
    }
  }

  for (let y = iRad; y < h - iRad; y++) {
    for (let x = iRad; x < w - iRad; x++) {
      const pIdx = y * w + x;
      let maxA = 0;
      let bestR = 0, bestG = 0, bestB = 0;

      for (let k = 0; k < kernelOffsets.length; k++) {
        const { dx, dy, weight } = kernelOffsets[k];
        const nIdx = (y + dy) * w + (x + dx);
        const a = rawAlpha[nIdx];
        if (a > 0) {
          const wA = a * weight;
          if (wA > maxA) {
            maxA = wA;
            bestR = rawR[nIdx];
            bestG = rawG[nIdx];
            bestB = rawB[nIdx];
          }
        }
      }

      if (maxA > 0.05) {
        boldAlpha[pIdx] = Math.min(1.0, maxA * 1.5);
        boldR[pIdx] = bestR;
        boldG[pIdx] = bestG;
        boldB[pIdx] = bestB;
      }
    }
  }

  // Step 5: Connected Component Noise Filter
  console.log('--- Step 5: Connected component noise filtering ---');
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    mask[i] = boldAlpha[i] > 0.1 ? 1 : 0;
  }

  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  const cleanAlpha = new Float32Array(w * h);

  let keptComponents = 0;
  let prunedComponents = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const startIdx = y * w + x;
      if (mask[startIdx] === 0 || visited[startIdx] === 1) continue;

      let head = 0, tail = 0;
      queue[tail++] = startIdx;
      visited[startIdx] = 1;
      const comp = [];

      while (head < tail) {
        const curr = queue[head++];
        comp.push(curr);
        const cx = curr % w;
        const cy = Math.floor(curr / w);

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const nIdx = ny * w + nx;
              if (mask[nIdx] === 1 && visited[nIdx] === 0) {
                visited[nIdx] = 1;
                queue[tail++] = nIdx;
              }
            }
          }
        }
      }

      if (comp.length >= 220) {
        keptComponents++;
        for (const idx of comp) {
          cleanAlpha[idx] = boldAlpha[idx];
        }
      } else {
        prunedComponents++;
      }
    }
  }
  console.log(`Components: kept ${keptComponents} brand elements, pruned ${prunedComponents} speckles`);

  // Step 5.5: Morphological Closing (fills any micro-notches or paper texture pits)
  console.log('--- Step 5.5: Morphological closing for solid stroke fill ---');
  const closedAlpha = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      let maxA = cleanAlpha[idx];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const a = cleanAlpha[(y + dy) * w + (x + dx)];
          if (a > maxA) maxA = a;
        }
      }
      closedAlpha[idx] = maxA;
    }
  }

  // Step 6: 2D Separable Gaussian Blur + Hermite Smoothstep
  console.log('--- Step 6: 2D Gaussian smoothing and anti-aliasing ---');
  // 1D Gaussian kernel for sigma = 1.4 (radius = 3)
  const gKernel = [0.035, 0.109, 0.213, 0.286, 0.213, 0.109, 0.035];
  const gRad = 3;

  // Horizontal blur pass
  const tempBlur = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const rowOffset = y * w;
    for (let x = gRad; x < w - gRad; x++) {
      let sum = 0;
      for (let k = -gRad; k <= gRad; k++) {
        sum += closedAlpha[rowOffset + x + k] * gKernel[k + gRad];
      }
      tempBlur[rowOffset + x] = sum;
    }
  }

  // Vertical blur pass + smoothstep threshold
  const finalAlpha = new Float32Array(w * h);
  for (let y = gRad; y < h - gRad; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let k = -gRad; k <= gRad; k++) {
        sum += tempBlur[(y + k) * w + x] * gKernel[k + gRad];
      }

      // Smoothstep transfer function between 0.22 and 0.65
      // Produces silky, vector-perfect, anti-aliased contours with zero pixel breakage
      if (sum <= 0.22) {
        finalAlpha[y * w + x] = 0;
      } else if (sum >= 0.65) {
        finalAlpha[y * w + x] = 1.0;
      } else {
        const t = (sum - 0.22) / (0.65 - 0.22);
        finalAlpha[y * w + x] = t * t * (3 - 2 * t);
      }
    }
  }

  // Step 7: Render Master Assets (Gold, Dark Charcoal, Light Ivory)
  console.log('--- Step 7: Rendering HD color buffers ---');
  const goldBuf = Buffer.alloc(w * h * 4);
  const darkBuf = Buffer.alloc(w * h * 4);
  const lightBuf = Buffer.alloc(w * h * 4);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pIdx = y * w + x;
      const a = finalAlpha[pIdx];
      if (a <= 0.01) continue;

      const outIdx = pIdx * 4;
      const finalA = Math.round(Math.min(255, a * 255));

      // 1. Rich Deep Antique Gold (Optimized for High Contrast on Light/White Navbar)
      // Base: rich warm bronze-gold (R: 115..162, G: 80..120, B: 36..68)
      // Contrast against white is ~5.2:1 (easily readable, luxurious metallic presence)
      const origR = boldR[pIdx] || 235;
      const origG = boldG[pIdx] || 198;
      const origB = boldB[pIdx] || 156;
      const lum = 0.299 * origR + 0.587 * origG + 0.114 * origB;
      const normLum = Math.max(0, Math.min(1, (lum - 125) / 120));

      const goldR = Math.min(255, Math.round(115 + normLum * 48));
      const goldG = Math.min(255, Math.round(80 + normLum * 42));
      const goldB = Math.min(255, Math.round(36 + normLum * 32));

      goldBuf[outIdx] = goldR;
      goldBuf[outIdx + 1] = goldG;
      goldBuf[outIdx + 2] = goldB;
      goldBuf[outIdx + 3] = finalA;

      // 2. Obsidian Charcoal / Dark Logo (for crisp contrast on white/cream)
      darkBuf[outIdx] = 26;
      darkBuf[outIdx + 1] = 23;
      darkBuf[outIdx + 2] = 23;
      darkBuf[outIdx + 3] = finalA;

      // 3. Ivory Light Logo (for dark themes / footer)
      lightBuf[outIdx] = 250;
      lightBuf[outIdx + 1] = 246;
      lightBuf[outIdx + 2] = 238;
      lightBuf[outIdx + 3] = finalA;
    }
  }

  // Step 8: Trim excess transparency and add balanced breathing padding
  console.log('--- Step 8: Trimming transparent margins ---');
  const trimmedGold = await sharp(goldBuf, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 5 })
    .extend({ top: 14, bottom: 14, left: 18, right: 18, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  const trimmedDark = await sharp(darkBuf, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 5 })
    .extend({ top: 14, bottom: 14, left: 18, right: 18, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  const trimmedLight = await sharp(lightBuf, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 5 })
    .extend({ top: 14, bottom: 14, left: 18, right: 18, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  await sharp(trimmedGold).toFile('public/images/logo.png');
  await sharp(trimmedGold).toFile('public/images/logo-gold.png');
  await sharp(trimmedDark).toFile('public/images/logo-dark.png');
  await sharp(trimmedLight).toFile('public/images/logo-light.png');

  const meta = await sharp('public/images/logo.png').metadata();
  console.log(`DONE! Successfully written Ultra HD assets! Final resolution: ${meta.width} x ${meta.height}`);
}

generateMasterLogo().catch(console.error);
