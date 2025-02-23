CLS
PRINT "Multi-line IF THEN ELSE Demo"
PRINT "==========================="

LET score = 75
LET passing = 60
LET distinction = 85

' Multi-line IF with multiple statements
IF score >= passing THEN
    PRINT "You passed!"
    PRINT "Your score: " + score
    
    ' Nested IF for distinction
    IF score >= distinction THEN
        PRINT "With distinction!"
        PRINT "Excellent work!"
    ELSE
        PRINT "Keep working hard!"
    END IF
ELSE
    PRINT "Study more..."
    PRINT "You need " + (passing - score) + " more points"
END IF

' Another example with multiple conditions
LET age = 25
LET income = 50000

IF age > 18 AND income >= 45000 THEN
    PRINT "You qualify for the loan"
    PRINT "Processing application..."
ELSE
    PRINT "Sorry, you don't qualify"
    PRINT "Requirements:"
    PRINT "- Age > 18"
    PRINT "- Income >= 45000"
END IF
