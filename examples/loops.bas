' Basic FOR loop example
CLS
PRINT "FOR Loop Examples"
PRINT "================"

' Simple counting loop
PRINT "Counting from 1 to 5:"
FOR i = 1 TO 5
    PRINT i
NEXT i

' Loop with STEP
PRINT "Counting down by 2s:"
FOR count = 10 TO 2 STEP -2
    PRINT count
NEXT count

' Nested loops to make a multiplication table
PRINT "Multiplication Table (2x2):"
FOR row = 1 TO 2
    FOR col = 1 TO 2
        PRINT row * col
        PRINT " "
    NEXT col
    PRINT ""  ' New line after each row
NEXT row

' Loop using variables
LET start = 1
LET zend = 4
PRINT "Dynamic loop from "; start; " to "; zend; ":"
FOR x = start TO zend
    PRINT "Value: " + x
NEXT x