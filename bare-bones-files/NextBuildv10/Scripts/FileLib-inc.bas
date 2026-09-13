'!origin=/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/DISKIO/FileLib/ReadDirectory.bas
'!exe=cp /home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/DISKIO/FileLib/ReadDirectory.nex /mnt/flashair/192.168.2.1/

' fileLib     - em00k part of NextBuild
' library is incomplete and still a WIP
'
' working: 
' fOpenFile()
' FClose()
' FReadBytes()
' FWriteBytes()
' fSetPos()
' fReadBanks()
' fCreate()
' fOpenDrive()
' fChangeDir
' fDeleteFile
'

#include once <nextlib.bas>


declare function fOpenFile(fname as string) as ubyte
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
declare function fReadLine(infile as ubyte, destadd as UINTEGER) as string 
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
        ldir    
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
        ret     z
        rst     $08
        db      $9e
        jr      c, ffailed
        ret
    fread:		
        ; ix address, bc bytes 
        ; a is filehandle 
        or      a
        ret     z
        rst     $08
        db      $9d
        jr      c, ffailed
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
        jr      c, ffailed

    fpos:
        ; BCDE  position 
        ; a = filehandle 
        ; $9f = seek
        or      a 
        ret     z 
        ld      ixl, 0          ; esx_seek_set
        rst     $08 
        db      $9f
        jr      c, ffailed
        ret 

    fgetpos:
        ; rets position in BCDE 
        or      a 
        ret     z 
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
        ld      a, 2
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
        call    .fFileInit.fcachefname
        ld      ix, .LABEL._filename 
        jp      .fFileInit.fcreate
    end asm 
    'fFileInit()
end function 

function fastcall fOpenFile(fname as string) as ubyte 
    asm  
        ; opens a file an returns file handle 
        call    .fFileInit.fcachefname
        ld      ix,.LABEL._filename 
        call    .fFileInit.ffopen 
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

function fastcall fReadLine(infile as ubyte, destadd as UINTEGER) as string
    asm 
        ; loads bytes until an EOL 
        BREAK 
        ex      (sp), hl        ; swap return address with destadd 
        ld      (_fReadLFixix+2),ix 
        pop     ix              ; address of buffer 
        push    ix              ; copy address
    _keep_reading:
        ld      bc, 1           ; load 1 byte 
        call    .fFileInit.fread
        ld      a, (ix+0)       ; was it CR 
        inc     ix 
        cp      13 
        jr      z,_end_of_line  ; yes then end of line
        ld      a, c 
        cp      255             ; line too long?
        jr      z,_end_of_line  
        jr      _keep_reading
    _end_of_line
        pop     de 
        push    hl              ; ret address 
        ex      de, hl 
        ld      bc, 0
    1:
    _fReadLFixix:
        ld      ix, 0 
        ret 
    
    end asm 
end function 

_temp_buffer:
    asm
        _temp_buffer:
        ds 100, 0
    end asm 

function fastcall fWriteBytes(infile as ubyte, srcadd as uinteger, ldbytes as ulong) as uinteger 
    asm 
        ; ix address, bc bytes, a handle 
        ex      (sp), hl 
        pop     ix              ; get address 
        pop     ix              ; get address 
        pop     bc              ; get length 
        push    hl              ; save ret 
        call    .fFileInit.fwrite
        ld      l, c            ; send back saved size 
        ld      h, b 
    end asm 
end function

function fastcall fSetPos(file as ubyte, fpos as ulong) as ulong 
    asm 
        ; sets file position 
        ex      (sp), hl        ; exchange ret address
        pop     bc              ; need to empty off stack
        pop     de              ; pop LOW bytes
        pop     bc              ; pop HIGH bytes 
        push    hl              ; push ret back on to stack 
        call    .fFileInit.fpos ; do call 
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


function fastcall fDelete(fname as string) as ubyte
    asm 
        ; gets file position 
        call    .fFileInit.fcachefname
        ld      ix, .LABEL._filename 
        call    .fFileInit.fDelete
        ; a = success 
    end asm 
end function 


