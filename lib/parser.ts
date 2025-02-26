/**
 * QBASIC Parser
 * Converts tokenized QBASIC source code into an Abstract Syntax Tree (AST).
 * Handles standard QBASIC syntax including:
 * - Variable declarations and assignments
 * - Control structures (IF, FOR, WHILE)
 * - Function calls and expressions
 * - Array operations
 */

import { tokenize, Token, TokenType, functions, operators } from "./tokenizer.ts";
import { QBType, isValidQBType } from "./types.ts";

// Error and Base Interfaces

/**
 * Represents an error that occurred during parsing.
 */
interface ParserError {
    message: string;
}

/**
 * Base node interface for all AST nodes.
 */
export interface ASTNode {
    type: string;
}

// Expression Node Types

/**
 * Groups all expression node types for better type checking.
 */
export type ExpressionNode = 
    | StringLiteralNode 
    | NumberLiteralNode 
    | VariableNode 
    | BinaryExpressionNode 
    | UnaryExpressionNode 
    | FunctionCallNode
    | ArrayAccessNode 
    | EmptyExpressionNode;

/**
 * Represents a string literal in the AST.
 */
export interface StringLiteralNode extends ASTNode {
    type: "StringLiteral";
    value: string;
}

/**
 * Represents a numeric literal in the AST.
 */
export interface NumberLiteralNode extends ASTNode {
    type: "NumberLiteral";
    value: number;
}

/**
 * Represents a variable reference in the AST.
 */
export interface VariableNode extends ASTNode {
    type: "Variable";
    name: string;
}

/**
 * Represents a binary expression (e.g., a + b) in the AST.
 */
export interface BinaryExpressionNode extends ASTNode {
    type: "BinaryExpression";
    operator: string;
    left: ExpressionNode;
    right: ExpressionNode;
}

/**
 * Represents a unary expression (e.g., -a or NOT x) in the AST.
 */
export interface UnaryExpressionNode extends ASTNode {
    type: "UnaryExpression";
    operator: string;
    operand: ExpressionNode;
}

/**
 * Represents a function call in the AST.
 */
export interface FunctionCallNode extends ASTNode {
    type: "FunctionCall";
    name: string;
    arguments: ExpressionNode[];
}

/**
 * Represents an array access operation in the AST.
 */
export interface ArrayAccessNode extends ASTNode {
    type: "ArrayAccess";
    array: string;
    index: ExpressionNode;
}

/**
 * Represents an empty expression (used in PRINT statements) in the AST.
 */
export interface EmptyExpressionNode extends ASTNode {
    type: "EmptyExpression";
}

// Statement Node Types

/**
 * Groups all statement node types for better type organization.
 */
export type Statement = {
    type: string;
} & (
    | PrintNode 
    | LetNode 
    | InputNode 
    | ClsNode 
    | IfNode 
    | DimNode 
    | ForNode 
    | WhileNode 
    | GotoNode 
    | LabelNode
);

/**
 * Represents a PRINT statement in the AST.
 */
export interface PrintNode extends ASTNode {
    type: "Print";
    expression?: ExpressionNode;
    expressions?: ExpressionNode[];
}

/**
 * Represents a LET statement (assignment) in the AST.
 */
export interface LetNode extends ASTNode {
    type: "Let";
    variable?: string;
    value?: ExpressionNode;
    arrayAccess?: ArrayAccessNode;
    expression?: ExpressionNode;
}

/**
 * Represents an INPUT statement in the AST.
 */
export interface InputNode extends ASTNode {
    type: "Input";
    variable: string;
}

/**
 * Represents a CLS (clear screen) statement in the AST.
 */
export interface ClsNode extends ASTNode {
    type: "Cls";
}

/**
 * Represents an IF statement in the AST.
 */
export interface IfNode extends ASTNode {
    type: "If";
    condition: ExpressionNode;
    thenBranch: Statement[];
    elseBranch?: Statement[];
}

/**
 * Represents a DIM statement (variable declaration) in the AST.
 */
export interface DimNode extends ASTNode {
    type: "Dim";
    variable: string;
    variableType: QBType;
    size?: number;
}

/**
 * Represents a FOR loop in the AST.
 */
export interface ForNode extends ASTNode {
    type: "For";
    variable: string;
    start: ExpressionNode;
    end: ExpressionNode;
    step?: ExpressionNode;
    body: Statement[];
}

/**
 * Represents a WHILE loop in the AST.
 */
export interface WhileNode extends ASTNode {
    type: "While";
    condition: ExpressionNode;
    body: Statement[];
}

/**
 * Represents a GOTO statement in the AST.
 */
export interface GotoNode extends ASTNode {
    type: "Goto";
    label: string;
}

/**
 * Represents a label definition in the AST.
 */
export interface LabelNode extends ASTNode {
    type: "Label";
    name: string;
}

/**
 * Tracks the context of nested loops for proper nesting validation.
 */
