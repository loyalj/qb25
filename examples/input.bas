CLS
PRINT "QB25 Input Operations Test Suite"
PRINT "==============================="

' String input
PRINT "Enter your name:"
INPUT name
PRINT "Hello, " + name + "!"

' Numeric input with validation demo
PRINT "Enter a number between 1 and 10:"
INPUT num
IF num >= 1 AND num <= 10 THEN
    PRINT "Valid input: " + num
ELSE
    PRINT "Invalid input!"
END IF

' Multiple inputs and calculations
PRINT "Enter two numbers for calculation:"
PRINT "First number:"
INPUT a
PRINT "Second number:"
INPUT b
PRINT "Results:"
PRINT "Sum: " + (a + b)
PRINT "Product: " + (a * b)

