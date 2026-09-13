' fileLib v10    - em00k part of NextBuild
' library is incomplete and still a WIP
'
' working:
' fOpenFile()
' fOpenWrite()
' FClose()
' FReadBytes()
' fReadLine()
' FWriteBytes()
' fSetPos()
' fGetPos()
' fGetFilesize()
' fReadBanks()
' fSaveBanks()
' fCreate()
' fOpenDrive()
' fChangeDir()
' fGetDir()
' fDelete()
' fOpenDir() / fGetNextDir() / fGetDirSize() / fRewindDir()
'
' Every function preserves IX, so they are safe to call from inside a
' SUB or FUNCTION that has parameters or locals.
'

'#include once <nextlib.bas>


' Force Boriel's string runtime (__MEM_FREE and friends) to be linked.
' The fastcall wrappers below reference .core.__MEM_FREE unconditionally
' via the asm bodies, but the compiler only pulls that runtime in when
' it sees a BASIC-level string OP. Without at least one PRINT / literal-
' arg LoadSDBank / string DIM the linker fails with 'Undefined GLOBAL
' label .core.__MEM_FREE'. A concat inside fFileInit runs the first time
' any file op is invoked and keeps the runtime resident.
dim _filelib_strkeep as string

declare function fOpenFile(fname as string) as ubyte
declare function fOpenWrite(fname as string) as ubyte
declare function fFileInit() as ubyte
declare function fClose(fandle as ubyte) as ubyte 
declare function fCreate(fname as string) as ubyte
declare function fReadBytes(infile as ubyte,destadd as uinteger, ldbytes as ulong) as uinteger 
declare function fReadBanks(fname as string, dbank as ubyte) as ubyte
declare function fSaveBanks(fname as string, dbank as ubyte, fsize as ulong) as ubyte
declare function fWriteBytes(infile as ubyte,srcadd as uinteger, ldbytes as ulong) as uinteger
declare function fSetPos(file as ubyte, fpos as ulong) as ulong 
declare function fGetPos(file as ubyte) as ulong 
declare function fGetFilesize(file as ubyte) as ulong 
declare function fOpenDir(fname as string) as ubyte 
declare function fGetNextDir(fandle as ubyte) as string 
declare function fReadLine(infile as ubyte, destadd as uinteger, maxbytes as uinteger) as uinteger
declare function fGetDirSize(fandle as ubyte) as ulong

