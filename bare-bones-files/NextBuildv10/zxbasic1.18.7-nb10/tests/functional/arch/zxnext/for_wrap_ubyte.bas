REM Full UBYTE sweep: 255 + 1 wraps to 0, so "n > 255" can never fire
DIM n as ubyte

FOR n = 0 TO 255
  POKE 16384, n
NEXT n
