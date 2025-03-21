class Vector2 {
  x: int;
  y: int;

  skill sum(): int {
    reward this.x + this.y;
  }
}

class Human {
  name: string;
  coordinate: Vector2;
}

stat testCoord = Vector2(3, 4);
stat testHuman = Human("Alice", testCoord);

echo(testHuman.coordinate.sum()); // Output: 7