function fastcall fFileInit() as ubyte 
    asm 
        push    namespace   fFileInit 

    fcachefname:
        ; this will cache the file name and give
        ; a file handle, 0 = failure 
        push    hl                      ; save string address
        ld      de,.LABEL._filename
        ld      c, (hl)
        inc     hl
        ld      b, (hl)
        inc     hl
        ld      a, b
        or      c
        jr      z, 1F                   ; empty string: ldir with BC=0 would copy 64K
        ldir
    1:
        xor     a
        ld      (de), a 
        pop     hl 
        call    .core.__MEM_FREE
    
    setdrv:
        ; fall through to open the 
        ; default drive, returns file handle 
        ld      a,'*'
        rst     $08
        db      $89
        ret

    ffopen:
        ; b = $01, read, then jumps to
        ; faction with file handle in a  
        ld	    b,$01           ; read
        jr      faction

    fopenrw:
        ; read + write, open existing or create ($03 | $08)
        ld      b,$0b
        jr      faction

    fcreate:
        ld	    b,$0e           ; create 
        

    faction:
        ; opens drive? 9a = OPEN
        ld      a,'$'
        rst     $08
        db      $9a
        jr      c, ffailed
        ret

    fwrite:
        ; ix address, bc bytes
        or      a
        jr      z, fnohandle
        rst     $08
        db      $9e
        jr      c, ffailed
        ret
    fread:
        ; ix address, bc bytes
        ; a is filehandle
        or      a
        jr      z, fnohandle
        rst     $08
        db      $9d
        jr      c, ffailed
        ret
    fnohandle:
        ; handle 0: report nothing transferred / position 0 rather
        ; than handing the caller's request straight back
        ld      bc, 0
        ld      de, 0
        ret
    fclose:
        ; a = file handle 
        ; $9b = close
        or      a
        ret     z
        rst     $08
        db      $9b
        jr      c, ffailed
        ret

    fDelete:
        ; ix file name
        ld      a, '*'
        rst     8
        db      $ad                 ; unlink
        jr      c, fDelFail         ; own fail path -- avoid ffailed's red-border debug flash
        ld      a, 1                ; success -> non-zero for BASIC callers
        ret
    fDelFail:
        xor     a                   ; 0 = missing / permission / etc.
        ret

    fpos:
        ; BCDE  position 
        ; a = filehandle
        ; $9f = seek
        or      a
        jr      z, fnohandle
        ld      ixl, 0          ; esx_seek_set
        rst     $08
        db      $9f
        jr      c, ffailed
        ret

    fgetpos:
        ; rets position in BCDE
        or      a
        jr      z, fnohandle
        rst     $08
        db      $a0 
        jr      c, ffailed
        ret 

    fgetstat:
        or      a 
        ret     z 
        rst     $08 
        db      $a1 
        jr      c, ffailed
        ret 
    
    ; catches failures 
    ffailed:
        ld      b, 255
    1:
        ld      a, 1 
        out     ($fe), a 
        nop     : nop 
        ld      a, 2            ; leave border RED if error occurred. 
        out     ($fe), a 
        djnz    1B 

        xor     a 
        ld      b, a 
        ld      c, a 
        ld      h, a 
        ld      l, a 
        ld      d, a 
        ld      e, a        ; flatten everything going back 
        ret  
    
        POP     namespace 
        
        ;#include once <alloc.asm>
        
    end asm 
    fClose(0)
end function

function fastcall fOpenDrive() as ubyte 
    asm 
        call    .fFileInit.setdrv
        ret 
    end asm 
    fFileInit()
end function 

function fastcall fCreate(fname as string) as ubyte 
    asm 
        ; creates a file
        push    ix                      ; IX is the caller's frame pointer
        call    .fFileInit.fcachefname
        ld      ix, .LABEL._filename
        call    .fFileInit.fcreate
        pop     ix
        ret
    end asm
    'fFileInit()
end function 

function fastcall fOpenFile(fname as string) as ubyte
    asm
        ; opens a file an returns file handle
        push    ix                      ; IX is the caller's frame pointer
        call    .fFileInit.fcachefname
        ld      ix,.LABEL._filename
        call    .fFileInit.ffopen
        pop     ix
        ret
    end asm
    ' Dead code after the ret above, but emitted by the compiler -- the
    ' concat forces Boriel to link its string runtime (__MEM_FREE etc.),
    ' which the fastcall wrappers here reference from asm. See _filelib_strkeep
    ' at the top of this file for the rationale.
    _filelib_strkeep = _filelib_strkeep + "x"
    fFileInit()
end function

' Open a file for reading and writing, creating it if it doesn't exist.
' Existing contents are kept and the position starts at 0, so seek to
' fGetFilesize() to append. Returns the handle, 0 on failure.
function fastcall fOpenWrite(fname as string) as ubyte
    asm
        push    ix                      ; IX is the caller's frame pointer
        call    .fFileInit.fcachefname
        ld      ix,.LABEL._filename
        call    .fFileInit.fopenrw
        pop     ix
        ret
    end asm
    fFileInit()
end function

function fastcall fClose(fandle as ubyte)
    asm 
        ; closes a file 
        jp    .fFileInit.fclose
    end asm 
end function 

