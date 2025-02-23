import { tokenize, Token, TokenType } from "./tokenizer.ts";

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

export type ExpressionNode = StringLiteralNode | NumberLiteralNode | VariableNode | BinaryExpressionNode | UnaryExpressionNode;

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

export type Statement = PrintNode | LetNode | InputNode | ClsNode | IfNode;

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
    if (op === "AND" || op === "OR") return 0;  // Lowest precedence
    if (op === "=" || op === "<>" || op === "<" || op === ">" || op === "<=" || op === ">=") return 1;
    if (op === "+" || op === "-") return 2;
    if (op === "*" || op === "/") return 3;
    if (op === "NOT") return 4;  // Highest precedence
    return -1;
  }

  function parseExpression(precedence = 0): ExpressionNode {
    if (index >= tokens.length || tokens[index].type === TokenType.EOF) {
      throw new Error("Unexpected end of input");
    }

    let left: ExpressionNode;

    // Handle unary operators (NOT)
    if (tokens[index].type === TokenType.OPERATOR && tokens[index].value === "NOT") {
        index++; // Consume NOT
        // Don't increase precedence for NOT's operand to allow proper grouping
        const operand = parseExpression(0);
        left = {
            type: "UnaryExpression",
            operator: "NOT",
            operand
        } as UnaryExpressionNode;
    } else {
        left = parsePrimary();
    }

    // Continue parsing binary operators while precedence allows
    while (
        tokens[index] &&
        tokens[index].type === TokenType.OPERATOR &&
        tokens[index].value !== "NOT" && // NOT is only unary, not binary
        getPrecedence(tokens[index].value) >= precedence &&
        tokens[index].type !== TokenType.THEN_KEYWORD // Stop at THEN
    ) {
        let operator = tokens[index++].value;
        let right = parseExpression(getPrecedence(operator) + 1);
        left = { type: "BinaryExpression", operator, left, right } as BinaryExpressionNode;
    }

    return left;
  }

  // Update parsePrimary to remove NOT handling since it's now in parseExpression
  function parsePrimary(): ExpressionNode {
    if (index >= tokens.length || tokens[index].type === TokenType.EOF) {
      throw new Error("Unexpected end of input");
    }

    let token = tokens[index];

    if (token.type === TokenType.STRING) {
      index++;
      return { type: "StringLiteral", value: token.value.slice(1, -1) }; // Remove quotes
    } else if (token.type === TokenType.NUMBER) {
      index++;
      return { type: "NumberLiteral", value: Number(token.value) };
    } else if (token.type === TokenType.IDENTIFIER) {
      index++;
      return { type: "Variable", name: token.value };
    } else if (token.type === TokenType.PUNCTUATION && token.value === "(") {
      index++; // Consume '('
      let expression = parseExpression();
      eat(TokenType.PUNCTUATION); // Consume ')'
      return expression;
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
    
    if (index < tokens.length && tokens[index].type !== TokenType.EOF) {
      if (tokens[index].type !== TokenType.NEWLINE) {
        throw new Error(`Expected newline or end of input, got: ${tokens[index].value}`);
      }
      skipNewlines();
    }
  }

  return statements;
}
