' ---------------------------------------------------------------
' bank_strings - strings in and out of a CODEBANK
'
' Strings work in banked code with no special handling, but it is
' worth knowing what actually lives where:
'
'   DIM title$      inside a bank, this is a 2-byte descriptor in
'                   the bank's page. The *characters* are on the
'                   heap, which is resident and shared.
'
'   "LITERAL"       string literals are always emitted resident,
'                   whatever bank uses them. A bank full of message
'                   literals therefore saves you nothing - see
'                   bank 3 for the pattern that does.
'
'   RETURN s$       returning a String out of a bank is fine. The
'                   value is a heap pointer, and __FAR_RETURN
'                   preserves every register on the way back.
'
' So a bank-local String buys you privacy and 2 bytes, not storage.
' If you want the text itself out of the resident 32K, pack it into
' a bank-local uByte array and build the String on demand - that is
' what bank 3 does, and its characters never touch resident memory
' until the moment you ask for one.
'
' Two Boriel details this example depends on:
'   - strings are indexed from 0, not 1, so s$(0 TO 0) is the first
'     character and s$(0 TO LEN(s$) - 1) is the whole string
'   - AND / OR are logical; BAND / BOR are the bitwise ones
' ---------------------------------------------------------------
'!org=$6000
'!opt=4
'!heap=1024             ' string work needs somewhere to allocate

'!codebank=40           ' CODEBANK 1 -> page 40, 2 -> 41, 3 -> 42
'!codewindow=$e000      ' SLOT 7 will now be used for banked code

#include <nextlib.bas>

asm
    ei              ; enable for INKEY$
end asm

' ---- resident -------------------------------------------------
DIM line$ as String
DIM n as uByte
DIM i as uByte

' ---- bank 1: a string owned by one bank -----------------------
' `title$` is bank-local: nothing outside bank 1 can name it. The
' routines here treat it as an ordinary global, because from inside
' the bank that is exactly what it is.
CODEBANK 1

    DIM title$ as String

    SUB SetTitle(t$ as String)
        title$ = t$
    END SUB

    FUNCTION Title() as String
        RETURN title$
    END FUNCTION

    ' Concatenation inside a bank. Every + allocates on the resident
    ' heap; only the descriptor being written is in the bank.
    FUNCTION Banner(w as uByte) as String
        DIM s$ as String
        DIM j as uByte
        s$ = ""
        FOR j = 1 TO w
            s$ = s$ + "-"
        NEXT j
        RETURN s$ + " " + title$ + " " + s$
    END FUNCTION

END CODEBANK

' ---- bank 2: splitting and joining ----------------------------
' A bank-local *string array*. Its data area holds eight heap
' pointers, all inside the bank, so only bank 2 can reach them.
CODEBANK 2

    DIM parts$(7) as String
    DIM count as uByte

    ' Split on commas. Note the 0-based slicing: src$(a TO b) is
    ' inclusive of both ends, and the last character is LEN - 1.
    SUB Split(src$ as String, sep$ as String)
        DIM j as uByte
        DIM start as uByte
        count = 0
        start = 0
        IF LEN(src$) = 0 THEN RETURN
        FOR j = 0 TO LEN(src$) - 1
            IF src$(j TO j) = sep$ THEN
                IF j > start THEN
                    parts$(count) = src$(start TO j - 1)
                ELSE
                    parts$(count) = ""
                END IF
                count = count + 1
                start = j + 1
            END IF
        NEXT j
        parts$(count) = src$(start TO LEN(src$) - 1)
        count = count + 1
    END SUB

    FUNCTION Part(idx as uByte) as String
        RETURN parts$(idx)
    END FUNCTION

    FUNCTION Parts() as uByte
        RETURN count
    END FUNCTION

    ' Put them back together with a different separator, and ask
    ' bank 1 for the title on the way - a cross-bank call in the
    ' middle of string work.
    FUNCTION Join(sep$ as String) as String
        DIM j as uByte
        DIM s$ as String
        s$ = Title() + ": "
        FOR j = 0 TO count - 1
            IF j > 0 THEN s$ = s$ + sep$
            s$ = s$ + parts$(j)
        NEXT j
        RETURN s$
    END FUNCTION

