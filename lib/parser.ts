import { tokenize, Token, TokenType, functions } from "./tokenizer.ts";
import { QBType, isValidQBType } from "./types.ts";

// Add simple type checking functions
function isTokenType(token: Token, type: TokenType): boolean {
  return token.type === type;
}

function isAnyTokenType(token: Token, ...types: TokenType[]): boolean {
  return types.includes(token.type);
}

export interface ASTNode {
  type: string;
}

export interface PrintNode extends ASTNode {
  type: "Print";
  expression?: ExpressionNode;
  expressions?: ExpressionNode[];
}

// Update LetNode interface to handle array assignments
export interface LetNode extends ASTNode {
  type: "Let";
  variable?: string;  // Optional because it might be an array access instead
  value?: ExpressionNode;  // Optional because it might be an array assignment
  arrayAccess?: ArrayAccessNode;  // For array assignments
  expression?: ExpressionNode;  // For array assignments
}

export interface InputNode extends ASTNode {
  type: "Input";
  variable: string;
}

export interface ClsNode extends ASTNode {
  type: "Cls";
}

export interface IfNode extends ASTNode {
  type: "If";
  condition: ExpressionNode;
  thenBranch: Statement[];
  elseBranch?: Statement[];
}

export interface UnaryExpressionNode {
  type: "UnaryExpression";
  operator: string;
  operand: ExpressionNode;
}

export interface FunctionCallNode {
  type: "FunctionCall";
  name: string;
  arguments: ExpressionNode[];
}

// Update the ArrayAccessNode interface
export interface ArrayAccessNode {
  type: "ArrayAccess";
  array: string;  // Changed from 'name' to 'array' for consistency
  index: ExpressionNode;
}

// Add EmptyExpression interface
export interface EmptyExpressionNode {
  type: "EmptyExpression";
}

// Update ExpressionNode type to include EmptyExpression
export type ExpressionNode = StringLiteralNode | NumberLiteralNode | VariableNode | 
                           BinaryExpressionNode | UnaryExpressionNode | FunctionCallNode |
                           ArrayAccessNode | EmptyExpressionNode;

// Move Statement type definition before interfaces that extend it
export type Statement = {
  type: string;
} & (PrintNode | LetNode | InputNode | ClsNode | IfNode | DimNode | ForNode | WhileNode | GotoNode | LabelNode);

export interface StringLiteralNode {
  type: "StringLiteral";
  value: string;
}

export interface NumberLiteralNode {
  type: "NumberLiteral";
  value: number;
}

export interface VariableNode {
  type: "Variable";
  name: string;
}

export interface BinaryExpressionNode {
  type: "BinaryExpression";
  operator: string;
  left: ExpressionNode;
  right: ExpressionNode;
}

export interface DimNode {
  type: "Dim";
  variable: string;
  variableType: QBType;
  size?: number;
}

export interface AssignmentNode {
  type: "Let";
  variable: string;
  value: ExpressionNode;
}

export interface ForNode {
  type: "For";
  variable: string;
  start: ExpressionNode;
  end: ExpressionNode;
  step?: ExpressionNode;
  body: Statement[];
}

export interface WhileNode {
  type: "While";
  condition: ExpressionNode;
  body: Statement[];
}

export interface GotoNode {
  type: "Goto";
  label: string;
}

export interface LabelNode {
  type: "Label";
  name: string;
}

let current = 0;

interface LoopContext {
    type: 'WHILE' | 'FOR';
    depth: number;
}

// Add error interface before parse function
interface ParserError {
  message: string;
}

