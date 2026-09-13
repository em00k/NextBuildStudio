
' 01_hello_text - print and attributes
' build: NextBuild → target NEX
#include <nextlib.bas>   ' if you have a thin wrapper; otherwise remove

CLS
INK 7: PAPER 1: BRIGHT 1
PRINT AT 10, 6; "Hello, ZX Spectrum Next!"
PRINT AT 12, 4; "Press any key..."

DO : LOOP UNTIL INKEY$ <> ""
