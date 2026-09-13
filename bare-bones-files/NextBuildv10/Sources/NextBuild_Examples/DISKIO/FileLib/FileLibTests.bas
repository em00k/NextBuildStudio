'!org=24576
'!heap=1024
'!opt=4
'!exe=s2f {file}

#define NEX
#define IM2

#include <nextlib.bas>
#include <print42.bas>
#include <nextlib_filelib.bas>

' Exercises the four functions fixed in the recent FileLib cleanup:
'   fChangeDir  -- returns 1 on success, 0 on failure
'   fReadBanks  -- returns actual bank count, closes the handle behind it
'   fDelete     -- returns 1/0 and is repeatable
'   fRewindDir  -- uses the passed-in handle, not a stale SMC slot
'
' Needs lorum_ipsum.txt in the working directory. NEXTZXOS is used as a
' known-existing directory for the chdir test.

dim r        as ubyte
dim c        as ubyte
dim h        as ubyte
dim dh       as ubyte
dim first$   as string
dim tmp$     as string
dim after$   as string

InitLayer2(MODE256X192)

fOpenDrive()

printat42(0, 0)
print42("FileLib API sanity tests")

' ---- TEST 1: fChangeDir --------------------------------------------
r = fChangeDir("bogus_dir_xyz")
printat42(2, 0)
print42("chdir(bogus)     = " + str(r) + "  expect 0")

r = fChangeDir("NEXTZXOS")
printat42(3, 0)
print42("chdir(NEXTZXOS)  = " + str(r) + "  expect 1")

r = fChangeDir("/")
printat42(4, 0)
print42("chdir(/)         = " + str(r) + "  expect 1")

' ---- TEST 2: fReadBanks + reusable handle --------------------------
c = fReadBanks("lorum_ipsum.txt", 40)
printat42(6, 0)
print42("readbanks -> " + str(c) + " banks loaded")

' If fReadBanks closed its file handle, we should be able to reopen the
' same file cleanly right after.
h = fOpenFile("lorum_ipsum.txt")
printat42(7, 0)
print42("reopen -> h=" + str(h) + "  expect nonzero")
if h <> 0 then
    fClose(h)
endif

' ---- TEST 3: fDelete idempotence -----------------------------------
h = fCreate("scratch.bin")
if h = 0 then
    printat42(9, 0)
    print42("could not create scratch.bin (skipped)")
else
    fClose(h)

    r = fDelete("scratch.bin")
    printat42(9, 0)
    print42("delete #1        = " + str(r) + "  expect 1")

    h = fCreate("scratch.bin")
    fClose(h)
    r = fDelete("scratch.bin")
    printat42(10, 0)
    print42("delete #2        = " + str(r) + "  expect 1")

    r = fDelete("scratch.bin")
    printat42(11, 0)
    print42("delete when gone = " + str(r) + "  expect 0")
endif

' ---- TEST 4: fRewindDir -------------------------------------------
dh = fOpenDir("/")
if dh = 0 then
    printat42(13, 0)
    print42("could not open dir (skipped)")
else
    first$ = fGetNextDir(dh)
    tmp$   = fGetNextDir(dh)
    tmp$   = fGetNextDir(dh)

    r = fRewindDir(dh)
    printat42(13, 0)
    print42("rewind           = " + str(r) + "  expect 1")

    after$ = fGetNextDir(dh)
    printat42(14, 0)
    print42("first before = " + first$)
    printat42(15, 0)
    print42("first after  = " + after$)

    if first$ = after$ then
        printat42(16, 0)
        print42("MATCH -- rewind ok")
    else
        printat42(16, 0)
        print42("MISMATCH -- rewind broken")
    endif

    fClose(dh)
endif

printat42(20, 0)
print42("done")

'border 0    ' clean up in case any unexpected call went through ffailed

do
    WaitRaster(192)
loop
