REM Full BYTE sweep: 127 + 1 wraps to -128
DIM n as byte

FOR n = -128 TO 127
  POKE 16384, 1
NEXT n