function fastcall fReadBytes(infile as ubyte, destadd as uinteger, ldbytes as ulong) as uinteger 
    asm 
        ; ix address, bc bytes, a handle 
        ld      (_fReadFixix+2),ix 
        ex      (sp), hl 
        pop     ix              ; get address 
        pop     ix              ; get address 
        pop     bc              ; get length 
        inc     sp 
        inc     sp  
        push    hl              ; save ret 
        call    .fFileInit.fread
    _fReadFixix:
        ld      ix, 0 
        ld      l, c            ; send back saved size 
        ld      h, b 
    end asm 
end function

' Read one line into destadd, up to maxbytes bytes. Consumes and drops
' the line terminator (CR, LF, or CRLF). Returns the number of bytes
' actually stored -- 0 on EOF-at-start-of-line or an empty line.
function fastcall fReadLine(infile as ubyte, destadd as uinteger, maxbytes as uinteger) as uinteger
    asm
        ; A = infile, stack = ret_addr, destadd(2), maxbytes(2)
        ld      (_fReadLHandle), a           ; save handle
        ld      (_fReadLIxSave+2), ix        ; save caller IX via SMC

        ex      (sp), hl                     ; HL = ret_addr, top = old HL
        pop     bc                           ; discard old HL
        pop     ix                           ; IX = destadd (write ptr)
        pop     de                           ; DE = max bytes remaining
        push    hl                           ; ret_addr back

        ld      hl, 0                        ; HL = count written

    _fReadLLoop:
        ld      a, d
        or      e
        jr      z, _fReadLDone               ; buffer full

        push    hl
        push    de
        push    ix
        ld      a, (_fReadLHandle)
        ld      ix, _fReadLScratch
        ld      bc, 1
        call    .fFileInit.fread             ; C = bytes read (0 on EOF)
        ld      a, c
        pop     ix
        pop     de
        pop     hl
        or      a
        jr      z, _fReadLDone               ; EOF

        ld      a, (_fReadLScratch)
        cp      10
        jr      z, _fReadLDone               ; LF ends the line
        cp      13
        jr      z, _fReadLGotCR              ; CR: check for CRLF

        ld      (ix+0), a
        inc     ix
        inc     hl
        dec     de
        jr      _fReadLLoop

    _fReadLGotCR:
        ; Peek next byte into scratch (does not disturb caller buffer).
        push    hl
        push    de
        push    ix
        ld      a, (_fReadLHandle)
        ld      ix, _fReadLScratch
        ld      bc, 1
        call    .fFileInit.fread
        ld      a, c
        pop     ix
        pop     de
        pop     hl
        or      a
        jr      z, _fReadLDone               ; EOF right after CR
        ld      a, (_fReadLScratch)
        cp      10
        jr      z, _fReadLDone               ; CRLF consumed

        ; Non-LF byte after CR is real data. Store it if there's room;
        ; otherwise it's dropped (the read cursor has still advanced past
        ; it, matching the "max bytes" contract).
        push    af
        ld      a, d
        or      e
        jr      z, _fReadLDropPop
        pop     af
        ld      (ix+0), a
        inc     ix
        inc     hl
        dec     de
        jr      _fReadLLoop

    _fReadLDropPop:
        pop     af

    _fReadLDone:
    _fReadLIxSave:
        ld      ix, 0                        ; SMC-restored caller IX
        ret                                  ; HL = bytes stored

    _fReadLHandle:
        db      0
    _fReadLScratch:
        db      0
    end asm
end function

' In the future, we may use our own buffer for filenames instead of .LABEL.filename
' _temp_buffer:
'     asm
'         _temp_buffer:
'         ds 100, 0
'     end asm 

function fastcall fWriteBytes(infile as ubyte, srcadd as uinteger, ldbytes as ulong) as uinteger 
    asm 
        ; ix address, bc bytes, a handle
        ld      (_fWriteFixix+2),ix     ; IX is the caller's frame pointer
        ex      (sp), hl
        pop     ix              ; get address
        pop     ix              ; get address
        pop     bc              ; get length
        inc     sp
        inc     sp
        push    hl              ; save ret
        call    .fFileInit.fwrite
    _fWriteFixix:
        ld      ix, 0
        ld      l, c            ; send back saved size
        ld      h, b
    end asm
