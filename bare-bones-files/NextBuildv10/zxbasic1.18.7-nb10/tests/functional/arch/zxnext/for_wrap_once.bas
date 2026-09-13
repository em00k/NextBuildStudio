REM STEP is larger than the limit, so limit - step is not representable
REM as a UBYTE and the loop can never run more than one iteration
DIM n as ubyte

FOR n = 0 TO 100 STEP 200
  POKE 16384, n
NEXT n
