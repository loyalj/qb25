' Type conversion function demonstrations
PRINT "Type Conversion Tests"
PRINT "===================="

' CINT tests (rounds to nearest integer)
PRINT "CINT Examples:"
PRINT "--------------"
PRINT "CINT(3.7) = " + CINT(3.7)      ' Should be 4
PRINT "CINT(3.2) = " + CINT(3.2)      ' Should be 3
PRINT "CINT(-3.7) = " + CINT(-3.7)    ' Should be -4
PRINT "CINT(-3.2) = " + CINT(-3.2)    ' Should be -3

' CSNG tests (single precision)
PRINT
PRINT "CSNG Examples:"
PRINT "--------------"
PRINT "CSNG(1/3) = " + CSNG(1/3)              ' Should show ~7 digits
PRINT "CSNG(123456.789) = " + CSNG(123456.789) ' Should limit precision

' CDBL tests (double precision)
PRINT
PRINT "CDBL Examples:"
PRINT "--------------"
PRINT "CDBL(1/3) = " + CDBL(1/3)              ' Should show more digits
PRINT "CDBL(123456.789) = " + CDBL(123456.789) ' Should maintain precision

' Conversion in expressions
PRINT
PRINT "Mixed Conversions:"
PRINT "-----------------"
LET x = 3.14159265359
PRINT "Original: " + x
PRINT "As Integer: " + CINT(x)
PRINT "As Single: " + CSNG(x)
PRINT "As Double: " + CDBL(x)
