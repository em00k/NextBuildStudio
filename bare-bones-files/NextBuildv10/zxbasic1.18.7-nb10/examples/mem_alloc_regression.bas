#include <alloc.bas>

sub check(byval ok as ubyte, byval id as ubyte)
    if ok then
        print "OK  "; id
    else
        print "FAIL"; id
    end if
end sub

dim p as uinteger
dim q as uinteger
dim i as uinteger
dim ok as ubyte

print "Allocator regression test"

' 1) allocate/deallocate sanity
p = allocate(16)
ok = (p <> 0)
if ok then
    deallocate(p)
end if
check(ok, 1)

' 2) callocate() must zero initialize
p = callocate(8)
ok = (p <> 0)
if ok then
    for i = 0 to 7
        if peek(cast(uinteger, p + i)) <> 0 then
            ok = 0
            exit for
        end if
    next i
    deallocate(p)
end if
check(ok, 2)

' 3) callocate(0) should be safe (no crash/overflow)
p = callocate(0)
if p <> 0 then
    deallocate(p)
end if
check(1, 3)

' 4) reallocate grow must preserve previous bytes
p = allocate(8)
ok = (p <> 0)
if ok then
    for i = 0 to 7
        poke cast(uinteger, p + i), cast(ubyte, i + 1)
    next i
    q = reallocate(p, 20)
    ok = (q <> 0)
    if ok then
        for i = 0 to 7
            if peek(cast(uinteger, q + i)) <> cast(ubyte, i + 1) then
                ok = 0
                exit for
            end if
        next i
        deallocate(q)
    end if
end if
check(ok, 4)

' 5) reallocate shrink must preserve prefix bytes
p = allocate(16)
ok = (p <> 0)
if ok then
    for i = 0 to 15
        poke cast(uinteger, p + i), cast(ubyte, i + 3)
    next i
    q = reallocate(p, 6)
    ok = (q <> 0)
    if ok then
        for i = 0 to 5
            if peek(cast(uinteger, q + i)) <> cast(ubyte, i + 3) then
                ok = 0
                exit for
            end if
        next i
        deallocate(q)
    end if
end if
check(ok, 5)

' 6) reallocate(ptr, 0) should free and return NULL
p = allocate(10)
ok = (p <> 0)
if ok then
    q = reallocate(p, 0)
    ok = (q = 0)
end if
check(ok, 6)

' 7) realloc OOM should fail without invalidating old block
p = allocate(8)
ok = (p <> 0)
if ok then
    poke p, 85
    poke cast(uinteger, p + 1), 170
    q = reallocate(p, cast(uinteger, 65535))
    if q = 0 then
        ok = (peek(p) = 85 and peek(cast(uinteger, p + 1)) = 170)
        deallocate(p)
    else
        ' Unexpectedly succeeded. Still valid behavior for this test.
        deallocate(q)
        ok = 1
    end if
end if
check(ok, 7)

print "Done"
