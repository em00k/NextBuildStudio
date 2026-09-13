REM Full UINTEGER sweep: 65535 + 1 wraps to 0
DIM n as uinteger

FOR n = 0 TO 65535
  POKE 16384, 1
NEXT n
