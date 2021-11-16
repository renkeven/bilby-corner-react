# bilby-corner-react

js components in src

requires classes in main.css to properly manage overflow of recharts divs.

<img src="sample/sample_output.png" align="middle" width="400">


recharts does not have a contour plotting function, thus we have used SVG polygon to draw contours the plotting area. the contours will overflow (if
allowed) as overflow was toggled on recharts-surface to allow the ticks to be freely drawn. 

recharts has limited syncing abilities: https://recharts.org/en-US/examples/SynchronizedLineChart . furthermore, recharts does not have a drag 
function, only brush (1d drag). a limited fix may be to limit domain changes only by doing the brush action on the histogram, while the corners are 
essentially non-interactive.

another possible way to do zoom (for a single plot) would be to use the onMouseDown attribute on the actual plot to set the appropriate useState hooks
(left-right, up-down), have it referenceArea with the mentioned hooks, and zoom in (make axis dimension states that is set with zoom) onMouseUp.