end function

function fastcall fSetPos(file as ubyte, fpos as ulong) as ulong 
    asm 
        ; sets file position
        ld      (_fSetPosFixix+2),ix    ; fpos loads the seek mode into IXL
        ex      (sp), hl        ; exchange ret address
        pop     bc              ; need to empty off stack
        pop     de              ; pop LOW bytes
        pop     bc              ; pop HIGH bytes
        push    hl              ; push ret back on to stack
        call    .fFileInit.fpos ; do call
    _fSetPosFixix:
        ld      ix, 0
        ld      l, c            ; size in BCDE, so transfer to DEHL
        ld      h, b 
        ex      de, hl 
    end asm 
end function 

function fastcall fGetPos(file as ubyte) as ulong 
    asm 
        ; gets file position 
        call    .fFileInit.fgetpos
        ld      l, c 
        ld      h, b 
        ex      de, hl 
    end asm 
end function 


' Delete file. Returns 1 on success, 0 on failure.
function fastcall fDelete(fname as string) as ubyte
    asm
        push    ix                   ; IX is the caller's frame pointer
        call    .fFileInit.fcachefname
        ld      ix, .LABEL._filename
        call    .fFileInit.fDelete   ; returns A=1 on success, 0 on failure
        pop     ix
    end asm
end function


' Get the current working directory of the default drive.
' Returns "" if esxDOS can't report it.
function fastcall fGetDir() as string
    asm
        push    ix
        ld      ix, .LABEL._filename+2      ; path lands after a 2 byte length
        ld      a, '*'                      ; default drive, same as fChangeDir
        rst     8
        db      $a8                         ; F_GETCWD
        ld      bc, 0
        jr      c, 2F                       ; failed: return an empty string
        ld      hl, .LABEL._filename+2
    1:
        ld      a, (hl)
        or      a
        jr      z, 2F
        inc     hl
        inc     bc
        jr      1B
    2:
        ld      hl, .LABEL._filename        ; write the length header
        ld      (hl), c
        inc     hl
        ld      (hl), b
        dec     hl
        call    .core.__LOADSTR             ; caller owns (and frees) a heap copy
        pop     ix
        ret
    end asm
    ' Dead code after the ret above. Returning a string variable makes the
    ' compiler copy it with __LOADSTR, which links that routine for the asm.
    ' (An #include once <loadstr.asm> here would be dropped with the function
    ' when it's unused, and still use up the "once" for everyone else.)
    return _filelib_strkeep
end function


' Change working directory. Returns 1 on success, 0 on failure.
function fastcall fChangeDir(fname as string) as ubyte
    asm
        push    ix                  ; IX is the caller's frame pointer
        call    .fFileInit.fcachefname
        ld      ix, .LABEL._filename
        ld      a, '*'
        rst     8
        db      $a9                 ; F_CHDIR: Fc=1 + A=error on failure
        pop     ix                  ; pop and ld leave the flags alone
        ld      a, 1
        ret     nc
        xor     a
        ret
    end asm
end function

function fastcall fGetFilesize(file as ubyte) as ulong 
    asm 
        ; gets file size
        push    ix                          ; IX is the caller's frame pointer
        ld      hl, 0                       ; size reads as 0 if handle is 0
        ld      (.LABEL._filename+7), hl    ; or F_FSTAT fails
        ld      (.LABEL._filename+9), hl
        ld      ix, .LABEL._filename
        call    .fFileInit.fgetstat
        pop     ix
        ld      hl, (.LABEL._filename+7)
        ld      de, (.LABEL._filename+9)
    end asm
end function 

