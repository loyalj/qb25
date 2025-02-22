import { parse, Statement, PrintNode, LetNode, InputNode, ClsNode, ExpressionNode, BinaryExpressionNode, StringLiteralNode, NumberLiteralNode, VariableNode, IfNode } from "./parser.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

class Interpreter {
  private variables: Record<string, string | number | boolean> = {};

  private async evaluateExpression(node: ExpressionNode): Promise<string | number | boolean> {
    switch (node.type) {
      case "UnaryExpression": {
        if (node.operator === "NOT") {
          const operand = await this.evaluateExpression(node.operand);
          // Handle comparison results and boolean values
          if (typeof operand === "boolean") {
            return !operand;
          }
          // Convert numbers to boolean (0 is false, non-zero is true)
          if (typeof operand === "number") {
            return operand === 0;
          }
          // Convert strings to boolean (empty string is false)
          if (typeof operand === "string") {
            return operand === "";
          }
          return !operand;
        }
        throw new Error(`Unknown unary operator: ${node.operator}`);
      }
      case "StringLiteral":
        return (node as StringLiteralNode).value;
      case "NumberLiteral":
        return (node as NumberLiteralNode).value;
      case "Variable": {
        const varName = (node as VariableNode).name;
        if (!(varName in this.variables)) {
          throw new Error(`Undefined variable: ${varName}`);
        }
        return this.variables[varName];
      }
      case "BinaryExpression": {
        const binaryNode = node as BinaryExpressionNode;
        const left = await this.evaluateExpression(binaryNode.left);
        const right = await this.evaluateExpression(binaryNode.right);
        const operator = binaryNode.operator;

        // Validate operand types for arithmetic operations
        if (["+", "-", "*", "/"].includes(operator)) {
          if (operator === "+" && (typeof left === "string" || typeof right === "string")) {
            return String(left) + String(right);
          }
          if (typeof left !== "number" || typeof right !== "number") {
            throw new Error("Invalid binary expression: arithmetic operations require numbers");
          }
        }

        // Handle boolean operations
        if (operator === "AND") {
          return Boolean(left) && Boolean(right);
        }
        if (operator === "OR") {
          return Boolean(left) || Boolean(right);
        }

        // Handle comparisons - these should return boolean
        if (["=", "<>", "<", ">", "<=", ">="].includes(operator)) {
          if (typeof left === "number" && typeof right === "number") {
            switch (operator) {
              case "=": return left === right;
              case "<>": return left !== right;
              case "<": return left < right;
              case ">": return left > right;
              case "<=": return left <= right;
              case ">=": return left >= right;
            }
          }
        }

        // Handle arithmetic
        if (typeof left === "number" && typeof right === "number") {
          switch (operator) {
            case "+": return left + right;
            case "-": return left - right;
            case "*": return left * right;
            case "/": return right !== 0 ? left / right : "DIVIDE BY ZERO ERROR";
          }
        }

        // Handle string concatenation
        if (typeof left === "string" || typeof right === "string") {
          return String(left) + String(right);
        }

        throw new Error(`Invalid binary expression: ${left} ${operator} ${right}`);
      }
      default:
        throw new Error(`Unknown expression type: ${(node as ExpressionNode).type}`);
    }
  }

  private async executeStatement(statement: Statement): Promise<void> {
    switch (statement.type) {
      case "Print": {
        const value = await this.evaluateExpression(statement.expression);
        console.log(value);
        break;
      }
      case "Let": {
        this.variables[statement.variable] = await this.evaluateExpression(statement.value);
        break;
      }
      case "Input": {
        await Deno.stdout.write(encoder.encode(`? `));
        const inputBuffer = new Uint8Array(1024);
        const n = await Deno.stdin.read(inputBuffer);
        if (!n) return;
        let value = decoder.decode(inputBuffer.subarray(0, n)).trim();
        this.variables[statement.variable] = isNaN(Number(value)) ? value : Number(value);
        break;
      }
      case "Cls": {
        console.clear();
        break;
      }
      case "If": {
        const condition = await this.evaluateExpression(statement.condition);
        if (condition) {
          for (const stmt of statement.thenBranch) {
            await this.executeStatement(stmt);
          }
        } else if (statement.elseBranch) {
          for (const stmt of statement.elseBranch) {
            await this.executeStatement(stmt);
          }
        }
        break;
      }
    }
  }

  public async execute(source: string): Promise<void> {
    const statements = parse(source);
    for (const statement of statements) {
      await this.executeStatement(statement);
    }
  }
}

// Export a singleton instance
const interpreter = new Interpreter();
export const execute = (source: string) => interpreter.execute(source);
