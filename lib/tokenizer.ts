export enum TokenType {
    KEYWORD,
    IDENTIFIER,
    NUMBER,
    STRING,
    OPERATOR,
    PUNCTUATION,
    EOF,
  }
  
  export interface Token {
    type: TokenType;
    value: string;
  }
  
  const keywords = new Set([
    "PRINT", "LET", "INPUT", "IF", "THEN", "ELSE", "GOTO", "FOR", "NEXT", "WHILE", "WEND", "CLS"
  ]);
  
  const operators = new Set(["+", "-", "*", "/", "=", "<", ">", "<=", ">=", "<>"]);
  
  export function tokenize(source: string): Token[] {
    let tokens: Token[] = [];
    let i = 0;
  
    while (i < source.length) {
      let char = source[i];
  
      // Ignore whitespace
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
        let start = i++;
        while (i < source.length && source[i] !== '"') i++;
        if (i < source.length) i++; // Skip closing "
        tokens.push({ type: TokenType.STRING, value: source.slice(start, i) });
        continue;
      }
  
      // Numbers
      if (/\d/.test(char)) {
        let start = i++;
        while (i < source.length && /\d/.test(source[i])) i++;
        tokens.push({ type: TokenType.NUMBER, value: source.slice(start, i) });
        continue;
      }
  
      // Identifiers / Keywords
      if (/[A-Za-z]/.test(char)) {
        let start = i++;
        while (i < source.length && /[A-Za-z0-9_]/.test(source[i])) i++;
        let value = source.slice(start, i).toUpperCase();
        let type = keywords.has(value) ? TokenType.KEYWORD : TokenType.IDENTIFIER;
        tokens.push({ type, value });
        continue;
      }
  
      // Multi-character operators (>=, <=, <>)
      if (operators.has(char)) {
        let op = char;
        if (i + 1 < source.length) {
          let twoCharOp = char + source[i + 1];
          if (operators.has(twoCharOp)) {
            op = twoCharOp;
            i++;
          }
        }
        tokens.push({ type: TokenType.OPERATOR, value: op });
        i++;
        continue;
      }
  
      // Punctuation (Parentheses, commas, semicolons)
      if ("(),;".includes(char)) {
        tokens.push({ type: TokenType.PUNCTUATION, value: char });
        i++;
        continue;
      }
  
      throw new Error(`Unexpected character: ${char}`);
    }
  
    tokens.push({ type: TokenType.EOF, value: "" });
    return tokens;
  }
  