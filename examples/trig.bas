CLS
PRINT "QB25 Trigonometry Examples"
PRINT "========================"

' Define PI for calculations
LET PI = 3.14159

PRINT "Basic Trig Functions:"
PRINT "------------------"
PRINT "SIN(PI/2) = " + SIN(PI/2)    ' Should be 1
PRINT "COS(PI) = " + COS(PI)        ' Should be -1
PRINT "TAN(PI/4) = " + TAN(PI/4)    ' Should be 1

PRINT ""
PRINT "Arctangent Examples:"
PRINT "------------------"
PRINT "ATN(0) = " + ATN(0)          ' Should be 0
PRINT "ATN(1) = " + ATN(1)          ' Should be π/4 (≈0.785398)
PRINT "ATN(-1) = " + ATN(-1)        ' Should be -π/4
PRINT "ATN(1.732) = " + ATN(1.732)  ' Should be π/3 (≈1.0472)

PRINT ""
PRINT "Angle Conversions:"
PRINT "-----------------"
' Convert radians to degrees: multiply by 180/π
LET angle = ATN(1)  ' π/4 radians
PRINT "π/4 radians in degrees = " + (angle * 180/PI)  ' Should be 45°