interface LoopContext {
    type: 'WHILE' | 'FOR';
    depth: number;
}

// Parser state
let current = 0;

/**
 * Helper function to check if a token matches a specific type.
 */
function isTokenType(token: Token, type: TokenType): boolean {
    return token.type === type;
}

/**
 * Helper function to check if a token matches any of the given types.
 */
function isAnyTokenType(token: Token, ...types: TokenType[]): boolean {
    return types.includes(token.type);
}

// Main parsing functions

/**
 * Main parsing function that converts QBASIC source code into an AST.
 * @param source The QBASIC source code to parse
 * @returns An array of Statement nodes representing the program
 * @throws {Error} If there's a syntax error in the source code
 */
export function parse(source: string): Statement[] {
    const tokens = tokenize(source);
    let index = 0;
    const statements: Statement[] = [];
    const loopStack: LoopContext[] = [];

    /**
     * Skips over newline tokens in the token stream.
     */
    function skipNewlines(): void {
        while (index < tokens.length && isTokenType(tokens[index], TokenType.NEWLINE)) {
            index++;
        }
    }

    /**
     * Consumes a token of the expected type or throws an error.
     * @throws {Error} If the next token is not of the expected type
     */
    function eat(type: TokenType): Token {
        if (index >= tokens.length || isTokenType(tokens[index], TokenType.EOF)) {
            throw new Error("Unexpected end of input");
        }
        
        if (!isTokenType(tokens[index], type)) {
            throw new Error(`Unexpected token: ${tokens[index].value}`);
        }
        
        const token = tokens[index];
        index++;
        return token;
    }

    // Expression Parsing

    /**
     * Returns the precedence level for an operator.
     * Higher numbers indicate higher precedence.
     */
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

    /**
     * Parses expressions with operator precedence.
     * @param precedence Current precedence level
     */
    function parseExpression(precedence = 0): ExpressionNode {
        let left: ExpressionNode;
        
        if (isTokenType(tokens[index], TokenType.NOT_OPERATOR)) {
            index++; // Consume NOT
            left = {
                type: "UnaryExpression",
                operator: "NOT",
                operand: parseExpression(getPrecedence("NOT"))
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
            const right = parseExpression(
                operator === "AND" || operator === "OR" ? nextPrecedence + 1 : nextPrecedence
            );
            left = { type: "BinaryExpression", operator, left, right };
        }
        return left;
    }

    /**
     * Parses primary expressions (literals, variables, function calls).
     * @throws {Error} If an invalid expression is encountered
     */
    function parsePrimary(): ExpressionNode {
        const token = tokens[index];

        // Handle string functions and standard functions
        if (isTokenType(token, TokenType.STRING_FUNCTION) || isTokenType(token, TokenType.FUNCTION)) {
            const name = token.value;
            index++; // consume function name
            
            if (!isTokenType(tokens[index], TokenType.LEFT_PAREN)) {
                throw new Error("Expected ( after function name");
            }
            index++; // consume left paren

            const args: ExpressionNode[] = [];
            
            // Parse arguments if any
            if (!isTokenType(tokens[index], TokenType.RIGHT_PAREN)) {
                args.push(parseExpression(0));
                
                while (index < tokens.length && isTokenType(tokens[index], TokenType.COMMA)) {
                    index++; // consume comma directly
                    if (isTokenType(tokens[index], TokenType.RIGHT_PAREN)) {
                        throw new Error("Expected argument after comma");
                    }
                    args.push(parseExpression(0));
                }
            }
            
            // Ensure we have a closing parenthesis
            if (!isTokenType(tokens[index], TokenType.RIGHT_PAREN)) {
                throw new Error("Expected )");
            }
            index++; // consume right paren
            
            return {
                type: "FunctionCall",
                name,
                arguments: args
            };
        }

        // Handle identifiers and array access
        if (isTokenType(token, TokenType.IDENTIFIER)) {
            const name = token.value;
            index++;

            // Check for array access
            if (isTokenType(tokens[index], TokenType.LEFT_PAREN)) {
                index++; // consume (
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

        // Handle operators
        if (isTokenType(token, TokenType.OPERATOR)) {
            if (token.value === '-' || token.value === '+') {
                index++;
                const operand = parsePrimary();
                if (operand.type === "NumberLiteral") {
                    return {
                        type: "NumberLiteral",
                        value: token.value === '-' ? -operand.value : operand.value
                    };
                }
                return {
                    type: "UnaryExpression",
                    operator: token.value,
                    operand
                };
            }
        }
    
        // Handle literals and identifiers
        if (isTokenType(token, TokenType.STRING)) {
            index++;
            return { type: "StringLiteral", value: token.value.slice(1, -1) };
        }
    
        if (isTokenType(token, TokenType.NUMBER)) {
            index++;
            return { type: "NumberLiteral", value: Number(token.value) };
        }
    
        // Handle parentheses
        if (isTokenType(token, TokenType.LEFT_PAREN)) {
            index++; // consume (
            const expr = parseExpression(0);
            eat(TokenType.RIGHT_PAREN);
            return expr;
        }
    
        throw new Error(`Unexpected token: ${token.value}`);
    }

    // Statement Parsing

    /**
     * Parses IF statements, including multi-line IF blocks.
     * @throws {Error} If the IF statement syntax is invalid
     */
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

    /**
     * Parses DIM statements for variable declarations.
     * @throws {Error} If the variable declaration syntax is invalid
     */
    function parseDimStatement(): DimNode {
        index++; // Consume DIM
        const variable = eat(TokenType.IDENTIFIER).value;
        let size: number | undefined;
        let variableType: QBType = QBType.SINGLE; // Default to SINGLE
        
        // Handle array declaration - must have parentheses
        if (isTokenType(tokens[index], TokenType.LEFT_PAREN)) {
            index++; // consume (
            const sizeExpr = parseExpression();
            if (sizeExpr.type !== "NumberLiteral") {
                throw new Error("Array size must be a number literal");
            }
            size = sizeExpr.value;
            if (size <= 0) {
                throw new Error("Array size must be positive");
            }
            eat(TokenType.RIGHT_PAREN);
        }
    
        // Handle AS type declaration
        if (isTokenType(tokens[index], TokenType.AS)) {
            index++; // consume AS
            const typeToken = eat(TokenType.TYPE);
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

    /**
     * Parses PRINT statements with multiple expressions.
     * @throws {Error} If the PRINT statement syntax is invalid
     */
    function parsePrintStatement(): PrintNode {
        index++; // consume PRINT
        
        if (index >= tokens.length || isTokenType(tokens[index], TokenType.NEWLINE)) {
            return { type: "Print", expression: { type: "EmptyExpression" } };
        }
        
        const expressions: ExpressionNode[] = [];
        
        // Parse first expression
        expressions.push(parseExpression(0));
        
        // Parse additional expressions after separators
        while (index < tokens.length && 
            (isTokenType(tokens[index], TokenType.SEMICOLON) || 
            isTokenType(tokens[index], TokenType.COMMA))) {
            const separator = tokens[index];
            index++; // consume separator
            
            // Don't parse another expression if we're at the end of line
            if (!isTokenType(tokens[index], TokenType.NEWLINE) && 
                !isTokenType(tokens[index], TokenType.EOF)) {
                
                // Add space after comma but not after semicolon
                if (separator.type === TokenType.COMMA) {
                    expressions.push({ 
                        type: "StringLiteral", 
                        value: " " 
                    });
                }
                
                expressions.push(parseExpression(0));
            }
        }
        
        return expressions.length === 1
            ? { type: "Print", expression: expressions[0] }
            : { type: "Print", expressions };
    }

    /**
     * Parses LET statements and array assignments.
     * @throws {Error} If the assignment syntax is invalid
     */
    function parseLetStatement(): LetNode {
        index++; // Consume LET
        const variable = eat(TokenType.IDENTIFIER).value;
        
        // Handle array assignment
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
        
        return {
            type: "Let",
            variable,
            value
        };
    }

    /**
     * Parses FOR loops with optional STEP values.
     * @throws {Error} If the FOR loop syntax is invalid
     */
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
            throw new Error(`Mismatched FOR/NEXT variables: expected ${variable}, got ${nextVar}`);
        }
        
        return { type: "For", variable, start, end, step, body };
    }

    /**
     * Parses WHILE loops.
     * @throws {Error} If the WHILE loop syntax is invalid
     */
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

    /**
     * Parses individual statements based on their type.
     * @throws {Error} If an invalid statement is encountered
     */
    function parseStatement(): Statement {
        skipNewlines();
        
        if (index >= tokens.length || isTokenType(tokens[index], TokenType.EOF)) {
            throw new Error("Unexpected end of input");
        }
        
        let token = tokens[index];  // Change to let since we'll reuse it

        // Handle array assignment first
        if (isTokenType(token, TokenType.IDENTIFIER)) {
            const name = token.value;
            index++;
            
            if (isTokenType(tokens[index], TokenType.LEFT_PAREN)) {
                // This is an array assignment
                index++; // consume (
                const arrayIndex = parseExpression();
                eat(TokenType.RIGHT_PAREN);
                eat(TokenType.OPERATOR); // consume =
                const expression = parseExpression();
                
                return {
                    type: "Let",
                    arrayAccess: {
                        type: "ArrayAccess",
                        array: name,
                        index: arrayIndex
                    },
                    expression
                } as LetNode;
            }
            
            // Not an array access, backtrack and handle as normal
            index--;
            token = tokens[index];  // Update token after backtracking
        }
        
        // Handle function calls that appear as statements
        if (isTokenType(token, TokenType.STRING_FUNCTION) || isTokenType(token, TokenType.FUNCTION)) {
            const expr = parsePrimary();
            return { type: "Print", expression: expr };
        }

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

    // Parser Loop
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