function fastcall fSaveBanks(fname as string, dbank as ubyte, fsize as ulong) as ubyte
    asm
        ; Save sequential 8K banks to a file
        ; fname  = filename (fastcall, in HL)
        ; dbank  = starting 8K bank number
        ; fsize  = total bytes to write (32-bit)
        ; returns: non-zero on success, 0 on failure

        call    .fFileInit.fcachefname
        pop     hl              ; return address
        pop     af              ; dbank -> A
        pop     bc              ; fsize low word
        ld      (fSaveRemLo+1), bc
        pop     bc              ; fsize high word
        ld      (fSaveRemHi+1), bc

        nextreg $52, a          ; map starting bank to $4000
        push    hl              ; save return address
        ld      d, a            ; bank in D
        ; BREAK
        push    ix
        ld      ix, .LABEL._filename
        call    .fFileInit.fcreate  ; CREATE file for writing
        or      a                   ; ffailed returns A=0 with carry clear,
        jr      z, fSaveBankFailOpen ; so test the handle, not the carry

        ld      e, a            ; file handle in E

    fSaveLoop:
        ; Check how many bytes remain (32-bit)
    fSaveRemHi:
        ld      bc, 0           ; high word of remaining (SMC)
        ld      a, b
        or      c
        jr      nz, fSaveFullChunk  ; high > 0, definitely >= $2000

    fSaveRemLo:
        ld      bc, 0           ; low word of remaining (SMC)
        ld      a, b
        or      c
        jr      z, fSaveDone    ; remaining == 0, finished

        ; BC < $10000, check if >= $2000
        ld      a, b
        cp      $20
        jr      c, fSaveDoWrite ; B < $20 so BC < $2000, partial write

    fSaveFullChunk:
        ld      bc, $2000       ; write full 8K chunk

    fSaveDoWrite:
        ; BC = bytes to write this iteration
        push    de              ; save handle(E) + bank(D)
        ld      a, e            ; file handle
        ld      ix, $4000       ; source address (mapped bank)
        call    .fFileInit.fwrite
        ; BC = bytes actually written

        ld      a, b
        or      c
        jr      z, fSaveWriteErr  ; 0 bytes = write failed

        ; Subtract written bytes from 32-bit remaining
        ld      hl, (fSaveRemLo+1)
        or      a               ; clear carry
        sbc     hl, bc
        ld      (fSaveRemLo+1), hl
        ld      hl, (fSaveRemHi+1)
        ld      bc, 0
        sbc     hl, bc          ; propagate carry into high word
        ld      (fSaveRemHi+1), hl

        pop     de              ; restore handle + bank
        inc     d               ; next bank
        ld      a, d
        nextreg $52, a          ; map next bank

        jr      fSaveLoop

    fSaveDone:
        ld      a, e
        call    .fFileInit.fclose
        nextreg $52, $0a        ; restore banks
        ld      a, 1            ; success
        pop     ix
        ret

    fSaveWriteErr:
        pop     de              ; balance push de from loop
        ld      a, e
        call    .fFileInit.fclose
    fSaveBankFailOpen:
        nextreg $52, $0a        ; restore banks
        xor     a               ; 0 = failure
        pop     ix
        ret
    end asm
    fFileInit()
end function

