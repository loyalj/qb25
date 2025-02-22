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
