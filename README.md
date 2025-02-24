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
- IF/THEN/ELSE statements
- FOR/NEXT loops with STEP support
- WHILE/WEND loops
- GOTO and labels

### Arrays
- One-dimensional arrays with DIM statement
- Type-safe array declarations
- Bounds checking
- Array access and assignment

### Built-in Functions

#### Mathematical Functions
- `ABS(x)` - Absolute value
- `SGN(x)` - Sign of number (-1, 0, 1)
- `INT(x)` - Integer portion
- `RND(x)` - Random number
- `SQR(x)` - Square root
- `SIN(x)`, `COS(x)`, `TAN(x)` - Trigonometric functions
- `LOG(x)`, `EXP(x)` - Natural logarithm and exponential
- `ATN(x)`, `ATN2(y,x)` - Arctangent functions

#### String Functions
- `LEFT$(str, n)` - Left n characters
- `RIGHT$(str, n)` - Right n characters
- `MID$(str, start, length)` - Substring
- `LEN(str)` - String length
- `CHR$(n)` - Character from ASCII code
- `ASC(str)` - ASCII code of first character
- `INSTR$(str, search)` - Find substring position

#### Type Conversion
- `CINT(x)` - Convert to integer
- `CSNG(x)` - Convert to single precision
- `CDBL(x)` - Convert to double precision

### Input/Output
- PRINT statement with expression support
- INPUT statement for user input
- CLS for clearing screen

## Usage

### Basic Example
```basic
PRINT "Hello, World!"
LET x = 42
PRINT "Value of x: " + x
```

### Variables and Types
```basic
DIM count AS INTEGER
DIM name AS STRING
DIM price AS DOUBLE

LET count = 42
LET name = "John"
LET price = 3.14159
```

### Arrays
```basic
DIM numbers(10) AS INTEGER
LET numbers(0) = 42
LET numbers(1) = 100
PRINT numbers(0) + numbers(1)
```

### Control Flow
```basic
' IF/THEN/ELSE
IF x > 10 THEN
    PRINT "Greater than 10"
ELSE
    PRINT "Less than or equal to 10"
END IF

' FOR loop
FOR i = 1 TO 10 STEP 2
    PRINT i
NEXT i

' WHILE loop
WHILE x < 100
    LET x = x + 1
    PRINT x
WEND
```

### Functions
```basic
' Math functions
PRINT SQR(16)      ' Output: 4
PRINT ABS(-42)     ' Output: 42

' String functions
LET name = "Hello, World!"
PRINT LEN(name)    ' Output: 13
PRINT LEFT$(name, 5) ' Output: Hello
```

## Running the Interpreter

The interpreter can be run using Deno:

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