CLS
PRINT "QB25 Arithmetic Operations Test Suite"
PRINT "=================================="

' Basic operations with integers
LET a = 10
LET b = 3

PRINT "Basic Operations:"
PRINT "-----------------"
PRINT "a = " + a + ", b = " + b
PRINT "Addition (a + b): " + (a + b)
PRINT "Subtraction (a - b): " + (a - b)
PRINT "Multiplication (a * b): " + (a * b)
PRINT "Division (a / b): " + (a / b)

PRINT "Order of Operations:"
PRINT "------------------"
PRINT "2 + 3 * 4 = " + (2 + 3 * 4)
PRINT "(2 + 3) * 4 = " + ((2 + 3) * 4)
PRINT "10 / 2 + 3 = " + (10 / 2 + 3)
PRINT "10 / (2 + 3) = " + (10 / (2 + 3))

PRINT "Complex Expressions:"
PRINT "------------------"
LET x = ((a + b) * (a - b)) / (2 + 3)
PRINT "((a + b) * (a - b)) / (2 + 3) = " + x
