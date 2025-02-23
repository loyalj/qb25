import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { execute } from "../lib/interpreter.ts";
import { captureOutput } from "./test-utils.ts";

Deno.test("single line IF THEN ELSE", async () => {
  const output = await captureOutput(`
    LET x = 5
    IF x = 5 THEN PRINT "correct" ELSE PRINT "wrong"
    IF x = 6 THEN PRINT "wrong" ELSE PRINT "correct"
  `);
  assertEquals(output, ["correct", "correct"]);
});

Deno.test("multi-line IF THEN ELSE", async () => {
  const output = await captureOutput(`
    LET score = 75
    IF score >= 60 THEN
      PRINT "pass"
      PRINT score
    ELSE
      PRINT "fail"
      PRINT "retry"
    END IF
  `);
  assertEquals(output, ["pass", "75"]);
});

Deno.test("nested IF statements", async () => {
  const output = await captureOutput(`
    LET age = 25
    LET income = 50000
    IF age > 18 THEN
      IF income >= 45000 THEN
        PRINT "qualified"
      ELSE
        PRINT "insufficient income"
      END IF
    ELSE
      PRINT "too young"
    END IF
  `);
  assertEquals(output, ["qualified"]);
});

Deno.test("complex conditions in IF statements", async () => {
  const output = await captureOutput(`
    LET a = 1
    LET b = 2
    LET c = 3
    IF (a < b AND b < c) OR (c > 10) THEN
      PRINT "logic works"
    END IF
    IF NOT (a > b) AND c = 3 THEN
      PRINT "complex logic works"
    END IF
  `);
  assertEquals(output, ["logic works", "complex logic works"]);
});

Deno.test("IF THEN ELSE with string operations", async () => {
  const output = await captureOutput(`
    LET name = "Alice"
    IF name = "Alice" THEN
      PRINT "Hello " + name
      PRINT "Welcome back"
    ELSE
      PRINT "Unknown user"
    END IF
  `);
  assertEquals(output, ["Hello Alice", "Welcome back"]);
});
