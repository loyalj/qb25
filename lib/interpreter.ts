import { parse, Statement, ExpressionNode, BinaryExpressionNode, StringLiteralNode, 
         NumberLiteralNode, VariableNode, IfNode, DimNode, AssignmentNode, LetNode,
         ForNode, WhileNode, GotoNode, LabelNode, ArrayAccessNode } from "./parser.ts";
import { QBType, TypedVariable, validateType, getDefaultValue, isValidQBType } from "./types.ts";

// Add interface for GOTO signal
interface GotoSignal {
  isGoto: true;
  targetIndex: number;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Add this type guard to check for array access
function isArrayAssignment(node: LetNode): boolean {
    return node.arrayAccess !== undefined;
}

class Interpreter {
  private variables: Map<string, TypedVariable>;
  private labels: Map<string, number>;  // Add labels map
  private statements: Statement[];      // Add statements array for GOTO support

  constructor() {
    this.variables = new Map();
    this.labels = new Map();
    this.statements = [];
  }

  private reset(): void {
    this.variables.clear();
    this.labels.clear();
    this.statements = [];
  }

  // Remove inPrintStatement flag

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
    "CHR$": (n: number) => String.fromCharCode(n),
    "LEFT$": (str: string, n: number) => str.slice(0, n),
    "RIGHT$": (str: string, n: number) => str.slice(-n),
    "MID$": (str: string, start: number, length: number) => str.slice(start - 1, start - 1 + length),
    "LEN": (str: string) => str.length,
    "INSTR$": (str: string, search: string) => str.indexOf(search) + 1
  };

  private async evaluateDim(node: DimNode): Promise<void> {
    if (!node?.variable) {
        throw new Error("Invalid DIM statement");
    }

    const varName = node.variable;
    
    // Update error message with variable name
    if (this.variables.has(varName)) {
        throw new Error(`Variable ${varName} already declared`);
    }

    const varType = node.variableType;

    // Validate type before creating variable
    if (!varType || !Object.values(QBType).includes(varType)) {
        throw new Error("Invalid type");
    }

    // Handle array declaration
    if (node.size !== undefined) {
        if (node.size <= 0) {
            throw new Error("Array size must be positive");
        }

        // Create array with default values
        const defaultValue = getDefaultValue(varType);
        const array = new Array(node.size).fill(defaultValue);
        this.variables.set(varName, {
            name: varName,
            type: varType,
            value: array as (number | string)[]  // Type assertion to match TypedVariable
        });
    } else {
        // Regular variable
        this.variables.set(varName, {
            name: varName,
            type: varType,
            value: getDefaultValue(varType)
        });
    }
  }

  private convertExpressionResult(value: string | number | boolean): string | number {
    if (typeof value === 'boolean') {
      return value ? -1 : 0;  // QBasic convention: true = -1, false = 0
    }
    return value;
  }

  private async evaluateArrayAccess(node: ArrayAccessNode): Promise<any> {
    const variable = this.variables.get(node.array);
    if (!variable || !Array.isArray(variable.value)) {
        throw new Error(`Array ${node.array} is not defined`);
    }

    const index = Number(await this.evaluateExpression(node.index, false));
    if (index < 0 || index >= variable.value.length) {
        throw new Error("Array index out of bounds");
    }

    return variable.value[index];
  }

  private async evaluateAssignment(statement: LetNode): Promise<void> {
    if (isArrayAssignment(statement)) {
        if (!statement.arrayAccess || !statement.expression) {
            throw new Error("Invalid array assignment");
        }

        const arrayName = statement.arrayAccess.array;
        const variable = this.variables.get(arrayName);
        if (!variable || !Array.isArray(variable.value)) {
            throw new Error(`Array ${arrayName} is not defined`);
        }

        const indexValue = Number(await this.evaluateExpression(statement.arrayAccess.index, false));
        const value = await this.evaluateExpression(statement.expression, false);

        // Fix array bounds check for 0-based arrays
        if (!Number.isInteger(indexValue) || indexValue < 0 || indexValue >= variable.value.length) {
            throw new Error("Array index out of bounds");
        }

        // Type checking for array assignments
        if (!validateType(variable.type, value)) {
            throw new Error("Type mismatch");
        }

        variable.value[indexValue] = value;
    } else {
        if (!statement.variable || !statement.value) {
            throw new Error("Invalid assignment");
        }

        const value = await this.evaluateExpression(statement.value, false);
        this.variables.set(statement.variable, {
            name: statement.variable,
            type: typeof value === 'string' ? QBType.STRING : QBType.SINGLE,
            value
        });
    }
  }

