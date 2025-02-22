import { parse, Statement, PrintNode, LetNode, InputNode, ClsNode, ExpressionNode, BinaryExpressionNode, StringLiteralNode, NumberLiteralNode, VariableNode } from "./parser.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function execute(source: string) {
  const statements = parse(source);
  let variables: Record<string, string | number> = {};

  async function evaluateExpression(node: ExpressionNode): Promise<string | number> {
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
        const left = await evaluateExpression(binaryNode.left);
        const right = await evaluateExpression(binaryNode.right);
        const operator = binaryNode.operator;

        if (typeof left === "string" || typeof right === "string") {
          return String(left) + String(right);
        }

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
        console.log(await evaluateExpression(printNode.expression));
        break;
      }
      case "Let": {
        const letNode = statement as LetNode;
        variables[letNode.variable] = await evaluateExpression(letNode.value);
        break;
      }
      
      case "Input": {
        const inputNode = statement as InputNode;
        await Deno.stdout.write(encoder.encode(`? `));

        const inputBuffer = new Uint8Array(1024);
        const n = await Deno.stdin.read(inputBuffer);
        if (!n) return;

        let value = decoder.decode(inputBuffer.subarray(0, n)).trim();
        variables[inputNode.variable] = isNaN(Number(value)) ? value : Number(value);
        break;
      }
      case "Cls": {
        console.clear();
        break;
      }
      default:
        throw new Error(`Unknown statement type: ${statement.type}`);
    }
  }
}
