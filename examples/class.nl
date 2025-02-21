/*

  * @name: Class
  * @description: A simple class implementation
  * @input: string, int
  * @output: N/A

*/

class Person {
  name = "";
  age = 0;

  skill constructor(newName, newAge) {
    this.name = newName;
    this.age = newAge;
  }

  skill sayHello() {
    echo("Hello, my name is " + this.name + ". I am " + this.age + " years old!");
  }
}

stat human = new Person("Felix", 20);
human.sayHello();