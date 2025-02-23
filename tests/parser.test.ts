import { assertEquals, assertThrows, assert } from "https://deno.land/std@0.204.0/testing/asserts.ts";
import { parse } from "../lib/parser.ts";
import type { PrintNode, FunctionCallNode } from "../lib/parser.ts";

Deno.test("parser handles basic IF THEN ELSE", () => {
    const input = "IF x = 5 THEN PRINT x ELSE PRINT y";
    const ast = parse(input);
    
    assertEquals(ast.length, 1);
    assertEquals(ast[0].type, "If");
    
    const ifNode = ast[0] as any;
    assertEquals(ifNode.condition.type, "BinaryExpression");
    assertEquals(ifNode.condition.operator, "=");
    assertEquals(ifNode.thenBranch.length, 1);
    assertEquals(ifNode.thenBranch[0].type, "Print");
    assertEquals(ifNode.elseBranch?.length, 1);
    assertEquals(ifNode.elseBranch[0].type, "Print");
});

Deno.test("parser handles IF THEN without ELSE", () => {
    const input = "IF x = 5 THEN PRINT x";
    const ast = parse(input);
    
    assertEquals(ast.length, 1);
    assertEquals(ast[0].type, "If");
    
    const ifNode = ast[0] as any;
    assertEquals(ifNode.thenBranch.length, 1);
    assertEquals(ifNode.elseBranch, undefined);
});

Deno.test("parser handles arithmetic expressions", () => {
    const input = "PRINT 2 + 3 * 4";
    const ast = parse(input);
    
    assertEquals(ast[0].type, "Print");
    const expr = (ast[0] as any).expression;
    assertEquals(expr.type, "BinaryExpression");
    assertEquals(expr.operator, "+");
    assertEquals(expr.right.type, "BinaryExpression");
    assertEquals(expr.right.operator, "*");
});

Deno.test("parser handles complex boolean expressions", () => {
    const input = "IF x > 0 AND y < 10 OR z = 5 THEN PRINT x";
    const ast = parse(input);
    
    const ifNode = ast[0] as any;
    assertEquals(ifNode.type, "If");
    assertEquals(ifNode.condition.type, "BinaryExpression");
    assertEquals(ifNode.condition.operator, "OR");
});

Deno.test("parser handles string concatenation", () => {
    const input = 'PRINT "Hello, " + name + "!"';
    const ast = parse(input);
    
    const printNode = ast[0] as any;
    assertEquals(printNode.expression.type, "BinaryExpression");
    assertEquals(printNode.expression.operator, "+");
});

Deno.test("parser handles NOT operator", () => {
    const cases = [
        {
            input: "IF NOT x > 5 THEN PRINT x",  // Test was failing on this input
            checkAst: (ifNode: any) => {
                assertEquals(ifNode.condition.type, "UnaryExpression");
                assertEquals(ifNode.condition.operator, "NOT");
                assertEquals(ifNode.condition.operand.type, "BinaryExpression");
                assertEquals(ifNode.condition.operand.operator, ">");
            }
        },
        {
            input: "IF NOT (x = 3) THEN PRINT x",
            checkAst: (ifNode: any) => {
                assertEquals(ifNode.condition.type, "UnaryExpression");
                assertEquals(ifNode.condition.operator, "NOT");
                assertEquals(ifNode.condition.operand.type, "BinaryExpression");
                assertEquals(ifNode.condition.operand.operator, "=");
            }
        }
    ];

    for (const testCase of cases) {
        const ast = parse(testCase.input);
        assertEquals(ast[0].type, "If");
        testCase.checkAst(ast[0]);
    }
});

Deno.test("parser handles empty input", () => {
    const ast = parse("");
    assertEquals(ast.length, 0);
});

Deno.test("parser handles CLS statement", () => {
    const ast = parse("CLS");
    assertEquals(ast.length, 1);
    assertEquals(ast[0].type, "Cls");
});

Deno.test("parser handles INPUT statement", () => {
    const ast = parse("INPUT x");
    assertEquals(ast.length, 1);
    assertEquals(ast[0].type, "Input");
    assertEquals((ast[0] as any).variable, "X");
});

Deno.test("parser handles multiple statements", () => {
    const input = "LET x = 1: PRINT x";
    const ast = parse(input);
    assertEquals(ast.length, 2);
    assertEquals(ast[0].type, "Let");
    assertEquals(ast[1].type, "Print");
});

Deno.test("parser handles function calls", () => {
    const result = parse("PRINT ABS(-5)")[0] as PrintNode;
    assertEquals(result.type, "Print");
    assertEquals((result.expression as any).type, "FunctionCall");
    assertEquals((result.expression as any).name, "ABS");
    assertEquals((result.expression as any).arguments.length, 1);
});

Deno.test("parser handles nested function calls", () => {
    const result = parse("PRINT ABS(SGN(-10))")[0] as PrintNode;
    const expr = result.expression as any;
    assertEquals(expr.type, "FunctionCall");
    assertEquals(expr.name, "ABS");
    assertEquals(expr.arguments[0].type, "FunctionCall");
    assertEquals(expr.arguments[0].name, "SGN");
});

Deno.test("parser handles function calls with multiple arguments", async () => {
    // First test valid multi-argument functions
    const result = parse("PRINT RND(1, 10)")[0] as PrintNode;
    const expr = result.expression as any;
    assertEquals(expr.type, "FunctionCall");
    assertEquals(expr.arguments.length, 2);

    // Then test unknown function
    assertThrows(
        () => parse("PRINT MIN(42)"),
        Error,
        "Unknown function: MIN"
    );
});

Deno.test("parser handles all built-in math functions", () => {
    const functions = [
        "ABS(-1)", 
        "SGN(-5)", 
        "INT(3.14)", 
        "RND(100)",
        "SQR(16)",
        "SIN(0)",
        "COS(0)",
        "TAN(0)"
    ];

    for (const func of functions) {
        const result = parse(`PRINT ${func}`)[0] as PrintNode;
        const expr = result.expression as any;
        assertEquals(expr.type, "FunctionCall");
        assert(expr.arguments.length > 0, `${func} should have arguments`);
    }
});

Deno.test("parser handles two-argument functions", () => {
  const statements = parse('PRINT ATN2(1, 1)');
  assertEquals(statements.length, 1);
  assertEquals((statements[0] as PrintNode).expression.type, "FunctionCall");
  const funcCall = (statements[0] as PrintNode).expression as FunctionCallNode;
  assertEquals(funcCall.name, "ATN2");
  assertEquals(funcCall.arguments.length, 2);
});

Deno.test("parser handles type conversion functions", () => {
  const source = `
    PRINT CINT(3.7)
    PRINT CSNG(3.14159265359)
    PRINT CDBL(3.14159265359)
  `;
  const statements = parse(source);
  assertEquals(statements.length, 3);
  
  // Check each statement is a function call with correct name
  const functionNames = statements.map(stmt => 
    ((stmt as PrintNode).expression as FunctionCallNode).name
  );
  assertEquals(functionNames, ["CINT", "CSNG", "CDBL"]);
});