END CODEBANK

' ---- bank 3: the text itself, in the bank ---------------------
' Length-prefixed records packed as bytes. Unlike a string literal,
' these characters really are in the bank's page and cost nothing
' resident. Message() builds a String from them on demand.
CODEBANK 3

    DIM text(27) as uByte => { _
         5, 83,84,65,82,84, _                    ' "START"
         6, 80,65,85,83,69,68, _                 ' "PAUSED"
         9, 71,65,77,69,32,79,86,69,82, _        ' "GAME OVER"
         4, 81,85,73,84 }                        ' "QUIT"

    FUNCTION Message(idx as uByte) as String
        DIM p as uByte
        DIM sz as uByte
        DIM j as uByte
        DIM s$ as String

        p = 0
        FOR j = 1 TO idx                ' skip idx records
            p = p + text(p) + 1
        NEXT j

        sz = text(p)
        s$ = ""
        FOR j = 1 TO sz
            s$ = s$ + CHR$(text(p + j))
        NEXT j
        RETURN s$
    END FUNCTION

END CODEBANK

CODEBANK 4 

    dim names$(10) as string        ' create a string array 10 deep

    sub shownames()
        names$(0) = "Don"           ' assign some names 
        names$(1) = "Tom"           ' these will all be placed on 
        names$(2) = "Bob"           ' the stack and NOT in the CODEBANK
        names$(3) = "Jon"           ' this is a design limitation 
        names$(4) = "Tim"
        names$(5) = "Sam"
        names$(6) = "Baz"
        names$(7) = "Hue"
        names$(8) = "Pat"
        names$(9) = "Ron"

        for x = 0 to 9
            print names$(x)         ' print the names 
        next x 
    end sub 

END CODEBANK        

CODEBANK 5 
    
    ' demonstrates asm block within a CODEBANK

    sub gettest()

        print chr$ (peek (@label))      ' prints first char of label : "t" 
        return

    label:                              ' this exists inside of the CODEBANK
    asm 
        label:
        db "test",0
    end asm 

    end sub 

    sub printlong()

        dim x as uinteger 
        dim c as ubyte        

        do 
            
            c = (peek(@long_text+x))    ' prints the contents of the LONG STRING 
            if c = 0 
                return 
            else 
                print chr$ c;
            endif 
            x = x + 1 
        loop
    

    long_text:
    asm 
        long_text:
        ; the following is stored in the CODEBANK, and is 4KB worth of text
        db "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts. Separated they live in Bookmarksgrove right at the coast of the Semantics, a large language ocean. A small river named Duden flows by their place and supplies it with the necessary regelialia. It is a paradisematic country, in which roasted parts of sentences fly into your mouth. Even the all-powerful Pointing has no control about the blind texts it is an almost unorthographic life One day however a small line of blind text by the name of Lorem Ipsum decided to leave for the far World of Grammar. The Big Oxmox advised her not to do so, because there were thousands of bad Commas, wild Question Marks and devious Semikoli, but the Little Blind Text didn’t listen. She packed her seven versalia, put her initial into the belt and made herself on the way. When she reached the first hills of the Italic Mountains, she had a last view back on the skyline of her hometown Bookmarksgrove, the headline of Alphabet Village and the subline of her own road, the Line Lane. Pityful a rethoric question ran over her cheek, then she continued her way. On her way she met a copy. The copy warned the Little Blind Text, that where it came from it would have been rewritten a thousand times and everything that was left from its origin would be the word and, and the Little Blind Text should turn around and return to its own, safe country. But nothing the copy said could convince her and so it didn’t take long until a few insidious Copy Writers ambushed her, made her drunk with Longe and Parole and dragged her into their agency, where they abused her for their projects again and again. And if she hasn’t been rewritten, then they are still using her. Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts. Separated they live in Bookmarksgrove right at the coast of the Semantics, a large language ocean. A small river named Duden flows by their place and supplies it with the necessary regelialia. It is a paradisematic country, in which roasted parts of sentences fly into your mouth. Even the all-powerful Pointing has no control about the blind texts it is an almost unorthographic life One day however a small line of blind text by the name of Lorem Ipsum decided to leave for the far World of Grammar. The Big Oxmox advised her not to do so, because there were thousands of bad Commas, wild Question Marks and devious Semikoli, but the Little Blind Text didn’t listen. She packed her seven versalia, put her initial into the belt and made herself on the way. When she reached the first hills of the Italic Mountains, she had a last view back on the skyline of her hometown Bookmarksgrove, the headline of Alphabet Village and the subline of her own road, the Line Lane. Pityful a rethoric question ran over her cheek, then she continued her way. On her way she met a copy. The copy warned the Little Blind Text, that where it came from it would have been rewritten a thousand times and everything that was left from its origin would be the word and the Little Blind Text should turn around and return to its own, safe country. But nothing the copy said could convince her and so it didnt take long until a few insidious Copy Writers ambushed her, made her drunk with Longe and Parole and dragged her into their agency, where they abused her for their projects again and again. And if she hasnt been rewritten, then they are still using her. Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts. Separated they live in Bookmarksgrove right at the coast of the Semantics, a large language ocean. A small river named Duden flows by their place and supplies it with the necessary regelialia. It is a paradisematic country, in which roasted parts of sentences fly into your mouth. Even the all-powerful Pointing has no control about the blind texts it is an almost unorthographic life One day however a small line of blind text by the name of Lore",0
    end asm 
    end sub 

