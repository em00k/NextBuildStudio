REM Partial overflow: 250 + 10 wraps to 4, so the limit is never passed
DIM n as ubyte

FOR n = 0 TO 250 STEP 10
  POKE 16384, n
NEXT n
