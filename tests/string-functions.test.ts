import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { captureOutput } from "./test-utils.ts";

Deno.test("basic string functions", async () => {
  const output = await captureOutput(`
    PRINT CHR$(65)
    PRINT LEFT$("hello", 2)
    PRINT RIGHT$("hello", 2)
    PRINT MID$("hello", 2, 2)
    PRINT LEN("hello")
    PRINT SPACE$(3)
    PRINT STRING$(3, "x")
    PRINT LTRIM$("   hello")
    PRINT RTRIM$("hello   ")
    PRINT UCASE$("Hello World")
    PRINT LCASE$("Hello World")
  `);
  assertEquals(output, [
    "A",                // CHR$
    "he",               // LEFT$
    "lo",               // RIGHT$
    "el",               // MID$
    "5",                // LEN
    "   ",              // SPACE$
    "xxx",              // STRING$
    "hello",            // LTRIM$
    "hello",            // RTRIM$
    "HELLO WORLD",      // UCASE$
    "hello world"       // LCASE$
  ]);
});

// Test string function edge cases
Deno.test("string function edge cases", async () => {
  const output = await captureOutput(`
    PRINT LEN("")
    PRINT LEFT$("", 1)
    PRINT RIGHT$("", 1)
    PRINT MID$("", 1, 1)
    PRINT SPACE$(0)
    PRINT STRING$(0, "x")
    PRINT LTRIM$("")
    PRINT RTRIM$("")
    PRINT UCASE$("")
    PRINT LCASE$("")
  `);
  assertEquals(output, [
    "0", "", "", "",    // Original empty string tests
    "",                 // SPACE$ with 0
    "",                 // STRING$ with 0
    "",                 // LTRIM$ empty
    "",                 // RTRIM$ empty
    "",                 // UCASE$ empty
    ""                  // LCASE$ empty
  ]);
});

// Test number format functions
Deno.test("number format functions", async () => {
  const output = await captureOutput(`
    PRINT STR$(42)
    PRINT STR$(-42)
    PRINT STR$(0)
    PRINT STR$(3.14159)
    PRINT STR$(-3.14159)
    PRINT OCT$(8)
    PRINT OCT$(15)
    PRINT HEX$(16)
    PRINT HEX$(255)
    PRINT VAL("123.45")
    PRINT VAL(" -456 ")
    PRINT VAL("abc")
  `);
  assertEquals(output, [
    " 42",              // STR$ positive
    "-42",              // STR$ negative
    " 0",               // STR$ zero
    " 3.14159",         // STR$ positive decimal
    "-3.14159",         // STR$ negative decimal
    "10",               // OCT$ of 8
    "17",               // OCT$ of 15
    "10",               // HEX$ of 16
    "FF",               // HEX$ of 255
    "123.45",           // VAL of decimal
    "-456",             // VAL with spaces
    "0"                 // VAL of non-numeric
  ]);
});

// Test string functions in expressions
Deno.test("string functions in expressions", async () => {
  const output = await captureOutput(`
    DIM x AS STRING
    LET x = "hello   "
    PRINT ">" + SPACE$(3) + "<"
    PRINT ">" + STRING$(2, "-") + "<"
    PRINT ">" + LTRIM$(x) + "<"
    PRINT ">" + RTRIM$(x) + "<"
    PRINT "Number:" + STR$(123)
    LET x = "456"
    PRINT "Value:" + x
  `);
  assertEquals(output, [
    ">   <",            // SPACE$ in expression
    ">--<",             // STRING$ in expression
    ">hello   <",       // LTRIM$ in expression
    ">hello<",          // RTRIM$ in expression
    "Number: 123",      // STR$ in expression
    "Value:456"         // String variable in expression
  ]);
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
  assertEquals(output, [
    "int:42",
    "single:3.14",
    "double:2.718281828459045"
  ]);
});


Deno.test("string trimming", async () => {
  const output = await captureOutput(`
    ' Trimming
    LET test = "  Hello Beautiful World!  "
    PRINT "Trimming (LTRIM$/RTRIM$):"
    PRINT "Left trim:  [" + LTRIM$(test) + "]"
    PRINT "Right trim: [" + RTRIM$(test) + "]"
    PRINT "Both trim: [" + LTRIM$(RTRIM$(test)) + "]"
    LET trimmed = LTRIM$(test)
    PRINT "First 5 chars: "; LEFT$(trimmed, 5)
    PRINT "Last 6 chars: "; RIGHT$(test, 6)
    PRINT "Middle chars: "; MID$(test, 8, 9)
  `);
  assertEquals(output, [
    "Trimming (LTRIM$/RTRIM$):",
    "Left trim:  [Hello Beautiful World!  ]",
    "Right trim: [  Hello Beautiful World!]",
    "Both trim: [Hello Beautiful World!]",
    "First 5 chars: Hello",
    "Last 6 chars: rld!  ",
    "Middle chars:  Beautifu"
  ]);
});


Deno.test("string manipulation", async () => {
  const output = await captureOutput(`
    LET test = "  Hello Beautiful World!  "
    LET searchFor = "Beautiful"
    PRINT "Position of "; searchFor; ": "; INSTR(test, searchFor)
    LET original = "Hello Beautiful World!"
    LET find = "Beautiful"
    LET replace = "Amazing"
    LET posx = INSTR(original, find)
    IF posx > 0 THEN
        LET start = LEFT$(original, posx - 1)
        LET rest = MID$(original, posx + LEN(find), LEN(original))
        LET result = start + replace + rest
        PRINT "Changed: "; result
    END IF
  `);
  assertEquals(output, [
    "Position of Beautiful: 9",
    "Changed: Hello Amazing World!"
  ]);
});