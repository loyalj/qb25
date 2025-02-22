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

export type ExpressionNode = StringLiteralNode | NumberLiteralNode | VariableNode | BinaryExpressionNode;

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

export type Statement = PrintNode | LetNode;

export function parse(source: string): Statement[] {
  let tokens = tokenize(source);
  let index = 0;
  let statements: Statement[] = [];

  function eat(type: TokenType): Token {
    if (tokens[index].type !== type) {
      throw new Error(`Unexpected token: ${tokens[index].value}`);
    }
    return tokens[index++];
  }

  function getPrecedence(op: string): number {
    if (op === "+" || op === "-") return 1;
    if (op === "*" || op === "/") return 2;
    return 0;
  }

  function parseExpression(precedence = 0): ExpressionNode {
    let left = parsePrimary();

    while (
      tokens[index] &&
      tokens[index].type === TokenType.OPERATOR &&
      getPrecedence(tokens[index].value) >= precedence
    ) {
      let operator = eat(TokenType.OPERATOR).value;
      let right = parseExpression(getPrecedence(operator) + 1);
      left = { type: "BinaryExpression", operator, left, right } as BinaryExpressionNode;
    }

    return left;
  }

  function parsePrimary(): ExpressionNode {
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

  while (tokens[index].type !== TokenType.EOF) {
    let token = tokens[index];

    if (token.type === TokenType.KEYWORD) {
      if (token.value === "PRINT") {
        index++; // Consume PRINT
        let expression = parseExpression();
        statements.push({ type: "Print", expression });
      } else if (token.value === "LET") {
        index++; // Consume LET
        let variable = eat(TokenType.IDENTIFIER).value;
        eat(TokenType.OPERATOR); // Consume '='
        let value = parseExpression();
        statements.push({ type: "Let", variable, value });
      }
    }
  }

  return statements;
}
