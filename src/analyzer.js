import * as core from "./core.js";

class Context {
  constructor({
    parent = null,
    locals = new Map(),
    inLoop = false,
    function: f = null,
    class: c = null,
  }) {
    Object.assign(this, { parent, locals, inLoop, function: f, class: c });
  }

  add(name, entity) {
    this.locals.set(name, entity);
  }

  lookup(name) {
    return this.locals.get(name) || this.parent?.lookup(name);
  }

  lookupImmediate(name) {
    return this.locals.get(name);
  }

  static root() {
    return new Context({
      locals: new Map(Object.entries(core.standardLibrary)),
    });
  }

  newChildContext(props) {
    return new Context({
      ...this,
      ...props,
      parent: this,
      locals: new Map(),
    });
  }
}

export default function analyze(match) {
  let context = Context.root();

  function must(condition, message, errorLocation) {
    if (!condition) {
      const prefix = errorLocation.at.source.getLineAndColumnMessage();
      throw new Error(`${prefix} ${message}`);
    }
  }

  function mustNotAlreadyBeDeclared(name, at) {
    must(!context.lookup(name), `Identifier '${name}' already declared`, at);
  }

  function mustNotAlreadyBeDeclaredAsParameter(name, at) {
    must(
      !context.lookupImmediate(name),
      `Parameter '${name}' already declared`,
      at
    );
  }

  function mustHaveBeenFound(entity, name, at) {
    must(entity, `Identifier '${name}' not declared`, at);
  }

  function mustHaveNumericType(e, at) {
    const expectedType = [core.intType, core.floatType];
    must(expectedType.includes(e.type), "Expected a number", at);
  }

  function mustHaveNumericOrStringType(e, at) {
    const expectedTypes = [core.intType, core.floatType, core.stringType];
    must(expectedTypes.includes(e.type), "Expected a number or string", at);
  }

  function mustHaveBooleanType(e, at) {
    must(e.type === core.booleanType, "Expected a boolean", at);
  }

  function mustHaveIntegerType(e, at) {
    must(e.type === core.intType, "Expected an integer", at);
  }

  function mustHaveAnArrayType(e, at) {
    must(e.type?.kind === "ArrayType", "Expected an array", at);
  }

  // function mustHaveAnOptionalType(e, at) {
  //   must(e.type?.kind === "OptionalType", "Expected an optional", at);
  // }

  function mustHaveAClassType(e, at) {
    must(e.type?.kind === "ClassType", "Expected a class", at);
  }

  function mustBothHaveTheSameType(e1, e2, at) {
    must(
      equivalent(e1.type, e2.type),
      "Operands do not have the same type",
      at
    );
  }

  function mustAllHaveSameType(expressions, at) {
    // Used to check the elements of an array expression, and the two
    // arms of a conditional expression, among other scenarios.
    must(
      expressions
        .slice(1)
        .every((e) => equivalent(e.type, expressions[0].type)),
      "Not all elements have the same type",
      at
    );
  }

  function mustBeAType(e, at) {
    const isBasicType = /int|float|string|bool|void|any/.test(e);
    const isCompositeType =
      /ClassType|FunctionType|ArrayType|OptionalType/.test(e?.kind);
    must(isBasicType || isCompositeType, "Type expected", at);
  }

  function mustBeAnArrayType(t, at) {
    must(t?.kind === "ArrayType", "Must be an array type", at);
  }

  function includesAsField(classType, type) {
    // Whether the class has a field of type type, directly or indirectly
    return classType.fields.some(
      (field) =>
        field.type === type ||
        (field.type.kind === "ClassType" && includesAsField(field.type, type))
    );
  }

  function mustNotBeSelfContaining(classType, at) {
    const containsSelf = includesAsField(classType, classType);
    must(!containsSelf, "Class type must not be self-containing", at);
  }

  function equivalent(t1, t2) {
    return (
      t1 === t2 ||
      (t1?.kind === "ArrayType" &&
        t2?.kind === "ArrayType" &&
        equivalent(t1.baseType, t2.baseType)) ||
      (t1?.kind === "FunctionType" &&
        t2?.kind === "FunctionType" &&
        equivalent(t1.returnType, t2.returnType) &&
        t1.paramTypes.length === t2.paramTypes.length &&
        t1.paramTypes.every((t, i) => equivalent(t, t2.paramTypes[i])))
    );
  }

  function assignable(fromType, toType) {
    return (
      toType == core.anyType ||
      equivalent(fromType, toType) ||
      (fromType?.kind === "ArrayType" &&
        toType?.kind === "ArrayType" &&
        toType.baseType === core.anyType) ||
      (fromType?.kind === "FunctionType" &&
        toType?.kind === "FunctionType" &&
        // covariant in return types
        assignable(fromType.returnType, toType.returnType) &&
        fromType.paramTypes.length === toType.paramTypes.length &&
        // contravariant in parameter types
        toType.paramTypes.every((t, i) =>
          assignable(t, fromType.paramTypes[i])
        ))
    );
  }

  function typeDescription(type) {
    if (typeof type === "string") return type;
    // if (type.kind == "ClassType") return type.name;
    if (type.kind == "FunctionType") {
      const paramTypes = type.paramTypes.map(typeDescription).join(", ");
      const returnType = typeDescription(type.returnType);
      return `(${paramTypes})->${returnType}`;
    }
    if (type.kind == "ArrayType") return `[${typeDescription(type.baseType)}]`;
    // if (type.kind == "OptionalType")
    //   return `${typeDescription(type.baseType)}?`;
  }

  function mustBeAssignable(e, { toType: type }, at) {
    const source = typeDescription(e.type);
    const target = typeDescription(type);
    const message = `Cannot assign a ${source} to a ${target}`;
    must(assignable(e.type, type), message, at);
  }

  function isMutable(e) {
    return (
      (e?.kind === "Variable" && e?.mutable) ||
      (e?.kind === "SubscriptExpression" && isMutable(e?.array)) ||
      (e?.kind === "MemberExpression" && isMutable(e?.object))
    );
  }

  function mustBeMutable(e, at) {
    must(isMutable(e), `Cannot assign to immutable ${e.name}`, at);
  }

  function mustHaveDistinctFields(type, at) {
    const fieldNames = new Set(type.fields.map((f) => f.name));
    must(fieldNames.size === type.fields.length, "Fields must be distinct", at);
  }

  function mustHaveMember(classType, field, at) {
    must(
      classType.fields.map((f) => f.name).includes(field),
      "No such field",
      at
    );
  }

  function mustBeInLoop(at) {
    must(context.inLoop, "Break can only appear in a loop", at);
  }

  function mustBeInAFunction(at) {
    must(context.function, "Return can only appear in a function", at);
  }

  function mustBeCallable(e, at) {
    const callable = e?.kind === "ClassType" || e.type?.kind === "FunctionType";
    must(callable, "Call of non-function or non-constructor", at);
  }

  function mustNotReturnAnything(f, at) {
    const returnsNothing = f.type.returnType === core.voidType;
    must(returnsNothing, "Something should be returned", at);
  }

  function mustReturnSomething(f, at) {
    const returnsSomething = f.type.returnType !== core.voidType;
    must(returnsSomething, "Cannot return a value from this function", at);
  }

  function mustBeReturnable(e, { from: f }, at) {
    mustBeAssignable(e, { toType: f.type.returnType }, at);
  }

  function mustHaveCorrectArgumentCount(argCount, paramCount, at) {
    const message = `${paramCount} argument(s) required but ${argCount} passed`;
    must(argCount === paramCount, message, at);
  }

  const builder = match.matcher.grammar.createSemantics().addOperation("rep", {
    Program(statements) {
      return core.program(statements.children.map((s) => s.rep()));
    },

    VarDecl(modifier, id, _eq, exp, _semicolon) {
      mustNotAlreadyBeDeclared(id.sourceString, { at: id.at });
      const initializer = exp.rep();
      const mutable = modifier.sourceString === "stat";
      const variable = core.variable(
        id.sourceString,
        mutable,
        initializer.type
      );
      context.add(id.sourceString, variable);
      return core.variableDeclaration(variable, initializer);
    },

    TypeDecl(_class, id, _left, fields, _right) {
      mustNotAlreadyBeDeclared(id.sourceString, { at: id });
      const type = core.classType(id.sourceString, []);
      context.add(id.sourceString, type);
      context = context.newChildContext({
        class: type,
      });
      type.fields = fields.children.map((field) => {
        let repResult = field.rep();
        context.class = type;
        return repResult;
      });
      mustHaveDistinctFields(type, { at: id });
      mustNotBeSelfContaining(type, { at: id });
      context = context.parent;
      return core.typeDeclaration(type);
    },

    Field_parameter(id, _colon, type, _semi) {
      let field = core.field(id.sourceString, type.rep());
      context?.class?.fields.push(field);
      return field;
    },

    Field_method(funDecl) {
      const method = funDecl.rep();
      return core.field(method.fun.name, method.fun.type, true, method);
    },

    FunDecl(_fun, id, parameters, _colons, type, block) {
      mustNotAlreadyBeDeclared(id.sourceString, { at: id });

      const fun = core.fun(id.sourceString);
      context.add(id.sourceString, fun);

      context = context.newChildContext({
        inLoop: false,
        function: fun,
      });
      fun.params = parameters.rep();

      const paramTypes = fun.params.map((param) => param.type);
      const returnType = type.children?.[0]?.rep() ?? core.voidType;
      fun.type = core.functionType(paramTypes, returnType);

      fun.body = block.rep();

      context = context.parent;
      return core.functionDeclaration(fun);
    },

    Params(_open, paramList, _close) {
      return paramList.asIteration().children.map((p) => p.rep());
    },

    Param(id, _colon, type) {
      // Parameter can be mutable
      const param = core.variable(id.sourceString, true, type.rep());
      // This was mustnotAlreadyBeDeclared
      mustNotAlreadyBeDeclaredAsParameter(param.name, { at: id });
      context.add(param.name, param);
      return param;
    },

    Type_array(_left, baseType, _right) {
      return core.arrayType(baseType.rep());
    },

    Type_function(_left, types, _right, _arrow, type) {
      const paramTypes = types.asIteration().children.map((t) => t.rep());
      const returnType = type.rep();
      return core.functionType(paramTypes, returnType);
    },

    Type_id(id) {
      const entity = context.lookup(id.sourceString);
      mustHaveBeenFound(entity, id.sourceString, { at: id });
      mustBeAType(entity, { at: id });
      return entity;
    },

    Statement_bump(exp, operator, _semicolon) {
      const variable = exp.rep();
      mustBeMutable(variable, { at: exp });
      mustHaveIntegerType(variable, { at: exp });
      return operator.sourceString === "++"
        ? core.increment(variable)
        : core.decrement(variable);
    },

    Statement_assign(variable, _eq, expression, _semicolon) {
      const source = expression.rep();
      const target = variable.rep();
      mustBeMutable(target, { at: variable });
      // console.log("TRYING TO ASSIGN", source, "TO", target);
      mustBeAssignable(source, { toType: target.type }, { at: variable });
      return core.assignment(target, source);
    },

    Statement_call(call, _semicolon) {
      return call.rep();
    },

    Statement_break(_break, _semicolon) {
      mustBeInLoop({ at: _break });
      return core.breakStatement;
    },

    Statement_return(returnKeyword, exp, _semicolon) {
      mustBeInAFunction({ at: returnKeyword });
      mustReturnSomething(context.function, { at: returnKeyword });
      const returnExpression = exp.rep();
      mustBeReturnable(
        returnExpression,
        { from: context.function },
        { at: exp }
      );
      return core.returnStatement(returnExpression);
    },

    Statement_shortreturn(returnKeyword, _semicolon) {
      mustBeInAFunction({ at: returnKeyword });
      mustNotReturnAnything(context.function, { at: returnKeyword });
      return core.shortReturnStatement;
    },

    IfStmt_long(_if, _lparen, exp, _rparen, block1, _else, block2) {
      const test = exp.rep();
      mustHaveBooleanType(test, { at: exp });
      context = context.newChildContext();
      const consequent = block1.rep();
      context = context.parent;
      context = context.newChildContext();
      const alternate = block2.rep();
      context = context.parent;
      return core.ifStatement(test, consequent, alternate);
    },

    IfStmt_elseif(
      _if,
      _lparen,
      exp,
      _rparen,
      block,
      _else,
      trailingIfStatement
    ) {
      const test = exp.rep();
      mustHaveBooleanType(test, { at: exp });
      context = context.newChildContext();
      const consequent = block.rep();
      context = context.parent;
      const alternate = trailingIfStatement.rep();
      return core.ifStatement(test, consequent, alternate);
    },

    IfStmt_short(_if, _lparen, exp, _rparen, block) {
      const test = exp.rep();
      mustHaveBooleanType(test, { at: exp });
      context = context.newChildContext();
      const consequent = block.rep();
      context = context.parent;
      return core.shortIfStatement(test, consequent);
    },

    LoopStmt_quest(_quest, _lparen, exp, _rparen, block) {
      const test = exp.rep();
      mustHaveBooleanType(test, { at: exp });
      context = context.newChildContext({ inLoop: true });
      const body = block.rep();
      context = context.parent;
      return core.whileStatement(test, body);
    },

    LoopStmt_repeat(_repeat, _lparen, exp, _rparen, block) {
      const count = exp.rep();
      mustHaveIntegerType(count, { at: exp });
      context = context.newChildContext({ inLoop: true });
      const body = block.rep();
      context = context.parent;
      return core.repeatStatement(count, body);
    },

    LoopStmt_range(_for, _lparen, id, _in, exp1, op, exp2, _rparen, block) {
      const [low, high] = [exp1.rep(), exp2.rep()];
      mustHaveIntegerType(low, { at: exp1 });
      mustHaveIntegerType(high, { at: exp2 });
      const iterator = core.variable(id.sourceString, true, core.intType);
      context = context.newChildContext({ inLoop: true });
      context.add(id.sourceString, iterator);
      const body = block.rep();
      context = context.parent;
      return core.forRangeStatement(iterator, low, op.sourceString, high, body);
    },

    LoopStmt_collection(_for, _lparen, id, _in, exp, _rparen, block) {
      const collection = exp.rep();
      mustHaveAnArrayType(collection, { at: exp });
      const iterator = core.variable(
        id.sourceString,
        true,
        collection.type.baseType
      );
      context = context.newChildContext({ inLoop: true });
      context.add(iterator.name, iterator);
      const body = block.rep();
      context = context.parent;
      return core.forStatement(iterator, collection, body);
    },

    Block(_open, statements, _close) {
      return statements.children.map((s) => s.rep());
    },

    Exp_conditional(exp, _questionMark, exp1, colon, exp2) {
      const test = exp.rep();
      mustHaveBooleanType(test, { at: exp });
      const [consequent, alternate] = [exp1.rep(), exp2.rep()];
      mustBothHaveTheSameType(consequent, alternate, { at: colon });
      return core.conditional(test, consequent, alternate, consequent.type);
    },

    Exp2_or(exp, _ops, exps) {
      let left = exp.rep();
      mustHaveBooleanType(left, { at: exp });
      for (let e of exps.children) {
        let right = e.rep();
        mustHaveBooleanType(right, { at: e });
        left = core.binary("||", left, right, core.booleanType);
      }
      return left;
    },

    Exp2_and(exp, _ops, exps) {
      let left = exp.rep();
      mustHaveBooleanType(left, { at: exp });
      for (let e of exps.children) {
        let right = e.rep();
        mustHaveBooleanType(right, { at: e });
        left = core.binary("&&", left, right, core.booleanType);
      }
      return left;
    },

    Exp3_compare(exp1, relop, exp2) {
      const [left, op, right] = [exp1.rep(), relop.sourceString, exp2.rep()];
      // == and != can have any operand types as long as they are the same
      // But inequality operators can only be applied to numbers and strings
      if (["<", "<=", ">", ">="].includes(op)) {
        mustHaveNumericOrStringType(left, { at: exp1 });
      }
      mustBothHaveTheSameType(left, right, { at: relop });
      return core.binary(op, left, right, core.booleanType);
    },

    Exp4_add(exp1, addOp, exp2) {
      const [left, op, right] = [exp1.rep(), addOp.sourceString, exp2.rep()];
      if (op === "+") {
        mustHaveNumericOrStringType(left, { at: exp1 });
      } else {
        mustHaveNumericType(left, { at: exp1 });
      }
      // mustBothHaveTheSameType(left, right, { at: addOp }); // Removed to allow concatenation
      return core.binary(op, left, right, left.type);
    },

    Exp5_multiply(exp1, mulOp, exp2) {
      const [left, op, right] = [exp1.rep(), mulOp.sourceString, exp2.rep()];
      mustHaveNumericType(left, { at: exp1 });
      mustBothHaveTheSameType(left, right, { at: mulOp });
      return core.binary(op, left, right, left.type);
    },

    Exp6_power(exp1, powerOp, exp2) {
      const [left, op, right] = [exp1.rep(), powerOp.sourceString, exp2.rep()];
      mustHaveNumericType(left, { at: exp1 });
      mustBothHaveTheSameType(left, right, { at: powerOp });
      return core.binary(op, left, right, left.type);
    },

    Exp6_unary(unaryOp, exp) {
      const [op, operand] = [unaryOp.sourceString, exp.rep()];
      let type;
      if (op === "...") {
        mustHaveAnArrayType(operand, { at: exp });
        type = core.arrayType(operand?.type?.baseType);
      } else if (op === "-") {
        mustHaveNumericType(operand, { at: exp });
        type = operand.type;
      } else if (op === "!") {
        mustHaveBooleanType(operand, { at: exp });
        type = core.booleanType;
      }
      return core.unary(op, operand, type);
    },

    Exp7_emptyarray(ty, _open, _close) {
      const type = ty.rep();
      mustBeAnArrayType(type, { at: ty });
      return core.emptyArray(type);
    },

    Exp7_arrayexp(_open, args, _close) {
      const elements = args.asIteration().children.map((e) => e.rep());
      mustAllHaveSameType(elements, { at: args });
      return core.arrayExpression(elements);
    },

    Exp7_parens(_open, expression, _close) {
      return expression.rep();
    },

    Exp7_access_subscript(exp1, _open, exp2, _close) {
      const [array, subscript] = [exp1.rep(), exp2.rep()];
      mustHaveAnArrayType(array, { at: exp1 });
      mustHaveIntegerType(subscript, { at: exp2 });
      return core.subscript(array, subscript);
    },

    Exp7_access_member(exp, dot, id) {
      const object = exp.rep();
      let classType;
      mustHaveAClassType(object, { at: exp });
      classType = object.type;
      mustHaveMember(classType, id.sourceString, { at: id });
      const field = classType.fields.find((f) => f.name === id.sourceString);
      if (object.kind === "ThisExpression") {
        return core.memberExpression("this", dot.sourceString, field);
      }
      return core.memberExpression(object, dot.sourceString, field);
    },

    Exp7_call(exp, open, expList, _close) {
      const callee = exp.rep();
      mustBeCallable(callee, { at: exp });

      const exps = expList.asIteration().children;
      const targetTypes =
        callee?.kind === "ClassType"
          ? callee.fields.map((f) => f.type)
          : callee.type.paramTypes;

      const methodCount =
        callee?.kind === "ClassType"
          ? callee.fields.filter((f) => f.isMethod).length
          : 0;

      mustHaveCorrectArgumentCount(
        exps.length,
        targetTypes.length - methodCount,
        {
          at: open,
        }
      );
      const args = exps.map((exp, i) => {
        const arg = exp.rep();
        mustBeAssignable(arg, { toType: targetTypes[i] }, { at: exp });
        return arg;
      });
      return callee?.kind === "ClassType"
        ? core.constructorCall(callee, args)
        : core.functionCall(callee, args);
    },

    Exp7_access_id(id) {
      // When an id appears in an expression, it had better have been declared
      const entity = context.lookup(id.sourceString);
      if (!entity && id.sourceString === "this") {
        mustBeInAFunction({ at: id });
        return core.thisExpression(context?.class);
      }
      mustHaveBeenFound(entity, id.sourceString, { at: id });
      return entity;
    },

    true(_) {
      return true;
    },

    false(_) {
      return false;
    },

    intlit(_digits) {
      return BigInt(this.sourceString);
    },

    floatlit(_whole, _point, _fraction, _e, _sign, _exponent) {
      return Number(this.sourceString);
    },

    stringlit(_openQuote, _chars, _closeQuote) {
      return this.sourceString;
    },

    comment_multiLine(_commentopen, _chars, _commentclose) {
      // Ignore multi-line comments
    },
  });

  return builder(match).rep();
}
