import { parse, Statement, ExpressionNode, BinaryExpressionNode, StringLiteralNode, NumberLiteralNode, VariableNode, IfNode } from "./parser.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

class Interpreter {
  private variables: Record<string, string | number | boolean> = {};

  // Add built-in functions
  private builtinFunctions: Record<string, Function> = {
    "ABS": (x: number) => Math.abs(x),
    "SGN": (x: number) => Math.sign(x),
    "INT": (x: number) => Math.floor(x),
    "RND": (max: number = 1) => {
        if (max === undefined) return Math.random();
        return Math.floor(Math.random() * max);
    },
    "SQR": (x: number) => {
        if (x < 0) throw new Error("Square root of negative number");
        return Math.sqrt(x);
    },
    "SIN": (x: number) => Math.sin(x),
    "COS": (x: number) => Math.cos(x),
    "TAN": (x: number) => Math.tan(x),
    "ASC": (str: string) => {
      if (typeof str !== 'string') {
        throw new Error("ASC function requires a string argument");
      }
      if (str.length === 0) {
        throw new Error("Cannot get ASCII code of empty string");
      }
      return str.charCodeAt(0);
    },
    "ATN": (x: number) => Math.atan(x),
    "LOG": (x: number) => {
      if (x <= 0) throw new Error(x === 0 ? "Cannot take logarithm of zero" : "Cannot take logarithm of negative number");
      return Math.log(x);
    },
    "EXP": (x: number) => Math.exp(x),
    "ATN2": (y: number, x: number) => Math.atan2(y, x),
    "CINT": (x: number) => {
      // QBasic rounds ties away from zero
      if (x > 0) {
        return Math.floor(x + 0.5);
      } else {
        return Math.ceil(x - 0.5);
      }
    },
    "CSNG": (x: number) => {
      const str = x.toPrecision(7);
      // Convert to scientific notation if number is too large or small
      if (Math.abs(x) >= 1e7 || (Math.abs(x) < 0.0001 && x !== 0)) {
        return Number(str).toExponential(6);
      }
      return Number(str);
    },
    "CDBL": (x: number) => x, // JavaScript numbers are already double precision
  };

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
      case "ArrayAccess":
        throw new Error(`Arrays not yet supported`);
      case "FunctionCall": {
        const func = this.builtinFunctions[node.name];
        if (!func) {
          throw new Error(`Unknown function: ${node.name}`);
        }

        // Evaluate all arguments
        const args = await Promise.all(
          node.arguments.map(arg => this.evaluateExpression(arg))
        );

        // Special handling for ASC function which expects string
        if (node.name === "ASC") {
          if (typeof args[0] !== 'string') {
            throw new Error("ASC function requires a string argument");
          }
          return func(args[0]);
        }

        // For other functions, ensure numeric arguments
        const numericArgs = args.map(arg => {
          if (typeof arg !== 'number') {
            throw new Error(`Function ${node.name} expects numeric arguments`);
          }
          return arg;
        });

        try {
          return func(...numericArgs);
        } catch (e: any) {
          throw new Error(`Error in function ${node.name}: ${e?.message || 'Unknown error'}`);
        }
      }
      default:
        throw new Error(`Unknown expression type: ${(node as ExpressionNode).type}`);
    }
  }

  private async executeStatement(statement: Statement): Promise<void> {
    switch (statement.type) {
      case "Print": {
        // Handle empty PRINT statements
        if (statement.expression.type === "EmptyExpression") {
          console.log();  // Print just a newline
          return;
        }
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
        const value = decoder.decode(inputBuffer.subarray(0, n)).trim();
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
