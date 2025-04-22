/*

  * @name: Fibonacci
  * @description: Calculate the nth Fibonacci number using while loop
  * @input: int
  * @output: int

*/

skill fibonacci(n: int): int {
  stat fib = [0, 1];
  stat i = 2;
  stat newValue = 0;
  quest (i <= n) {
    newValue = fib[i - 1] + fib[i - 2];
    push(fib, newValue);
    i = i + 1;
  }
  reward fib[length(fib) - 1];
}

echo(fibonacci(5)); // Output: 5
echo(fibonacci(10)); // Output: 55

