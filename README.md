# NOOL

![logo](docs/logo.png)

NOOL is a programming language designed to make coding more intuitive and engaging for gamers. It introduces game-inspired syntax and concepts to simplify software development, allowing developers to write code that feels more natural and expressive. With RPG-themed keywords and a flexible structure, NOOL aims to reduce complexity while maintaining powerful programming capabilities.

## Website
[Our website](https://sona-sar.github.io/nool-web/)

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
repeat(5) {
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

1. A function that will determine if a number is even or odd
```
skill checkIfEven(number) {
  encounter (number % 2 == 0) {
    reward true;
  } fallback {
    reward false;
  }
}

echo(checkIfEven(5));
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

6. A simple example of how classes work
```
class Person {
  name: string;
  age: int;

  skill sayHello(): string {
    reward "Hello, my name is " + this.name + " and I am " + this.age + " years old.";
  }
}

stat human = Person("Felix", 20);

echo(human.sayHello());
```

7. A simple example on how to read a file and take input from user
```
stat filepath = input("Enter the path of the file that you want to read: ");
stat content = readFile(filepath);
echo(content);
```

8. A simple example on how to write a file
```
stat filepath = "output.txt";
writeFile(filepath, "Hello, World!");
```

9. A really big and a little too advanced example of Tic Tac Toe game that showcases almost every feature that the language has. Vector2 is useless in this game :D
```
class Vector2 {
  x: int;
  y: int;

  skill getX(): int {
    reward this.x;
  }

  skill getY(): int {
    reward this.y;
  }
}

class Player {
  name: string;
  position: Vector2;

  skill getName(): string {
    reward this.name;
  }

  skill getPosition(): Vector2 {
    reward this.position;
  }
}

class Game {
  players: [Player];
  score: int;
}

stat players = [Player]();
stat playerCount = input("Enter number of players: ");

repeat(toInt(playerCount)) {
  stat name = input("Enter player #" + (length(players) + 1) + " name: ");
  stat player = Player(name, Vector2(0, 0));
  push(players, player);
}

stat game = Game(players, 0);

echo("==============================");
for(i in 0...(length(players)-1)) {
  echo("[" + i + "] > " + "Player: " + players[i].getName() + " | Position: [" + players[i].getPosition().getX() + ", " + players[i].getPosition().getY() + "]");
}

stat selectedPlayerIndex = input("Select a player by index: ");
stat currentPlayer = players[toInt(selectedPlayerIndex)];
stat lives = 3;
stat round = 1;
echo(currentPlayer.getName() + " is selected");

for(i in 0...(length(players)-1)) {
  encounter(i != toInt(selectedPlayerIndex)) {
    echo("==============================");
    echo("Round " + round + " | " + currentPlayer.getName() + " vs " + players[i].getName());
    echo("==============================");
    stat action = input("Choose rock/paper/scissors: ");
    stat opponentAction = randomInt(0, 2);
    encounter(opponentAction == 0) {
      // Opponent chose rock
      encounter (toLowerCase(action) == "rock") {
        echo("Both chose rock! It's a tie!");
      } fallback encounter (toLowerCase(action) == "paper") {
        echo("Paper beats rock. " + currentPlayer.getName() + " wins!");
        game.score = game.score + 1;
      } fallback {
        echo("Rock beats scissors. " + players[i].getName() + " wins!");
        lives = lives - 1;
        encounter(lives == 0) {
          echo("Game Over! " + players[i].getName() + " wins!");
          break;
        }
      }
    } fallback encounter (opponentAction == 1) {
      // Opponent chose paper
      encounter (toLowerCase(action) == "rock") {
        echo("Paper beats rock. " + players[i].getName() + " wins!");
        lives = lives - 1;
        encounter(lives == 0) {
          echo("Game Over! " + players[i].getName() + " wins!");
          break;
        }
      } fallback encounter (toLowerCase(action) == "paper") {
        echo("Both chose paper! It's a tie!");
      } fallback {
        echo("Scissors beats paper. " + currentPlayer.getName() + " wins!");
        game.score = game.score + 1;
      }
    } fallback {
      // Opponent chose scissors
      encounter (toLowerCase(action) == "rock") {
        echo("Rock beats scissors. " + currentPlayer.getName() + " wins!");
        game.score = game.score + 1;
      } fallback encounter (toLowerCase(action) == "paper") {
        echo("Scissors beats paper. " + players[i].getName() + " wins!");
        lives = lives - 1;
        encounter(lives == 0) {
          echo("Game Over! " + players[i].getName() + " wins!");
          break;
        }
      } fallback {
        echo("Both chose scissors! It's a tie!");
      }
    }

    round = round + 1;
  }
}

echo("Games Finished! Final Score: " + game.score + ". Lives left: " + lives);
```
