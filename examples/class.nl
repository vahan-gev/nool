/*

  * @name: Class
  * @description: A simple class implementation
  * @input: string, int
  * @output: N/A

*/

class Person {
  name = "";
  age = 0;

  skill constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  skill sayHello() {
    echo("Hello, I'm " + this.name + " and I'm " + this.age + " years old.");
  }
}

stat human = new Person("Name");
echo(human);