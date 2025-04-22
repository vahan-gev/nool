// The code generator exports a single function, generate(program), which
// accepts a program representation and returns the JavaScript translation
// as a string.

import { voidType, standardLibrary } from "./core.js";

export default function generate(program) {
  // When generating code for statements, we'll accumulate the lines of
  // the target code here. When we finish generating, we'll join the lines
  // with newlines and return the result.
  const output = [];

  // Variable and function names in JS will be suffixed with _1, _2, _3,
  // etc. This is because "switch", for example, is a legal name in Carlos,
  // but not in JS. So, the Carlos variable "switch" must become something
  // like "switch_1". We handle this by mapping each name to its suffix.
  const targetName = ((mapping) => {
    return (entity) => {
      if (!mapping.has(entity)) {
        mapping.set(entity, mapping.size + 1);
      }
      return `${entity.name}_${mapping.get(entity)}`;
    };
  })(new Map());

  const gen = (node) => generators?.[node?.kind]?.(node) ?? node;

  const generators = {
    // Key idea: when generating an expression, just return the JS string; when
    // generating a statement, write lines of translated JS to the output array.
    Program(p) {
      p.statements.forEach(gen);
    },
    VariableDeclaration(d) {
      // We don't care about const vs. let in the generated code! The analyzer has
      // already checked that we never updated a const, so let is always fine.
      output.push(`let ${gen(d.variable)} = ${gen(d.initializer)};`);
    },
    TypeDeclaration(d) {
      // The only type declaration in Carlos is the struct! Becomes a JS class.
      output.push(`class ${gen(d.type)} {`);
      let constructorArgs = d.type.fields
        .filter((field) => !field.isMethod)
        .map(gen)
        .join(",");
      output.push(`constructor(${constructorArgs}) {`);
      for (let field of d.type.fields) {
        if (field.isMethod === false) {
          output.push(`this[${JSON.stringify(gen(field))}] = ${gen(field)};`);
        } else {
          output.push(
            `this[${JSON.stringify(gen(field))}] = (${field.method.fun.params
              .map(gen)
              .join(", ")}) => {`
          );
          field.method.fun.body.forEach(gen);
          output.push("};");
        }
      }
      output.push("}");
      output.push("}");
    },
    ClassType(t) {
      return targetName(t);
    },
    Field(f) {
      return targetName(f);
    },
    FunctionDeclaration(d) {
      output.push(
        `function ${gen(d.fun)}(${d.fun.params.map(gen).join(", ")}) {`
      );
      d.fun.body.forEach(gen);
      output.push("}");
    },
    Variable(v) {
      // Standard library constants get special treatment
      if (v === standardLibrary.π) return "Math.PI";
      return targetName(v);
    },
    Function(f) {
      return targetName(f);
    },
    Increment(s) {
      output.push(`${gen(s.variable)}++;`);
    },
    Decrement(s) {
      output.push(`${gen(s.variable)}--;`);
    },
    Assignment(s) {
      output.push(`${gen(s.target)} = ${gen(s.source)};`);
    },
    BreakStatement(s) {
      output.push("break;");
    },
    ReturnStatement(s) {
      output.push(`return ${gen(s.expression)};`);
    },
    ShortReturnStatement(s) {
      output.push("return;");
    },
    IfStatement(s) {
      output.push(`if (${gen(s.test)}) {`);
      s.consequent.forEach(gen);
      if (s.alternate?.kind?.endsWith?.("IfStatement")) {
        output.push("} else");
        gen(s.alternate);
      } else {
        output.push("} else {");
        s.alternate.forEach(gen);
        output.push("}");
      }
    },
    ShortIfStatement(s) {
      output.push(`if (${gen(s.test)}) {`);
      s.consequent.forEach(gen);
      output.push("}");
    },
    WhileStatement(s) {
      output.push(`while (${gen(s.test)}) {`);
      s.body.forEach(gen);
      output.push("}");
    },
    RepeatStatement(s) {
      // JS can only repeat n times if you give it a counter variable!
      const i = targetName({ name: "i" });
      output.push(`for (let ${i} = 0; ${i} < ${gen(s.count)}; ${i}++) {`);
      s.body.forEach(gen);
      output.push("}");
    },
    ForRangeStatement(s) {
      const i = targetName(s.iterator);
      const op = s.op === "..." ? "<=" : "<";
      output.push(
        `for (let ${i} = ${gen(s.low)}; ${i} ${op} ${gen(s.high)}; ${i}++) {`
      );
      s.body.forEach(gen);
      output.push("}");
    },
    ForStatement(s) {
      output.push(`for (let ${gen(s.iterator)} of ${gen(s.collection)}) {`);
      s.body.forEach(gen);
      output.push("}");
    },
    Conditional(e) {
      return `((${gen(e.test)}) ? (${gen(e.consequent)}) : (${gen(
        e.alternate
      )}))`;
    },
    BinaryExpression(e) {
      if (e.op === "hypot") return `Math.hypot(${gen(e.left)},${gen(e.right)})`;
      if (e.op === "push") {
        output.push(`${gen(e.left)}.push(${gen(e.right)});`);
        return `${gen(e.left)}.length - 1`;
      }

      if (e.op === "randomInt") {
        return `Math.floor(Math.random() * (${gen(e.right)} - ${gen(
          e.left
        )} + 1)) + ${gen(e.left)}`;
      }

      if (e.op === "writeFile") {
        if (!output.includes("import * as fs from 'fs';")) {
          output.push("import * as fs from 'fs';");
        }
        output.push(`fs.writeFileSync(${gen(e.left)}, ${gen(e.right)});`);
        return true;
      }

      const op = { "==": "===", "!=": "!==" }[e.op] ?? e.op;
      return `(${gen(e.left)} ${op} ${gen(e.right)})`;
    },
    UnaryExpression(e) {
      const operand = gen(e.operand);
      if (e.op === "...") return `...${operand}`;
      if (e.op === "sqrt") return `Math.sqrt(${operand})`;
      if (e.op === "sin") return `Math.sin(${operand})`;
      if (e.op === "cos") return `Math.cos(${operand})`;
      if (e.op === "exp") return `Math.exp(${operand})`;
      if (e.op === "ln") return `Math.log(${operand})`;
      if (e.op === "length") return `${operand}.length`;
      if (e.op === "pop") {
        return `${operand}.pop()`;
      }
      if (e.op === "toString") {
        return `'' + ${operand}`;
      }
      if (e.op === "toInt") {
        return `Math.floor(${operand})`;
      }
      if (e.op === "toFloat") {
        return `parseFloat(${operand})`;
      }
      if (e.op === "readFile") {
        if (!output.includes("import * as fs from 'fs';")) {
          output.push("import * as fs from 'fs';");
        }
        return `fs.readFileSync(${operand}, 'utf8')`;
      }
      if (e.op === "input") {
        if (!output.includes("import * as fs from 'fs';")) {
          output.push("import * as fs from 'fs';");
        }
        output.push(`process.stdout.write(${operand});`);
        output.push(`const buffer = Buffer.alloc(1024);`);
        output.push(
          `const bytesRead = fs.readSync(0, buffer, 0, buffer.length, null);`
        );

        return `buffer.toString('utf8', 0, bytesRead).trim();`;
      }

      return `${e.op}(${operand})`;
    },

    SubscriptExpression(e) {
      return `${gen(e.array)}[${gen(e.index)}]`;
    },
    ArrayExpression(e) {
      return `[${e.elements.map(gen).join(",")}]`;
    },
    EmptyArray(e) {
      return "[]";
    },
    MemberExpression(e) {
      const object = gen(e.object);
      const field = JSON.stringify(gen(e.field));
      const chain = e.op === "." ? "" : e.op;
      return `(${object}${chain}[${field}])`;
    },
    FunctionCall(c) {
      const targetCode = `${gen(c.callee)}(${c.args.map(gen).join(", ")})`;
      // Calls in expressions vs in statements are handled differently
      if (c.callee.type.returnType !== voidType) {
        return targetCode;
      }
      output.push(`${targetCode};`);
    },
    ConstructorCall(c) {
      return `new ${gen(c.callee)}(${c.args.map(gen).join(", ")})`;
    },
    Echo(s) {
      output.push(`console.log(${s.args.map(gen).join(", ")});`);
    },
  };

  gen(program);
  return output.join("\n");
}
