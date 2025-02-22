import { parse, Statement, PrintNode, LetNode, ExpressionNode, BinaryExpressionNode, StringLiteralNode, NumberLiteralNode, VariableNode } from "./parser.ts";

export function execute(source: string) {
  const statements = parse(source);
  let variables: Record<string, string | number> = {};

  function evaluateExpression(node: ExpressionNode): string | number {
    switch (node.type) {
      case "StringLiteral":
        return (node as StringLiteralNode).value;
      case "NumberLiteral":
        return (node as NumberLiteralNode).value;
      case "Variable": {
        const varName = (node as VariableNode).name;
        if (!(varName in variables)) {
          throw new Error(`Undefined variable: ${varName}`);
        }
        return variables[varName];
      }
      case "BinaryExpression": {
        const binaryNode = node as BinaryExpressionNode;
        const left = evaluateExpression(binaryNode.left);
        const right = evaluateExpression(binaryNode.right);
        const operator = binaryNode.operator;

        // Handle String Concatenation
        if (typeof left === "string" || typeof right === "string") {
          return String(left) + String(right);
        }

        // Handle Math Operations
        if (typeof left === "number" && typeof right === "number") {
          switch (operator) {
            case "+": return left + right;
            case "-": return left - right;
            case "*": return left * right;
            case "/": return right !== 0 ? left / right : "DIVIDE BY ZERO ERROR";
            default: throw new Error(`Unsupported operator: ${operator}`);
          }
        }

        throw new Error(`Invalid binary expression: ${left} ${operator} ${right}`);
      }
      default:
        throw new Error(`Unknown expression type: ${node.type}`);
    }
  }

  for (const statement of statements) {
    switch (statement.type) {
      case "Print": {
        const printNode = statement as PrintNode;
        console.log(evaluateExpression(printNode.expression));
        break;
      }
      case "Let": {
        const letNode = statement as LetNode;
        variables[letNode.variable] = evaluateExpression(letNode.value);
        break;
      }
      default:
        throw new Error(`Unknown statement type: ${statement.type}`);
    }
  }
}
