import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { execute } from "../lib/interpreter.ts";

// Add helper function for float comparison
function assertFloatEquals(actual: string, expected: string, precision = 7) {
  assertEquals(Number(actual).toFixed(precision), Number(expected).toFixed(precision));
}

// Helper function for capturing console output
async function captureOutput(code: string): Promise<string> {
  let output = "";
  const originalLog = console.log;
  console.log = (msg: any) => { output += String(msg) + "\n"; };
  await execute(code);
  console.log = originalLog;
  return output.trim();
}

// Basic type declarations and operations
Deno.test("basic variable types", async () => {
  const output = await captureOutput(`
    DIM count AS INTEGER
    DIM name AS STRING
    DIM price AS SINGLE
    DIM total AS DOUBLE

    LET count = 42
    LET name = "John"
    LET price = 19.99
    LET total = 123.456789

    PRINT count
    PRINT name
    PRINT price
    PRINT total
  `);

  const outputLines = output.split("\n");
  assertEquals(outputLines[0], "42");
  assertEquals(outputLines[1], "John");
  assertEquals(outputLines[2], "19.99");
  assertEquals(outputLines[3], "123.456789");
});

// Default values
Deno.test("default type values", async () => {
  const output = await captureOutput(`
    DIM i AS INTEGER
    DIM s AS STRING
    DIM n AS SINGLE
    PRINT i
    PRINT s
    PRINT n
  `);
  
  const outputLines = output.split("\n");
  assertEquals(outputLines[0], "0");
  assertEquals(outputLines[1], "");
  assertEquals(outputLines[2], "0");
});

// Type mismatch errors
Deno.test("type mismatch errors", async () => {
  await assertRejects(
    () => execute(`
      DIM x AS INTEGER
      LET x = "hello"
    `),
    Error,
    "Type mismatch"
  );

  await assertRejects(
    () => execute(`
      DIM s AS STRING
      LET s = 42
    `),
    Error,
    "Type mismatch"
  );
});

// Update the floating point test
Deno.test("type validation in expressions", async () => {
  const output = await captureOutput(`
    DIM i AS INTEGER
    DIM d AS DOUBLE
    LET i = 5
    LET d = 3.14
    PRINT i + d
    PRINT i * d
  `);
  
  const lines = output.split("\n");
  assertFloatEquals(lines[0], "8.14");
  assertFloatEquals(lines[1], "15.7");
});

// Error cases - update test to match case sensitivity
Deno.test("type error cases", async () => {
  // Redeclaring variables - case matches interpreter
  await assertRejects(
    () => execute(`
      DIM X AS INTEGER
      DIM X AS STRING
    `),
    Error,
    "Variable X already declared"
  );

  // Invalid type name
  await assertRejects(
    () => execute(`
      DIM x AS FLOAT
    `),
    Error,
    "Invalid type"
  );

  // Using undeclared variable
  await assertRejects(
    () => execute(`
      PRINT x
    `),
    Error,
    "Undefined variable"
  );
});
