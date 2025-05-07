import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";
import analyze from "../src/analyzer.js";
import {
  program,
  variableDeclaration,
  variable,
  binary,
  floatType,
} from "../src/core.js";

// Programs that are semantically correct
const semanticChecks = [
  ["variable declarations", 'const x = 1; stat y = "false";'],
  ["increment and decrement", "stat x = 10; x--; x++;"],
  ["initialize with empty array", "stat a = [int]();"],
  ["assign arrays", "stat a = [int]();stat b=[1];a=b;b=a;"],
  ["assign to array element", "stat a = [1,2,3]; a[1]=100;"],
  ["short return", "skill f() { reward; }"],
  ["long return", "skill f(): boolean { reward true; }"],
  ["return in nested if", "skill f() {encounter(true) {reward;}}"],
  ["break in nested if", "quest(false) {encounter(true) {break;}}"],
  ["long if", "encounter(true) {echo(1);} fallback {echo(3);}"],
  [
    "elsif",
    "encounter(true) {echo(1);} fallback encounter(true) {echo(0);} fallback {echo(3);}",
  ],
  ["for over collection", "for(i in [2,3,5]) {echo(1);}"],
  ["for in range", "for(i in 1..<10) {echo(0);}"],
  ["repeat", "repeat(3) {stat a = 1; echo(a);}"],
  ["conditionals with ints", "echo(true ? 8 : 5);"],
  ["conditionals with floats", "echo(1<2 ? 8.0 : -5.22);"],
  ["conditionals with strings", 'echo(1<2 ? "x" : "y");'],
  ["||", "echo(true||1<2||false||!true);"],
  ["&&", "echo(true&&1<2&&false&&!true);"],
  ["relations", 'echo(1<=2 && "x">"y" && 3.5<1.2);'],
  ["ok to == arrays", "echo([1]==[5,8]);"],
  ["ok to != arrays", "echo([1]!=[5,8]);"],
  ["arithmetic", "stat x=1;echo(2*3+5**-3/2-5%8);"],
  ["array length", "echo(length([1,2,3]));"],
  ["variables", "stat x=[[[[1]]]]; echo(x[0][0][0][0]+2);"],
  ["subscript exp", "stat a=[1,2];echo(a[0]);"],
  ["assigned skills", "skill f() {}\nstat g = f;g = f;"],
  ["call of assigned skills", "skill f(x: int) {}\nstat g=f;g(1);"],
  [
    "type equivalence of nested arrays",
    "skill f(x: [[int]]) {} echo(f([[1],[2]]));",
  ],
  [
    "call of assigned skill in expression",
    `skill f(x: int, y: boolean): int {}
    stat g = f;
    echo(g(1, true));`,
  ],
  [
    "pass a skill to a skill",
    `skill f(x: int, y: (boolean): void): int { reward 1; }
     skill g(z: boolean) {}
     f(2, g);`,
  ],
  ["skill return types", `skill square(x: int): int { reward x * x; }`],
  ["skill assign", "skill f() {} stat g = f; stat h = [g, f]; echo(h[0]());"],
  [
    "covariant return types",
    `skill f(): any { reward 1; }
    skill g(): float { reward 1.0; }
    stat h = f; h = g;`,
  ],
  [
    "contravariant parameter types",
    `skill f(x: float) {  }
    skill g(x: any) {  }
    stat h = f; h = g;`,
  ],
  ["array parameters", "skill f(x: [int]) {}"],
  ["types in skill type", "skill f(g: (int, float): string) {}"],
  ["voids in fn type", "skill f(g: (void): void) {}"],
  ["outer variable", "stat x=1; quest(false) {echo(x);}"],
  ["built-in constants", "echo(25.0 * π);"],
  ["built-in sqrt", "echo(sin(25.0));"],
  ["built-in sin", "echo(sin(π));"],
  ["built-in cos", "echo(cos(93.999));"],
  ["built-in hypot", "echo(hypot(-4.0, 3.00001));"],
  ["multiline comments", "/* this is a comment */ stat x = 1;"],
];

