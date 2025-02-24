import { assertEquals, assertRejects } from "https://deno.land/std@0.204.0/testing/asserts.ts";
import { execute } from "../lib/interpreter.ts";
import { captureOutput } from "./test-utils.ts";

// Basic execution
Deno.test("interpreter - basic execution", async () => {
    const cases = [
        {
            input: `
                PRINT "Hello"
                PRINT 42
            `,
            expected: ["Hello", "42"]
        },
        {
            input: 'PRINT "A": PRINT "B": PRINT "C"',
            expected: ["A", "B", "C"]
        }
    ];

    for (const { input, expected } of cases) {
        const output = await captureOutput(input);
        assertEquals(output, expected);
    }
});

// Variables and types
Deno.test("interpreter - variables and types", async () => {
    const cases = [
        {
            input: `
                DIM count AS INTEGER
                DIM name AS STRING
                DIM price AS DOUBLE
                LET count = 42
                LET name = "John"
                LET price = 3.14
                PRINT count
                PRINT name
                PRINT price
            `,
            expected: ["42", "John", "3.14"]
        }
    ];

    for (const { input, expected } of cases) {
        const output = await captureOutput(input);
        assertEquals(output, expected);
    }
});

// Array operations
Deno.test("interpreter - arrays", async () => {
    const cases = [
        {
            input: `
                DIM arr(5) AS INTEGER
                LET arr(0) = 10
                LET arr(1) = 20
                PRINT arr(0) + arr(1)
            `,
            expected: ["30"]
        }
    ];

    for (const { input, expected } of cases) {
        const output = await captureOutput(input);
        assertEquals(output, expected);
    }

    // Test array bounds
    await assertRejects(
        () => execute(`
            DIM arr(5) AS INTEGER
            LET arr(5) = 42
        `),
        Error,
        "Array index out of bounds"
    );
});

// Control flow execution
Deno.test("interpreter - control flow", async () => {
    const cases = [
        {
            input: `
                LET x = 5
                IF x = 5 THEN
                    PRINT "yes"
                ELSE
                    PRINT "no"
                END IF
            `,
            expected: ["yes"]
        },
        {
            input: `
                FOR i = 1 TO 3
                    PRINT i
                NEXT i
            `,
            expected: ["1", "2", "3"]
        },
        {
            input: `
                LET x = 1
                WHILE x <= 3
                    PRINT x
                    LET x = x + 1
                WEND
            `,
            expected: ["1", "2", "3"]
        }
    ];

    for (const { input, expected } of cases) {
        const output = await captureOutput(input);
        assertEquals(output, expected);
    }
});

// Function execution
Deno.test("interpreter - functions", async () => {
    const cases = [
        {
            input: `
                PRINT ABS(-5)
                PRINT INT(3.7)
                PRINT LEFT$("Hello", 2)
            `,
            expected: ["5", "3", "He"]
        },
        {
            input: `
                PRINT SQR(16)
                PRINT LEN("Hello")
            `,
            expected: ["4", "5"]
        }
    ];

    for (const { input, expected } of cases) {
        const output = await captureOutput(input);
        assertEquals(output, expected);
    }
});

// Error handling
Deno.test("interpreter - errors", async () => {
    const cases = [
        {
            input: `
                DIM x AS INTEGER
                LET x = "hello"
            `,
            error: "Type mismatch"
        },
        {
            input: `
                PRINT x
            `,
            error: "Undefined variable"
        },
        {
            input: `
                DIM arr(5) AS INTEGER
                LET arr(10) = 42
            `,
            error: "Array index out of bounds"
        }
    ];

    for (const { input, error } of cases) {
        await assertRejects(
            () => execute(input),
            Error,
            error
        );
    }
});

// GOTO and labels
Deno.test("interpreter - goto", async () => {
    const output = await captureOutput(`
        PRINT "start"
        GOTO skip
        PRINT "hidden"
        skip:
        PRINT "end"
    `);
    assertEquals(output, ["start", "end"]);
});