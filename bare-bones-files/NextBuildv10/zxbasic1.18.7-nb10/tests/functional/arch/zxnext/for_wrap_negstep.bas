REM Descending sweep: 0 - 1 wraps to 255
DIM n as ubyte

FOR n = 255 TO 0 STEP -1
  POKE 16384, n
NEXT n