// Programs that are syntactically correct but have semantic errors
const semanticErrors = [
  ["non-int increment", "stat x=false;x++;", /an integer/],
  ["assign to const", "const x = 1;x = 2;", /Cannot assign to immutable/],
  [
    "assign to skill",
    "skill f() {} skill g() {} f = g;",
    /Cannot assign to immutable/,
  ],
  [
    "assign to const array element",
    "const a = [1];a[0] = 2;",
    /Cannot assign to immutable/,
  ],
  ["assign bad type", "stat x=1;x=true;", /Cannot assign a boolean to a int/],
  [
    "assign bad array type",
    "stat x=1;x=[true];",
    /Cannot assign a \[boolean\] to a int/,
  ],
  ["break outside loop", "break;", /Break can only appear in a loop/],
  [
    "break inside skill",
    "quest(true) {skill f() {break;}}",
    /Break can only appear in a loop/,
  ],
  [
    "return value from void skill",
    "skill f() {reward 1;}",
    /Cannot return a value/,
  ],
  [
    "return nothing from non-void",
    "skill f(): int {reward;}",
    /should be returned/,
  ],
  [
    "return type mismatch",
    "skill f(): int {reward false;}",
    /boolean to a int/,
  ],
  ["non-boolean short if test", "encounter(1) {}", /Expected a boolean/],
  ["non-boolean if test", "encounter(1) {} fallback {}", /Expected a boolean/],
  ["non-boolean quest test", "quest(1) {}", /Expected a boolean/],
  ["non-integer repeat", 'repeat("1") {}', /Expected an integer/],
  ["non-integer low range", "for(i in true...2) {}", /Expected an integer/],
  ["non-array in for", "for(i in 100) {}", /Expected an array/],
  ["non-boolean conditional test", "echo(1?2:3);", /Expected a boolean/],
  [
    "diff types in conditional arms",
    "echo(true?1:true);",
    /not have the same type/,
  ],
  ["bad types for ||", "echo(false||1);", /Expected a boolean/],
  ["bad types for &&", "echo(false&&1);", /Expected a boolean/],
  ["bad types for ==", "echo(false==1);", /Operands do not have the same type/],
  ["bad types for !=", "echo(false==1);", /Operands do not have the same type/],
  ["bad types for +", "echo(false+1);", /Expected a number or string/],
  ["bad types for -", "echo(false-1);", /Expected a number/],
  ["bad types for *", "echo(false*1);", /Expected a number/],
  ["bad types for /", "echo(false/1);", /Expected a number/],
  ["bad types for **", "echo(false**1);", /Expected a number/],
  ["bad types for <", "echo(false<1);", /Expected a number or string/],
  ["bad types for <=", "echo(false<=1);", /Expected a number or string/],
  ["bad types for >", "echo(false>1);", /Expected a number or string/],
  ["bad types for >=", "echo(false>=1);", /Expected a number or string/],
  ["bad types for ==", "echo(2==2.0);", /not have the same type/],
  ["bad types for !=", "echo(false!=1);", /not have the same type/],
  ["bad types for negation", "echo(-true);", /Expected a number/],
  ["bad types for not", 'echo(!"hello");', /Expected a boolean/],
  ["non-integer index", "stat a=[1];echo(a[false]);", /Expected an integer/],
  [
    "diff type array elements",
    "echo([3,3.0]);",
    /Not all elements have the same type/,
  ],
  [
    "Too many args",
    "skill f(x: int) {}\nf(1,2);",
    /1 argument\(s\) required but 2 passed/,
  ],
  [
    "Too few args",
    "skill f(x: int) {}\nf();",
    /1 argument\(s\) required but 0 passed/,
  ],
  [
    "Parameter type mismatch",
    "skill f(x: int) {}\nf(false);",
    /Cannot assign a boolean to a int/,
  ],
  [
    "skill type mismatch",
    `skill f(x: int, y: (boolean): void): int { reward 1; }
     skill g(z: boolean): int { reward 5; }
     f(2, g);`,
    /Cannot assign a \(boolean\)->int to a \(boolean\)->void/,
  ],
  [
    "bad param type in fn assign",
    "skill f(x: int) {} skill g(y: float) {} f = g;",
  ],
  [
    "bad return type in fn assign",
    `skill f(x: int): int {reward 1;}
    skill g(y: int): string {reward "uh-oh";}
    stat h = f; h = g;`,
    /Cannot assign a \(int\)->string to a \(int\)->int/,
  ],
  [
    "type error call to sin()",
    "echo(sin(true));",
    /Cannot assign a boolean to a float/,
  ],
  [
    "type error call to sqrt()",
    "echo(sqrt(true));",
    /Cannot assign a boolean to a float/,
  ],
  [
    "type error call to cos()",
    "echo(cos(true));",
    /Cannot assign a boolean to a float/,
  ],
  [
    "type error call to hypot()",
    'echo(hypot("dog", 3.3));',
    /Cannot assign a string to a float/,
  ],
  [
    "too many arguments to hypot()",
    "echo(hypot(1, 2, 3));",
    /2 argument\(s\) required but 3 passed/,
  ],
  ["Non-type in param", "stat x=1;skill f(y:x){}", /Type expected/],
  [
    "Non-type in return type",
    "stat x=1;skill f():x{reward 1;}",
    /Type expected/,
  ],
  [
    "assign to immutable member",
    `
    class Point {
      x: int;
      y: int;
    }
    const p = Point(10, 20);
    p.x = 30;
  `,
    /Cannot assign to immutable/,
  ],
];

describe("The analyzer", () => {
  for (const [scenario, source] of semanticChecks) {
    it(`recognizes ${scenario}`, () => {
      assert.ok(analyze(parse(source)));
    });
  }
  for (const [scenario, source, errorMessagePattern] of semanticErrors) {
    it(`throws on ${scenario}`, () => {
      assert.throws(() => analyze(parse(source)), errorMessagePattern);
    });
  }
  it("produces the expected representation for a trivial program", () => {
    assert.deepEqual(
      analyze(parse("stat x = π + 2.2;")),
      program([
        variableDeclaration(
          variable("x", true, floatType),
          binary("+", variable("π", false, floatType), 2.2, floatType)
        ),
      ])
    );
  });

  it("tests nested class types in includesAsField function", () => {
    assert.throws(
      () =>
        analyze(
          parse(`
      class Inner {
        x: int;
      }
      class Middle {
        inner: Inner;
      }
      class Outer {
        middle: Middle;
        outer: Outer;
      }
    `)
        ),
      /Class type must not be self-containing/
    );
  });
});
