/*

  * @name: File Handling
  * @description: A simple example of writing in a file
  * @input: N/A
  * @output: N/A

*/

stat filename = input("Enter a file name: ");
stat data = input("Enter text to write: ");

writeFile("./examples/" + filename, data); 

appendFile("./examples/" + filename, "This text was appended");