END CODEBANK
' ---- resident: drive it all -----------------------------------


DO
BORDER 0 : PAPER 0 : INK 7 : CLS


gettest()
printlong()
WaitKey()
CLS
' A literal handed *into* a bank. The characters are resident; the
' bank copies the pointer into its own descriptor.
SetTitle("MENU")

PRINT AT 0,2;Banner(4)                  ' "---- MENU ----"

' Split in bank 2, read the pieces back one at a time.

Split("one,two,three,four", ",")
n = Parts()
PRINT AT 2,2;"SPLIT INTO ";n;" PARTS"
FOR i = 0 TO n - 1
    PRINT AT 3 + i,4;i;" ";Part(i);"        "
NEXT i

' Join uses bank 2's array and calls bank 1 for the title.
line$ = Join(" / ")
PRINT AT 8,2;line$;"        "

' Text that lives in bank 3 rather than in resident memory.
PRINT AT 10,2;"PACKED IN BANK 3"
FOR i = 0 TO 3
    PRINT AT 11 + i,4;Message(i);"        "
NEXT i

shownames()

WaitKey()

LOOP

PRINT AT 16,2;"PRESS A KEY"
DIM k as String

DO
    k = INKEY$
LOOP UNTIL k <> ""

' ---- expected output ------------------------------------------
'
'   ---- MENU ----
'   SPLIT INTO 4 PARTS
'     0 one
'     1 two
'     2 three
'     3 four
'   MENU: one / two / three / four
'   PACKED IN BANK 3
'     START
'     PAUSED
'     GAME OVER
'     QUIT
'
' ---- what you still cannot do ---------------------------------
'
' The usual rule applies to string variables exactly as it does to
' numbers - these are compile errors:
'
'   line$ = title$          ' resident code naming bank 1's string
'   PRINT parts$(0)         ' resident code naming bank 2's array
'
' Call a routine in the bank and let it hand you the String back,
' as Title() and Part() do above. What comes back is a heap pointer,
' and the heap is resident, so it stays valid after the bank has
' been paged out.