function fastcall fGetDir() as string 
    asm 
        ; gets file position 
        ; BREAK 
        push    ix 
        call    .fFileInit.setdrv
        ld      ix, .LABEL._filename+2 
        ld      a, $ff
        ld      de, spec
        ld      b, 0 
        rst     8 
        db      $a8                 ; getcwd 
        ld      hl, .LABEL._filename+2 
        ld      bc, 0 
    1:
        inc     bc 
        ld      a, (hl)
        or      a 
        inc     hl 
        jr      nz, 1B
        
        ld      hl, .LABEL._filename

        ld      c, (hl)
        inc     hl 
        ld      b, (hl)
        dec     hl 
        pop     ix 
        ret 
    spec:
        db "C:",0
        ; a = success 
    end asm 
end function 


function fastcall fChangeDir(fname as string) as ubyte
    asm 
        ; gets file position 
        ;BREAK 
        call    .fFileInit.fcachefname
        ld      ix, .LABEL._filename 
        ld      a, '*'
        rst     8 
        db      $a9                 ; change dir 
        
        ; a = success 
    end asm 
end function 

function fastcall fGetFilesize(file as ubyte) as ulong 
    asm 
        ; gets file size 
        ld      ix, .LABEL._filename
        call    .fFileInit.fgetstat
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
        jr      c, fSaveBankFailOpen

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

function fastcall fReadBanks(fname as string, dbank as ubyte) as ubyte 
    asm 
        ; ix address, bc bytes, a handle 
         
        
        call    .fFileInit.fcachefname
        pop     hl 
        pop     af              ; start bank 
        nextreg $52, a          ; $4000 as workspace 
        push    hl              ; save ret 
        ld      d, a            ; save bank in d 
        push    ix 
        ld      ix,.LABEL._filename 
        call    .fFileInit.ffopen 
        jr      z, fReadBankFailOpen
        ; a will be handle 
        ld      e, a            ; save handle in e  

    1:  ; load loop
        push    de              ; save handle and banks
        ld      a, e            ; get back handle 
        ld      ix, $4000       ; destination 
        ld      bc, $2000       ; max load amount 
        call    .fFileInit.fread
        ;       bc bytes read 
        pop     de 
        inc     d               ; increse banks 
        ld      a, d            ; next bank 
        nextreg $52, a 
        
        ld      a, b 
        or      c 
        jr      nz, 1B          ; did we load zero bytes yet? yes jump forward to 2 
       
        ld      a, e            ; return the number of banks loaded 
        nextreg $52, $0a        ; retsore banks
        pop     ix 
        ret 
    fReadBankFailOpen:
        nextreg $52, $0a        ; retsore banks
        xor     a               ; flatten a for error
        pop     ix 
        ret 
    end asm 
    fFileInit()
end function 

function fastcall fOpenDir(fname as string) as ubyte 
    asm
    push        namespace   fOpenDir
    
    initdrive:
         
        push    ix 
		;' get current work dir
        BREAK 
        call    .fFileInit.fcachefname

		ld      a,'*'                       ; default drive
    	ld      ix,.LABEL._filename         ; buffer 
		rst     8 : DB $a8                  ; get the current directory 
		
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

        jp      z,_dont_close			    ; no more entries
        jp      c,close_dir 		        ; fail, a = error code 
        jr      _dont_close        

    close_dir:
        rst 8 : db $9b
        xor     a 
        jp      _open_dir_end

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
        or      a 
        ret     z 
        push    ix 
        ld      (close_dir2+1), a 
        ld      ix, .LABEL._filename+1      ; leave space for size 
        ld      de, .LABEL._filename+1 
        rst     8 : db $a4                  ; read entry 

         
        or      a
        jp      z,close_dir2		        ; no more entries
        jp      c,close_dir2 		        ; fail, a = error code 
        jr      _dont_close2
    close_dir2:
        ld      a, 0 : rst 8 : db $9b
        ; BREAK 
        xor     a
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
        dw      0000
    dir_ent_size2:
        dw      0000,0000
    hl_str:
        db 4,0,"!END"
    rout_end:
        pop         namespace
    end asm

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

function fastcall fRewindDir(fandle as ubyte) as ubyte
    asm 
        ; gets file position 
        ; a should be handle 
        ld      a, (.fOpenDir.fandle+1)
        ret     z 
        rst     8 
        db      $a7                 ; change dir 
        
        ; a = success 
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
