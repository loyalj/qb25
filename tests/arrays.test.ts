import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { captureOutput } from "./test-utils.ts";
import { execute } from "../lib/interpreter.ts";

Deno.test("array declaration and initialization", async () => {
  const output = await captureOutput(`
    DIM numbers(5) AS INTEGER
    PRINT numbers(0)
    PRINT numbers(4)
  `);
  assertEquals(output, ["0", "0"]); // Arrays should initialize to 0/empty
});

Deno.test("array assignment and access", async () => {
  const output = await captureOutput(`
    DIM arr(3) AS INTEGER
    LET arr(0) = 10
    LET arr(1) = 20
    LET arr(2) = 30
    PRINT arr(0)
    PRINT arr(1)
    PRINT arr(2)
  `);
  assertEquals(output, ["10", "20", "30"]);
});

Deno.test("array bounds checking", async () => {
  // Test negative index
  await assertRejects(
    () => execute(`
      DIM arr(5) AS INTEGER
      LET arr(-1) = 42
    `),
    Error,
    "Array index out of bounds"
  );

  // Test index too large
  await assertRejects(
    () => execute(`
      DIM arr(5) AS INTEGER
      LET arr(5) = 42
    `),
    Error,
    "Array index out of bounds"
  );
});

Deno.test("array with different types", async () => {
  const output = await captureOutput(`
    DIM integers(2) AS INTEGER
    DIM strings(2) AS STRING
    DIM doubles(2) AS DOUBLE
    
    LET integers(0) = 42
    LET strings(0) = "Hello"
    LET doubles(0) = 3.14159
    
    PRINT integers(0)
    PRINT strings(0)
    PRINT doubles(0)
  `);
  
  assertEquals(output, ["42", "Hello", "3.14159"]);
});

Deno.test("array type checking", async () => {
  // Test assigning string to integer array
  await assertRejects(
    () => execute(`
      DIM nums(5) AS INTEGER
      LET nums(0) = "hello"
    `),
    Error,
    "Type mismatch"
  );

  // Test assigning float to integer array
  await assertRejects(
    () => execute(`
      DIM nums(5) AS INTEGER
      LET nums(0) = 3.14
    `),
    Error,
    "Type mismatch"
  );
});

Deno.test("array in expressions", async () => {
  const output = await captureOutput(`
    DIM nums(3) AS INTEGER
    LET nums(0) = 5
    LET nums(1) = 10
    PRINT nums(0) + nums(1)
    PRINT nums(0) * 2
  `);
  assertEquals(output, ["15", "10"]);
});

Deno.test("array with loop", async () => {
  const output = await captureOutput(`
    DIM arr(5) AS INTEGER
    FOR i = 0 TO 4
      LET arr(i) = i * 2
    NEXT i
    FOR i = 0 TO 4
      PRINT arr(i)
    NEXT i
  `);
  assertEquals(output, ["0", "2", "4", "6", "8"]);
});

// Test array declaration errors
Deno.test("array declaration errors", async () => {
  // Zero size array
  await assertRejects(
    () => execute(`DIM arr(0) AS INTEGER`),
    Error,
    "Array size must be positive"
  );

  // Negative size array
  await assertRejects(
    () => execute(`DIM arr(-5) AS INTEGER`),
    Error,
    "Array size must be positive"
  );

  // Redeclaring array
  await assertRejects(
    () => execute(`
      DIM arr(5) AS INTEGER
      DIM arr(10) AS INTEGER
    `),
    Error,
    "Variable ARR already declared"  // Updated to match actual error message
  );
});

Deno.test("array string operations", async () => {
  const output = await captureOutput(`
    DIM words(2) AS STRING
    LET words(0) = "Hello"
    LET words(1) = "World"
    PRINT words(0) + " " + words(1)
  `);
  assertEquals(output, ["Hello World"]);
});
