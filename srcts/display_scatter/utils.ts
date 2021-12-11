import { Matrix } from "./types";

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
