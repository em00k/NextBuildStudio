(c)2026 em00k for NextBuildStudio

This is a software tile map full 320x256 16x16 256 colour, 4 way hardware scrolling map.

The map is 32 x 24 16x16 tiles wide and tall. Each byte in the map dicateds what 16x16 tile should
be drawn on screen.

You would need to adjust the world MAPW & MAPH if you want to make your map larger.

The drawn columns always appear on the bottom or right edges, these are hidden by the
ClipLayer2() command in the drawmap() routine

ClipLayer2(4,128+24,16,255-16)

This clips just enough to hide the drawn tiles.

FOUR ELEMENTS... pt3 by DjDENSON (not used but need for sfx system)