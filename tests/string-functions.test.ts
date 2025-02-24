import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { captureOutput } from "./test-utils.ts";

Deno.test("string functions", async () => {
  const output = await captureOutput(`
    PRINT CHR$(65)
    PRINT LEFT$("hello", 2)
    PRINT RIGHT$("hello", 2)
    PRINT MID$("hello", 2, 2)
    PRINT LEN("hello")
  `);
  assertEquals(output, ["A", "he", "lo", "el", "5"]);
});

Deno.test("string function edge cases", async () => {
  // Empty strings
  const output1 = await captureOutput(`
    PRINT LEN("")
    PRINT LEFT$("", 1)
    PRINT RIGHT$("", 1)
    PRINT MID$("", 1, 1)
  `);
  assertEquals(output1, ["0", "", "", ""]);

  // Out of bounds
  const output2 = await captureOutput(`
    PRINT LEFT$("a", 5)
    PRINT RIGHT$("a", 5)
    PRINT MID$("a", 5, 1)
  `);
  assertEquals(output2, ["a", "a", ""]);
});

// Test string concatenation with various types
Deno.test("string concatenation", async () => {
  const output = await captureOutput(`
    DIM i AS INTEGER
    DIM s AS SINGLE
    DIM d AS DOUBLE
    LET i = 42
    LET s = 3.14
    LET d = 2.718281828459045
    PRINT "int:" + i
    PRINT "single:" + s
    PRINT "double:" + d
  `);
  assertEquals(output, ["int:42", "single:3.14", "double:2.718281828459045"]);
});
