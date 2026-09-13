
declare function PeekString(address as uinteger, delimeter as ubyte) as string
declare function _nls_return_lit() as string

' Force Boriel's string runtime (LOADSTR / STRCAT / MEM_FREE) to be
' linked. The asm bodies below reference .core.__LOADSTR from raw asm,
' which the compiler doesn't count as a "string is used" signal, so a
' concat inside PeekString (below) keeps the runtime resident.
dim _nls_strkeep as string

asm
    ; stringtemp is a shared scratch buffer holding a Boriel string:
    ; 2 bytes of length followed by the characters. Emits no code.
    STRINGTEMP_SIZE equ 255
    STRINGTEMP_MAX  equ STRINGTEMP_SIZE - 2     ; longest string it can hold
end asm

sub fastcall PeekMem(address as uinteger, delimeter as ubyte, byref outstring as string)
    ' Copy bytes from `address` into `outstring` until either `delimeter`
    ' is hit or STRINGTEMP_MAX chars have been copied. Uses stringtemp as
    ' the intermediate buffer; STORE_STR assigns it into outstring.
    asm
        push    namespace   peekmem

        ex      de, hl                          ; save outstring ptr in DE
        pop     hl                              ; ret addr
        pop     af                              ; A = delimeter
        ex      (sp), hl                        ; put ret back on stack

        push    hl                              ; save source ptr for later
        ex      de, hl                          ; HL = source, DE = free
        ld      de, .LABEL._stringtemp + 2      ; skip past the length header
        ld      b, a                            ; B = delimeter (persistent)
        ld      c, 0                            ; C = character count

    copyloop:
        ld      a, (hl)                         ; source byte
        cp      b                               ; hit delimeter?
        jr      z, endcopy
        ld      (de), a                         ; append to stringtemp
        inc     hl
        inc     de
        inc     c
        ld      a, c
        cp      .STRINGTEMP_MAX                 ; buffer full?
        jr      nz, copyloop

    endcopy:
        ld      b, 0                            ; BC = length (B held delimeter)
        ld      (.LABEL._stringtemp), bc
        pop     hl                              ; HL = outstring ptr
        ld      de, .LABEL._stringtemp          ; DE = temp descriptor

        pop     namespace
        jp      .core.__STORE_STR
    end asm

end sub


' Function form: same copy-until-delimeter behaviour as PeekMem, but
' returns a fresh heap-allocated Boriel string in HL. Lets you write
'   test$ = PeekString(@testdata + 5, 0)
' or use it inline where an expression is wanted.
function fastcall PeekString(address as uinteger, delimeter as ubyte) as string
    asm
        push    namespace   peekstr

        ; Fastcall: HL = address, stack = [ret_addr, delimeter(word)]
        pop     de                              ; DE = ret addr
        pop     af                              ; A  = delimeter (high byte of word)
        push    de                              ; ret back on stack

        ld      de, .LABEL._stringtemp + 2      ; skip length header
        ld      b, a                            ; B = delimeter
        ld      c, 0                            ; C = character count

    copyloop:
        ld      a, (hl)
        cp      b                               ; hit delimeter?
        jr      z, endcopy
        ld      (de), a
        inc     hl
        inc     de
        inc     c
        ld      a, c
        cp      .STRINGTEMP_MAX                 ; buffer full?
        jr      nz, copyloop

    endcopy:
        ld      b, 0                            ; BC = length (B held delimeter)
        ld      (.LABEL._stringtemp), bc

        ld      hl, .LABEL._stringtemp          ; HL = source descriptor
        pop     namespace
        jp      .core.__LOADSTR                 ; allocate heap copy; HL = result
    end asm
    ' Dead code after the jp above but still emitted -- forces Boriel
    ' to link the string runtime .core.__LOADSTR references from asm.
    ' A BASIC function that returns a String literal makes Boriel emit
    ' a __LOADSTR call to allocate the heap return, which is the exact
    ' symbol our asm above jumps to.
    _nls_strkeep = _nls_return_lit()
end function

function _nls_return_lit() as string
    return "x"
end function


sub fastcall PeekMemLen(address as uinteger, length as uinteger, byref outstring as string)
    ' Copy exactly `length` bytes from `address` into `outstring`.
    ' Length is clamped to STRINGTEMP_MAX; length == 0 is honoured
    ' (LDIR with BC=0 would copy 65536 bytes and crash).
    asm
        push    namespace   peekmemlen

        ex      de, hl                          ; DE = outstring ptr
        pop     hl                              ; ret addr
        pop     bc                              ; BC = requested length
        ex      (sp), hl                        ; ret back on stack

        push    hl                              ; save source
        ex      de, hl                          ; HL = source

        ld      a, b                            ; clamp to STRINGTEMP_MAX:
        or      a                               ;   anything with high byte
        jr      nz, clamp                       ;   set is definitely too big
        ld      a, c
        cp      .STRINGTEMP_MAX + 1             ;   0..MAX is fine as-is
        jr      c, lenok
    clamp:
        ld      bc, .STRINGTEMP_MAX
    lenok:
        ld      (.LABEL._stringtemp), bc        ; store final length

        ld      a, b                            ; zero-length: skip LDIR to
        or      c                               ; avoid the 65536-byte trap
        jr      z, copied
        ld      de, .LABEL._stringtemp + 2      ; DE = past length header
        ldir                                    ; HL -> DE, BC bytes
    copied:

        pop     hl                              ; HL = outstring ptr
        ld      de, .LABEL._stringtemp          ; DE = temp descriptor

        pop     namespace
        jp      .core.__STORE_STR
    end asm

end sub

