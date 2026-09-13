'!org=32768

#include <nextlib.bas>

' 02_keyboard_input - move a @ around
DIM x AS UBYTE: DIM y AS UBYTE
x=15: y=10
CLS

SUB update()
    if x=255 then x = 0 
    if y=255 then y = 0 
    if y>23 then y = 23
    if x>31 then x = 31 
    
    PRINT at y,x;"@";
END SUB

SUB remove()
    PRINT at y,x;" ";
END SUB

DO
  remove()
  ' Arrow keys (QAOP fallback)
  IF INKEY$="q" OR CODE INKEY$=11 THEN y6 = (y - 1)     ' up
  IF INKEY$="a" OR CODE INKEY$=10 THEN y = (y + 1)     ' down
  IF INKEY$="o" OR CODE INKEY$=8  THEN x = (x - 1)     ' left
  IF INKEY$="p" OR CODE INKEY$=9  THEN x = (x + 1)     ' right
  update()

  ' simple throttle
  WaitRaster(192)

LOOP UNTIL INKEY$=" "
