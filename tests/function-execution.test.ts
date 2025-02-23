import { assertEquals } from "https://deno.land/std@0.204.0/testing/asserts.ts";
import { execute } from "../lib/interpreter.ts";

function withOutput(fn: () => Promise<void>): Promise<string> {
    let output = "";
    const originalLog = console.log;
    console.log = (msg: any) => { output += msg + "\n"; };
    return fn().then(() => {
        console.log = originalLog;
        return output.trim();
    });
}

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

Deno.test("all math functions with edge cases", async () => {
    const output = await withOutput(async () => {
        await execute(`
            ' Test each function with normal input
            PRINT ABS(-42)
            PRINT SGN(-5)
            PRINT SGN(5)
            PRINT SGN(0)
            PRINT INT(3.9)
            PRINT INT(-3.9)
            PRINT SQR(16)
            PRINT SQR(0)
            PRINT SIN(0)
            PRINT COS(0)
            PRINT TAN(0)
            
            ' Test RND variants
            PRINT RND() >= 0
            PRINT RND() < 1
            PRINT RND(10) >= 0
            PRINT RND(10) < 10
        `);
    });

    const lines = output.split('\n');
    assertEquals(lines[0], "42");
    assertEquals(lines[1], "-1");
    assertEquals(lines[2], "1");
    assertEquals(lines[3], "0");
    assertEquals(lines[4], "3");
    assertEquals(lines[5], "-4");
    assertEquals(lines[6], "4");
    assertEquals(lines[7], "0");
    assertEquals(lines[8], "0");
    assertEquals(lines[9], "1");
    assertEquals(lines[10], "0");
    assertEquals(lines.slice(11), ["true", "true", "true", "true"]);
});
