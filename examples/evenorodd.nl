/*

 * @name: Even or Odd
 * @description: Function to check if a number is even or odd
 * @input: int
 * @output: string

*/

skill checkIfEven(number) {
  encounter (number % 2 == 0) {
    reward true;
  } fallback {
    reward false;
  }
}

stat num = int(input("Enter a number: "));
encounter (checkIfEven(num)) {
  echo("Number " + num + " is Even");
} fallback {
  echo("Number " + num + " is Odd");
}
