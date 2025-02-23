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

Deno.test("tokenize functions", () => {
    const input = `PRINT ABS(-5)
                  PRINT SGN(10)`;
    const tokens = tokenize(input);
    
    // Test function recognition
    const functionTokens = tokens.filter(t => t.type === TokenType.FUNCTION);
    assertEquals(functionTokens.length, 2);
    assertEquals(functionTokens[0].value, "ABS");
    assertEquals(functionTokens[1].value, "SGN");

    // Test parentheses
    const parens = tokens.filter(t => t.type === TokenType.LEFT_PAREN || t.type === TokenType.RIGHT_PAREN);
    assertEquals(parens.length, 4);
});

Deno.test("tokenizer handles array syntax", () => {
    const input = "DIM arr(10)\nLET arr(5) = 42";
    const tokens = tokenize(input);
    
    assertEquals(tokens[0].type, TokenType.DIM_KEYWORD);
    assertEquals(tokens[1].type, TokenType.IDENTIFIER);
    assertEquals(tokens[2].type, TokenType.LEFT_PAREN);
    assertEquals(tokens[3].type, TokenType.NUMBER);
    assertEquals(tokens[4].type, TokenType.RIGHT_PAREN);
});

Deno.test("tokenizer handles all keywords", () => {
    const input = `
        PRINT LET INPUT IF THEN ELSE GOTO FOR NEXT 
        WHILE WEND CLS END DIM
    `;
    const tokens = tokenize(input);
    const keywords = tokens.filter(t => 
        t.type === TokenType.KEYWORD || 
        t.type === TokenType.IF_KEYWORD || 
        t.type === TokenType.THEN_KEYWORD || 
        t.type === TokenType.ELSE_KEYWORD ||
        t.type === TokenType.DIM_KEYWORD ||
        t.type === TokenType.END_KEYWORD
    );
    
    assertEquals(keywords.length, 14); // Updated to include END keyword
    assertEquals(tokens.some(t => t.value === "DIM" && t.type === TokenType.DIM_KEYWORD), true);
});

Deno.test("tokenizer handles all operators", () => {
    const input = `+ - * / = <> < > <= >= AND OR NOT`;
    const tokens = tokenize(input);
    const operators = tokens.filter(t => 
        t.type === TokenType.OPERATOR || 
        t.type === TokenType.NOT_OPERATOR
    );
    
    assertEquals(operators.length, 13); // Total number of operators including NOT
    assertEquals(tokens.some(t => t.value === "NOT" && t.type === TokenType.NOT_OPERATOR), true);
});

Deno.test("tokenizer handles decimal numbers", () => {
    const input = "3.14159 -0.5 .123 42. 1e3";
    const tokens = tokenize(input);
    const numbers = tokens.filter(t => t.type === TokenType.NUMBER);
    assertEquals(numbers.length, 5);
    assertEquals(numbers.map(n => n.value), ["3.14159", "0.5", ".123", "42.", "1e3"]);
});
