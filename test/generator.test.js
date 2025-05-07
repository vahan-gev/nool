import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";
import analyze from "../src/analyzer.js";
import optimize from "../src/optimizer.js";
import generate from "../src/generator.js";

function dedent(s) {
  return `${s}`.replace(/(?<=\n)\s+/g, "").trim();
}

const fixtures = [
  {
    name: "small",
    source: `
      stat x = 3 * 7;
      x++;
      x--;
      stat y = true;
      y = 5 ** -x / -100 > - x || false;
      echo((y && y) || false || (x*2) != 5);
    `,
    expected: dedent`
      let x_1 = 21;
      x_1++;
      x_1--;
      let y_2 = true;
      y_2 = (((5 ** -(x_1)) / -(100)) > -(x_1));
      console.log(((y_2 && y_2) || ((x_1 * 2) !== 5)));
    `,
  },
  {
    name: "if",
    source: `
      stat x = 0;
      encounter (x == 0) { echo("1"); }
      encounter (x == 0) { echo(1); } fallback { echo(2); }
      encounter (x == 0) { echo(1); } fallback encounter (x == 2) { echo(3); }
      encounter (x == 0) { echo(1); } fallback encounter (x == 2) { echo(3); } fallback { echo(4); }
    `,
    expected: dedent`
      let x_1 = 0;
      if ((x_1 === 0)) {
        console.log("1");
      }
      if ((x_1 === 0)) {
        console.log(1);
      } else {
        console.log(2);
      }
      if ((x_1 === 0)) {
        console.log(1);
      } else
        if ((x_1 === 2)) {
          console.log(3);
        }
      if ((x_1 === 0)) {
        console.log(1);
      } else
        if ((x_1 === 2)) {
          console.log(3);
        } else {
          console.log(4);
        }
    `,
  },
  {
    name: "while",
    source: `
      stat x = 0;
      quest(x < 5) {
        stat y = 0;
        quest(y < 5) {
          echo(x * y);
          y = y + 1;
          break;
        }
        x = x + 1;
      }
    `,
    expected: dedent`
      let x_1 = 0;
      while ((x_1 < 5)) {
        let y_2 = 0;
        while ((y_2 < 5)) {
          console.log((x_1 * y_2));
          y_2 = (y_2 + 1);
          break;
        }
        x_1 = (x_1 + 1);
      }
    `,
  },
  {
    name: "functions",
    source: `
      stat z = 0.5;
      skill f(x: float, y: boolean) {
        echo(sin(x) > π);
        reward;
      }
      skill g(): boolean {
        reward false;
      }
      f(sqrt(z), g());
    `,
    expected: dedent`
      let z_1 = 0.5;
      function f_2(x_3, y_4) {
        console.log((Math.sin(x_3) > Math.PI));
        return;
      }
      function g_5() {
        return false;
      }
      f_2(Math.sqrt(z_1), g_5());
    `,
  },
  {
    name: "arrays",
    source: `
      stat a = [true, false, true];
      stat b = [10, 20, 30];
      const c = [[int]]();
      const d = b;
      echo(a[1] || (b[0] < 88 ? false : true));
    `,
    expected: dedent`
      let a_1 = [true,false,true];
      let b_2 = [10,20,30];
      let c_3 = [];
      let d_4 = b_2;
      console.log((a_1[1] || (((b_2[0] < 88)) ? (false) : (true))));
    `,
  },
  {
    name: "classes",
    source: `
      class S { x: int; }
      stat x = S(3);
      echo(x.x);
    `,
    expected: dedent`
      class S_1 {
      constructor(x_2) {
      this["x_2"] = x_2;
      }
      }
      let x_3 = new S_1(3);
      console.log((x_3["x_2"]));
    `,
  },
  {
    name: "for loops",
    source: `
      for(i in 1..<50) {
        echo(i);
      }
      for(j in [10, 20, 30]) {
        echo(j);
      }
      repeat(3) {
        // hello
      }
      for(k in 1...10) {
      }
    `,
    expected: dedent`
      for (let i_1 = 1; i_1 < 50; i_1++) {
        console.log(i_1);
      }
      for (let j_2 of [10,20,30]) {
        console.log(j_2);
      }
      for (let i_3 = 0; i_3 < 3; i_3++) {
      }
      for (let k_4 = 1; k_4 <= 10; k_4++) {
      }
    `,
  },
  {
    name: "taking an input",
    source: `
      stat x = input("Enter a number: ");
      echo(x);
    `,
    expected: dedent`
      import * as fs from 'fs';
      
      function getNoolInput(prompt) { // NOOL_INPUT_FUNCTION_DEFINITION
        process.stdout.write(prompt);
        const buffer = Buffer.alloc(1024);
        const bytesRead = fs.readSync(0, buffer, 0, buffer.length, null);
        return buffer.toString('utf8', 0, bytesRead).trim();
      }
      let x_1 = getNoolInput("Enter a number: ");
      console.log(x_1);
    `,
  },
  {
    name: "writing to a file",
    source: `
      stat x = "hello";
      writeFile("output.txt", x);
    `,
    expected: dedent`
      let x_1 = "hello";
      import * as fs from 'fs';
      fs.writeFileSync("output.txt", x_1);
    `,
  },
  {
    name: "reading from a file",
    source: `
      stat x = readFile("input.txt");
      echo(x);
    `,
    expected: dedent`
      import * as fs from 'fs';
      let x_1 = fs.readFileSync("input.txt", 'utf8');
      console.log(x_1);
    `,
  },
  {
    name: "randomInt",
    source: `
      stat x = randomInt(1, 10);
      echo(x);
    `,
    expected: dedent`
      let x_1 = Math.floor(Math.random() * (10 - 1 + 1)) + 1;
      console.log(x_1);
    `,
  },
  {
    name: "pop",
    source: `
      stat x = [1, 2, 3];
      stat y = pop(x);
      echo(y);
    `,
    expected: dedent`
      let x_1 = [1,2,3];
      let y_2 = x_1.pop();
      console.log(y_2);
    `,
  },
  {
    name: "push",
    source: `
      stat x = [1, 2, 3];
      push(x, 4);
      echo(x);
    `,
    expected: dedent`
      let x_1 = [1,2,3];
      x_1.push(4);
      console.log(x_1);
    `,
  },
  {
    name: "hypot",
    source: `
      stat x = hypot(3.0, 4.0);
      echo(x);
    `,
    expected: dedent`
      let x_1 = Math.hypot(3,4);
      console.log(x_1);
    `,
  },
  {
    name: "π",
    source: `
      stat x = π;
      echo(x);
    `,
    expected: dedent`
      let x_1 = Math.PI;
      console.log(x_1);
    `,
  },
  {
    name: "toString",
    source: `
      stat x = 3;
      stat y = toString(x);
      echo(y);
    `,
    expected: dedent`
      let x_1 = 3;
      let y_2 = '' + x_1;
      console.log(y_2);
    `,
  },
  {
    name: "toInt",
    source: `
      stat x = "3";
      stat y = toInt(x);
      echo(y);
    `,
    expected: dedent`
      let x_1 = "3";
      let y_2 = Math.floor(x_1);
      console.log(y_2);
    `,
  },
  {
    name: "toFloat",
    source: `
      stat x = 3;
      stat y = toFloat(x);
      echo(y);
    `,
    expected: dedent`
      let x_1 = 3;
      let y_2 = parseFloat(x_1);
      console.log(y_2);
    `,
  },
  {
    name: "class",
    source: `
      class S {
        x: int;
      }
      stat x = S(3);
      echo(x.x);
    `,
    expected: dedent`
      class S_1 {
      constructor(x_2) {
      this["x_2"] = x_2;
      }
      }
      let x_3 = new S_1(3);
      console.log((x_3["x_2"]));
    `,
  },
  {
    name: "class-with-methods",
    source: `
      class Calculator {
        value: int;
        skill add(x: int): int {
          reward this.value + x;
        }
      }
      stat calc = Calculator(5);
      echo(calc.add(3));
    `,
    expected: dedent`
      class Calculator_1 {
      constructor(value_2) {
      this["value_2"] = value_2;
      this["add_3"] = (x_4) => {
      return ((this["value_2"]) + x_4);
      };
      }
      }
      let calc_5 = new Calculator_1(5);
      console.log((calc_5["add_3"])(3));
    `,
  },
  {
    name: "spread",
    source: `
      stat x = [1, 2, 3];
      stat y = [...x];
      echo(y);
    `,
    expected: dedent`
      let x_1 = [1,2,3];
      let y_2 = [...x_1];
      console.log(y_2);
    `,
  },
  {
    name: "sin",
    source: `
      stat x = sin(3.0);
      echo(x);
    `,
    expected: dedent`
      let x_1 = Math.sin(3);
      console.log(x_1);
    `,
  },
  {
    name: "cos",
    source: `
      stat x = cos(3.0);
      echo(x);
    `,
    expected: dedent`
      let x_1 = Math.cos(3);
      console.log(x_1);
    `,
  },
  {
    name: "exp",
    source: `
      stat x = exp(3.0);
      echo(x);
    `,
    expected: dedent`
      let x_1 = Math.exp(3);
      console.log(x_1);
    `,
  },
  {
    name: "ln",
    source: `
      stat x = ln(3.0);
      echo(x);
    `,
    expected: dedent`
      let x_1 = Math.log(3);
      console.log(x_1);
    `,
  },
  {
    name: "length",
    source: `
      stat x = [1, 2, 3];
      stat y = length(x);
      echo(y);
    `,
    expected: dedent`
      let x_1 = [1,2,3];
      let y_2 = x_1.length;
      console.log(y_2);
    `,
  },
  {
    name: "toLowerCase",
    source: `
      stat x = "HELLO";
      stat y = toLowerCase(x);
      echo(y);
    `,
    expected: dedent`
      let x_1 = "HELLO";
      let y_2 = x_1.toLowerCase();
      console.log(y_2);
    `,
  },
  {
    name: "toUpperCase",
    source: `
      stat x = "hello";
      stat y = toUpperCase(x);
      echo(y);
    `,
    expected: dedent`
      let x_1 = "hello";
      let y_2 = x_1.toUpperCase();
      console.log(y_2);
    `,
  },
  {
    name: "nool",
    source: `
      stat x = nool;
      echo(x);
    `,
    expected: dedent`
      let x_1 = null;
      console.log(x_1);
    `,
  },
];

describe("The code generator", () => {
  for (const fixture of fixtures) {
    it(`produces expected js output for the ${fixture.name} program`, () => {
      const actual = generate(optimize(analyze(parse(fixture.source))));
      assert.deepEqual(dedent(actual), fixture.expected);
    });
  }
});
