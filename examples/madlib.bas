CLS
PRINT "Welcome to QB25 Mad Libs!"
PRINT "======================="
PRINT "Let's create a wacky story together!"
PRINT

' Get inputs for our story
PRINT "Enter a name:"
INPUT hero
PRINT "Enter a number:"
INPUT num
PRINT "Enter an adjective:"
INPUT adj1
PRINT "Enter another adjective:"
INPUT adj2
PRINT "Enter a verb:"
INPUT verb
PRINT "Enter an animal:"
INPUT animal
PRINT "Enter a color:"
INPUT color
PRINT "Enter a food:"
INPUT food

' Clear screen for the story
CLS
PRINT "Your Wacky Story:"
PRINT "================="
PRINT
PRINT "Once upon a time, there was a " + adj1 + " person named " + hero + "."
PRINT "They had exactly " + num + " pet " + animal + "s, all colored " + color + "!"
PRINT
PRINT "Every day, they would " + verb + " with their pets while eating " + adj2
PRINT food + ". It was quite a sight to see!"
PRINT
PRINT "One day, the " + animal + "s decided to start a band."
PRINT "They became known as '" + hero + " and the " + color + " " + animal + "s'!"
PRINT
IF num > 5 THEN
    PRINT "With " + num + " members, they were the biggest " + animal + " band ever!"
ELSE
    PRINT "They were a small band, but they made " + adj1 + " music!"
END IF

PRINT
PRINT "The End!"
PRINT
PRINT "(Press any key to exit)"
INPUT dummy
