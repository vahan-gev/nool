class Player {
  name = "";
  score = 0;
  position = [0, 0, 0];
  specialPower = "";

  skill constructor(name, specialPower) {
    this.name = name;
    this.score = randomInt(0, 250);
    this.position = [randomInt(0, 100), randomInt(0, 100), randomInt(0, 100)];
    this.specialPower = specialPower;
  }

  skill setPlayerPosition(positionArr) {
    this.position = positionArr;
  }

  skill getPlayerPosition() {
    reward this.position;
  }

  skill setPlayerName(name) {
    this.name = name;
  }

  skill getPlayerName() {
    reward this.name;
  }
}

stat playerCount = int(input("Enter the amount of player that you want to have: "));
stat playerBase = [];
stat playerNames = [
  "John", "Jane", "Doe", "Alice", "Bob", "Eve",
  "Charlie", "Dave", "Grace", "Hank", "Ivy", "Jack", "Karen", "Leo", "Mona", "Nina", "Oscar", "Paul", "Quinn", "Rachel",
  "Sam", "Tina", "Umar", "Vera", "Walter", "Xena", "Yara", "Zane", "Aiden", "Bella", "Caleb", "Diana", "Ethan", "Fiona",
  "George", "Holly", "Isaac", "Jasmine", "Kevin", "Lily", "Mason", "Nora", "Oliver", "Penny", "Quentin", "Rebecca",
  "Scott", "Tessa", "Ulysses", "Victor", "Wendy", "Xander", "Yvonne", "Zack"
];

stat magicalPowers = [
  "Pyrokinesis", "Hydrokinesis", "Aerokinesis", "Geokinesis", "Electrokinesis", "Cryokinesis",
  "Chronokinesis", "Photokinesis", "Umbrakinesis", "Telekinesis", "Telepathy", "Invisibility",
  "Shapeshifting", "Healing", "Energy Absorption", "Gravity Manipulation", "Portal Creation",
  "Illusions", "Force Fields", "Mind Control", "Precognition", "Postcognition", "Astral Projection",
  "Necromancy", "Summoning", "Size Manipulation", "Sound Manipulation", "Magnetokinesis",
  "Shadow Travel", "Luck Manipulation", "Regeneration", "Memory Manipulation", "Metal Manipulation",
  "Elemental Fusion", "Super Speed", "Super Strength", "Super Intelligence", "Animal Communication",
  "Plant Manipulation", "Poison Generation", "Weather Manipulation", "Emotion Control",
  "Clairvoyance", "Dimensional Travel", "Dream Manipulation", "Duplication", "Elasticity",
  "X-Ray Vision", "Sonic Screams", "Energy Blasts", "Camouflage", "Blood Manipulation",
  "Aura Reading", "Artifact Enchantment", "Time Reversal", "Quantum Manipulation"
];

quest (length(playerBase) < playerCount) {
  push(playerBase, new Player(playerNames[randomInt(0, length(playerNames) - 1)], magicalPowers[randomInt(0, length(magicalPowers) - 1)]));
}

stat currentPlayer = null;
stat currentPlayerPosition = null;
stat index = 0;
quest(index < length(playerBase)) {
  currentPlayer = playerBase[index];
  currentPlayerPosition = currentPlayer.position;
  echo("Player #" + (index + 1) + ": " + currentPlayer.name + " has a power: " + currentPlayer.specialPower + " and is located at {x: " + currentPlayerPosition[0] + ", y: " + currentPlayerPosition[1] + ", z: " + currentPlayerPosition[2] + "} with the score of: " + currentPlayer.score);
  index = index + 1;
}
