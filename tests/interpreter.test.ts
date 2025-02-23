import { assertEquals, assertRejects } from "https://deno.land/std@0.204.0/testing/asserts.ts";
import { execute } from "../lib/interpreter.ts";

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

// Basic Operations
Deno.test("arithmetic operations", async () => {
    const output = await withOutput(async () => {
        await execute(`
            LET a = 5
            LET b = 3
            PRINT a + b
            PRINT a - b
            PRINT a * b
            PRINT a / b
        `);
    });
    assertEquals(output, "8\n2\n15\n1.6666666666666667");
});

Deno.test("string operations", async () => {
    const output = await withOutput(async () => {
        await execute(`
            LET name = "World"
            PRINT "Hello, " + name
            LET x = 42
            PRINT "Value: " + x
        `);
    });
    assertEquals(output, "Hello, World\nValue: 42");
});

// Comparison Operators
Deno.test("comparison operators", async () => {
    const output = await withOutput(async () => {
        await execute(`
            LET x = 5
            LET y = 3
            IF x = 5 THEN PRINT "eq"
            IF x <> y THEN PRINT "neq"
            IF x > y THEN PRINT "gt"
            IF x >= 5 THEN PRINT "gte"
            IF y < x THEN PRINT "lt"
            IF y <= 3 THEN PRINT "lte"
        `);
    });
    assertEquals(output, "eq\nneq\ngt\ngte\nlt\nlte");
});

// Complex Logic
Deno.test("nested logical expressions", async () => {
    const output = await withOutput(async () => {
        await execute(`
            LET x = 5
            LET y = 3
            LET z = 10
            IF (x > y AND y > 0) OR z = 10 THEN PRINT "complex true"
            IF x > y AND (y > 0 OR z < 0) THEN PRINT "nested true"
        `);
    });
    assertEquals(output, "complex true\nnested true");
});

// Error Conditions
Deno.test("undefined variable error", async () => {
    await assertRejects(
        () => execute('PRINT undefinedVar'),
        Error,
        "Undefined variable: UNDEFINEDVAR"
    );
});

Deno.test("division by zero", async () => {
    const output = await withOutput(async () => {
        await execute('PRINT 10 / 0');
    });
    assertEquals(output, "DIVIDE BY ZERO ERROR");
});

// Multiple Statements
Deno.test("multiple statement execution order", async () => {
    const output = await withOutput(async () => {
        await execute(`
            LET x = 1
            PRINT x
            LET x = x + 1
            PRINT x
            LET x = x + 1
            PRINT x
        `);
    });
    assertEquals(output, "1\n2\n3");
});

// Existing IF THEN ELSE and AND/OR tests remain...
Deno.test("interpreter executes IF THEN ELSE correctly", async () => {
    const output = await withOutput(async () => {
        await execute(`
            LET x = 5
            IF x > 3 THEN PRINT "Greater" ELSE PRINT "Lesser"
            IF x < 3 THEN PRINT "Wrong" ELSE PRINT "Correct"
        `);
    });
    assertEquals(output, "Greater\nCorrect");
});

Deno.test("interpreter handles AND/OR operators", async () => {
    const output = await withOutput(async () => {
        await execute(`
            LET x = 5
            LET y = 2
            IF x >= 10 AND y < 5 THEN PRINT "Both true" ELSE PRINT "Not both"
            IF x >= 10 OR y < 5 THEN PRINT "At least one" ELSE PRINT "Neither"
        `);
    });
    assertEquals(output, "Not both\nAt least one");
});

Deno.test("interpreter handles NOT operator", async () => {
    const output = await withOutput(async () => {
        await execute(`
            LET x = 5
            LET y = 0
            IF NOT x > 10 THEN PRINT "not greater"
            IF NOT (x = 3) THEN PRINT "not equal"
            IF NOT y THEN PRINT "y is false"
            IF NOT (x < 3) THEN PRINT "not less"
        `);
    });
    assertEquals(output, "not greater\nnot equal\ny is false\nnot less");
});

