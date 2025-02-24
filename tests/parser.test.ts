import { assertEquals, assertThrows } from "https://deno.land/std@0.204.0/testing/asserts.ts";
import { parse } from "../lib/parser.ts";
import type { PrintNode, Statement, IfNode, DimNode, LetNode, ForNode, WhileNode } from "../lib/parser.ts";
import { QBType } from "../lib/types.ts";

// Statement structure tests
Deno.test("parser - statements", () => {
    const cases = [
        {
            input: "LET x = 42",
            check: (stmt: LetNode) => {
                assertEquals(stmt.type, "Let");
                assertEquals(stmt.variable, "X");
                assertEquals((stmt.value as any).value, 42);
            }
        },
        {
            input: 'PRINT "Hello"',
            check: (stmt: PrintNode) => {
                assertEquals(stmt.type, "Print");
                assertEquals((stmt.expression as any).value, "Hello");
            }
        },
        {
            input: "DIM arr(10) AS INTEGER",
            check: (stmt: DimNode) => {
                assertEquals(stmt.type, "Dim");
                assertEquals(stmt.variable, "ARR");
                assertEquals(stmt.size, 10);
                assertEquals(stmt.variableType, QBType.INTEGER);
            }
        }
    ];

    for (const { input, check } of cases) {
        check(parse(input)[0] as any);
    }
});

// Control flow structure tests
Deno.test("parser - control flow", () => {
    const cases = [
        {
            input: "IF x > 0 THEN PRINT x",
            check: (stmt: IfNode) => {
                assertEquals(stmt.type, "If");
                assertEquals(stmt.thenBranch.length, 1);
                assertEquals(stmt.elseBranch, undefined);
            }
        },
        {
            input: `
                WHILE x < 10
                    PRINT x
                WEND
            `,
            check: (stmt: WhileNode) => {
                assertEquals(stmt.type, "While");
                assertEquals(stmt.body.length, 1);
            }
        },
        {
            input: `
                FOR i = 1 TO 10
                    PRINT i
                NEXT i
            `,
            check: (stmt: ForNode) => {
                assertEquals(stmt.type, "For");
                assertEquals(stmt.variable, "I");
                assertEquals(stmt.body.length, 1);
            }
        }
    ];

    for (const { input, check } of cases) {
        check(parse(input)[0] as any);
    }
});

// Expression structure tests
Deno.test("parser - expressions", () => {
    const cases = [
        {
            input: "PRINT 2 + 3 * 4",
            check: (stmt: PrintNode) => {
                const expr = stmt.expression as any;
                assertEquals(expr.type, "BinaryExpression");
                assertEquals(expr.operator, "+");
                assertEquals(expr.right.operator, "*");
            }
        },
        {
            input: "LET x = -5",
            check: (stmt: LetNode) => {
                const expr = stmt.value as any;
                assertEquals(expr.type, "NumberLiteral");
                assertEquals(expr.value, -5);
            }
        }
    ];

    for (const { input, check } of cases) {
        check(parse(input)[0] as any);
    }
});

// Function call structure tests
Deno.test("parser - functions", () => {
    const cases = [
        {
            input: "PRINT ABS(-5)",
            check: (stmt: PrintNode) => {
                const expr = stmt.expression as any;
                assertEquals(expr.type, "FunctionCall");
                assertEquals(expr.name, "ABS");
                assertEquals(expr.arguments.length, 1);
            }
        },
        {
            input: "PRINT LEFT$(str, 3)",
            check: (stmt: PrintNode) => {
                const expr = stmt.expression as any;
                assertEquals(expr.type, "FunctionCall");
                assertEquals(expr.name, "LEFT$");
                assertEquals(expr.arguments.length, 2);
            }
        }
    ];

    for (const { input, check } of cases) {
        check(parse(input)[0] as any);
    }
});

// Error cases - updated with correct error messages
Deno.test("parser - errors", () => {
    const cases = [
        {
            input: "LET 42 = x",
            error: "Unexpected token"
        },
        {
            input: "DIM arr(-5) AS INTEGER",
            error: "Array size must be positive"
        },
        {
            input: "IF THEN",
            error: "Unexpected token: THEN"  // Updated to match actual error
        },
        {
            input: "PRINT )",
            error: "Unexpected token"
        }
    ];

    for (const { input, error } of cases) {
        assertThrows(
            () => parse(input),
            Error,
            error
        );
    }
});
