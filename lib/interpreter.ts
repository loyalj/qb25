/**
 * QBASIC Interpreter
 * Executes QBASIC programs by interpreting the AST.
 * Features:
 * - Variable management and type checking
 * - Expression evaluation
 * - Control flow (IF, FOR, WHILE)
 * - Built-in functions
 * - Input/Output operations
 */

import { 
    parse, Statement, ExpressionNode, BinaryExpressionNode, 
    StringLiteralNode, NumberLiteralNode, VariableNode, 
    IfNode, DimNode, LetNode, ForNode, WhileNode, 
    GotoNode, LabelNode, ArrayAccessNode, PrintNode, InputNode 
} from "./parser.ts";
import { QBType, TypedVariable, validateType, getDefaultValue, isValidQBType } from "./types.ts";

/**
 * Represents a GOTO operation signal.
 * Used for implementing GOTO statement functionality.
 */
interface GotoSignal {
    isGoto: true;
    targetIndex: number;
}

// I/O utilities
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Type guard to check if a LET node is an array assignment.
 */
function isArrayAssignment(node: LetNode): boolean {
    return node.arrayAccess !== undefined;
}

/**
 * Main interpreter class that executes QBASIC programs.
 * Handles variable management, expression evaluation, and statement execution.
 */
class Interpreter {
    // State Management
    private variables: Map<string, TypedVariable>;
    private labels: Map<string, number>;
    private statements: Statement[];
    
    /**
     * Built-in QBASIC functions implementation.
     * Each function handles type checking and error conditions.
     */
    private readonly builtinFunctions: Record<string, Function> = {
        // Mathematical Functions
        "ABS": (x: number) => Math.abs(x),
        "SGN": (x: number) => Math.sign(x),
        "INT": (x: number) => Math.floor(x),
        "RND": (max: number = 1) => {
            if (max === undefined) return Math.random();
            return Math.floor(Math.random() * max);
        },
        
        // Trigonometric Functions
        "SIN": (x: number) => Math.sin(x),
        "COS": (x: number) => Math.cos(x),
        "TAN": (x: number) => Math.tan(x),
        "ATN": (x: number) => Math.atan(x),
        "ATN2": (y: number, x: number) => Math.atan2(y, x),
        
        // Numeric Functions
        "SQR": (x: any) => {
            if (typeof x !== 'number') throw new Error("Type mismatch");
            if (x < 0) throw new Error("Square root of negative number");
            return Math.sqrt(x);
        },
        "LOG": (x: number) => {
            if (x <= 0) throw new Error(x === 0 ? "Cannot take logarithm of zero" : "Cannot take logarithm of negative number");
            return Math.log(x);
        },
        "EXP": (x: number) => Math.exp(x),
        
        // Type Conversion Functions
        "CINT": (x: any) => {
            if (typeof x !== 'number') throw new Error("Type mismatch");
            return x > 0 ? Math.floor(x + 0.5) : Math.ceil(x - 0.5);
        },
        "CSNG": (x: number) => {
            const str = x.toPrecision(7);
            return Math.abs(x) >= 1e7 || (Math.abs(x) < 0.0001 && x !== 0)
                ? Number(str).toExponential(6)
                : Number(str);
        },
        "CDBL": (x: number) => x,
        
        // String Functions
        "CHR$": (n: number) => String.fromCharCode(n),
        "LEFT$": (str: string, n: number) => str.slice(0, n),
        "RIGHT$": (str: string, n: number) => str.slice(-n),
        "MID$": (str: string, start: number, length: number) => str.slice(start - 1, start - 1 + length),
        "SPACE$": (n: number) => " ".repeat(Math.max(0, n)),
        "STRING$": (n: number, char: string | number) => {
            const charStr = typeof char === 'number' ? String.fromCharCode(char) : String(char);
            return charStr.charAt(0).repeat(Math.max(0, n));
        },
        "LTRIM$": (str: string) => str.trimStart(),
        "RTRIM$": (str: string) => str.trimEnd(),
        "UCASE$": (str: string) => str.toUpperCase(),
        "LCASE$": (str: string) => str.toLowerCase(),
        
        // String/Number Conversion
        "STR$": (x: any) => {
            const num = Number(x);
            if (isNaN(num)) throw new Error("STR$ function requires a numeric argument");
            return num >= 0 ? ` ${num}` : `${num}`;
        },
        "VAL": (str: any) => {
            const strValue = String(str).trim();
            return isNaN(Number(strValue)) ? 0 : Number(strValue);
        },
        
        // Other Functions
        "LEN": (str: string) => str.length,
        "ASC": (str: string) => {
            if (typeof str !== 'string') throw new Error("ASC function requires a string argument");
            if (str.length === 0) throw new Error("Cannot get ASCII code of empty string");
            return str.charCodeAt(0);
        },
        "INSTR": (str: string, search: string) => {
            if (typeof str !== 'string' || typeof search !== 'string') throw new Error("Type mismatch");
            return str.indexOf(search) + 1;  // QB uses 1-based indexing
        },
        "OCT$": (n: number) => Math.floor(n).toString(8),
        "HEX$": (n: number) => Math.floor(n).toString(16).toUpperCase(),
    };

