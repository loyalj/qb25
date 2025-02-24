' While Loop Demonstrations
' Currently, the BASIC dialect does not support the WHILE loop.'
CLS

' Basic counter example
PRINT "Counting down from 5:"
LET count = 5
WHILE count > 0
    PRINT count
    LET count = count - 1
WEND
PRINT "Blast off!"
PRINT ""

' Guess the number game
LET secret = 42
PRINT "Guess the number between 1 and 100"
LET tries = 0
LET guess = 0

WHILE guess <> secret
    INPUT guess
    LET tries = tries + 1
    
    IF guess < secret THEN
        PRINT "Too low, try again!"
    ELSE IF guess > secret THEN
        PRINT "Too high, try again!"
    END IF
WEND

PRINT "Congratulations! You found it in " + tries + " tries!"
