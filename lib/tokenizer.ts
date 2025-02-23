export enum TokenType {
    KEYWORD,
    IDENTIFIER,
    NUMBER,
    STRING,
    OPERATOR,
    PUNCTUATION,
    EOF,
    IF_KEYWORD,
    THEN_KEYWORD,
    ELSE_KEYWORD,
    NEWLINE,
    FUNCTION,  // Add function type
    LINE_NUMBER,
    LABEL,
    DIM_KEYWORD,
    LEFT_PAREN,
    RIGHT_PAREN,
    COMMA,
    COLON,
    END_KEYWORD,
    NOT_OPERATOR,  // Add this new type
  }
  
  export interface Token {
    type: TokenType;
    value: string;
  }
  
  const keywords = new Set([
    "PRINT", "LET", "INPUT", "IF", "THEN", "ELSE", "GOTO", "FOR", "NEXT", 
    "WHILE", "WEND", "CLS", "END", "DIM"  // Add DIM keyword
  ]);
  
  // Update the operator handling to exclude NOT since it's handled separately
  const operators = new Set(["+", "-", "*", "/", "=", "<", ">", "<=", ">=", "<>", "AND", "OR"]);
  
  export const functions = new Set([
    "ABS", "SGN", "INT", "RND", "SQR", 
    "SIN", "COS", "TAN", "ASC", "ATN",
    "LOG", "EXP", "ATN2", "CINT", "CSNG", "CDBL"
  ]);
  
  export function tokenize(source: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
  
    while (i < source.length) {
      const char = source[i];
  
      // Handle newlines explicitly
      if (char === '\n' || char === ':') {
        // Collapse multiple newlines into one
        while (i + 1 < source.length && (source[i + 1] === '\n' || source[i + 1] === ':')) {
          i++;
        }
        tokens.push({ type: TokenType.NEWLINE, value: '\n' });
        i++;
        continue;
      }

      // Ignore other whitespace
      if (/\s/.test(char)) {
        i++;
        continue;
      }
  
      // Handle comments (`'` in QBasic)
      if (char === "'") {
        while (i < source.length && source[i] !== "\n") i++;
        continue;
      }
  
      // String literals
      if (char === '"') {
        const start = i++;
        while (i < source.length && source[i] !== '"') i++;
        if (i < source.length) i++; // Skip closing "
        tokens.push({ type: TokenType.STRING, value: source.slice(start, i) });
        continue;
      }
  
      // Numbers (update this section)
      if (/[\d.]/.test(char)) {
        const start = i;
        let hasDecimal = char === '.';
        
        // If starting with decimal, must be followed by digit
        if (hasDecimal && !/\d/.test(source[i + 1])) {
            throw new Error("Invalid number format");
        }
        
        i++; // Move past first character
        
        // Parse rest of number
        while (i < source.length && (/\d/.test(source[i]) || (!hasDecimal && source[i] === '.'))) {
            if (source[i] === '.') hasDecimal = true;
            i++;
        }
        
        // Handle scientific notation
        if (i < source.length && /[eE]/.test(source[i])) {
            i++; // consume 'e' or 'E'
            if (i < source.length && (source[i] === '+' || source[i] === '-')) i++;
            while (i < source.length && /\d/.test(source[i])) i++;
        }
        
        tokens.push({ type: TokenType.NUMBER, value: source.slice(start, i) });
        continue;
    }
  
      // Update the identifier/keyword section
      if (/[A-Za-z]/.test(char)) {
        const start = i++;
        while (i < source.length && /[A-Za-z0-9_]/.test(source[i])) i++;
        const value = source.slice(start, i).toUpperCase();
        
        let type = TokenType.IDENTIFIER;
        if (value === "NOT") {
            type = TokenType.NOT_OPERATOR;
        } else if (value === "IF") {
            type = TokenType.IF_KEYWORD;
        } else if (value === "THEN") {
            type = TokenType.THEN_KEYWORD;
        } else if (value === "ELSE") {
            type = TokenType.ELSE_KEYWORD;
        } else if (value === "DIM") {
            type = TokenType.DIM_KEYWORD;
        } else if (operators.has(value)) {
            type = TokenType.OPERATOR;
        } else if (functions.has(value)) {
            type = TokenType.FUNCTION;
        } else if (keywords.has(value)) {
            type = TokenType.KEYWORD;
        }
        
        tokens.push({ type, value });
        continue;
      }
  
      // Multi-character operators (>=, <=, <>)
      if (operators.has(char)) {
        let op = char;
        if (i + 1 < source.length) {
          const twoCharOp = char + source[i + 1];
          if (operators.has(twoCharOp)) {
            op = twoCharOp;
            i++;
          }
        }
        tokens.push({ type: TokenType.OPERATOR, value: op });
        i++;
        continue;
      }
  
      // Update the parentheses handling section
      if ("(),;".includes(char)) {
        if (char === '(') {
          tokens.push({ type: TokenType.LEFT_PAREN, value: char });
        } else if (char === ')') {
          tokens.push({ type: TokenType.RIGHT_PAREN, value: char });
        } else if (char === ',') {
          tokens.push({ type: TokenType.COMMA, value: char });
        } else {
          tokens.push({ type: TokenType.PUNCTUATION, value: char });
        }
        i++;
        continue;
      }
  
      // Update error message for unexpected characters
      throw new Error(`Unexpected token: "${char}"`);
    }
  
    // Only add EOF if last token wasn't a newline
    if (tokens.length === 0 || tokens[tokens.length - 1].type !== TokenType.NEWLINE) {
      tokens.push({ type: TokenType.EOF, value: "" });
    }
    return tokens;
  }