// Test CLS command
Deno.test("interpreter handles CLS command", async () => {
    const originalClear = console.clear;
    let clearCalled = false;
    console.clear = () => { clearCalled = true; };
    
    try {
        await execute("CLS");
        assertEquals(clearCalled, true);
    } finally {
        console.clear = originalClear;
    }
});

// Test INPUT command
Deno.test("interpreter handles INPUT command", async () => {
    const originalWrite = Deno.stdout.write;
    const originalRead = Deno.stdin.read;
    const textDecoder = new TextDecoder();
    let promptShown = false;
    let inputProcessed = false;
    
    // Mock stdout.write
    Deno.stdout.write = async (p: Uint8Array) => {
        promptShown = textDecoder.decode(p) === "? ";
        return p.length;
    };
    
    // Mock stdin.read
    Deno.stdin.read = async (p: Uint8Array) => {
        const testInput = new TextEncoder().encode("42\n");
        p.set(testInput);
        inputProcessed = true;
        return testInput.length;
    };
    
    try {
        const output = await withOutput(async () => {
            await execute(`
                INPUT x
                PRINT x
            `);
        });
        assertEquals(promptShown, true);
        assertEquals(inputProcessed, true);
        assertEquals(output, "42");
    } finally {
        Deno.stdout.write = originalWrite;
        Deno.stdin.read = originalRead;
    }
});

// Test line comments
Deno.test("interpreter handles comments", async () => {
    const output = await withOutput(async () => {
        await execute(`
            ' This is a comment
            PRINT "Hello" ' This is also a comment
            ' Another comment
            PRINT "World"
        `);
    });
    assertEquals(output, "Hello\nWorld");
});

// Test syntax errors
Deno.test("interpreter handles syntax errors", async () => {
    await assertRejects(
        () => execute("IF THEN PRINT x"),
        Error,
        "Unexpected token: THEN"
    );
    
    await assertRejects(
        () => execute("LET "),  // Changed to trigger EOF at identifier
        Error,
        "Unexpected end of input"
    );
});

// Test invalid expressions
Deno.test("interpreter handles invalid expressions", async () => {
    await assertRejects(
        () => execute('PRINT "text" - 5'),
        Error,
        "Invalid binary expression"
    );
});

// Test multiple statements on one line
Deno.test("interpreter handles multiple statements", async () => {
    const output = await withOutput(async () => {
        await execute("LET x = 1: PRINT x: LET x = 2: PRINT x");
    });
    assertEquals(output, "1\n2");
});

// Test empty and whitespace programs
Deno.test("interpreter handles empty programs", async () => {
    await execute("");
    await execute("  \n  \t  \n");
    // Should not throw any errors
});

// Add new test group for functions
Deno.test("interpreter executes math functions", async () => {
    const output = await withOutput(async () => {
        await execute(`
            PRINT ABS(-5)
            PRINT SGN(-10)
        `);
    });
    assertEquals(output, "5\n-1");
});

Deno.test("interpreter handles nested function calls", async () => {
    const output = await withOutput(async () => {
        await execute(`
            PRINT ABS(SGN(-10))
        `);
    });
    assertEquals(output, "1");
});

Deno.test("interpreter handles function errors", async () => {
    await assertRejects(
        () => execute('PRINT UNKNOWN(5)'),
        Error,
        "Unknown function: UNKNOWN"
    );

    await assertRejects(
        () => execute('PRINT ABS("hello")'),
        Error,
        "Function ABS expects numeric arguments"
    );
});

Deno.test("interpreter executes math functions", async () => {
    const output = await withOutput(async () => {
        await execute(`
            PRINT INT(3.7)
            PRINT RND(100)
            PRINT SQR(16)
            PRINT SIN(0)
            PRINT COS(0)
            PRINT TAN(0)
        `);
    });

    const lines = output.split('\n');
    assertEquals(lines[0], "3");
    assertEquals(Number(lines[1]) >= 0 && Number(lines[1]) < 100, true);
    assertEquals(lines[2], "4");
    assertEquals(lines[3], "0");
    assertEquals(lines[4], "1");
    assertEquals(lines[5], "0");
});

