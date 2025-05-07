/*

 * @name: Tic Tac Toe
 * @description: An advanced Tic Tac Toe game
 * @input: n/a
 * @output: n/a

*/

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