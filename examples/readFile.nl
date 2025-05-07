/*

 * @name: Read File with input
 * @description: Script to read a file and return its content
 * @input: string
 * @output: string

*/

stat filepath = input("Enter the path of the file that you want to read: ");
stat content = readFile(filepath);
echo(content);