/**
 * Represents all possible token types in QBASIC.
 * These types are used to classify different parts of the source code during lexical analysis.
 */
export const enum TokenType {
    // Basic types
    KEYWORD = "KEYWORD",
    IDENTIFIER = "IDENTIFIER",
    NUMBER = "NUMBER",
    STRING = "STRING",
    OPERATOR = "OPERATOR",
    NOT_OPERATOR = "NOT_OPERATOR",
    PUNCTUATION = "PUNCTUATION",
    EOF = "EOF",
    NEWLINE = "NEWLINE",
    FUNCTION = "FUNCTION",
    STRING_FUNCTION = "STRING_FUNCTION",
    TYPE = "TYPE",
    LEFT_PAREN = "LEFT_PAREN",
    RIGHT_PAREN = "RIGHT_PAREN",
    COMMA = "COMMA",
    AS = "AS",
    LABEL = "LABEL",
    SEMICOLON = "SEMICOLON",

    // Specialized keyword types
    IF_KEYWORD = "IF_KEYWORD",
    THEN_KEYWORD = "THEN_KEYWORD",
    ELSE_KEYWORD = "ELSE_KEYWORD",
    FOR_KEYWORD = "FOR_KEYWORD",
    TO_KEYWORD = "TO_KEYWORD",
    STEP_KEYWORD = "STEP_KEYWORD",
    NEXT_KEYWORD = "NEXT_KEYWORD",
    WHILE_KEYWORD = "WHILE_KEYWORD",
    WEND_KEYWORD = "WEND_KEYWORD",
    DIM_KEYWORD = "DIM_KEYWORD",
    GOTO_KEYWORD = "GOTO_KEYWORD",
    END_KEYWORD = "END_KEYWORD"
}

/**
 * Represents a token in the QBASIC source code.
 * Each token has a type and a value.
 */
export interface Token {
    type: TokenType;
    value: string;
}

const specialTokens: Record<string, TokenType> = {
    "PRINT": TokenType.KEYWORD,
    "LET": TokenType.KEYWORD,
    "INPUT": TokenType.KEYWORD,
    "CLS": TokenType.KEYWORD,
    "IF": TokenType.IF_KEYWORD,
    "THEN": TokenType.THEN_KEYWORD,
    "ELSE": TokenType.ELSE_KEYWORD,
    "FOR": TokenType.FOR_KEYWORD,
    "TO": TokenType.TO_KEYWORD,
    "STEP": TokenType.STEP_KEYWORD,
    "NEXT": TokenType.NEXT_KEYWORD,
    "WHILE": TokenType.WHILE_KEYWORD,
    "WEND": TokenType.WEND_KEYWORD,
    "DIM": TokenType.DIM_KEYWORD,
    "GOTO": TokenType.GOTO_KEYWORD,
    "AS": TokenType.AS,
    "AND": TokenType.OPERATOR,
    "OR": TokenType.OPERATOR,
    "NOT": TokenType.NOT_OPERATOR,
    "END": TokenType.END_KEYWORD,
    "RETURN": TokenType.KEYWORD,
    "GOSUB": TokenType.KEYWORD,
    "SKIP": TokenType.IDENTIFIER,
    "ESCAPE": TokenType.IDENTIFIER,
    "IS": TokenType.OPERATOR
};

export const operators = new Set([
  "+", "-", "*", "/", "=", "<", ">", "<=", ">=", "<>", "AND", "OR", "IS"
]);

export const functions = new Set([
    "ABS", "SGN", "INT", "RND", "SQR", 
    "SIN", "COS", "TAN", "ASC", "ATN",
    "LOG", "EXP", "ATN2", "CINT", "CSNG", "CDBL",
    "VAL", "LEN"
]);

export const stringFunctions = new Set([
    "LEFT$", "RIGHT$", "MID$", "CHR$", "STR$", "INSTR",
    "SPACE$", "STRING$", "LTRIM$", "RTRIM$", "UCASE$", "LCASE$",
    "OCT$", "HEX$"
]);

const validTypes = new Set(["INTEGER", "SINGLE", "DOUBLE", "STRING"]);
const typeKeywords = new Set(["INTEGER", "SINGLE", "DOUBLE", "STRING"]);

/**
 * Converts a source string into an array of tokens.
 * This is the main tokenization function that breaks down QBASIC source code into its lexical components.
 * @param source The QBASIC source code as a string
 * @returns An array of Token objects
 * @throws Error if an invalid or unexpected token is encountered
 */
