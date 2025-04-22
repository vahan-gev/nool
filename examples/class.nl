/*

  * @name: Class
  * @description: A simple class implementation
  * @input: string, int
  * @output: N/A

*/

class Person {
  name: string;
  age: int;

  skill sayHello(): string {
    reward "Hello, my name is " + this.name + " and I am " + this.age + " years old.";
  }
}

stat human = Person("Felix", 20);

echo(human.sayHello()); // Output: Hello, my name is Felix and I am 20 years old.