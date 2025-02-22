' Arithmetic Operations Test Suite
PRINT "Testing Basic Arithmetic Operations"
PRINT "=================================="

LET a = 10
LET b = 3

PRINT "Addition: 10 + 3 should be 13"
PRINT "Result: " + (a + b)

PRINT "Subtraction: 10 - 3 should be 7"
PRINT "Result: " + (a - b)

PRINT "Multiplication: 10 * 3 should be 30"
PRINT "Result: " + (a * b)

PRINT "Division: 10 / 3 should be ~3.333..."
PRINT "Result: " + (a / b)

PRINT "Complex Expression: (10 + 3) * (10 - 3) should be 13 * 7 = 91"
PRINT "Result: " + ((a + b) * (a - b))

' Test operator precedence
PRINT "Testing Operator Precedence"
PRINT "=========================="
PRINT "2 + 3 * 4 should be 14 (not 20)"
PRINT "Result: " + (2 + 3 * 4)
