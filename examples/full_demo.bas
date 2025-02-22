' QB25 Full Feature Demo
' This program demonstrates all features of QB25

CLS
PRINT "Welcome to QB25 Feature Demo"
PRINT "==========================="

' Input and string handling
PRINT "What's your name?"
INPUT name
PRINT "Hello, " + name + "! Let's test some features."

' Arithmetic
PRINT "Basic arithmetic:"
LET a = 10
LET b = 3
PRINT "10 + 3 = " + (a + b)
PRINT "10 - 3 = " + (a - b)
PRINT "10 * 3 = " + (a * b)
PRINT "10 / 3 = " + (a / b)

' Logic and conditionals
PRINT "Logic tests:"
LET x = 5
IF x = 5 THEN PRINT "PASS: x equals 5"
IF NOT (x > 10) THEN PRINT "PASS: x is not greater than 10"
IF x > 0 AND x < 10 THEN PRINT "PASS: x is between 0 and 10"

' Complex expressions
PRINT "Complex expression test:"
LET result = (a + b) * (a - b)
PRINT "(10 + 3) * (10 - 3) = " + result

' Interactive calculation
PRINT "Let's do some math!"
PRINT "Enter a number:"
INPUT num
PRINT "Your number squared is: " + (num * num)

PRINT "Demo complete! All features tested successfully!"
