// perspective.ts

// Solves a system of linear equations Ax = b using Gaussian elimination.
function solve(A: number[][], b: number[]): number[] {
  const n = A.length;
  for (let i = 0; i < n; i++) {
    let maxEl = Math.abs(A[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > maxEl) {
        maxEl = Math.abs(A[k][i]);
        maxRow = k;
      }
    }

    for (let k = i; k < n; k++) {
      [A[maxRow][k], A[i][k]] = [A[i][k], A[maxRow][k]];
    }
    [b[maxRow], b[i]] = [b[i], b[maxRow]];

    for (let k = i + 1; k < n; k++) {
      const c = -A[k][i] / A[i][i];
      for (let j = i; j < n; j++) {
        if (i === j) {
          A[k][j] = 0;
        } else {
          A[k][j] += c * A[i][j];
        }
      }
      b[k] += c * b[i];
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i > -1; i--) {
    x[i] = b[i] / A[i][i];
    for (let k = i - 1; k > -1; k--) {
      b[k] -= A[k][i] * x[i];
    }
  }
  return x;
}

// Calculates the perspective transform matrix from 4 source to 4 destination points.
export function getPerspectiveTransform(src: {x: number, y: number}[], dst: {x: number, y: number}[]): number[] {
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = [src[i].x, src[i].y];
    const [xp, yp] = [dst[i].x, dst[i].y];
    A.push([x, y, 1, 0, 0, 0, -x * xp, -y * xp]);
    A.push([0, 0, 0, x, y, 1, -x * yp, -y * yp]);
    b.push(xp);
    b.push(yp);
  }
  const h = solve(A, b);
  h.push(1);
  return h;
}

// Applies a perspective warp to an ImageData object.
export function warpPerspective(imageData: ImageData, transformMatrix: number[], width: number, height: number): ImageData {
  const warpedData = new Uint8ClampedArray(width * height * 4);
  const [h11, h12, h13, h21, h22, h23, h31, h32, h33] = transformMatrix;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const denominator = x * h31 + y * h32 + h33;
      const srcX = (x * h11 + y * h12 + h13) / denominator;
      const srcY = (x * h21 + y * h22 + h23) / denominator;

      const x_floor = Math.floor(srcX);
      const y_floor = Math.floor(srcY);

      if (x_floor >= 0 && x_floor < imageData.width - 1 && y_floor >= 0 && y_floor < imageData.height - 1) {
        const x_frac = srcX - x_floor;
        const y_frac = srcY - y_floor;

        const idx_tl = (y_floor * imageData.width + x_floor) * 4;
        const idx_tr = (y_floor * imageData.width + x_floor + 1) * 4;
        const idx_bl = ((y_floor + 1) * imageData.width + x_floor) * 4;
        const idx_br = ((y_floor + 1) * imageData.width + x_floor + 1) * 4;

        const dest_idx = (y * width + x) * 4;

        for (let i = 0; i < 4; i++) { // R, G, B, A
          const top = imageData.data[idx_tl + i] * (1 - x_frac) + imageData.data[idx_tr + i] * x_frac;
          const bottom = imageData.data[idx_bl + i] * (1 - x_frac) + imageData.data[idx_br + i] * x_frac;
          warpedData[dest_idx + i] = top * (1 - y_frac) + bottom * y_frac;
        }
      }
    }
  }
  return new ImageData(warpedData, width, height);
}