    constructor() {
        this.variables = new Map();
        this.labels = new Map();
        this.statements = [];
    }

    /**
     * Resets the interpreter state.
     * Clears all variables, labels, and statements.
     */
    private reset(): void {
        this.variables.clear();
        this.labels.clear();
        this.statements = [];
    }

    // Variable Management

    /**
     * Evaluates a DIM statement to declare variables.
     * Handles both regular variables and arrays.
     * @param node The DIM statement node
     * @throws Error if variable is already declared or type is invalid
     */
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

    /**
     * Evaluates array access expressions.
     * Handles bounds checking and type validation.
     * @param node The array access node
     * @throws Error if array is undefined or index is out of bounds
     */
    private async evaluateArrayAccess(node: ArrayAccessNode): Promise<any> {
        const variable = this.variables.get(node.array);
        if (!variable || !Array.isArray(variable.value)) {
            throw new Error(`Array ${node.array} is not defined`);
        }

        const index = Math.floor(Number(await this.evaluateExpression(node.index, false)));
        if (isNaN(index) || index < 0 || index >= variable.value.length) {
            throw new Error("Array index out of bounds");
        }

        return variable.value[index];
    }

    /**
     * Evaluates array assignments.
     * Handles type checking and array bounds validation.
     * @param statement The LET statement node containing array assignment
     * @throws Error if assignment is invalid or types don't match
     */
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

            // Evaluate value without string context for strict type checking
            const value = await this.evaluateExpression(statement.value, false);

