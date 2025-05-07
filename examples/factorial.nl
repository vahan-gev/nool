/*

 * @name: Factorial
 * @description: Function to calculate the factorial of a number
 * @input: int
 * @output: int

*/

skill factorial(n: int): int {
  encounter(n <= 0) {
    reward 1;
  }
  reward n * factorial(n - 1);
}

echo(factorial(5)); // Output: 120