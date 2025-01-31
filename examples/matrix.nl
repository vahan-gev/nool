/*

 * @name: Matrix
 * @description: A function that will print all the values in matrix
 * @input: array
 * @output: void

*/

stat matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
];

skill printMatrix(matrix) {
  stat i = 0;
  stat j = 0;
  quest (i < length(matrix)) {
    j = 0;
    quest (j < length(matrix[i])) {
      echo(matrix[i][j]);
      j = j + 1;
    }
    i = i + 1;
  }
}

printMatrix(matrix);