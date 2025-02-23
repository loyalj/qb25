import { assertEquals } from "https://deno.land/std@0.204.0/testing/asserts.ts";
import { parse } from "../lib/parser.ts";

Deno.test("parser handles basic function calls", () => {
    const input = "PRINT ABS(-5)";
    const ast = parse(input);
    
    assertEquals(ast.length, 1);
    assertEquals(ast[0].type, "Print");
    
    const printNode = ast[0] as any;
    assertEquals(printNode.expression.type, "FunctionCall");
    assertEquals(printNode.expression.name, "ABS");
    assertEquals(printNode.expression.arguments.length, 1);
});

Deno.test("parser handles nested function calls", () => {
    const input = "PRINT ABS(SGN(-10))";
    const ast = parse(input);
    
    const printNode = ast[0] as any;
    assertEquals(printNode.expression.type, "FunctionCall");
    assertEquals(printNode.expression.name, "ABS");
    
    const innerFunc = printNode.expression.arguments[0];
    assertEquals(innerFunc.type, "FunctionCall");
    assertEquals(innerFunc.name, "SGN");
});

Deno.test("parser handles multiple function arguments", () => {
    const input = "LET x = RND(1, 10)";
    const ast = parse(input);
    
    const letNode = ast[0] as any;
    assertEquals(letNode.value.type, "FunctionCall");
    assertEquals(letNode.value.arguments.length, 2);
});

Deno.test("parser handles function calls in expressions", () => {
    const cases = [
        {
            input: "IF ABS(x) > 5 THEN PRINT x",
            check: (node: any) => {
                assertEquals(node.condition.type, "BinaryExpression");
                assertEquals(node.condition.left.type, "FunctionCall");
                assertEquals(node.condition.left.name, "ABS");
            }
        },
        {
            input: "LET y = SQR(x) + 1",
            check: (node: any) => {
                assertEquals(node.value.type, "BinaryExpression");
                assertEquals(node.value.left.type, "FunctionCall");
                assertEquals(node.value.left.name, "SQR");
            }
        }
    ];

    for (const testCase of cases) {
        const ast = parse(testCase.input);
        testCase.check(ast[0]);
    }
});
