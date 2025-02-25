export const enum TokenType {
    // Basic types
    KEYWORD = "KEYWORD",
    IDENTIFIER = "IDENTIFIER",
    NUMBER = "NUMBER",
    STRING = "STRING",
    OPERATOR = "OPERATOR",
    NOT_OPERATOR = "NOT_OPERATOR",  // Add NOT_OPERATOR
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
    SEMICOLON = "SEMICOLON",  // Add new token type for semicolon

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

export interface Token {
    type: TokenType;
    value: string;
}

// Update keyword mapping
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
    "WEND": TokenType.WEND_KEYWORD,  // Make sure WEND is properly defined
    "DIM": TokenType.DIM_KEYWORD,
    "GOTO": TokenType.GOTO_KEYWORD,
    "AS": TokenType.AS,
    "AND": TokenType.OPERATOR,
    "OR": TokenType.OPERATOR,
    "NOT": TokenType.NOT_OPERATOR,
    "END": TokenType.END_KEYWORD,
    "RETURN": TokenType.KEYWORD,
    "GOSUB": TokenType.KEYWORD,
    "SKIP": TokenType.IDENTIFIER,  // Add support for labels
    "ESCAPE": TokenType.IDENTIFIER  // Add support for labels
};

const operators = new Set(["+", "-", "*", "/", "=", "<", ">", "<=", ">=", "<>", "AND", "OR"]);

export const functions = new Set([
    "ABS", "SGN", "INT", "RND", "SQR", 
    "SIN", "COS", "TAN", "ASC", "ATN",
    "LOG", "EXP", "ATN2", "CINT", "CSNG", "CDBL", "LEN",
    // Add string functions (with $) to the main functions set
    "LEFT$", "RIGHT$", "MID$", "CHR$", "STR$", "INSTR$", "LEN$"
]);

const stringFunctions = new Set([
    "LEFT$", "RIGHT$", "MID$", "CHR$", "STR$", "INSTR$", "LEN$"
]);

const validTypes = new Set(["INTEGER", "SINGLE", "DOUBLE", "STRING"]);

// Handle type keywords before generic keywords
const typeKeywords = new Set(["INTEGER", "SINGLE", "DOUBLE", "STRING"]);

// Update how we handle identifiers and keywords
export function tokenize(source: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    
    while (i < source.length) {
        const char = source[i];

        // Skip whitespace except newlines
        if (/[ \t\r]/.test(char)) {
            i++;
            continue;
        }

        // Handle newlines and colons
        if (char === '\n') {
            tokens.push({ type: TokenType.NEWLINE, value: '\n' });
            i++;
            continue;
        }

        if (char === ':') {
            // Convert previous identifier into label if exists
            if (tokens.length > 0 && tokens[tokens.length - 1].type === TokenType.IDENTIFIER) {
                const prevToken = tokens[tokens.length - 1];
                tokens[tokens.length - 1] = { type: TokenType.LABEL, value: prevToken.value };
            }
            tokens.push({ type: TokenType.NEWLINE, value: ':' });
            i++;
            continue;
        }
        
        // Handle comments
        if (char === "'") {
            while (i < source.length && source[i] !== '\n') i++;
            continue;
        }

        // Handle strings
        if (char === '"') {
            let str = '"';
            i++;
            while (i < source.length && source[i] !== '"') {
                str += source[i++];
            }
            if (i < source.length) {
                str += source[i++];
            }
            tokens.push({ type: TokenType.STRING, value: str });
            continue;
        }

        // Handle numbers with scientific notation and decimal points
        if (/[0-9.]/.test(char)) {
            let numStr = '';
            let decimalCount = 0;
            let hasExponent = false;

            // Handle leading decimal point
            if (char === '.') {
                if (!/[0-9]/.test(source[i + 1] || '')) {
                    throw new Error("Invalid number format");
                }
                numStr = '.';
                decimalCount++;
                i++;
            } else {
                numStr = char;
                i++;
            }

            // Parse digits before decimal or exponent
            while (i < source.length && /[0-9]/.test(source[i])) {
                numStr += source[i++];
            }

            // Handle decimal point
            if (i < source.length && source[i] === '.') {
                if (decimalCount > 0 || /[eE]/.test(numStr)) {
                    throw new Error("Invalid number format");
                }
                numStr += source[i++];
                decimalCount++;

                // Parse decimal digits
                while (i < source.length && /[0-9]/.test(source[i])) {
                    numStr += source[i++];
                }
            }

            // Handle scientific notation - preserve original case
            if (i < source.length && /[eE]/.test(source[i])) {
                if (hasExponent) {
                    throw new Error("Invalid number format");
                }
                numStr += source[i++]; // Keep original 'e' or 'E'
                hasExponent = true;

                // Handle optional sign
                if (i < source.length && /[+-]/.test(source[i])) {
                    numStr += source[i++];
                }

                // Must have at least one digit after E
                if (!/[0-9]/.test(source[i] || '')) {
                    throw new Error("Invalid number format");
                }

                while (i < source.length && /[0-9]/.test(source[i])) {
                    numStr += source[i++];
                }
            }

            // Additional validation
            if (i < source.length && /[.]/.test(source[i])) {
                throw new Error("Invalid number format");
            }

            tokens.push({ type: TokenType.NUMBER, value: numStr });
            continue;
        }

        // Handle identifiers and keywords
        if (/[A-Za-z_]/.test(char)) {
            let word = '';
            while (i < source.length && /[A-Za-z0-9_]/.test(source[i])) {
                word += source[i++];
            }
            
            const upperWord = word.toUpperCase();

            // Handle string function names with $ suffix
            if (i < source.length && source[i] === '$') {
                const funcName = upperWord + '$';
                i++; // consume $
                if (stringFunctions.has(funcName)) {
                    tokens.push({ type: TokenType.STRING_FUNCTION, value: funcName });
                    continue;
                }
            }

            // Check for special keywords
            if (upperWord in specialTokens) {
                tokens.push({ type: specialTokens[upperWord], value: upperWord });
                continue;
            }

            // Check for functions
            if (functions.has(upperWord)) {
                tokens.push({ type: TokenType.FUNCTION, value: upperWord });
                continue;
            }

            // Check for types
            if (typeKeywords.has(upperWord)) {
                tokens.push({ type: TokenType.TYPE, value: upperWord });
                continue;
            }

            // Default to identifier
            tokens.push({ type: TokenType.IDENTIFIER, value: upperWord });
            continue;
        }

        // Handle operators and other symbols
        if (/[+\-*/<>=,();]/.test(char)) {  // Add semicolon to regex
            let op = char;
            // Check for two-character operators
            if (i + 1 < source.length) {
                const twoChar = char + source[i + 1];
                if (operators.has(twoChar)) {
                    op = twoChar;
                    i++;
                }
            }
            
            // Determine correct token type
            if (op === '(') {
                tokens.push({ type: TokenType.LEFT_PAREN, value: op });
            } else if (op === ')') {
                tokens.push({ type: TokenType.RIGHT_PAREN, value: op });
            } else if (op === ',') {
                tokens.push({ type: TokenType.COMMA, value: op });
            } else if (op === ';') {
                tokens.push({ type: TokenType.SEMICOLON, value: op });
            } else {
                tokens.push({ type: TokenType.OPERATOR, value: op });
            }
            i++;
            continue;
        }

        throw new Error(`Unexpected token: ${char}`);
    }
    
    if (tokens.length === 0 || tokens[tokens.length - 1].type !== TokenType.NEWLINE) {
        tokens.push({ type: TokenType.EOF, value: "" });
    }
    
    return tokens;
}