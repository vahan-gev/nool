import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";

// Programs expected to be syntactically correct
const syntaxChecks = [
  ["simplest syntactically correct program", "break;"],
  ["multiple statements", "echo(1);\nbreak;\nx=5; reward; reward;"],
  ["variable declarations", "stat e=99*1;\nconst z=false;"],
  ["type declarations", "class S {x:T1; y:T2; z:Bool;}"],
  ["function with no params, no reward type", "skill f() {}"],
  ["function with one param", "skill f(x: Int) {}"],
  ["function with two params", "skill f(x: Int, y: Bool) {}"],
  ["function with no params + reward type", "skill f(): Int {}"],
  ["function types in params", "skill f(g: (Int): Bool) {}"],
  ["function types rewarded", "skill f(): (Int): (Int): Void {}"],
  ["array type for param", "skill f(x: [[[Bool]]]) {}"],
  ["array type rewarded", "skill f(): [[Int]] {}"],
  ["assignments", "a--; c++; abc=9*3; a=1;"],
  ["complex var assignment", "c(5)[2] = 100;c.p.r=1;c.q(8)[2](1,1).z=1;"],
  ["complex var bumps", "c(5)[2]++;c.p.r++;c.q(8)[2](1,1).z--;"],
  ["call in statement", "stat x = 1;\nf(100);\necho(1);"],
  ["call in exp", "echo(5 * f(x, y, 2 * y));"],
  ["short if", "encounter (true) { echo(1); }"],
  ["longer if", "encounter (true) { echo(1); } fallback { echo(1); }"],
  [
    "even longer if",
    "encounter (true) { echo(1); } fallback encounter (false) { echo(1);}",
  ],
  ["quest loop", "quest (true) {}"],
  ["quest with one statement block", "quest (true) { stat x = 1; }"],
  ["repeat with long block", "repeat (2) { echo(1);\necho(2);echo(3); }"],
  ["if inside loop", "repeat (3) { encounter (true) { echo(1); } }"],
  ["for closed range", "for (i in 2...9*1) {}"],
  ["for half-open range", "for (i in 2..<9*1) {}"],
  ["for collection-as-id", "for (i in things) {}"],
  ["for collection-as-lit", "for (i in [3,5,8]) {}"],
  ["conditional", "reward x?y:z?y:p;"],
  ["ors can be chained", "echo(1 || 2 || 3 || 4 || 5);"],
  ["ands can be chained", "echo(1 && 2 && 3 && 4 && 5);"],
  ["relational operators", "echo(1<2||1<=2||1==2||1!=2||1>=2||1>2);"],
  ["arithmetic", "reward 2 * x + 3 / 5 - -1 % 7 ** 3 ** 3;"],
  ["length", "reward length(c); reward length([1,2,3]);"],
  ["boolean literals", "stat x = false || true;"],
  ["all numeric literal forms", "echo(8 * 89.123 * 1.3E5 * 1.3E+5 * 1.3E-5);"],
  ["empty array literal", "echo([Int]());"],
  ["nonempty array literal", "echo([1, 2, 3]);"],
  ["parentheses", "echo(83 * ((((((((-(13 / 21))))))))) + 1 - 0);"],
  ["indexing array literals", "echo([1,2,3][1]);"],
  ["non-Latin letters in identifiers", "stat コンパイラ = 100;"],
  ["a simple string literal", 'echo("hello😉😬💀🙅🏽‍♀️—");'],
  ["end of program inside comment", "echo(0); // yay"],
  ["comments with no text", "echo(1);//\necho(0);//"],
];

// Programs with syntax errors that the parser will detect
const syntaxErrors = [
  ["non-letter in an identifier", "stat ab😭c = 2;", /Line 1, col 8:/],
  ["malformed number", "stat x= 2.;", /Line 1, col 11:/],
  ["a float with an E but no exponent", "stat x = 5E * 11;", /Line 1, col 11:/],
  ["a missing right operand", "echo(5 -);", /Line 1, col 9:/],
  ["a non-operator", "echo(7 * ((2 _ 3));", /Line 1, col 14:/],
  ["an expression starting with a )", "reward );", /Line 1, col 8:/],
  ["a statement starting with expression", "x * 5;", /Line 1, col 3:/],
  ["an illegal statement on line 2", "echo(5);\nx * 5;", /Line 2, col 3:/],
  ["a statement starting with a )", "echo(5);\n)", /Line 2, col 1:/],
  ["an expression starting with a *", "stat x = * 71;", /Line 1, col 10:/],
  ["negation before exponentiation", "echo(-2**2);", /Line 1, col 9:/],
  ["mixing ands and ors", "echo(1 && 2 || 3);", /Line 1, col 13:/],
  ["mixing ors and ands", "echo(1 || 2 && 3);", /Line 1, col 13:/],
  ["associating relational operators", "echo(1 < 2 < 3);", /Line 1, col 12:/],
  ["quest without braces", "quest (true)\necho(1);", /Line 2, col 1/],
  ["if without braces", "encounter (x < 3)\necho(1);", /Line 2, col 1/],
  ["for as identifier", "stat for = 3;", /Line 1, col 6/],
  ["if as identifier", "stat encounter = 8;", /Line 1, col 6/],
  ["unbalanced brackets", "skill f(): Int[;", /Line 1, col 15/],
  ["empty array without type", "echo([]);", /Line 1, col 7/],
  ["bad array literal", "echo([1,2,]);", /Line 1, col 11/],
  ["empty subscript", "echo(a[]);", /Line 1, col 8/],
  ["true is not assignable", "true = 1;", /Line 1, col 5/],
  ["false is not assignable", "false = 1;", /Line 1, col 6/],
  ["numbers cannot be subscripted", "echo(500[x]);", /Line 1, col 9/],
  ["numbers cannot be called", "echo(500(x));", /Line 1, col 9/],
  ["numbers cannot be dereferenced", "echo(500.x);", /Line 1, col 10/],
  ["no-paren function type", "skill f(g:Int->Int) {}", /Line 1, col 14/],
  ["string lit with unknown escape", 'echo("ab\\zcdef");', /col 10/],
  ["string lit with newline", 'echo("ab\ncdef");', /col 9/],
  ["string lit with unescaped quote", 'echo("ab"cdef");', /col 10/],
];

describe("The parser", () => {
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
