/*

  * @name: Towers of Hanoi
  * @description: Solve the Towers of Hanoi puzzle
  * @input: int, string, string, string
  * @output: void

*/

skill towerOfHanoi(n, source, target, auxiliary) {
  encounter (n > 0) {
    // Move n - 1 disks from source to auxiliary, so they are out of the way
    towerOfHanoi(n - 1, source, auxiliary, target);

    // Move the nth disk from source to target
    echo("Move disk " + n + " from " + source + " to " + target);

    // Move the n - 1 disks that we left on auxiliary to target
    towerOfHanoi(n - 1, auxiliary, target, source);
  }
}

towerOfHanoi(3, "A", "C", "B");