  private async evaluateExpression(node: ExpressionNode, isPrintContext = false): Promise<any> {
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
        const variable = this.variables.get(varName);
        if (!variable) {
          throw new Error(`Undefined variable: ${varName}`);
        }
        return variable.value;
      }
      case "BinaryExpression": {
        const binaryNode = node as BinaryExpressionNode;
        const operator = binaryNode.operator;

        // Handle logical operators first
        if (operator === "AND" || operator === "OR") {
          const left = await this.evaluateExpression(binaryNode.left, false);
          const right = await this.evaluateExpression(binaryNode.right, false);
          const leftBool = typeof left === "boolean" ? left : left !== 0;
          const rightBool = typeof right === "boolean" ? right : right !== 0;
          return operator === "AND" ? leftBool && rightBool : leftBool || rightBool;
        }

        // For PRINT statements with string concatenation
        if (isPrintContext && operator === "+") {
          const left = await this.evaluateExpression(binaryNode.left, isPrintContext);
          const right = await this.evaluateExpression(binaryNode.right, isPrintContext);
          if (typeof left === "string" || typeof right === "string") {
            return String(left) + String(right);
          }
        }

        // For all other cases, evaluate normally
        const left = await this.evaluateExpression(binaryNode.left, false);
        const right = await this.evaluateExpression(binaryNode.right, false);

        // Handle numeric operations and comparisons
        if (typeof left === "number" && typeof right === "number") {
          switch (operator) {
            // Arithmetic operators
            case "+": return left + right;
            case "-": return left - right;
            case "*": return left * right;
            case "/": return right === 0 ? Infinity : left / right;  // Return Infinity for division by zero
            // Comparison operators
            case "=": return left === right;
            case "<>": return left !== right;
            case ">": return left > right;
            case "<": return left < right;
            case ">=": return left >= right;
            case "<=": return left <= right;
            default: throw new Error(`Unknown operator: ${operator}`);
          }
        }

        // Handle string comparisons
        if (typeof left === "string" && typeof right === "string") {
          switch (operator) {
            case "=": return left === right;
            case "<>": return left !== right;
            case ">": return left > right;
            case "<": return left < right;
            case ">=": return left >= right;
            case "<=": return left <= right;
            default: throw new Error("Invalid binary expression: string operations only support comparisons");
          }
        }

        // Handle mixed type comparisons
        if (operator === "=" || operator === "<>") {
          const result = String(left) === String(right);
          return operator === "=" ? result : !result;
        }

        throw new Error(`Invalid binary expression: incompatible types for operator ${operator}`);
      }
      case "ArrayAccess":
        return await this.evaluateArrayAccess(node);
      case "FunctionCall": {
        const func = this.builtinFunctions[node.name];
        if (!func) {
          throw new Error(`Unknown function: ${node.name}`);
        }

        // Evaluate all arguments first
        const args = await Promise.all(
            node.arguments.map(arg => this.evaluateExpression(arg))
        );

        // Handle ASC function specially
        if (node.name === 'ASC') {
            const arg = args[0];
            if (typeof arg !== 'string') {
                throw new Error("ASC function requires a string argument");
            }
            if (arg.length === 0) {
                throw new Error("Cannot get ASCII code of empty string");
            }
            return func(arg);
        }

        // Special handling for string functions
        if (node.name.endsWith('$') || node.name === 'LEN') {
            const firstArg = String(args[0]);

            if (['LEFT$', 'RIGHT$', 'MID$'].includes(node.name)) {
                // First arg should be string, rest should be numbers
                const numericArgs = args.slice(1).map(arg => {
                    if (typeof arg !== 'number') {
                        throw new Error(`Function ${node.name} expects numeric arguments after string argument`);
                    }
                    return arg;
                });
                return func(firstArg, ...numericArgs);
            }

            // For other string functions (LEN, etc)
            return func(firstArg);
        }

        // For numeric-only functions, ensure all arguments are numbers
        const numericArgs = args.map(arg => {
            if (typeof arg !== 'number') {
                throw new Error(`Function ${node.name} expects numeric arguments`);
            }
            return arg;
        });

        return func(...numericArgs);
      }
      default:
        throw new Error(`Unknown expression type: ${(node as ExpressionNode).type}`);
    }
  }

  private async executeLetStatement(statement: LetNode): Promise<void> {
    if (!statement.variable && !statement.arrayAccess) {
        throw new Error("Invalid LET statement");
    }

    if (statement.variable && !this.variables.has(statement.variable)) {
        const value = await this.evaluateExpression(statement.value!, false);
        const varType = typeof value === 'string' ? QBType.STRING : QBType.SINGLE;
        await this.evaluateDim({
            type: "Dim",
            variable: statement.variable,
            variableType: varType
        } as DimNode);
    }

    // Get existing variable before assignment
    if (statement.variable) {
        const variable = this.variables.get(statement.variable);
        if (variable) {
            const newValue = await this.evaluateExpression(statement.value!, false);
            // Type check before assignment
            if ((variable.type === QBType.STRING && typeof newValue !== 'string') ||
                (variable.type !== QBType.STRING && typeof newValue !== 'number')) {
                throw new Error("Type mismatch");
            }
        }
    }

    await this.evaluateAssignment(statement);
  }

  private async executeStatement(statement: Statement): Promise<void> {
    switch (statement.type) {
      case "Dim": {
        await this.evaluateDim(statement);
        break;
      }
      case "Print": {
        // Handle empty PRINT statements
        if (!statement.expression && !statement.expressions) {
          console.log();
          return;
        }

        // Handle print with semicolon for expression lists
        if (statement.expressions) {
          const values = [];
          for (const expr of statement.expressions) {
            const value = await this.evaluateExpression(expr, true);
            values.push(typeof value === "number" ? String(value) : value);
          }
          console.log(values.join(""));
        } else if (statement.expression) {
          // Handle single expression print
          if (statement.expression.type === "EmptyExpression") {
            console.log();
            return;
          }
          const value = await this.evaluateExpression(statement.expression, true);
          console.log(typeof value === "number" ? String(value) : value);
        }
        break;
      }
      case "Let":
        await this.executeLetStatement(statement as LetNode);
        break;
      case "Input": {
        // Auto-declare variables used in INPUT if they don't exist
        if (!this.variables.has(statement.variable)) {
          await this.evaluateDim({
            type: "Dim",
            variable: statement.variable,
            variableType: QBType.SINGLE // Default to SINGLE like LET statements
          });
        }

        await Deno.stdout.write(encoder.encode(`? `));
        const inputBuffer = new Uint8Array(1024);
        const n = await Deno.stdin.read(inputBuffer);
        if (!n) return;
        const value = decoder.decode(inputBuffer.subarray(0, n)).trim();
        const variable = this.variables.get(statement.variable);
        if (!variable) {
          throw new Error(`Variable ${statement.variable} not declared`);
        }
        variable.value = isNaN(Number(value)) ? value : Number(value);
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
      case "For": {
        const forNode = statement as ForNode;
        const startValue = await this.evaluateExpression(forNode.start);
        const endValue = await this.evaluateExpression(forNode.end);
        const stepValue = forNode.step ? 
          await this.evaluateExpression(forNode.step) : 
          1;

        if (typeof startValue !== 'number' || 
            typeof endValue !== 'number' || 
            typeof stepValue !== 'number') {
          throw new Error("FOR loop requires numeric values");
        }

        // Initialize loop variable
        this.variables.set(forNode.variable, {
          name: forNode.variable,
          type: QBType.SINGLE,
          value: startValue
        });

        let i = startValue;
        const continueLoop = () => 
          stepValue > 0 ? i <= endValue : i >= endValue;

        while (continueLoop()) {
          // Update loop variable
          this.variables.set(forNode.variable, {
            name: forNode.variable,
            type: QBType.SINGLE,
            value: i
          });

          // Execute loop body
          for (const stmt of forNode.body) {
            await this.executeStatement(stmt);
          }

          i += stepValue;
        }
        break;
      }

      case "While": {
        const whileNode = statement as WhileNode;
        while (await this.evaluateExpression(whileNode.condition)) {
          for (const bodyStmt of whileNode.body) {
            await this.executeStatement(bodyStmt);
          }
        }
        break;
      }

      case "Label": {
        const labelNode = statement as LabelNode;
        this.labels.set(labelNode.name, this.statements.indexOf(statement));
        break;
      }

      case "Goto": {
        const gotoNode = statement as GotoNode;
        const labelIndex = this.labels.get(gotoNode.label);
        if (labelIndex === undefined) {
          throw new Error(`Label not found: ${gotoNode.label}`);
        }
        throw { 
          isGoto: true, 
          targetIndex: labelIndex 
        } as GotoSignal;
      }
    }
  }

  public async execute(source: string): Promise<void> {
    try {
        // Reset state before each execution
        this.reset();
        this.statements = parse(source);
        
        // First pass: collect all labels
        for (let i = 0; i < this.statements.length; i++) {
          if (this.statements[i].type === "Label") {
            const labelNode = this.statements[i] as LabelNode;
            this.labels.set(labelNode.name, i);
          }
        }
        
        // Second pass: execute statements with GOTO handling
        for (let i = 0; i < this.statements.length; i++) {
          try {
            await this.executeStatement(this.statements[i]);
          } catch (e) {
            if (e && typeof e === 'object' && 'isGoto' in e) {
              const gotoSignal = e as GotoSignal;
              i = gotoSignal.targetIndex;
              continue;
            }
            throw e;  // Re-throw any other errors
          }
        }
    } catch (error) {
        // Only throw if it's not our special GOTO signal
        if (!error || typeof error !== 'object' || !('isGoto' in error)) {
          throw error;
        }
    }
  }
}

// Create a new interpreter for each execution instead of reusing a singleton
export const execute = (source: string) => new Interpreter().execute(source);
