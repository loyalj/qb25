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
  }
  
  export interface Token {
    type: TokenType;
    value: string;
  }
  
  const keywords = new Set([
    "PRINT", "LET", "INPUT", "IF", "THEN", "ELSE", "GOTO", "FOR", "NEXT", 
    "WHILE", "WEND", "CLS", "END"
  ]);
  
  const operators = new Set(["+", "-", "*", "/", "=", "<", ">", "<=", ">=", "<>", "AND", "OR", "NOT"]);
  
  export function tokenize(source: string): Token[] {
    let tokens: Token[] = [];
    let i = 0;
  
    while (i < source.length) {
      let char = source[i];
  
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
        
        // Updated special handling to check operators first
        let type = TokenType.IDENTIFIER;
        if (operators.has(value)) {
            type = TokenType.OPERATOR;
        } else if (keywords.has(value)) {
            type = TokenType.KEYWORD;
            if (value === "IF") type = TokenType.IF_KEYWORD;
            else if (value === "THEN") type = TokenType.THEN_KEYWORD;
            else if (value === "ELSE") type = TokenType.ELSE_KEYWORD;
        }
        
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
  
      // Update error message for unexpected characters
      throw new Error(`Unexpected token: "${char}"`);
    }
  
    // Only add EOF if last token wasn't a newline
    if (tokens.length === 0 || tokens[tokens.length - 1].type !== TokenType.NEWLINE) {
      tokens.push({ type: TokenType.EOF, value: "" });
    }
    return tokens;
  }
