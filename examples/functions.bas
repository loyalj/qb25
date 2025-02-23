CLS
PRINT "QB25 Built-in Functions Test Suite"
PRINT "================================"

PRINT "ABS Function Tests:"
PRINT "-----------------"
PRINT "ABS(-5) = " + ABS(-5)
PRINT "ABS(3.14) = " + ABS(3.14)
PRINT "ABS(0) = " + ABS(0)

PRINT ""
PRINT "SGN Function Tests:"
PRINT "-----------------"
PRINT "SGN(-5) = " + SGN(-5)
PRINT "SGN(3.14) = " + SGN(3.14)
PRINT "SGN(0) = " + SGN(0)

PRINT ""
PRINT "INT Function Tests:"
PRINT "-----------------"
PRINT "INT(3.14) = " + INT(3.14)
PRINT "INT(-3.14) = " + INT(-3.14)
PRINT "INT(5) = " + INT(5)

PRINT ""
PRINT "RND Function Tests:"
PRINT "-----------------"
PRINT "RND() = " + RND()
PRINT "RND(10) = " + RND(10)
PRINT "RND(100) = " + RND(100)

PRINT ""
PRINT "SQR Function Tests:"
PRINT "-----------------"
PRINT "SQR(16) = " + SQR(16)
PRINT "SQR(2) = " + SQR(2)
PRINT "SQR(0) = " + SQR(0)

PRINT ""
PRINT "Trigonometric Functions:"
PRINT "----------------------"
PRINT "SIN(0) = " + SIN(0)
PRINT "SIN(3.14159/2) = " + SIN(3.14159/2)
PRINT "COS(0) = " + COS(0)
PRINT "COS(3.14159) = " + COS(3.14159)
PRINT "TAN(0) = " + TAN(0)
PRINT "TAN(3.14159/4) = " + TAN(3.14159/4)

PRINT ""
PRINT "ASC Function Tests:"
PRINT "-----------------"
PRINT "ASC('A') = " + ASC("A")
PRINT "ASC('a') = " + ASC("a")
PRINT "ASC('1') = " + ASC("1")
PRINT "ASC('!') = " + ASC("!")

PRINT ""
PRINT "ATN Function Tests:"
PRINT "-----------------"
PRINT "ATN(0) = " + ATN(0)
PRINT "ATN(1) = " + ATN(1)      ' Should be approximately 0.785398 (π/4)
PRINT "ATN(-1) = " + ATN(-1)    ' Should be approximately -0.785398