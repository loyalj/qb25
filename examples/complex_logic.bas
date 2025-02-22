' Test various logical combinations
LET X = 5
LET Y = 2
LET Z = 10

' Test AND
IF X > 2 AND Y < 5 THEN PRINT "AND works!" ELSE PRINT "AND failed"

' Test OR
IF X > 10 OR Y < 5 THEN PRINT "OR works!" ELSE PRINT "OR failed"

' Test complex condition
IF (X > 2 AND Y < 5) OR Z = 10 THEN PRINT "Complex logic works!" ELSE PRINT "Complex logic failed"
