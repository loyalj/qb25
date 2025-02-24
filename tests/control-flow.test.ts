import { assertEquals } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { captureOutput } from "./test-utils.ts";

// FOR/NEXT loops
Deno.test("basic FOR loop", async () => {
  const output = await captureOutput(`
    FOR i = 1 TO 3
      PRINT i
    NEXT i
  `);
  assertEquals(output, ["1", "2", "3"]);
});

Deno.test("FOR loop with STEP", async () => {
  const output = await captureOutput(`
    FOR i = 10 TO 2 STEP -2
      PRINT i
    NEXT i
  `);
  assertEquals(output, ["10", "8", "6", "4", "2"]);
});

// WHILE/WEND loops
Deno.test("WHILE loop", async () => {
  const output = await captureOutput(`
    LET x = 1
    WHILE x <= 3
      PRINT x
      LET x = x + 1
    WEND
  `);
  assertEquals(output, ["1", "2", "3"]);
});

// GOTO statements
Deno.test("GOTO control flow", async () => {
  const output = await captureOutput(`
    PRINT "start"
    GOTO skipLabel
    PRINT "should not print"
    skipLabel:
    PRINT "end"
  `);
  assertEquals(output, ["start", "end"]);
});

// Nested loop tests
Deno.test("nested loops", async () => {
  const output = await captureOutput(`
    FOR i = 1 TO 2
      FOR j = 1 TO 2
        PRINT i * j
      NEXT j
    NEXT i
  `);
  assertEquals(output, ["1", "2", "2", "4"]);
});

// Edge cases
Deno.test("loop edge cases", async () => {
  // Empty loop body
  const output1 = await captureOutput(`
    FOR i = 1 TO 0
      PRINT "should not print"
    NEXT i
    PRINT "done"
  `);
  assertEquals(output1, ["done"]);

  // Early exit using GOTO
  const output2 = await captureOutput(`
    LET x = 1
    WHILE x = 1
      PRINT x
      GOTO escapeLabel
    WEND
    escapeLabel:
    PRINT "escaped"
  `);
  assertEquals(output2, ["1", "escaped"]);
});
