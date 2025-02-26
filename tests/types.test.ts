import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { execute } from "../lib/interpreter.ts";
import { captureOutput } from "./test-utils.ts";

// Add helper function for float comparison
function assertFloatEquals(actual: string, expected: string, precision = 7) {
  assertEquals(Number(actual).toFixed(precision), Number(expected).toFixed(precision));
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

  // output is already an array, no need to split
  assertEquals(output[0], "42");
  assertEquals(output[1], "John");
  assertEquals(output[2], "19.99");
  assertEquals(output[3], "123.456789");
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
  
  // output is already an array, no need to split
  assertEquals(output[0], "0");
  assertEquals(output[1], "");
  assertEquals(output[2], "0");
});

// Type mismatch errors
Deno.test("type mismatch errors", async () => {
  // String to number assignment should fail
  await assertRejects(
    () => captureOutput(`
      DIM x AS INTEGER
      LET x = "hello"
    `),
    Error,
    "Type mismatch"
  );

  // Number to string assignment should fail
  await assertRejects(
    () => captureOutput(`
      DIM x AS STRING
      LET x = 42
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
  
  // output is already an array, no need to split
  assertFloatEquals(output[0], "8.14");
  assertFloatEquals(output[1], "15.7");
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

  // This is the failing test
  await assertRejects(
    () => execute(`
      DIM x AS FLOAT
    `),
    Error,
    "Invalid type"  // Expected error message
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
