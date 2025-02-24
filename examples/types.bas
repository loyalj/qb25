' filepath: /Users/chrisjohnson/Documents/code/qb25/examples/types.bas
' Example program demonstrating QB25's type system and features

CLS
PRINT "Type System Demo"
PRINT "==============="

' Variable declarations
DIM count AS INTEGER
DIM price AS SINGLE
DIM amount AS DOUBLE
DIM name AS STRING

' Initialize with compatible types
LET count = CINT(5)      ' Use CINT for INTEGER assignment
LET price = 3.14
LET amount = 123.456789
LET name = "John"

' Display variables
PRINT "count (INTEGER) = " + count
PRINT "price (SINGLE) = " + price
PRINT "amount (DOUBLE) = " + amount
PRINT "name (STRING) = " + name

' Type conversions
PRINT
PRINT "Type conversions:"
PRINT "CINT(3.7) = " + CINT(3.7)
PRINT "CSNG(1/3) = " + CSNG(1/3)
PRINT "CDBL(1/3) = " + CDBL(1/3)

' Math functions
PRINT
PRINT "Math functions:"
PRINT "SQR(16) = " + SQR(16)
PRINT "ABS(-5) = " + ABS(-5)
PRINT "SIN(0) = " + SIN(0)

' String operations
PRINT
PRINT "String operations:"
PRINT "ASCII of 'A' = " + ASC("A")
PRINT "Hello, " + name

' Conditional logic with type checking
IF count > 0 AND name = "John" THEN
    PRINT
    PRINT "Conditions met!"
    PRINT "count is positive and name is John"
END IF

' Input with type inference
PRINT
PRINT "Type some numbers:"
INPUT value
PRINT "You entered: " + value
PRINT "Value type defaulted to SINGLE"

' Random number generation
PRINT
PRINT "Random numbers:"
PRINT "RND(1-10): " + RND(10)
PRINT "RND(0-1): " + RND()

' Safe INTEGER conversion
DIM score AS INTEGER
LET score = CINT(price)  ' Explicitly convert to INTEGER
PRINT "Score (converted from float): " + score