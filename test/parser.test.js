import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";

// Programs expected to be syntactically correct
const syntaxChecks = [
  ["simplest syntactically correct program", "escape;"],
  ["multiple statements", "echo(1);\nescape;\nstat x=5; reward 1;"],
  ["variable declarations", "stat e=99*1;"],
  [
    "class declaration",
    "class MyClass { x = 1; skill constructor() { echo(x); } }",
  ],
  ["function with no params", "skill f() { echo(1); }"],
  ["function with two params", "skill f(x, y) { echo(1); }"],
  ["method calls", "myObj.method(x, y);"],
  ["property assignments", "myObj.property = 100;"],
  ["property access", "echo(obj.property);"],
  ["assignments", "x = 1; y = 2;"],
  ["function calls", "myFunction(1, 2, 3);"],
  [
    "if statements",
    "encounter(true) { echo(1); } alternative(false) { echo(2); } fallback { echo(3); }",
  ],
  ["while loops", "quest(true) { echo(1); }"],
  ["repeat loops", "repeat 3 { echo(1); }"],
  ["array literals", "stat arr = [1, 2, 3];"],
  ["array access", "echo(arr[0]);"],
  ["nested array access", "echo(matrix[1][2]);"],
  ["new instance creation", "stat obj = new MyClass(1, 2);"],
  ["logical operators", "echo(true && false || true);"],
  ["comparison operators", "echo(1 < 2 && 3 >= 4);"],
  ["arithmetic", "echo(2 * x + 3 / 5 - 1 % 7);"],
  ["boolean literals", "stat x = false || true;"],
  ["numeric literals", "echo(8 * 89.123);"],
  ["string literals", 'echo("hello");'],
  ["comments", "echo(1); /* multiline comment */ echo(2);"],
  ["import statement", 'import "mymodule";'],
];

// Programs with syntax errors that the parser will detect
const syntaxErrors = [
  ["non-letter in an identifier", "stat ab@c = 2;", /Line 1, col 8:/],
  ["malformed number", "stat x = 2.;", /Line 1, col 12:/],
  ["a missing right operand", "echo(5 -);", /Line 1, col 9:/],
  ["a non-operator", "echo(7 * ((2 _ 3));", /Line 1, col 14:/],
  ["an expression starting with a )", "reward );", /Line 1, col 8:/],
  ["a statement starting with expression", "x * 5;", /Line 1, col 3:/],
  ["unmatched brackets", "skill f() { echo(1);", /Line 1, col 21:/],
  ["missing parentheses in function call", "myFunction;", /Line 1, col 11:/],
  ["invalid method syntax", "obj.method;", /Line 1, col 11:/],
  ["invalid array access", "arr[];", /Line 1, col 5:/],
  ["missing block in encounter", "encounter(true) echo(1);", /Line 1, col 17:/],
  ["missing block in quest", "quest(true) echo(1);", /Line 1, col 13:/],
  ["invalid repeat syntax", "repeat x { echo(1); }", /Line 1, col 8:/],
];

describe("The NoolLanguage parser", () => {
  for (const [scenario, source] of syntaxChecks) {
    it(`matches ${scenario}`, () => {
      assert(parse(source).succeeded());
    });
  }
  for (const [scenario, source, errorMessagePattern] of syntaxErrors) {
    it(`throws on ${scenario}`, () => {
      assert.throws(() => parse(source), errorMessagePattern);
    });
  }
});
