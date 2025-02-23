CLS
PRINT "QB25 Logical Operations Test Suite"
PRINT "================================"

' Test values
LET x = 5
LET y = 10
LET z = 0

PRINT "Comparison Operators:"
PRINT "-------------------"
PRINT "Equal (=): " + (x = 5)
PRINT "Not Equal (<>): " + (x <> y)
PRINT "Less Than (<): " + (x < y)
PRINT "Greater Than (>): " + (y > x)
PRINT "Less Equal (<=): " + (x <= 5)
PRINT "Greater Equal (>=): " + (y >= 10)

PRINT "Logical Operators:"
PRINT "----------------"
PRINT "AND: " + (x > 0 AND y > 0)
PRINT "OR: " + (z > 0 OR x > 0)
PRINT "NOT: " + (NOT (x > y))

PRINT "Complex Conditions:"
PRINT "-----------------"
PRINT "(x < y AND NOT z) OR y = 10: " + ((x < y AND NOT z) OR y = 10)