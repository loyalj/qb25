' String Operations Test Suite
PRINT "Testing String Functions"
PRINT "======================="

' Basic test string
LET test = "  Hello Beautiful World!  "
PRINT "Original string: [" + test + "]"
PRINT

' Length function
PRINT "String length (LEN):"
PRINT "Length of string: "; LEN(test)
PRINT

' Case conversion
PRINT "Case conversion (UCASE$/LCASE$):"
PRINT "Uppercase: "; UCASE$(test)
PRINT "Lowercase: "; LCASE$(test)
PRINT

' Trimming
PRINT "Trimming (LTRIM$/RTRIM$):"
PRINT "Left trim:  [" + LTRIM$(test) + "]"
PRINT "Right trim: [" + RTRIM$(test) + "]"
PRINT "Both trim: [" + LTRIM$(RTRIM$(test)) + "]"
PRINT

' Substring extraction
PRINT "Substring extraction (LEFT$/RIGHT$/MID$):"
LET trimmed = LTRIM$(test)
PRINT "First 5 chars: "; LEFT$(trimmed, 5)
PRINT "Last 6 chars: "; RIGHT$(test, 6)
PRINT "Middle chars: "; MID$(test, 8, 9)
PRINT

' String search
PRINT "String search (INSTR):"
LET searchFor = "Beautiful"
PRINT "Position of "; searchFor; ": "; INSTR(test, searchFor)
PRINT

PRINT "String manipulation example:"
LET original = "Hello Beautiful World!"
LET find = "Beautiful"
LET replace = "Amazing"
LET posx = INSTR(original, find)
IF posx > 0 THEN
    LET start = LEFT$(original, posx - 1)
    LET rest = MID$(original, posx + LEN(find), LEN(original))
    LET result = start + replace + rest
    PRINT "Changed: "; result
END IF