' Read a whole file into consecutive 8K banks starting at dbank.
' Uses slot 2 ($4000) as a paging window. Closes the file when finished.
' Returns the number of banks actually populated (0 on open failure).
function fastcall fReadBanks(fname as string, dbank as ubyte) as ubyte
    asm
        call    .fFileInit.fcachefname
        pop     hl              ; return address
        pop     af              ; dbank -> A
        nextreg $52, a          ; map first destination bank to $4000
        push    hl              ; ret_addr back on stack
        push    ix              ; preserve caller IX

        ld      d, a            ; D = current bank
        ld      (fRBStart+1), a ; SMC: remember starting bank for count math
        ld      ix, .LABEL._filename
        call    .fFileInit.ffopen
        or      a               ; esxDOS doesn't define Z on success,
        jr      z, fReadBankFailOpen ; so test the handle itself
        ld      e, a            ; E = file handle
        ld      c, 0            ; C = bank count (running)

    fRBLoop:
        push    bc              ; save count
        push    de              ; save handle + bank
        ld      a, e            ; A = handle
        ld      ix, $4000       ; destination in the paged window
        ld      bc, $2000       ; up to 8K per iteration
        call    .fFileInit.fread ; BC = bytes actually read
        ld      a, b
        or      c               ; short read (0 bytes) means EOF
        pop     de
        pop     bc
        jr      z, fRBEof

        inc     c               ; +1 bank populated
        inc     d               ; next bank
        ld      a, d
        nextreg $52, a
        jr      fRBLoop

    fRBEof:
        ld      a, e
        call    .fFileInit.fclose   ; close the file (release the handle)
        ld      a, c                ; return count (in A)
        nextreg $52, $0a            ; restore default $4000 mapping
        pop     ix
        ret

    fReadBankFailOpen:
        nextreg $52, $0a
        xor     a                   ; 0 = failure
        pop     ix
        ret

    fRBStart:
        db      0                   ; SMC slot (unused by the runtime, but
                                    ; kept so the label survives if callers
                                    ; ever want to peek it via .fRBStart+1)
    end asm
    fFileInit()
end function

function fastcall fOpenDir(fname as string) as ubyte 
    asm
    push        namespace   fOpenDir
    
    initdrive:
         
        push    ix
        call    .fFileInit.fcachefname      ; path -> filename buffer

        ld      a, (.LABEL._filename)
        or      a
        jr      nz, 1F                      ; open the path we were given
		ld      a,'*'                       ; empty path: open the current dir
    	ld      ix,.LABEL._filename         ; buffer
		rst     8 : DB $a8                  ; get the current directory
    1:

        ; note that adjusting the sort can break listing on real HW!
        ; b,$90 c,$39 will 100% show results, LFN sorted! 
        ; esx_mode_lfn_only	$10
        ; esx_sf_exclude_dots	$20
        ; esx_sf_exclude_sys	$10
        ; esx_sf_exclude_sys	$10
		ld      b,$10                      ; lfn files only
        ; ld      c,$30
		ld      a,'*'                       ; default drive         

		ld      ix,.LABEL._filename         ; point to buffer         
        ld      de,.LABEL._filename         ; point to buffer         
		rst     8 : db $a3                  ; open dir

        jr      nc, _dont_close
        xor     a                           ; fail: A was an error code, not a
        jr      _open_dir_end               ; handle, so there is nothing to close

    _dont_close:
		ld      (fandle+1),a	            ; a = dir handle 
		rst     8 : db $a7                  ; rewind to start of dir
    fandle:
        ld      a, 0 
        ; a will be return <>0 for success 

    _open_dir_end:
        pop     ix 
        ret 
    pop         namespace
    end asm
    fFileInit()
end function

