'!org=32768
'!opt=4
'!codebank=40 			' Bank 40 is the start of our CODEBANKS
' CODEBANK tests : Tests passing strings to a bank, banked
' variable and array assignments. Please note about using 
' DIM string as string AT @bank_label not working how you 
' might expect and the proper method in CODEBANK 3 

#include <nextlib.bas>

'----------------------------------------------------------
' CODEBANKS
'

CODEBANK 1
    sub Bank1(s$ as string)
        Print ink 6;s$
    end sub 
END CODEBANK 

CODEBANK 2 
    sub ShowTest(s$ as string)
        Bank1(s$)
    end sub 
END CODEBANK 

CODEBANK 3
    ' dim test$ as string at @my_bank_chars would not 
    ' return the string, as the string is a descriptor on 
    ' the heap. The way to get them off resident memory and 
    ' live in a bank would be : 

    dim buf(16) as uByte AT @my_bank_chars

    sub ShowAddress()
        dim s$ as String = ""
        dim i as ubyte
        for i = 0 to 12
            s$ = s$ + chr$(buf(i))
        next
        print ink 5;s$
    end sub

    my_bank_chars:
        asm
            db "BANKED STRING"
        end asm
END CODEBANK


CODEBANK 4
    ' "this" and "mybuffer() are define on the CODEBANKs memory

    dim this as ubyte = $55
    dim mybuffer(256) as ubyte AT @my_bank_buffer2

    sub ShowAddressTest()
        mybuffer(0) = $ff               ' set a known value 
        print ink 3; "Expected 255 : ";peek (uinteger, @my_bank_buffer2) ' should return 255
        print ink 3; "Expected 85  : ";this    ' should print 85
        this = $ff                      ' change value 
        print ink 3; "Expected 255 : ";this    ' should print 255
    end sub

    my_bank_buffer2:
        asm 
            defs 256,0
        end asm 
END CODEBANK

'----------------------------------------------------------
' Resident 
'

ShowTest("Testing multiple CODEBANKS jumps")

ShowTest("PASSED STRING")
ShowAddress()
ShowAddressTest()

do : loop 