export function tokenize(source: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < source.length) {
        const char = source[i];

        if (isWhitespace(char)) {
            i++;
            continue;
        }

        if (char === '\n') {
            tokens.push(createToken(TokenType.NEWLINE, '\n'));
            i++;
            continue;
        }

        if (char === ':') {
            handleColon(tokens);
            i++;
            continue;
        }

        if (char === "'") {
            i = skipComment(source, i);
            continue;
        }

        if (char === '"') {
            i = handleString(source, i, tokens);
            continue;
        }

        if (isDigitOrDot(char)) {
            i = handleNumber(source, i, tokens);
            continue;
        }

        if (isIdentifierStart(char)) {
            i = handleIdentifierOrKeyword(source, i, tokens);
            continue;
        }

        if (isOperatorOrSymbol(char)) {
            i = handleOperatorOrSymbol(source, i, tokens);
            continue;
        }

        throw new Error(`Unexpected token: ${char}`);
    }

    if (tokens.length === 0 || tokens[tokens.length - 1].type !== TokenType.NEWLINE) {
        tokens.push(createToken(TokenType.EOF, ""));
    }

    return tokens;
}

/**
 * Checks if a character is whitespace (space, tab, or carriage return).
 * @param char The character to check
 * @returns true if the character is whitespace, false otherwise
 */
function isWhitespace(char: string): boolean {
    return /[ \t\r]/.test(char);
}

/**
 * Creates a new token with the specified type and value.
 * @param type The TokenType for the new token
 * @param value The string value for the token
 * @returns A new Token object
 */
function createToken(type: TokenType, value: string): Token {
    return { type, value };
}

/**
 * Handles colon characters in the source code.
 * Colons can either terminate statements or indicate labels.
 * @param tokens The current array of tokens
 */
function handleColon(tokens: Token[]): void {
    if (tokens.length > 0 && tokens[tokens.length - 1].type === TokenType.IDENTIFIER) {
        const prevToken = tokens[tokens.length - 1];
        tokens[tokens.length - 1] = createToken(TokenType.LABEL, prevToken.value);
    }
    tokens.push(createToken(TokenType.NEWLINE, ':'));
}

/**
 * Skips over comment text in the source code.
 * Comments in QBASIC start with a single quote and continue to the end of the line.
 * @param source The source code string
 * @param i The current position in the source
 * @returns The new position after skipping the comment
 */
function skipComment(source: string, i: number): number {
    while (i < source.length && source[i] !== '\n') i++;
    return i;
}

/**
 * Processes a string literal in the source code.
 * Strings are enclosed in double quotes.
 * @param source The source code string
 * @param i The current position in the source
 * @param tokens The current array of tokens
 * @returns The new position after processing the string
 */
function handleString(source: string, i: number, tokens: Token[]): number {
    let str = '"';
    i++;
    while (i < source.length && source[i] !== '"') {
        str += source[i++];
    }
    if (i < source.length) {
        str += source[i++];
    }
    tokens.push(createToken(TokenType.STRING, str));
    return i;
}

/**
 * Checks if a character is a digit or decimal point.
 * @param char The character to check
 * @returns true if the character is a digit or decimal point
 */
function isDigitOrDot(char: string): boolean {
    return /[0-9.]/.test(char);
}

/**
 * Processes numeric literals in the source code.
 * Handles integers, decimals, and scientific notation.
 * @param source The source code string
 * @param i The current position in the source
 * @param tokens The current array of tokens
 * @returns The new position after processing the number
 * @throws Error if the number format is invalid
 */
function handleNumber(source: string, i: number, tokens: Token[]): number {
    let numStr = '';
    let decimalCount = 0;
    let hasExponent = false;

    if (source[i] === '.') {
        if (!/[0-9]/.test(source[i + 1] || '')) {
            throw new Error("Invalid number format");
        }
        numStr = '.';
        decimalCount++;
        i++;
    } else {
        numStr = source[i];
        i++;
    }

    while (i < source.length && /[0-9]/.test(source[i])) {
        numStr += source[i++];
    }

    if (i < source.length && source[i] === '.') {
        if (decimalCount > 0 || /[eE]/.test(numStr)) {
            throw new Error("Invalid number format");
        }
        numStr += source[i++];
        decimalCount++;

        while (i < source.length && /[0-9]/.test(source[i])) {
            numStr += source[i++];
        }
    }

    if (i < source.length && /[eE]/.test(source[i])) {
        if (hasExponent) {
            throw new Error("Invalid number format");
        }
        numStr += source[i++];
        hasExponent = true;

        if (i < source.length && /[+-]/.test(source[i])) {
            numStr += source[i++];
        }

        if (!/[0-9]/.test(source[i] || '')) {
            throw new Error("Invalid number format");
        }

        while (i < source.length && /[0-9]/.test(source[i])) {
            numStr += source[i++];
        }
    }

    if (i < source.length && /[.]/.test(source[i])) {
        throw new Error("Invalid number format");
    }

    tokens.push(createToken(TokenType.NUMBER, numStr));
    return i;
}

