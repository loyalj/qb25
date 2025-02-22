' Logic Operations Test Suite
PRINT "Testing Logical Operations"
PRINT "========================="

LET x = 5
LET y = 10
LET z = 0

' Basic IF THEN ELSE
PRINT "Testing IF THEN ELSE:"
IF x < y THEN PRINT "PASS: x is less than y" ELSE PRINT "FAIL: x should be less than y"

' Testing AND operator
PRINT "Testing AND operator:"
IF x > 0 AND y > 0 THEN PRINT "PASS: both x and y are positive"

' Testing OR operator
PRINT "Testing OR operator:"
IF z > 0 OR x > 0 THEN PRINT "PASS: at least one value is positive"

' Testing NOT operator
PRINT "Testing NOT operator:"
IF NOT z THEN PRINT "PASS: z is zero (false)"
IF NOT (x > y) THEN PRINT "PASS: x is not greater than y"

' Complex conditions
PRINT "Testing complex conditions:"
IF (x < y AND NOT z) OR y = 10 THEN PRINT "PASS: complex condition works"

' Comparison operators
PRINT "Testing all comparison operators:"
IF x = 5 THEN PRINT "PASS: equality works"
IF x <> y THEN PRINT "PASS: inequality works"
IF x < y THEN PRINT "PASS: less than works"
IF y > x THEN PRINT "PASS: greater than works"
IF x <= 5 THEN PRINT "PASS: less than or equal works"
IF y >= 10 THEN PRINT "PASS: greater than or equal works"