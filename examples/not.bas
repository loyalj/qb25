' Test NOT operator
LET x = 5
LET y = 2

' Basic NOT with comparison
IF NOT x > 10 THEN PRINT "x is NOT greater than 10"

' NOT with AND
IF NOT (x < 3 AND y > 5) THEN PRINT "At least one condition is false"

' Complex NOT expression
IF NOT x < 3 AND NOT y > 5 THEN PRINT "Both conditions are false"
