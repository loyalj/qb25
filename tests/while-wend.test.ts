import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { captureOutput } from "./test-utils.ts";
import { execute } from "../lib/interpreter.ts";

Deno.test("basic while loop", async () => {
  const output = await captureOutput(`
    LET x = 1
    WHILE x <= 3
      PRINT x
      LET x = x + 1
    WEND
  `);
  assertEquals(output, ["1", "2", "3"]);
});

Deno.test("nested while loops", async () => {
  const output = await captureOutput(`
    LET i = 1
    WHILE i <= 2
      LET j = 1
      WHILE j <= 2
        PRINT i * j
        LET j = j + 1
      WEND
      LET i = i + 1
    WEND
  `);
  assertEquals(output, ["1", "2", "2", "4"]);
});

Deno.test("while loop with complex condition", async () => {
  const output = await captureOutput(`
    LET x = 1
    LET y = 10
    WHILE x < 5 AND y > 5
      PRINT x * y
      LET x = x + 1
      LET y = y - 1
    WEND
  `);
  assertEquals(output, ["10", "18", "24", "28"]);
});

Deno.test("while loop syntax errors", async () => {
  // Missing WEND
  await assertRejects(
    () => execute(`
      WHILE x < 10
        PRINT x
        LET x = x + 1
    `),
    Error,
    "Unexpected end of input: While statement requires WEND"
  );

  // Mismatched WEND
  await assertRejects(
    () => execute(`
      PRINT "Hello"
      WEND
    `),
    Error,
    "Unexpected WEND without matching WHILE"
  );
});

Deno.test("while loop with if statements", async () => {
  const output = await captureOutput(`
    LET x = 1
    WHILE x <= 3
      IF x = 2 THEN
        PRINT "found two"
      END IF
      LET x = x + 1
    WEND
  `);
  assertEquals(output, ["found two"]);
});
