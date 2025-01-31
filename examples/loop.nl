/*

 * @name: Loop
 * @description: A loop that will print odd numbers from 1 to 20
 * @input: N/A
 * @output: N/A

*/


stat number = 1;
quest(number < 20) {
  echo(number);
  number = number + 2;
}