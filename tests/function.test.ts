import { assertEquals, assertRejects} from "https://deno.land/std@0.204.0/testing/asserts.ts";
import { execute } from "../lib/interpreter.ts";
import { parse } from "../lib/parser.ts";
import type { PrintNode} from "../lib/parser.ts";

// Helper function for capturing console output
function withOutput(fn: () => Promise<void>): Promise<string> {
    let output = "";
    const originalLog = console.log;
    console.log = (msg: any) => { output += msg + "\n"; };
    return fn().then(() => {
        console.log = originalLog;
        return output.trim();
    });
}

// Parser Tests
Deno.test("parser handles basic function calls", () => {
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

Deno.test("parser handles multiple function arguments", async () => {
    const result = parse("PRINT RND(1, 10)")[0] as PrintNode;
    const expr = result.expression as any;
    assertEquals(expr.type, "FunctionCall");
    assertEquals(expr.arguments.length, 2);
});

Deno.test("parser handles function calls in expressions", () => {
    const result = parse("PRINT 2 * ABS(-5)")[0] as PrintNode;
    const expr = result.expression as any;
    assertEquals(expr.type, "BinaryExpression");
    assertEquals(expr.operator, "*");
    assertEquals(expr.right.type, "FunctionCall");
});

// Execution Tests
Deno.test("interpreter executes basic functions", async () => {
    const output = await withOutput(async () => {
        await execute(`
            PRINT ABS(-5)
            PRINT SGN(-10)
            PRINT INT(3.7)
            PRINT SQR(16)
        `);
    });
    assertEquals(output, "5\n-1\n3\n4");
});

Deno.test("interpreter executes nested functions", async () => {
    const output = await withOutput(async () => {
        await execute(`
            PRINT ABS(SGN(-10))
            PRINT INT(SQR(16) + 1)
        `);
    });
    assertEquals(output, "1\n5");
});

Deno.test("interpreter handles RND function", async () => {
    const output = await withOutput(async () => {
        await execute(`
            LET x = RND(10)
            PRINT x >= 0 AND x < 10
        `);
    });
    assertEquals(output, "true");
});

Deno.test("interpreter handles trigonometric functions", async () => {
    const output = await withOutput(async () => {
        await execute(`
            PRINT SIN(0)
            PRINT COS(0)
            PRINT TAN(0)
        `);
    });
    assertEquals(output, "0\n1\n0");
});

Deno.test("interpreter handles ASC function", async () => {
    const logs: string[] = [];
    console.log = (str: string) => logs.push(String(str));

    await execute('PRINT ASC("A")');
    assertEquals(logs[0], "65");

    await execute('PRINT ASC("abc")');
    assertEquals(logs[1], "97");

    await assertRejects(
        () => execute('PRINT ASC("")'),
        Error,
        "Cannot get ASCII code of empty string"
    );

    await assertRejects(
        () => execute('PRINT ASC(123)'),
        Error,
        "ASC function requires a string argument"
    );
});

Deno.test("interpreter handles ATN function", async () => {
    const logs: string[] = [];
    console.log = (str: string) => logs.push(String(str));

    await execute('PRINT ATN(0)');
    assertEquals(logs[0], "0");

    await execute('PRINT ATN(1)');
    assertEquals(Number(logs[1]).toFixed(7), "0.7853982");

    await execute('PRINT ATN(-1)');
    assertEquals(Number(logs[2]).toFixed(7), "-0.7853982");
});

Deno.test("logarithmic and exponential functions", async () => {
    const logs: string[] = [];
    console.log = (str: string) => logs.push(String(str));

    await execute('PRINT LOG(2.718282)');
    assertEquals(Number(logs[0]).toFixed(6), "1.000000");

    await execute('PRINT LOG(10)');
    assertEquals(Number(logs[1]).toFixed(6), "2.302585");

    await execute('PRINT EXP(1)');
    assertEquals(Number(logs[2]).toFixed(6), "2.718282");

    await execute('PRINT EXP(0)');
    assertEquals(logs[3], "1");
});

Deno.test("type conversion functions", async () => {
    const logs: string[] = [];
    console.log = (str: string) => logs.push(String(str));

    await execute(`
        PRINT CINT(3.7)    ' Should round to 4
        PRINT CINT(-3.7)   ' Should round to -4
        PRINT CSNG(1/3)    ' Should show ~7 decimal places
        PRINT CDBL(1/3)    ' Should show ~15 decimal places
    `);

    assertEquals(logs[0], "4");
    assertEquals(logs[1], "-4");
    assertEquals(logs[2].length <= 9, true);
    assertEquals(logs[3].length > 9, true);
});

Deno.test("function comprehensive edge cases", async () => {
    const logs: string[] = [];
    console.log = (str: string) => logs.push(String(str));

    await execute(`
        PRINT CINT(3.5)    ' Should round to 4
        PRINT CINT(-3.5)   ' Should round to -4
        PRINT CINT(2.5)    ' Should round to 3
    `);
    assertEquals(logs[0], "4");
    assertEquals(logs[1], "-4");
    assertEquals(logs[2], "3");

    await execute(`
        PRINT CSNG(1/3)              ' Should show ~7 digits
        PRINT CSNG(123456789.123)    ' Should round to 7 significant digits
        PRINT CSNG(0.00000123456)    ' Should maintain precision for small numbers
    `);
    assertEquals(logs[3], "0.3333333");
    assertEquals(logs[4], "1.234568e+8");
    assertEquals(logs[5], "1.234560e-6");
});

Deno.test("function error conditions", async () => {
    await assertRejects(
        () => execute('PRINT SQR(-1)'),
        Error,
        "Square root of negative number"
    );

    await assertRejects(
        () => execute('PRINT LOG(-1)'),
        Error,
        "Cannot take logarithm of negative number"
    );

    await assertRejects(
        () => execute('PRINT LOG(0)'),
        Error,
        "Cannot take logarithm of zero"
    );

    await assertRejects(
        () => execute('PRINT CINT("hello")'),
        Error,
        "Function CINT expects numeric arguments"
    );
});

Deno.test("numeric precision and rounding", async () => {
    const logs: string[] = [];
    console.log = (str: string) => logs.push(String(str));

    await execute(`
        PRINT CDBL(1/3)
        PRINT CSNG(1/3)
        PRINT CINT(2.5)    ' Should round to 3
        PRINT CINT(3.5)    ' Should round to 4
        PRINT CINT(-2.5)   ' Should round to -3
    `);

    assertEquals(logs[0].length > logs[1].length, true);
    assertEquals(logs[2], "3");
    assertEquals(logs[3], "4");
    assertEquals(logs[4], "-3");
});
