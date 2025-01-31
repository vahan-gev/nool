# NOOL

![logo](docs/logo.png)

NOOL is a programming language designed to make coding more intuitive and engaging for gamers. It introduces game-inspired syntax and concepts to simplify software development, allowing developers to write code that feels more natural and expressive. With RPG-themed keywords and a flexible structure, NOOL aims to reduce complexity while maintaining powerful programming capabilities.

## Features

- Variables: Storage locations for data
- Operators: For performing operations on data, such as arithmetic and comparison
- Control Structures: Including conditional statements and loops
- Functions: Reusable blocks of code that perform specific tasks
- Input/Output: Mechanisms for reading input and displaying output
- Comments: Ways to add explanatory text within the code
- Arrays or Lists: Data structures for storing collections of items
- Classes and Objects: For object-oriented programming
- File Handling: Capabilities for reading from and writing to files


## Examples

1. A loop that will print "Hello, World!" 5 times
```
repeat 5 {
  echo("Hello, World!");
}
```

2. A loop that will print odd numbers from 1 to 20
```
stat number = 1;
quest(number < 20) {
  echo(number);
  number = number + 2;
}
```

3. A program that will loop through an array and print every value
```
stat arr = [1, 2, 3, 4, 5];
stat index = 0;
quest(index < length(arr)) {
  echo(arr[index]);
  index = index + 1;
}
```

4. A function that will ask for a number and determine if it is even or odd
```
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
```

5. A program that will calculate the nth Fibonacci number using while loop
```
skill fibonacci(n) {
  stat fib = [0, 1];
  stat i = 2;
  stat newValue = 0;
  quest (i <= n) {
    newValue = fib[i - 1] + fib[i - 2];
    push(fib, newValue);
    i = i + 1;
  }
  reward fib[-1];
}

echo(fibonacci(10)); // 55
```

6. A program that will solve the Towers of Hanoi puzzle
```
skill towerOfHanoi(n, source, target, auxiliary) {
  encounter (n > 0) {
    towerOfHanoi(n - 1, source, auxiliary, target);

    echo("Move disk " + n + " from " + source + " to " + target);

    towerOfHanoi(n - 1, auxiliary, target, source);
  }
}

towerOfHanoi(3, "A", "C", "B");
```