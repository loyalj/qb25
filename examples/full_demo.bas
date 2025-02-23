CLS
PRINT "QB25 Complete Feature Demo"
PRINT "========================="
PRINT

' 1. Input and String Operations
PRINT "PART 1: Input and Strings"
PRINT "------------------------"
PRINT "What's your name?"
INPUT name
PRINT "Hello, " + name + "!"
PRINT

' 2. Basic Arithmetic
PRINT "PART 2: Arithmetic Operations"
PRINT "---------------------------"
LET a = 10
LET b = 3
PRINT "a = " + a
PRINT "b = " + b
PRINT "Sum: " + (a + b)
PRINT "Difference: " + (a - b)
PRINT "Product: " + (a * b)
PRINT "Division: " + (a / b)
PRINT

' 3. Built-in Functions
PRINT "PART 3: Built-in Functions"
PRINT "-------------------------"
LET neg = -42
PRINT "ABS(-42) = " + ABS(neg)
PRINT "SGN(-42) = " + SGN(neg)
PRINT "SGN(0) = " + SGN(0)
PRINT "SGN(42) = " + SGN(42)
PRINT

' 4. Logic and Control Flow
PRINT "PART 4: Logic Operations"
PRINT "-----------------------"
LET x = 5
LET y = 10
PRINT

IF x < y THEN
    PRINT "x is less than y"
    IF x > 0 THEN
        PRINT "x is positive"
    END IF
ELSE
    PRINT "x is not less than y"
END IF
PRINT

IF x > 0 AND y > 0 THEN
    PRINT "Both x and y are positive"
END IF
PRINT

' 5. Interactive Calculator
PRINT "PART 5: Interactive Calculator"
PRINT "-----------------------------"
PRINT "Enter a number:"
INPUT num
PRINT
PRINT "Original: " + num
PRINT "ABS: " + ABS(num)
PRINT "SGN: " + SGN(num)
PRINT
PRINT "Demo complete!"
