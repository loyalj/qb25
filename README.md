# QB25 - A Modern QBasic Interpreter

QB25 is a TypeScript implementation of a QBasic-like interpreter that runs in modern environments. It aims to provide compatibility with classic QBasic syntax while adding modern features and type safety.

## Features

### Basic Operations
- Variables and arithmetic operations (`+`, `-`, `*`, `/`)
- String operations and concatenation
- Type system (INTEGER, SINGLE, DOUBLE, STRING)
- Logical operators (AND, OR, NOT)
- Comparison operators (`=`, `<>`, `<`, `>`, `<=`, `>=`)

### Control Flow
- IF/THEN/ELSE statements (both single-line and multi-line)
- FOR/NEXT loops with STEP support
- WHILE/WEND loops
- GOTO and labels

### Arrays
- One-dimensional arrays with DIM statement
- Zero-based indexing
- Type-safe array declarations
- Automatic bounds checking
- Array access and modification

### Built-in Functions

#### Mathematical Functions
- `ABS(x)` - Absolute value
- `SGN(x)` - Sign of number (-1, 0, 1)
- `INT(x)` - Integer portion of a number
- `RND([max])` - Random number (0 to max-1, or 0 to 1 if no argument)
- `SQR(x)` - Square root (error if negative)
- `SIN(x)`, `COS(x)`, `TAN(x)` - Trigonometric functions
- `ATN(x)`, `ATN2(y,x)` - Arctangent functions
- `LOG(x)` - Natural logarithm (error if ≤ 0)
- `EXP(x)` - Natural exponential

#### String Functions
- `LEFT$(str, n)` - Left n characters
- `RIGHT$(str, n)` - Right n characters
- `MID$(str, start, length)` - Substring from start position
- `SPACE$(n)` - String of n spaces
- `STRING$(n, x)` - String of n copies of character
- `LTRIM$(str)` - Remove leading spaces
- `RTRIM$(str)` - Remove trailing spaces
- `UCASE$(str)` - Convert to uppercase
- `LCASE$(str)` - Convert to lowercase
- `CHR$(n)` - Character from ASCII code
- `ASC(str)` - ASCII code of first character (error if empty)
- `INSTR(str, search)` - Find substring position (1-based)
- `LEN(str)` - String length
- `STR$(x)` - Convert number to string (with leading space for positive)
- `OCT$(n)` - Convert to octal string
- `HEX$(n)` - Convert to hexadecimal string (uppercase)

#### Type Conversion
- `CINT(x)` - Convert to integer (rounds)
- `CSNG(x)` - Convert to single precision (7 digits)
- `CDBL(x)` - Convert to double precision
- `VAL(str)` - Convert string to number (0 if invalid)

### Input/Output
- PRINT statement with expressions and separators (`,` and `;`)
- INPUT statement for user input with auto-type detection
- CLS for clearing screen

### Variable Management
- Automatic variable declaration
- Explicit variable declaration with DIM
- Type checking and validation
- Support for numeric and string variables
- Array bounds checking

## Usage

### Basic Example
```basic
PRINT "Hello, World!"
LET x = 42
PRINT "Value: "; x
```

### Variables and Arrays
```basic
DIM count AS INTEGER
DIM values(10) AS SINGLE
DIM name AS STRING

LET count = 42
LET values(0) = SQR(16)
LET name = "Hello" + " " + "World"
```

### String Manipulation
```basic
LET text = "  Hello World  "
PRINT LTRIM$(text)         ' Remove leading spaces
PRINT UCASE$(text)         ' Convert to uppercase
PRINT MID$(text, 3, 5)     ' Extract substring
PRINT LEN(RTRIM$(text))    ' Length after trimming
```

### Control Flow
```basic
IF x > 10 THEN
    PRINT "Greater than 10"
ELSE
    PRINT "Less than or equal to 10"
END IF

FOR i = 1 TO 10 STEP 2
    PRINT i
NEXT i

start:
    INPUT x
    IF x < 0 THEN GOTO done
    PRINT SQR(x)
    GOTO start
done:
```

## Running the Interpreter

The interpreter runs with Deno:

```bash
deno run --allow-read main.ts yourprogram.bas
```

## Development

To run tests:

```bash
deno test
```

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.