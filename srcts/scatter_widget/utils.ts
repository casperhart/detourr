import { Matrix, ProjectionMatrix } from "./data";

export function multiply(a: Matrix, b: ProjectionMatrix): Matrix {
    // TODO: return flattened result as Float32Array for performance
    let aRows = a.length;
    let aCols = a[0].length;
    let bCols = 3
    let result = new Array(aRows);
    for (let r = 0; r < aRows; ++r) {
        const row = new Array(bCols);
        result[r] = row;
        const ar = a[r];
        for (let c = 0; c < bCols; ++c) {
            let sum = 0.;
            for (let i = 0; i < aCols; ++i) {
                sum += ar[i] * b[i][c];
            }
            row[c] = sum;
        }
    }
    return result;
}

// TODO: add tests
function getColMeans(X: Matrix): number[] {
    let n = X.length
    let colSums = X.reduce((a, b) => {
        return a.map((val, ind) => val + b[ind])
    })
    return colSums.map(val => val / n)
}

export function centerColumns(X: Matrix): Matrix {
    let colMeans = getColMeans(X)
    let centered = X.map(function (row: number[]) {
        return row.map((element, index) => element - colMeans[index])
    });
    return centered
}