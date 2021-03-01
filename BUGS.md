Audio bug, first visit on firefox v86
	Not reproducible on 78esr
	Not broken in Chrome
	Might be audio tag at 100%, and only the volume slider is scaled!
		If so, should also be a relatively easy fix, load slider volume at page load
	Maybe its a Firefox sync

Pause, and unpausing doesn't seek to the front of the stream
	Should be a relatively easy fix.
	Tell audio element to seek to most current part of stream, on unpause