export function parse(source: string): Statement[] {
  const tokens = tokenize(source);
  let index = 0;
  const statements: Statement[] = [];
  const loopStack: LoopContext[] = []; // Track nested loops

  function skipNewlines() {
    while (index < tokens.length && isTokenType(tokens[index], TokenType.NEWLINE)) {
      index++;
    }
  }

  function eat(type: TokenType): Token {
    if (index >= tokens.length || isTokenType(tokens[index], TokenType.EOF)) {
      throw new Error("Unexpected end of input");
    }
    if (!isTokenType(tokens[index], type)) {
      throw new Error(`Unexpected token: ${tokens[index].value}`);
    }
    return tokens[index++];
  }

  function getPrecedence(op: string): number {
    switch (op) {
        case "OR": return 1;
        case "AND": return 2;
        case "NOT": return 3;
        case "=":
        case "<>":
        case "<":
        case ">":
        case "<=":
        case ">=":
            return 4;
        case "+":
        case "-":
            return 5;
        case "*":
        case "/":
            return 6;
        default:
            return 0;
    }
  }

  function parseExpression(precedence = 0): ExpressionNode {
    let left: ExpressionNode;
    
    if (isTokenType(tokens[index], TokenType.NOT_OPERATOR)) {
        index++; // Consume NOT
        left = {
            type: "UnaryExpression",
            operator: "NOT",
            operand: parseExpression(getPrecedence("NOT") - 1)  // Changed to respect precedence
        };
    } else {
        left = parsePrimary();
    }

    while (
        index < tokens.length &&
        isTokenType(tokens[index], TokenType.OPERATOR) &&
        getPrecedence(tokens[index].value) >= precedence
    ) {
        const operator = tokens[index++].value;
        const nextPrecedence = getPrecedence(operator);
        // For left-associative operators, use next precedence level
        const right = parseExpression(
            operator === "AND" || operator === "OR" ? nextPrecedence + 1 : nextPrecedence
        );
        left = { type: "BinaryExpression", operator, left, right };
    }

    return left;
  }

  function isTokenOfType(token: Token, ...types: TokenType[]): boolean {
    return types.includes(token.type);
  }

  // Add type guard functions at the top
  function isFunction(token: Token): boolean {
    return token.type === TokenType.FUNCTION;
  }

  function isStringFunction(token: Token): boolean {
    return token.type === TokenType.STRING_FUNCTION;
  }

  type TokenTypeKey = keyof typeof TokenType;

  function isToken(token: Token, ...types: TokenType[]): boolean {
      return types.some(type => token.type === type);
  }

  type TokenTypeValue = typeof TokenType[keyof typeof TokenType];

  function isTokenType(token: Token, ...types: TokenType[]): boolean {
    return types.some(type => String(token.type) === String(type));
  }

  // Add type predicate function for safer type checks
  function isFunctionToken(token: Token): boolean {
    return [TokenType.FUNCTION, TokenType.STRING_FUNCTION].includes(token.type);
  }

  // Helper functions for type-safe token comparison
  function tokenTypeEquals(token: Token, type: TokenType): boolean {
    return token.type.toString() === type.toString();
  }

  function tokenTypeIsOneOf(token: Token, ...types: TokenType[]): boolean {
    const tokenTypeStr = token.type.toString();
    return types.some(type => type.toString() === tokenTypeStr);
  }

  function parseFunctionCall(name: string): FunctionCallNode {
    eat(TokenType.LEFT_PAREN);
    const args: ExpressionNode[] = [];
    
    if (!isTokenType(tokens[index], TokenType.RIGHT_PAREN)) {
        args.push(parseExpression());
        while (isTokenType(tokens[index], TokenType.COMMA)) {
            index++;
            args.push(parseExpression());
        }
    }
    
    eat(TokenType.RIGHT_PAREN);
    return { type: "FunctionCall", name, arguments: args };
}

// Update the parsePrimary function's array access handling
function parsePrimary(): ExpressionNode {
    const token = tokens[index];

    if (isAnyTokenType(token, TokenType.IDENTIFIER, TokenType.FUNCTION, TokenType.STRING_FUNCTION)) {
        const name = token.value;
        index++;

        if (isTokenType(tokens[index], TokenType.LEFT_PAREN)) {
            // Check if this is a known function name
            if (isBuiltInFunction(name)) {
                return parseFunctionCall(name);
            }
            
            // If not a function, treat as array access
            eat(TokenType.LEFT_PAREN);
            const indexExpr = parseExpression();
            eat(TokenType.RIGHT_PAREN);
            
            return {
                type: "ArrayAccess",
                array: name,  // This now matches the interface
                index: indexExpr
            };
        }
        
        return { type: "Variable", name };
    }

    // Handle string functions and regular functions first
    if (isTokenType(token, TokenType.STRING_FUNCTION) || isTokenType(token, TokenType.FUNCTION)) {
        const name = token.value;
        index++; // consume function name
        
        eat(TokenType.LEFT_PAREN);
        const args: ExpressionNode[] = [];
        
        if (!isTokenType(tokens[index], TokenType.RIGHT_PAREN)) {
            args.push(parseExpression());
            while (isTokenType(tokens[index], TokenType.COMMA)) {
                index++;
                args.push(parseExpression());
            }
        }
        
        eat(TokenType.RIGHT_PAREN);
        return { type: "FunctionCall", name, arguments: args };
    }

    // Handle identifiers first to catch function calls correctly
    if (isAnyTokenType(token, TokenType.IDENTIFIER, TokenType.FUNCTION, TokenType.STRING_FUNCTION)) {
        const name = token.value;
        index++;

        if (isTokenType(tokens[index], TokenType.LEFT_PAREN)) {
            // Check if this is a known function name
            if (isBuiltInFunction(name)) {
                return parseFunctionCall(name);
            }
            
            // If not a function, treat as array access
            eat(TokenType.LEFT_PAREN);
            const indexExpr = parseExpression();
            eat(TokenType.RIGHT_PAREN);
            
            return {
                type: "ArrayAccess",
                array: name,
                index: indexExpr
            };
        }
        
        return { type: "Variable", name };
    }

    if (isTokenType(token, TokenType.NEWLINE)) {
        index++;
        return { type: "EmptyExpression" };
    }

    // Updated function and identifier handling
    if (isAnyTokenType(token, TokenType.STRING_FUNCTION, TokenType.FUNCTION, TokenType.IDENTIFIER)) {
        const name = token.value;
        index++;
        
        if (tokens[index] && isTokenType(tokens[index], TokenType.LEFT_PAREN)) {
            // ...existing function parsing code...
        }
        
        if (isTokenType(token, TokenType.IDENTIFIER)) {
            return { type: "Variable", name };
        }
    }

    // Replace the problematic conditional with matchesType
    if (isFunctionToken(token)) {
        const name = token.value;
        index++;
        eat(TokenType.LEFT_PAREN);
        const args: ExpressionNode[] = [];
        
        if (!isTokenType(tokens[index], TokenType.RIGHT_PAREN)) {
            args.push(parseExpression());
            while (isTokenType(tokens[index], TokenType.COMMA)) {
                index++;
                args.push(parseExpression());
            }
        }
        
        eat(TokenType.RIGHT_PAREN);
        return { type: "FunctionCall", name, arguments: args };
    }

    // Handle numbers with optional leading + or -
    if (isTokenType(token, TokenType.NUMBER) || 
        (isTokenType(token, TokenType.OPERATOR) && 
         (token.value === '+' || token.value === '-') && 
         tokens[index + 1] && isTokenType(tokens[index + 1], TokenType.NUMBER))) {
        
        const isNegative = isTokenType(token, TokenType.OPERATOR) && token.value === '-';
        if (isNegative || token.value === '+') {
            index++;
        }
        const numToken = tokens[index++];
        return {
            type: "NumberLiteral",
            value: Number((isNegative ? '-' : '') + numToken.value)
        };
    }

    // Add support for both PUNCTUATION and LEFT_PAREN types for opening parenthesis
    if ((isTokenType(token, TokenType.PUNCTUATION) && token.value === "(") ||
        isTokenType(token, TokenType.LEFT_PAREN)) {
      index++; // Consume '('
      const expression = parseExpression(0);
      // Support both PUNCTUATION and RIGHT_PAREN for closing parenthesis
      if (isTokenType(tokens[index], TokenType.RIGHT_PAREN) || 
          (isTokenType(tokens[index], TokenType.PUNCTUATION) && tokens[index].value === ")")) {
        index++;
        return expression;
      }
      throw new Error("Expected closing parenthesis");
    }

    if (isTokenType(token, TokenType.STRING)) {
      index++;
      return { type: "StringLiteral", value: token.value.slice(1, -1) }; // Remove quotes
    } else if (isTokenType(token, TokenType.NUMBER)) {
      index++;
      return { type: "NumberLiteral", value: Number(token.value) };
    } else if (isAnyTokenType(token, TokenType.FUNCTION, TokenType.IDENTIFIER)) {
        const name = token.value;
        index++;
        
        if (isTokenType(tokens[index], TokenType.LEFT_PAREN)) {
            index++; // consume '('
            const args: ExpressionNode[] = [];
            
            // Handle function arguments
            if (!isTokenType(tokens[index], TokenType.RIGHT_PAREN)) {
                args.push(parseExpression());
                while (isTokenType(tokens[index], TokenType.COMMA)) {
                    index++; // Consume comma
                    args.push(parseExpression());
                }
            }
            
            eat(TokenType.RIGHT_PAREN);
            
            // Check if this is a known function
            if (isTokenType(token, TokenType.IDENTIFIER) && !functions.has(name)) {
                throw new Error(`Unknown function: ${name}`);
            }
            
            return { type: "FunctionCall", name, arguments: args };
        }
        
        return { type: "Variable", name };
    }

    if (isAnyTokenType(token, TokenType.STRING_FUNCTION, TokenType.FUNCTION)) {
        const name = token.value;
        index++;
        eat(TokenType.LEFT_PAREN);
        const args: ExpressionNode[] = [];
        
        if (!isTokenType(tokens[index], TokenType.RIGHT_PAREN)) {
            args.push(parseExpression());
            while (isTokenType(tokens[index], TokenType.COMMA)) {
                index++;
                args.push(parseExpression());
            }
        }
        
        eat(TokenType.RIGHT_PAREN);
        return { type: "FunctionCall", name, arguments: args };
    }

    throw new Error(`Unexpected token: ${token.value}`);
}

// Add helper function to check if a name is a built-in function
function isBuiltInFunction(name: string): boolean {
    const builtInFunctions = [
        "ABS", "SGN", "INT", "RND", "SQR", "SIN", "COS", "TAN",
        "ATN", "LOG", "EXP", "CINT", "CSNG", "CDBL", "ATN2",
        "LEFT$", "RIGHT$", "MID$", "CHR$", "ASC", "LEN",
        "STR$", "VAL", "INSTR"
    ];
    return builtInFunctions.includes(name);
}

function parseIfStatement(): IfNode {
    index++; // Consume IF
    const condition = parseExpression();
  
    if (!isTokenType(tokens[index], TokenType.THEN_KEYWORD)) {
      throw new Error("Expected THEN after IF condition");
    }
    index++; // Consume THEN
  
    let thenBranch: Statement[] = [];
    let elseBranch: Statement[] | undefined;
  
    // Handle single-line IF first
    if (!isTokenType(tokens[index], TokenType.NEWLINE)) {
        thenBranch = [parseStatement()];
        if (isTokenType(tokens[index], TokenType.ELSE_KEYWORD)) {
            index++; // Consume ELSE
            elseBranch = [parseStatement()];
        }
        return { type: "If", condition, thenBranch, elseBranch };
    }
    
    // Multi-line IF
    index++; // Consume newline
    
    // Parse THEN branch
    while (index < tokens.length && 
           !isTokenType(tokens[index], TokenType.EOF) && 
           !isTokenType(tokens[index], TokenType.ELSE_KEYWORD) &&
           tokens[index].value !== "END" &&
           tokens[index].value !== "ELSE") {
        if (isTokenType(tokens[index], TokenType.NEWLINE)) {
            index++;
            continue;
        }
        const stmt = parseStatement();
        if (stmt !== null) {
            thenBranch.push(stmt);
        }
        skipNewlines();
    }

    // Handle ELSE branch if present
    if (index < tokens.length && tokens[index]?.value === "ELSE") {
        index++; // Consume ELSE
        skipNewlines();
        elseBranch = [];
        
        while (index < tokens.length && 
               !isTokenType(tokens[index], TokenType.EOF) && 
               tokens[index].value !== "END") {
            if (isTokenType(tokens[index], TokenType.NEWLINE)) {
                index++;
                continue;
            }
            const stmt = parseStatement();
            if (stmt !== null) {
                elseBranch.push(stmt);
            }
            skipNewlines();
        }
    }

    // Validate END IF
    if (!tokens[index] || tokens[index].value !== "END") {
        throw new Error("Expected END IF after multi-line IF block");
    }
    index++; // Consume END
    
    if (!tokens[index] || tokens[index].value !== "IF") {
        throw new Error("Expected IF after END");
    }
    index++; // Consume IF

    return { type: "If", condition, thenBranch, elseBranch };
}

function parseDimStatement(): DimNode {
    index++; // Consume DIM
    const variable = eat(TokenType.IDENTIFIER).value;
    let size: number | undefined;
    let variableType: QBType = QBType.SINGLE; // Default to SINGLE

    // Handle array size declaration
    if (isTokenType(tokens[index], TokenType.LEFT_PAREN)) {
        index++; // consume (
        const sizeToken = tokens[index];
        
        // Check for negative numbers
        let isNegative = false;
        if (isTokenType(sizeToken, TokenType.OPERATOR) && sizeToken.value === '-') {
            index++; // consume negative sign
            isNegative = true;
        }
        
        const numToken = eat(TokenType.NUMBER);
        size = Number(numToken.value);
        if (isNegative) size = -size;
        
        if (size <= 0) {
            throw new Error("Array size must be positive");
        }
        eat(TokenType.RIGHT_PAREN);
    }

    // Handle type declaration
    if (isTokenType(tokens[index], TokenType.AS)) {
        index++; // consume AS
        const typeToken = tokens[index];

        if (!typeToken || !isTokenType(typeToken, TokenType.TYPE)) {
            throw new Error("Invalid type");
        }
        
        index++; // consume type token
        const declaredType = typeToken.value.toUpperCase();
        
        if (!isValidQBType(declaredType)) {
            throw new Error("Invalid type");
        }
        variableType = declaredType as QBType;
    }

    return {
        type: "Dim",
        variable,
        variableType,
        size
    };
  }

  function parsePrintStatement(): PrintNode {
    index++; // consume PRINT
    
    if (index >= tokens.length || isTokenType(tokens[index], TokenType.NEWLINE)) {
        return { type: "Print", expression: { type: "EmptyExpression" } };
    }
    
    const expressions: ExpressionNode[] = [];
    let currentExpr = parseExpression();
    expressions.push(currentExpr);
    
    while (index < tokens.length && isTokenType(tokens[index], TokenType.SEMICOLON)) {
        index++; // consume semicolon
        if (index < tokens.length && !isTokenType(tokens[index], TokenType.NEWLINE)) {
            currentExpr = parseExpression();
            expressions.push(currentExpr);
        }
    }
    
    return expressions.length === 1
        ? { type: "Print", expression: expressions[0] }
        : { type: "Print", expressions };
}

// Add this helper function to parse LET statements
function parseLetStatement(): LetNode {
    index++; // Consume LET
    const variable = eat(TokenType.IDENTIFIER).value;
    
    // Check if this is an array assignment
    if (isTokenType(tokens[index], TokenType.LEFT_PAREN)) {
        index++; // consume (
        const arrayIndex = parseExpression();
        eat(TokenType.RIGHT_PAREN);
        eat(TokenType.OPERATOR); // consume =
        const expression = parseExpression();
        
        return {
            type: "Let",
            arrayAccess: {
                type: "ArrayAccess",
                array: variable,
                index: arrayIndex
            },
            expression
        } as LetNode;
    }
    
    // Regular variable assignment
    eat(TokenType.OPERATOR); // consume =
    const value = parseExpression();
    return { type: "Let", variable, value } as LetNode;
}

function parseForStatement(): ForNode {
    index++; // consume FOR
    const variable = eat(TokenType.IDENTIFIER).value;
    eat(TokenType.OPERATOR); // consume =
    const start = parseExpression();
    
    if (!isTokenType(tokens[index], TokenType.TO_KEYWORD)) {
      throw new Error("Expected TO after FOR initialization");
    }
    
    eat(TokenType.TO_KEYWORD);
    const end = parseExpression();
    
    let step;
    if (isTokenType(tokens[index], TokenType.STEP_KEYWORD)) {
      index++; // consume STEP
      step = parseExpression();
    }
    
    const body: Statement[] = [];
    skipNewlines();
    
    while (index < tokens.length && !isTokenType(tokens[index], TokenType.NEXT_KEYWORD)) {
      if (isTokenType(tokens[index], TokenType.NEWLINE)) {
        index++;
        continue;
      }
      body.push(parseStatement());
      skipNewlines();
    }
    
    if (index >= tokens.length || !isTokenType(tokens[index], TokenType.NEXT_KEYWORD)) {
      throw new Error("Expected NEXT at end of FOR loop");
    }
    
    eat(TokenType.NEXT_KEYWORD);
    const nextVar = eat(TokenType.IDENTIFIER).value;
    
    if (nextVar !== variable) {
      throw new Error(`Mismatched FOR/NEXT variables: expected ${variable}, got ${nextVar}`);  // Fixed template string syntax
    }
    
    return { type: "For", variable, start, end, step, body };
  }

function parseWhileStatement(): WhileNode {
    if (!tokens[index] || !isTokenType(tokens[index], TokenType.WHILE_KEYWORD)) {
        throw new Error("Expected WHILE");
    }
    
    index++; // consume WHILE
    const condition = parseExpression();
    const body: Statement[] = [];
    
    skipNewlines();
    
    while (index < tokens.length) {
        // First check if we've hit WEND
        if (isTokenType(tokens[index], TokenType.WEND_KEYWORD)) {
            index++; // consume WEND
            return { type: "While", condition, body };
        }

        // Skip empty lines
        if (isTokenType(tokens[index], TokenType.NEWLINE)) {
            index++;
            continue;
        }

        // Parse the next statement with proper error handling
        try {
            const stmt = parseStatement();
            if (stmt) {
                body.push(stmt);
            }
        } catch (e) {
            if (e instanceof Error && e.message === "Unexpected WEND without matching WHILE") {
                // We found our matching WEND
                index++; // consume WEND
                return { type: "While", condition, body };
            }
            throw e;
        }
        skipNewlines();
    }

    throw new Error("Unexpected end of input: While statement requires WEND");
}

function parseStatement(): Statement {
    skipNewlines();
    
    if (index >= tokens.length || isTokenType(tokens[index], TokenType.EOF)) {
        throw new Error("Unexpected end of input");
    }
    
    const token = tokens[index];
    
    switch (token.type) {
        case TokenType.DIM_KEYWORD:
            return parseDimStatement();
        case TokenType.IF_KEYWORD:
            return parseIfStatement();
        case TokenType.WHILE_KEYWORD:
            return parseWhileStatement();
        case TokenType.FOR_KEYWORD:
            return parseForStatement();
        case TokenType.GOTO_KEYWORD:
            index++; // Consume GOTO
            const label = eat(TokenType.IDENTIFIER).value;
            return { type: "Goto", label };
        case TokenType.LABEL:
            const name = token.value;
            index++;  // consume label
            return { type: "Label", name };
        case TokenType.WEND_KEYWORD:
            throw new Error("Unexpected WEND without matching WHILE");
        default:
            if (isTokenType(token, TokenType.KEYWORD)) {
                switch (token.value) {
                    case "PRINT":
                        return parsePrintStatement();
                    case "LET":
                        return parseLetStatement();
                    case "INPUT":
                        index++;
                        const variable = eat(TokenType.IDENTIFIER).value;
                        return { type: "Input", variable };
                    case "CLS":
                        index++;
                        return { type: "Cls" };
                }
            }
            throw new Error(`Unexpected token: ${token.value}`);
    }
}

  function isAtEnd(): boolean {
    return index >= tokens.length || isTokenType(tokens[index], TokenType.EOF);
  }

  function isNewline(token: Token): boolean {
    return isTokenType(token, TokenType.NEWLINE);
  }

  // Modified parser loop
  while (index < tokens.length) {
    skipNewlines(); // Skip any leading newlines
    
    // Break if we reach EOF after skipping newlines
    if (index >= tokens.length || isTokenType(tokens[index], TokenType.EOF)) {
      break;
    }
       
    statements.push(parseStatement());
  }

  return statements;
}