sub fastcall PeekString2(address as uinteger, byref outstring as string)
    ' Trivial wrapper: address of an existing Boriel string descriptor
    ' arrives in HL, outstring ptr is on the stack. Shuffle so that
    ' STORE_STR sees HL = destination, DE = source, then tail-call.
    asm
        ex      de, hl                          ; DE = source
        pop     hl                              ; HL = ret addr
        ex      (sp), hl                        ; ret back on stack; HL = outstring
        jp      .core.__STORE_STR
    end asm
end sub

' function PeekString(byval Memory as uinteger) as string 
'     peekstringcount=0 :tempcar$=""

'     while peek(ubyte,Memory+peekstringcount)>0 and peekstringcount<255
'         tcar=peek(ubyte,Memory+peekstringcount)
'         if tcar> 31 and tcar < 127
'             tempcar$=tempcar$+chr$(tcar)
'         endif 
'         peekstringcount=peekstringcount+1	
'     wend 
'     if tempcar$<>"" 
'         border 2
'         return tempcar$
'     else 
'         s$=tempcar$
'         tempcar$="empty"
'     return s$
' endif 
' end function

Sub fastcall SplitString(source as uinteger, needle as ubyte, poision as ubyte)
    ' Pull the Nth `needle`-delimited slice out of a NUL-terminated byte
    ' stream at `source` and drop it (as a Boriel-format string) into
    ' `stringtemp`. Index 0 = first slice. If N is past the last
    ' delimiter, stringtemp is set to length 0 (empty string).
    asm
        push namespace strsplice
    start2:
        exx
        pop     de                                  ; save ret addr in DE'
        exx

        pop     af                                  ; A = needle
        ld      (needle), a
        pop     af                                  ; A = index to fetch
        ld      (source), hl                        ; save source ptr

        ld      de, needle                          ; DE=&needle, HL=source, A=idx
        push    ix
        push    bc
        call    getstringsplit
        pop     bc
        pop     ix

        exx
        push    de                                  ; restore ret addr
        exx
        ret

    ; --------------------------------------------------------------
    ; getstringsplit -- entry: HL = source, A = index
    ;                   out:   stringtemp holds the slice
    ; --------------------------------------------------------------
    getstringsplit:
        ld      (source), hl
        call    countdelimters
        ld      ix, currentindex
        ld      hl, (source)
        ld      (indextoget), a
        or      a
        jr      z, getfirstindex                    ; index 0 has no leading needle

    subloop:
        ld      de, needle
        ld      a, (de)                             ; A = needle
        ld      bc, 0
        cpir
        jr      z, foundneedle
        ret                                         ; ran off end without match

    foundneedle:
        ; HL points one past the matched needle
        push    hl
        ld      b, a                                ; keep needle in B
        inc     (ix+0)                              ; ++currentindex
        ld      a, (indextoget)
        cp      (ix+0)                              ; reached target index?
        jr      z, wefoundourindex
        pop     hl
        jr      subloop

    getfirstindex:
        ; Index 0: HL already at slice start; prime B with the needle.
        push    hl
        ld      a, (needle)
        ld      b, a

    wefoundourindex:
        ; HL = slice start, B = needle. Copy until needle / NUL / max.
        ld      de, .stringtemp + 2                  ; leave 2 bytes for length
        ld      c, .STRINGTEMP_MAX                  ; bytes still free

    wefoundourindexloop:
        ld      a, c
        or      a
        jr      z, copyends                         ; buffer full
        ld      a, (hl)
        or      a
        jr      z, copyends                         ; end of source
        cp      b
        jr      z, copyends                         ; hit next needle
        ldi                                         ; copy; BC-- but C stays >0
        jr      wefoundourindexloop                 ; B still holds the needle

    copyends:
        ; DE points one past last copied byte; length = DE - (stringtemp+2)
        xor     a
        ld      (currentindex), a                   ; reset for next run
        pop     hl
        ex      de, hl                              ; HL = end of copied data
        ld      de, .stringtemp + 2                  ; DE = start of copied data
        or      a                                   ; clear carry for sbc
        sbc     hl, de
        ld      (.stringtemp), hl                    ; store length
        ret

    ; --------------------------------------------------------------
    ; countdelimters -- walk source, count needle occurrences.
    ;   entry: A = requested index, needle already stashed
    ;   exit:  A = requested index on success, or bails via strfailed
    ; --------------------------------------------------------------
    countdelimters:
        ld      c, a                                ; save requested index
        ld      hl, totalindex
        ld      (hl), 0
        ld      de, (source)
        ld      hl, needle
        ld      b, (hl)                             ; B = needle byte

    countdelimtersloop:
        ld      a, (de)
        or      a
        jp      z, indexcountdone                   ; NUL terminator
        cp      b
        call    z, increasedelimetercount
        inc     de
        jr      countdelimtersloop

    indexcountdone:
        ld      a, (totalindex)
        cp      c
        jr      c, strfailed                        ; not enough delimiters
        ld      a, c
        ret

    strfailed:
        pop     hl                                  ; drop getstringsplit's ret
        ld      hl, 0
        ld      (.stringtemp), hl                    ; length 0 -> empty string
        ret

    increasedelimetercount:
        ld      hl, totalindex
        inc     (hl)
        ret

    ; --- scratch storage ------------------------------------------
    totalindex:
        db      0
    currentindex:
        db      0
    indextoget:
        db      0
    source:
        dw      0
    needle:
        db      "^"
        db      0
        pop namespace
    end asm

end sub

stringtemp:
	asm
	stringtemp:
			ds STRINGTEMP_SIZE,0
	end asm
