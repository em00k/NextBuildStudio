'!org=24576

#define NEX 
#define IM2 

#include <nextlib.bas>

' NBS can build and send files directly into NextZXOS! 
' First, lets launch CSpect with NextZXOS - Click "Start NextZXOS" on the bottom 
' button. Use ESC to quit. 

' To instruct NBS to sync the files, use the following in your .bas file 
 
'!nb=autostart(dir=/games,copy=/nextzxos/autoexec.bas,sync=all)

' this will copy the NEX to the NextZXOS image, create an autostart and sync all files in DATA
' Compile this program, then click "HDF Sync" then "Start NextZXOS" : it should auto launch.
' Press F3 to reset then hold shift+space to skip auto launch! 

paper 2 : ink 6 : border 0 : cls 

print "This is our NextZXOS test!"


' do a eternal loop to stop the program crashing on exit (this is a quirk of launching NEX
' files)

do : loop 

' Click "HDF Sync" and then "Start NextZXOS", go into the 