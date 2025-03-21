/*

 * @name: Even or Odd
 * @description: Function to check if a number is even or odd
 * @input: int
 * @output: string

*/

skill checkIfEven(number: int): boolean {
  encounter(number % 2 == 0) {
    reward true;
  } fallback {
    reward false;
  }
}

echo(checkIfEven(4)); // Output: true
echo(checkIfEven(5)); // Output: false