function fastcall fGetNextDir(fandle as ubyte) as string 

    asm
        
        push        namespace   fGetNextDir
        ; a will be handle
        push    ix
        or      a
        jr      z, _no_entries              ; handle 0: nothing to read or close
        ld      (close_dir2+1), a
        ld      ix, .LABEL._filename+1      ; leave space for size
        ld      de, .LABEL._filename+1
        rst     8 : db $a4                  ; read entry

        jr      c, close_dir2               ; fail, a = error code (test before
        or      a                           ; the "or a", which clears carry)
        jr      nz, _dont_close2            ; a = 0: no more entries
    close_dir2:
        ld      a, 0 : rst 8 : db $9b
    _no_entries:
        ld      bc, dir_ent_size2
        ld      (dir_ent_size), bc
        ld      hl, hl_str
        jr      _flyover
       

    _dont_close2:
        ld      hl, .LABEL._filename+2
        
        ; +0	1 byte	File attributes (MSDOS format)
        ; +1	? bytes	File/directory name(s), null-terminated
        ; +?	2 bytes	Timestamp (MSDOS format)
        ; +?	2 bytes	Datestamp (MSDOS format)
        ; +?	4 bytes	File size
        
        
        ld      bc,0 
    1:  ld      a, (hl)
        or      a 
        jr      z,_finished_counting         ; null terminated 
        inc     bc 
        inc     hl 
        jr      1B 
    _finished_counting:
        ;BREAK
        ld      hl, .LABEL._filename        ; point to size 
        ld      (hl), c
        inc     hl 
        ld      (hl), b 
        dec     hl 
        push    hl 
        add     hl, bc                      ; point to size
        add     hl, 7 
        ld      (dir_ent_size), hl          ; store pointer to size
        pop     hl                          ; bring back string

    _flyover:
        call    .core.__LOADSTR
        
        pop     ix 

        ret 
    dir_ent_size:
        dw      dir_ent_size2               ; fGetDirSize reads 0 until an entry is read
    dir_ent_size2:
        dw      0000,0000
    hl_str:
        db 4,0,"!END"
    rout_end:
        pop         namespace
    end asm
    ' Dead code: links __LOADSTR for the asm above, see fGetDir.
    return _filelib_strkeep
end function 

function fastcall fGetDirSize(fandle as ubyte) as ulong
    asm
        ; BREAK 
        ; returns the size of the last dir entry
        ld      hl, .fGetNextDir.dir_ent_size
        ld      a, (hl)
        inc     hl 
        ld      h, (hl)
        ld      l, a 

        ld      e, (hl)
        inc     hl 
        ld      d, (hl)
        inc     hl 
        ld      a, (hl)
        inc     hl 
        ld      h, (hl)
        ld      l, a 
        ex      de, hl
    end asm 
end function 

' Rewind an open directory handle to the first entry.
' Returns 1 on success, 0 on failure or if the passed handle is 0.
function fastcall fRewindDir(fandle as ubyte) as ubyte
    asm
        ; fastcall: A = fandle (the actual argument, not the SMC slot).
        or      a
        jr      z, fRDFail          ; guard against handle 0
        rst     8
        db      $a7                 ; F_REWINDDIR
        jr      c, fRDFail
        ld      a, 1
        ret
    fRDFail:
        xor     a
        ret
    end asm
end function


' dim n as ubyte 
' dim file as ubyte 

' fOpenDrive()

' test = fOpenDir("ATEST")

' print test 
' if test

'     dir = fOpenDir("ATEST")

'     if dir
'         test$=fGetDir(dir)
'         if len test$  
'             print test 
'         endif 
'     endif 

'     endif 

' endif 


' file = fCreate("test.asm")

' if file 
'     Print "File opened "+str(file)
'     bytes=fWriteBytes(file,@dataa,256)
'     if bytes 
'         print "bytes saved "+str(bytes)
'         new_pos = fSetPos(file,$20)
'         if new_pos
'             print "new position "+str(new_pos)
'             bytes=fReadBytes(file,$4000,32)
'             if bytes 
'                 print "bytes loaded "+str(bytes)
'                 print "file pos "+str(fGetPos(file))
'                 print "file size "+str(fGetFilesize(file))
'                 fClose(0)   
'             endif 
'         endif 
'     endif 
' endif 

' banks = fReadBanks("JAGTITLE.MOD",40 )


' ' if file 
' '     Print "File opened "+str(file)
' '     bytes=fReadBytes(file,$4000,32)
' '     if bytes 
' '         print "bytes read "+str(bytes)
' '         new_pos = fSetPos(file,$20)
' '         if new_pos
' '             print "new position "+str(new_pos)
' '             bytes=fReadBytes(file,$4000,32)
' '             if bytes 
' '                 print "bytes loaded "+str(bytes)
' '                 print "file pos "+str(fGetPos(file))
' '                 print "file size "+str(fGetFilesize(file))
' '                 fClose(0)   
' '             endif 
' '         endif 
' '     endif 
' ' endif 

' ' do : loop 
