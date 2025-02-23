import { tokenize, Token, TokenType, functions } from "./tokenizer.ts";

export interface ASTNode {
  type: string;
}

export interface PrintNode extends ASTNode {
  type: "Print";
  expression: ExpressionNode;
}

export interface LetNode extends ASTNode {
  type: "Let";
  variable: string;
  value: ExpressionNode;
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

export interface ArrayAccessNode {
  type: "ArrayAccess";
  name: string;
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

export interface DimNode extends ASTNode {
  type: "Dim";
  variable: string;
  size: number;
}

export type Statement = PrintNode | LetNode | InputNode | ClsNode | IfNode | DimNode;

export function parse(source: string): Statement[] {
  let tokens = tokenize(source);
  let index = 0;
  let statements: Statement[] = [];

  function skipNewlines() {
    while (index < tokens.length && tokens[index].type === TokenType.NEWLINE) {
      index++;
    }
  }

  function eat(type: TokenType): Token {
    if (index >= tokens.length || tokens[index].type === TokenType.EOF) {
      throw new Error("Unexpected end of input");
    }
    if (tokens[index].type !== type) {
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
    
    if (tokens[index]?.type === TokenType.NOT_OPERATOR) {
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
        tokens[index]?.type === TokenType.OPERATOR &&
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

  function parsePrimary(): ExpressionNode {
    if (index >= tokens.length) {
        throw new Error("Unexpected end of input");
    }

    const token = tokens[index];

    // Handle empty lines and whitespace more gracefully
    if (token.type === TokenType.NEWLINE) {
        index++;
        return { type: "EmptyExpression" };
    }

    // Handle numbers with optional leading + or -
    if ((token.type as TokenType) === TokenType.NUMBER || 
        (token.type === TokenType.OPERATOR && 
         (token.value === '+' || token.value === '-') && 
         tokens[index + 1] && (tokens[index + 1].type as TokenType) === TokenType.NUMBER)) {
        
        const isNegative = token.type === TokenType.OPERATOR && token.value === '-';
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
    if ((token.type === TokenType.PUNCTUATION && token.value === "(") ||
        token.type === TokenType.LEFT_PAREN) {
      index++; // Consume '('
      let expression = parseExpression(0);
      // Support both PUNCTUATION and RIGHT_PAREN for closing parenthesis
      if (tokens[index].type === TokenType.RIGHT_PAREN || 
          (tokens[index].type === TokenType.PUNCTUATION && tokens[index].value === ")")) {
        index++;
        return expression;
      }
      throw new Error("Expected closing parenthesis");
    }

    if (token.type === TokenType.STRING) {
      index++;
      return { type: "StringLiteral", value: token.value.slice(1, -1) }; // Remove quotes
    } else if (token.type === TokenType.NUMBER) {
      index++;
      return { type: "NumberLiteral", value: Number(token.value) };
    } else if (token.type === TokenType.FUNCTION || token.type === TokenType.IDENTIFIER) {
        index++;
        if (tokens[index]?.type === TokenType.LEFT_PAREN) {
            index++; // Consume '('
            const args: ExpressionNode[] = [];
            
            // Handle function arguments
            if (tokens[index].type !== TokenType.RIGHT_PAREN) {
                args.push(parseExpression());
                while (tokens[index].type === TokenType.COMMA) {
                    index++; // Consume comma
                    args.push(parseExpression());
                }
            }
            
            eat(TokenType.RIGHT_PAREN);

            // Check if this is a known function when it's being used as one
            if (token.type === TokenType.IDENTIFIER && !functions.has(token.value)) {
                throw new Error(`Unknown function: ${token.value}`);
            }

            return { type: "FunctionCall", name: token.value, arguments: args };
        }
        return { type: "Variable", name: token.value };
    }

    throw new Error(`Unexpected token: ${token.value}`);
  }

  function parseIfStatement(): IfNode {
    index++; // Consume IF
    const condition = parseExpression();
    
    if (tokens[index]?.type !== TokenType.THEN_KEYWORD) {
      throw new Error("Expected THEN after IF condition");
    }
    index++; // Consume THEN
  
    let thenBranch: Statement[] = [];
    let elseBranch: Statement[] | undefined;
  
    // If next token is newline, expect multi-line format
    if (tokens[index]?.type === TokenType.NEWLINE) {
      index++; // Consume newline
      while (index < tokens.length && 
             tokens[index].type !== TokenType.EOF && 
             tokens[index].type !== TokenType.ELSE_KEYWORD &&
             tokens[index].value !== "END" &&
             tokens[index].value !== "ELSE") {
        if (tokens[index].type === TokenType.NEWLINE) {
          index++;
          continue;
        }
        thenBranch.push(parseStatement());
      }
  
      // Handle ELSE branch
      if (tokens[index]?.value === "ELSE") {
        index++; // Consume ELSE
        if (tokens[index]?.type === TokenType.NEWLINE) {
          index++;
        }
        elseBranch = [];
        while (index < tokens.length && 
               tokens[index].type !== TokenType.EOF && 
               tokens[index].value !== "END") {
          if (tokens[index].type === TokenType.NEWLINE) {
            index++;
            continue;
          }
          elseBranch.push(parseStatement());
        }
      }
  
      // Expect END IF
      if (tokens[index]?.value !== "END") {
        throw new Error("Expected END IF after multi-line IF block");
      }
      index++; // Consume END
      if (tokens[index]?.value !== "IF") {
        throw new Error("Expected IF after END");
      }
      index++; // Consume IF
    } else {
      // Single-line IF
      thenBranch = [parseStatement()];
      if (tokens[index]?.type === TokenType.ELSE_KEYWORD) {
        index++; // Consume ELSE
        elseBranch = [parseStatement()];
      }
    }
  
    return { type: "If", condition, thenBranch, elseBranch };
  }

  function parseStatement(): Statement {
    if (index >= tokens.length || tokens[index].type === TokenType.EOF) {
      throw new Error("Unexpected end of input");
    }

    let token = tokens[index];
    
    // Remove redundant EOF check that was here
    
    if (token.type === TokenType.IF_KEYWORD) {
      return parseIfStatement();
    }

    if (token.type === TokenType.KEYWORD) {
      if (token.value === "PRINT") {
        index++; // Consume PRINT
        let expression = parseExpression();
        return { type: "Print", expression };
      } else if (token.value === "LET") {
        index++; // Consume LET
        if (index >= tokens.length) {
          throw new Error("Unexpected end of input");
        }
        let variable = eat(TokenType.IDENTIFIER).value;
        eat(TokenType.OPERATOR); // Consume '='
        let value = parseExpression();
        return { type: "Let", variable, value };
      } else if (token.value === "INPUT") {
        index++; // Consume INPUT
        let variable = eat(TokenType.IDENTIFIER).value;
        return { type: "Input", variable };
      } else if (token.value === "CLS") {
        index++; // Consume CLS
        return { type: "Cls" };
      }
    }

    if (token.type === TokenType.DIM_KEYWORD) {
      index++; // Consume DIM
      const variable = eat(TokenType.IDENTIFIER).value;
      eat(TokenType.LEFT_PAREN);
      const size = Number(eat(TokenType.NUMBER).value);
      eat(TokenType.RIGHT_PAREN);
      return { type: "Dim", variable, size };
    }

    throw new Error(`Unexpected token: ${token.value}`);
  }

  // Modified parser loop
  while (index < tokens.length) {
    skipNewlines(); // Skip any leading newlines
    
    // Break if we reach EOF after skipping newlines
    if (index >= tokens.length || tokens[index].type === TokenType.EOF) {
      break;
    }

    statements.push(parseStatement());
    
    // After parsing a statement, we should allow either:
    // 1. End of file
    // 2. Newline
    // 3. Another valid statement (like in multi-line IF)
    if (index < tokens.length && tokens[index].type !== TokenType.EOF) {
      // If it's a newline, skip all consecutive newlines
      if (tokens[index].type === TokenType.NEWLINE) {
        skipNewlines();
      }
      // Otherwise, continue to parse the next statement
      // This allows IF/THEN blocks to work without requiring newlines
    }
  }

  return statements;
}