/**
 * Checks if a character can start an identifier.
 * Valid identifier starts are letters and underscore.
 * @param char The character to check
 * @returns true if the character can start an identifier
 */
function isIdentifierStart(char: string): boolean {
    return /[A-Za-z_]/.test(char);
}

/**
 * Processes identifiers and keywords in the source code.
 * Handles variables, functions, and language keywords.
 * @param source The source code string
 * @param i The current position in the source
 * @param tokens The current array of tokens
 * @returns The new position after processing the identifier/keyword
 * @throws Error if an invalid type is encountered
 */
function handleIdentifierOrKeyword(source: string, i: number, tokens: Token[]): number {
    let word = '';
    let hasDollarSign = false;

    while (i < source.length && 
           (/[A-Za-z0-9_]/.test(source[i]) || 
            (!hasDollarSign && source[i] === '$'))) {
        if (source[i] === '$') {
            hasDollarSign = true;
        }
        word += source[i++];
    }

    const upperWord = word.toUpperCase();

    if (tokens.length > 0 && tokens[tokens.length - 1].type === TokenType.AS) {
        if (!validTypes.has(upperWord)) {
            throw new Error("Invalid type");
        }
        tokens.push(createToken(TokenType.TYPE, upperWord));
        return i;
    }

    if (upperWord in specialTokens) {
        tokens.push(createToken(specialTokens[upperWord], upperWord));
        return i;
    }

    if (stringFunctions.has(upperWord) || upperWord.endsWith('$')) {
        tokens.push(createToken(TokenType.STRING_FUNCTION, upperWord));
        return i;
    }

    if (functions.has(upperWord)) {
        tokens.push(createToken(TokenType.FUNCTION, upperWord));
        return i;
    }

    if (i < source.length && source[i] === '$') {
        const funcName = upperWord + '$';
        i++;
        if (stringFunctions.has(funcName)) {
            tokens.push(createToken(TokenType.STRING_FUNCTION, funcName));
            return i;
        }
    }

    if (upperWord in specialTokens) {
        tokens.push(createToken(specialTokens[upperWord], upperWord));
        return i;
    }

    if (functions.has(upperWord)) {
        tokens.push(createToken(TokenType.FUNCTION, upperWord));
        return i;
    }

    if (typeKeywords.has(upperWord) || validTypes.has(upperWord)) {
        tokens.push(createToken(TokenType.TYPE, upperWord));
        return i;
    }

    tokens.push(createToken(TokenType.IDENTIFIER, upperWord));
    return i;
}

/**
 * Checks if a character is an operator or symbol.
 * @param char The character to check
 * @returns true if the character is an operator or symbol
 */
function isOperatorOrSymbol(char: string): boolean {
    return /[+\-*/<>=,();]/.test(char);
}

/**
 * Processes operators and symbols in the source code.
 * Handles both single-character and two-character operators.
 * @param source The source code string
 * @param i The current position in the source
 * @param tokens The current array of tokens
 * @returns The new position after processing the operator/symbol
 */
function handleOperatorOrSymbol(source: string, i: number, tokens: Token[]): number {
    let op = source[i];
    if (i + 1 < source.length) {
        const twoChar = source[i] + source[i + 1];
        if (operators.has(twoChar)) {
            op = twoChar;
            i++;
        }
    }

    if (op === '(') {
        tokens.push(createToken(TokenType.LEFT_PAREN, op));
    } else if (op === ')') {
        tokens.push(createToken(TokenType.RIGHT_PAREN, op));
    } else if (op === ',') {
        tokens.push(createToken(TokenType.COMMA, op));
    } else if (op === ';') {
        tokens.push(createToken(TokenType.SEMICOLON, op));
    } else {
        tokens.push(createToken(TokenType.OPERATOR, op));
    }
    i++;
    return i;
}