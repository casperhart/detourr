import { Dim, Matrix, ProjectionMatrix } from "./types";

export function multiply3(a: Matrix, b: ProjectionMatrix): Matrix {
  // TODO: return flattened result as Float32Array for performance
  let aRows = a.length;
  let aCols = a[0].length;
  let result = new Array(aRows);
  for (let r = 0; r < aRows; ++r) {
    const row = new Array(3);
    result[r] = row;
    const ar = a[r];
    for (let c = 0; c < 3; ++c) {
      let sum = 0.;
      for (let i = 0; i < aCols; ++i) {
        sum += ar[i] * b[i][c];
      }
      row[c] = sum;
    }
  }
  return result;
}

export function multiply2(a: Matrix, b: ProjectionMatrix): Matrix {
  // TODO: return flattened result as Float32Array for performance
  let aRows = a.length;
  let aCols = a[0].length;
  let result = new Array(aRows);
  for (let r = 0; r < aRows; ++r) {
    const row = new Array(3);
    result[r] = row;
    const ar = a[r];
    for (let c = 0; c < 2; c++) {
      let sum = 0.;
      for (let i = 0; i < aCols; ++i) {
        sum += ar[i] * b[i][c];
      }
      row[c * 2] = sum;
    }
    row[1] = 0; // no y dimension for 2D
  }
  return result;
}

// TODO: add tests
export function getColMeans(X: Matrix): Matrix {
  let n = X.length;
  let colSums = X.reduce((a, b) => {
    return a.map((val, ind) => val + b[ind]);
  });
  return [colSums.map((val) => val / n)];
}

export function centerColumns(X: Matrix, colMeans: Matrix): Matrix {
  let centered = X.map(function (row: number[]) {
    return row.map((element, index) => element - colMeans[0][index]);
  });
  return centered;
}
