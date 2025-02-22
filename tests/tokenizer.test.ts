import { assertEquals } from "https://deno.land/std@0.204.0/testing/asserts.ts";
import { tokenize, TokenType } from "../lib/tokenizer.ts";

Deno.test("tokenizer handles basic IF THEN ELSE", () => {
    const input = "IF x = 5 THEN PRINT x ELSE PRINT y";
    const tokens = tokenize(input);
    
    // Check IF token
    assertEquals(tokens[0].type, TokenType.IF_KEYWORD);
    assertEquals(tokens[0].value, "IF");
    
    // Check each token to verify the sequence
    const expectedSequence = [
        { type: TokenType.IF_KEYWORD, value: "IF" },
        { type: TokenType.IDENTIFIER, value: "X" },
        { type: TokenType.OPERATOR, value: "=" },
        { type: TokenType.NUMBER, value: "5" },
        { type: TokenType.THEN_KEYWORD, value: "THEN" },
        { type: TokenType.KEYWORD, value: "PRINT" },
        { type: TokenType.IDENTIFIER, value: "X" },
        { type: TokenType.ELSE_KEYWORD, value: "ELSE" },
        { type: TokenType.KEYWORD, value: "PRINT" },
        { type: TokenType.IDENTIFIER, value: "Y" },
        { type: TokenType.EOF, value: "" }
    ];

    expectedSequence.forEach((expected, i) => {
        assertEquals(tokens[i].type, expected.type);
        assertEquals(tokens[i].value, expected.value);
    });
});

Deno.test("tokenizer handles all operators", () => {
    const input = "+ - * / = <> < > <= >= AND OR";
    const tokens = tokenize(input);
    const operators = tokens.filter(t => t.type === TokenType.OPERATOR).map(t => t.value);
    
    assertEquals(operators, ["+", "-", "*", "/", "=", "<>", "<", ">", "<=", ">=", "AND", "OR"]);
});

Deno.test("tokenizer handles string literals", () => {
    const input = '"Hello, World!" "Test" "" "Contains spaces"';
    const tokens = tokenize(input);
    const strings = tokens.filter(t => t.type === TokenType.STRING);
    
    assertEquals(strings.length, 4);
    assertEquals(strings[0].value, '"Hello, World!"');
});

Deno.test("tokenizer handles comments", () => {
    const input = "PRINT x ' This is a comment\nPRINT y";
    const tokens = tokenize(input);
    
    assertEquals(tokens.filter(t => t.type === TokenType.KEYWORD).length, 2);
});

Deno.test("tokenizer handles numbers", () => {
    const input = "42 0 123";
    const tokens = tokenize(input);
    const numbers = tokens.filter(t => t.type === TokenType.NUMBER);
    
    assertEquals(numbers.length, 3);
    assertEquals(numbers.map(n => n.value), ["42", "0", "123"]);
});