            // Set variable with strict type
            this.variables.set(statement.variable, {
                name: statement.variable,
                type: typeof value === 'string' ? QBType.STRING : QBType.SINGLE,
                value
            });
        }
    }

    // Expression Evaluation

    /**
     * Evaluates any expression node in the AST.
     * Handles all expression types including literals, operators, and function calls.
     * @param node The expression node to evaluate
     * @param isPrintContext Whether the expression is being evaluated for PRINT
     * @returns The evaluated result
     * @throws Error for invalid expressions or type mismatches
     */
    private async evaluateExpression(node: ExpressionNode, isPrintContext = false): Promise<any> {
        try {
            switch (node.type) {
                case "UnaryExpression": {
                    const operand = await this.evaluateExpression(node.operand);
                    switch (node.operator) {
                        case "NOT": return !operand;
                        case "+": return +operand;
                        case "-": return -operand;
                        default: throw new Error(`Unknown unary operator: ${node.operator}`);
                    }
                }
                case "StringLiteral":
                    return (node as StringLiteralNode).value;
                case "NumberLiteral":
                    return (node as NumberLiteralNode).value;
                case "Variable": {
                    const varName = (node as VariableNode).name;
                    const variable = this.variables.get(varName.toUpperCase()); // Case-insensitive lookup
                    if (!variable) {
                        throw new Error(`Undefined variable: ${varName}`);
                    }
                    return variable.value;
                }
                case "BinaryExpression": {
                    const binaryNode = node as BinaryExpressionNode;
                    const operator = binaryNode.operator;

                    // Handle string concatenation first
                    if (operator === "+") {
                        const left = await this.evaluateExpression(binaryNode.left, isPrintContext);
                        const right = await this.evaluateExpression(binaryNode.right, isPrintContext);
                        if (typeof left === "string" || typeof right === "string") {
                            return String(left) + String(right);
                        }
                    }

                    // Handle logical operators
                    if (operator === "AND" || operator === "OR") {
                        const left = await this.evaluateExpression(binaryNode.left, false);
                        const right = await this.evaluateExpression(binaryNode.right, false);
                        const leftBool = typeof left === "boolean" ? left : left !== 0;
                        const rightBool = typeof right === "boolean" ? right : right !== 0;
                        return operator === "AND" ? leftBool && rightBool : leftBool || rightBool;
                    }

                    // For both PRINT and string variable assignment contexts
                    if (operator === "+" && (isPrintContext || await this.isStringContext(binaryNode))) {
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

                    // Evaluate arguments
                    const args = await Promise.all(
                        node.arguments.map(arg => this.evaluateExpression(arg, false))
                    );

                    // Don't wrap in try/catch to ensure errors propagate properly
                    return func(...args);
                }
                default:
                    throw new Error(`Unknown expression type: ${(node as ExpressionNode).type}`);
            }
        } catch (error) {
            // Re-throw all errors
            throw error;
        }
    }

    /**
     * Determines if an expression is in string context.
     * Used for handling string concatenation and type coercion.
     * @param node The binary expression node to check
     * @returns true if either operand evaluates to a string
     */
    private async isStringContext(node: BinaryExpressionNode): Promise<boolean> {
        try {
            const left = await this.evaluateExpression(node.left, false);
            const right = await this.evaluateExpression(node.right, false);
            return typeof left === 'string' || typeof right === 'string';
        } catch {
            return false;
        }
    }

    // Statement Execution

    /**
     * Executes a LET statement for variable assignment.
     * Handles both regular variables and arrays.
     * @param statement The LET statement node
     * @throws Error if assignment is invalid or types don't match
     */
    private async executeLetStatement(statement: LetNode): Promise<void> {
        if (!statement.variable && !statement.arrayAccess) {
            throw new Error("Invalid LET statement");
        }

        // Handle existing variable assignment
        if (statement.variable) {
            const variable = this.variables.get(statement.variable);
            if (variable) {
                let newValue = await this.evaluateExpression(statement.value!, false);
                
                // For string variables, ensure the value is a string
                if (variable.type === QBType.STRING) {
                    if (typeof newValue !== 'string') {
                        throw new Error("Type mismatch");
                    }
                    variable.value = String(newValue);
                    return;
                }

                // For numeric variables, ensure we have a number
                if (typeof newValue !== 'number') {
                    throw new Error("Type mismatch");
                }
                variable.value = newValue;
                return;
            }

            // Auto-declare new variable
            const value = await this.evaluateExpression(statement.value!, false);
            const varType = typeof value === 'string' ? QBType.STRING : QBType.SINGLE;
            await this.evaluateDim({
                type: "Dim",
                variable: statement.variable,
                variableType: varType
            } as DimNode);
            
            // Set the value
            const newVar = this.variables.get(statement.variable);
            if (newVar) {
                newVar.value = value;
            }
            return;
        }

        await this.evaluateAssignment(statement);
    }

    /**
     * Executes a single statement node.
     * Dispatches to appropriate handler based on statement type.
     * @param statement The statement node to execute
     * @throws Error if statement execution fails
     */
    private async executeStatement(statement: Statement): Promise<void> {
        switch (statement.type) {
            case "Dim":
                await this.evaluateDim(statement as DimNode);
                break;
            case "Print":
                await this.executePrintStatement(statement as PrintNode);
                break;
            case "Let":
                await this.executeLetStatement(statement as LetNode);
                break;
            case "Input":
                await this.executeInputStatement(statement as InputNode);
                break;
            case "Cls":
                console.clear();
                break;
            case "If":
                await this.executeIfStatement(statement as IfNode);
                break;
            case "For":
                await this.executeForLoop(statement as ForNode);
                break;
            case "While":
                await this.executeWhileLoop(statement as WhileNode);
                break;
            case "Label":
                this.labels.set((statement as LabelNode).name, this.statements.indexOf(statement));
                break;
            case "Goto":
                await this.executeGoto(statement as GotoNode);
                break;
            default: {
                const exhaustiveCheck: never = statement;
                throw new Error(`Unknown statement type: ${(statement as Statement).type}`);
            }
        }
    }

    /**
     * Executes an INPUT statement.
     * Handles variable declaration and value assignment.
     */
    private async executeInputStatement(statement: InputNode): Promise<void> {
        // Auto-declare variables used in INPUT if they don't exist
        if (!this.variables.has(statement.variable)) {
            await this.evaluateDim({
                type: "Dim",
                variable: statement.variable,
                variableType: QBType.SINGLE
            } as DimNode);
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
    }

    /**
     * Executes a PRINT statement.
     * Handles empty prints, single expressions, and multiple expressions.
     */
    private async executePrintStatement(statement: PrintNode): Promise<void> {
        // Handle empty PRINT statements
        if (!statement.expression && !statement.expressions) {
            console.log();
            return;
        }

        // Handle multiple expressions
        if (statement.expressions) {
            const values = await Promise.all(
                statement.expressions.map((expr: ExpressionNode) => 
                    this.evaluateExpression(expr, true)
                )
            );
            console.log(values.join(""));
            return;
        }

        // Handle single expression
        if (statement.expression) {
            if (statement.expression.type === "EmptyExpression") {
                console.log();
                return;
            }
            const value = await this.evaluateExpression(statement.expression, true);
            console.log(typeof value === "number" ? String(value) : value);
        }
    }

    /**
     * Executes an IF statement with optional ELSE branch.
     * Evaluates condition and executes appropriate branch.
     */
    private async executeIfStatement(statement: IfNode): Promise<void> {
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
    }

    /**
     * Executes a FOR loop with step value.
     * Manages loop variable and iteration.
     */
    private async executeForLoop(statement: ForNode): Promise<void> {
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
    }

    /**
     * Executes a WHILE loop.
     * Repeatedly evaluates condition and executes body.
     */
    private async executeWhileLoop(statement: WhileNode): Promise<void> {
        const whileNode = statement as WhileNode;
        while (await this.evaluateExpression(whileNode.condition)) {
            for (const bodyStmt of whileNode.body) {
                await this.executeStatement(bodyStmt);
            }
        }
    }

    /**
     * Executes a GOTO statement.
     * Handles label lookup and control flow transfer.
     */
    private async executeGoto(statement: GotoNode): Promise<void> {
        const labelIndex = this.labels.get(statement.label);
        if (labelIndex === undefined) {
            throw new Error(`Label not found: ${statement.label}`);
        }
        throw { 
            isGoto: true, 
            targetIndex: labelIndex 
        } as GotoSignal;
    }

    /**
     * Main execution entry point.
     * Parses and executes QBASIC source code.
     * @param source QBASIC source code to execute
     * @throws Error if execution fails
     */
    public async execute(source: string): Promise<void> {
        try {
            this.reset();
            this.statements = parse(source);
            
            // First pass: collect label positions
            for (let i = 0; i < this.statements.length; i++) {
                if (this.statements[i].type === "Label") {
                    const labelNode = this.statements[i] as LabelNode;
                    this.labels.set(labelNode.name, i);
                }
            }
            
            // Second pass: execute statements
            for (let i = 0; i < this.statements.length; i++) {
                try {
                    await this.executeStatement(this.statements[i]);
                } catch (e) {
                    if (e && typeof e === 'object' && 'isGoto' in e) {
                        i = (e as GotoSignal).targetIndex;
                        continue;
                    }
                    throw e;
                }
            }
        } catch (error) {
            if (!error || typeof error !== 'object' || !('isGoto' in error)) {
                throw error;
            }
        }
    }
}

// Export a function that creates a new interpreter instance for each execution
export const execute = (source: string) => new Interpreter().execute(source);