Deno.test("math functions handle edge cases", async () => {
    const output = await withOutput(async () => {
        await execute(`
            PRINT SQR(0)
            PRINT SIN(3.14159265359)
            PRINT COS(3.14159265359)
        `);
    });

    const lines = output.split('\n');
    assertEquals(lines[0], "0");
    assertEquals(Math.abs(Number(lines[1])) < 0.0001, true); // Should be close to 0
    assertEquals(Math.abs(Number(lines[2]) + 1) < 0.0001, true); // Should be close to -1
});

// Add test for RND predictability
Deno.test("RND generates values within range", async () => {
    const output = await withOutput(async () => {
        await execute(`
            PRINT RND(10) < 10
            PRINT RND(10) >= 0
            PRINT RND() < 1
            PRINT RND() >= 0
        `);
    });

    assertEquals(output, "true\ntrue\ntrue\ntrue");
});

Deno.test("function edge cases and errors", async () => {
    // Test edge cases
    const output = await withOutput(async () => {
        await execute(`
            PRINT SQR(0)
            PRINT ABS(0)
            PRINT SGN(0)
            PRINT INT(-3.7)
            PRINT RND()
        `);
    });
    
    const lines = output.split('\n');
    assertEquals(lines[0], "0");
    assertEquals(lines[1], "0");
    assertEquals(lines[2], "0");
    assertEquals(lines[3], "-4");
    assertEquals(Number(lines[4]) >= 0 && Number(lines[4]) < 1, true);

    // Test errors
    await assertRejects(
        () => execute('PRINT SQR(-1)'),
        Error,
        "Square root of negative number"
    );

    await assertRejects(
        () => execute('PRINT ABS("text")'),
        Error,
        "Function ABS expects numeric arguments"
    );
});

Deno.test("operator precedence and grouping", async () => {
    const output = await withOutput(async () => {
        await execute(`
            PRINT 2 + 3 * 4
            PRINT (2 + 3) * 4
            PRINT -2 * 3
            PRINT NOT 0 AND 1
            PRINT 1 OR 0 AND 0
        `);
    });
    
    const lines = output.split('\n');
    assertEquals(lines[0], "14");     // 2 + (3 * 4)
    assertEquals(lines[1], "20");     // (2 + 3) * 4
    assertEquals(lines[2], "-6");     // (-2) * 3
    assertEquals(lines[3], "true");   // (NOT 0) AND 1
    assertEquals(lines[4], "true");   // 1 OR (0 AND 0)
});

Deno.test("interpreter handles LOG and EXP", async () => {
  const logs: string[] = [];
  console.log = (str: string) => logs.push(String(str));

  await execute(`
    PRINT LOG(EXP(1))  ' Should be 1
    PRINT EXP(LOG(2))  ' Should be 2
  `);

  assertEquals(Number(logs[0]).toFixed(6), "1.000000");
  assertEquals(Number(logs[1]).toFixed(6), "2.000000");
});

Deno.test("interpreter handles type conversions", async () => {
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
  assertEquals(logs[2].length <= 9, true);  // CSNG precision check
  assertEquals(logs[3].length > 9, true);   // CDBL precision check
});

Deno.test("interpreter handles ATN2", async () => {
  const logs: string[] = [];
  console.log = (str: string) => logs.push(String(str));

  await execute(`
    PRINT ATN2(1, 1)     ' Should be π/4
    PRINT ATN2(-1, -1)   ' Should be -3π/4
    PRINT ATN2(0, 1)     ' Should be 0
  `);

  assertEquals(Number(logs[0]).toFixed(6), "0.785398");
  assertEquals(Number(logs[1]).toFixed(6), "-2.356194");
  assertEquals(logs[2], "0");
});

// Add ASC function tests
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
