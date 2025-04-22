export function program(statements) {
  return { kind: "Program", statements };
}

export function variableDeclaration(variable, initializer) {
  return { kind: "VariableDeclaration", variable, initializer };
}

export function variable(name, mutable, type) {
  return { kind: "Variable", name, mutable, type };
}

export function typeDeclaration(type) {
  return { kind: "TypeDeclaration", type };
}

export const booleanType = "boolean";
export const intType = "int";
export const floatType = "float";
export const stringType = "string";
export const voidType = "void";
export const anyType = "any";

export function classType(name, fields) {
  return { kind: "ClassType", name, fields };
}

export function field(name, type, isMethod = false, method = {}) {
  return { kind: "Field", name, type, isMethod, method };
}
export function functionDeclaration(fun) {
  return { kind: "FunctionDeclaration", fun };
}

export function fun(name, params, body, type) {
  return { kind: "Function", name, params, body, type };
}

export function intrinsicFunction(name, type) {
  return { kind: "Function", name, type, intrinsic: true };
}

export function arrayType(baseType) {
  return { kind: "ArrayType", baseType };
}

export function functionType(paramTypes, returnType) {
  return { kind: "FunctionType", paramTypes, returnType };
}

export function increment(variable) {
  return { kind: "Increment", variable };
}

export function decrement(variable) {
  return { kind: "Decrement", variable };
}

export function assignment(target, source) {
  return { kind: "Assignment", target, source };
}

export const breakStatement = { kind: "BreakStatement" };

export function returnStatement(expression) {
  return { kind: "ReturnStatement", expression };
}

export const shortReturnStatement = { kind: "ShortReturnStatement" };

export function ifStatement(test, consequent, alternate) {
  return { kind: "IfStatement", test, consequent, alternate };
}

export function shortIfStatement(test, consequent) {
  return { kind: "ShortIfStatement", test, consequent };
}

export function whileStatement(test, body) {
  return { kind: "WhileStatement", test, body };
}

export function repeatStatement(count, body) {
  return { kind: "RepeatStatement", count, body };
}

export function forRangeStatement(iterator, low, op, high, body) {
  return { kind: "ForRangeStatement", iterator, low, op, high, body };
}

export function forStatement(iterator, collection, body) {
  return { kind: "ForStatement", iterator, collection, body };
}

export function conditional(test, consequent, alternate, type) {
  return { kind: "Conditional", test, consequent, alternate, type };
}

export function binary(op, left, right, type) {
  return { kind: "BinaryExpression", op, left, right, type };
}

export function unary(op, operand, type) {
  return { kind: "UnaryExpression", op, operand, type };
}

export function subscript(array, index) {
  return {
    kind: "SubscriptExpression",
    array,
    index,
    type: array.type.baseType,
  };
}

export function arrayExpression(elements) {
  return {
    kind: "ArrayExpression",
    elements,
    type: arrayType(elements[0].type),
  };
}

export function emptyArray(type) {
  return { kind: "EmptyArray", type };
}

export function memberExpression(object, op, field) {
  return { kind: "MemberExpression", object, op, field, type: field.type };
}

export function functionCall(callee, args) {
  if (callee.intrinsic) {
    if (callee.type.returnType === voidType) {
      return {
        kind: callee.name.replace(/^\p{L}/u, (c) => c.toUpperCase()),
        args,
      };
    } else if (callee.type.paramTypes.length === 1) {
      return unary(callee.name, args[0], callee.type.returnType);
    } else {
      return binary(callee.name, args[0], args[1], callee.type.returnType);
    }
  }
  return { kind: "FunctionCall", callee, args, type: callee.type.returnType };
}

export function constructorCall(callee, args) {
  return { kind: "ConstructorCall", callee, args, type: callee };
}

export function thisExpression(type) {
  return { kind: "ThisExpression", type };
}

// These local constants are used to simplify the standard library definitions.
const floatToFloatType = functionType([floatType], floatType);
const floatFloatToFloatType = functionType([floatType, floatType], floatType);
const anyToVoidType = functionType([anyType], voidType);
const arrayTypeAnyTypeToAnyType = functionType(
  [arrayType(anyType), anyType],
  anyType
);
const arrayAnyTypeToIntType = functionType([arrayType(anyType)], intType);
const arrayAnyTypeToAnyType = functionType([arrayType(anyType)], anyType);
const intTypeIntTypeToIntType = functionType([intType, intType], intType);
const anyTypeToStringType = functionType([anyType], stringType);
const anyTypeToIntType = functionType([anyType], intType);
const intTypeToFloatType = functionType([intType], floatType);
export const standardLibrary = Object.freeze({
  int: intType,
  float: floatType,
  boolean: booleanType,
  string: stringType,
  void: voidType,
  any: anyType,
  π: variable("π", false, floatType),
  echo: intrinsicFunction("echo", anyToVoidType),
  sqrt: intrinsicFunction("sqrt", floatToFloatType),
  sin: intrinsicFunction("sin", floatToFloatType),
  cos: intrinsicFunction("cos", floatToFloatType),
  exp: intrinsicFunction("exp", floatToFloatType),
  ln: intrinsicFunction("ln", floatToFloatType),
  hypot: intrinsicFunction("hypot", floatFloatToFloatType),
  push: intrinsicFunction("push", arrayTypeAnyTypeToAnyType),
  pop: intrinsicFunction("pop", arrayAnyTypeToAnyType),
  length: intrinsicFunction("length", arrayAnyTypeToIntType),
  randomInt: intrinsicFunction("randomInt", intTypeIntTypeToIntType),
  toString: intrinsicFunction("toString", anyTypeToStringType),
  toInt: intrinsicFunction("toInt", anyTypeToIntType),
  toFloat: intrinsicFunction("toFloat", intTypeToFloatType),
  readFile: intrinsicFunction(
    "readFile",
    functionType([stringType], stringType)
  ),
  writeFile: intrinsicFunction(
    "writeFile",
    functionType([stringType, stringType], booleanType)
  ),
  input: intrinsicFunction("input", functionType([stringType], stringType)),
});

// We want every expression to have a type property. But we aren't creating
// special entities for numbers, strings, and booleans; instead, we are
// just using JavaScript values for those. Fortunately we can monkey patch
// the JS classes for these to give us what we want.
String.prototype.type = stringType;
Number.prototype.type = floatType;
BigInt.prototype.type = intType;
Boolean.prototype.type = booleanType;
