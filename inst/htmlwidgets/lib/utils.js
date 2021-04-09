/**
 * transposes array of arrays / matrix
 * @param m
 */

const transpose = (m) => {
    return m[0].map((x,i) => m.map(x => x[i]))
}

/**
 * Subtracts two matrices
 * @param X
 * @param y
 */
 const center_columns = (X) => {
    let colmeans = math.mean(X, 0)
    for (let rowIndex = 0; rowIndex < X.length; rowIndex++) {
      const row = X[rowIndex];
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const value = row[colIndex];
        const meanval = colmeans[colIndex];
        X[rowIndex][colIndex] = value - meanval;
      }
    }
    return X;
  }
