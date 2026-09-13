' ---------------------------------------------------------------
' BankedCode - demonstrates ZX Next banked code (CODEBANK)
'
' Every SUB/FUNCTION inside a CODEBANK block is compiled into its
' own 8K binary that gets paged into $6000-$7FFF on demand. Calls
' are written exactly as normal - the compiler emits a resident
' trampoline that pages the bank in and out for you.
' ---------------------------------------------------------------
'!org=32768
'!opt=4
'!codebank=40           ' CODEBANK 1 -> 8K page 40, CODEBANK 2 -> 41

#include <nextlib.bas>

' we can place data directly into a CODEBANK, this data will appear at the 
' start of the bank - This code is ignored by the residen tprogram 
asm 
    CODEBANK 1
    db "This is also in codebank 1"
    CODEBANK 2
    db "this is in codebank 2"
    CODEBANK 0 
end asm 

' ---- bank 1 --------------------------------------------------
CODEBANK 1

    dim x as ubyte =0           ' This is a normal global DIM and will be reserved on the HEAP

    my_test:                    ' This label is only available in CODEBANK 1, stored after the first text line
                                ' The block will not be executed
    asm
        db "h","i"
    end asm 

    sub print_label_address()
        
        if x = 0 
            asm 
                ld hl,0000      ; normal inline ASM block runs when sub is called 
            end asm 
        endif 

        print peek (uinteger,@my_test)     ' When this is printed, my_test is in the CODEWINDOW

    end sub 

    SUB Hello()
        PRINT AT 2,2;"HELLO FROM BANK 1"
    END SUB

    FUNCTION Helper(n as uByte) as uInteger
        RETURN n * 100
    END FUNCTION

    FUNCTION AddU(a as uInteger, b as uInteger) as uInteger
        ' Helper() is in this same bank, so this call takes the
        ' far-call fast path - no paging, no shadow stack frame.
        RETURN a + b + Helper(1)
    END FUNCTION

END CODEBANK

' ---- bank 2 --------------------------------------------------
CODEBANK 2

    SUB Bye(msg as uByte)
    
        Hello()                     ' bank 2 -> bank 1 -> back to bank 2
        PRINT AT 8,2;"BYE ";msg
    END SUB

END CODEBANK

' --- bank 3 ---------------------------------------------------

CODEBANK 3

    dim test$(10) as string at @blob

    sub do_stuff()

        print @test$(0)

    end sub 


end CODEBANK

blob:
asm 
    CODEBANK 3          ; This will be place at the start of CODEBANK 3
    blob:
    ds 10,$FF
    CODEBANK 0 
end asm 


' ---- resident ------------------------------------------------
SUB Resident()
    PRINT AT 0,2;"RESIDENT"
END SUB

Resident()
BBREAK 
do_stuff()
Hello()

PRINT AT 4,2;"SUM=";AddU(40,2)      ' expect 142
PRINT AT 6,2;"HLP=";Helper(2)       ' expect 200
BBREAK                            
Bye(7)

print_label_address()

DO
LOOP
