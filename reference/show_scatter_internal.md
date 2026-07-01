# Internal method for 2D and 3D Scatter Plot Display

Internal method for 2D and 3D Scatter Plot Display

## Usage

``` r
show_scatter_internal(
  x,
  ...,
  palette = viridisLite::viridis,
  center = TRUE,
  axes = TRUE,
  edges = NULL,
  paused = TRUE,
  scale_factor = NULL,
  loop = TRUE
)
```

## Arguments

- x:

  a `detour` object

- ...:

  used to support aesthetic parameters for the plot, including

  - size: point size, defaults to 1

  - alpha: point opacity, defaults to 1

  - background_colour: defaults to "white"

  - edge_colour: colour of edges, defaults to black

  - edge_width: width of edges, defaults to 1

- palette:

  Colour palette to use with the colour aesthetic. Can be:

  - A character vector of R colours. This should match the number of
    levels of the colour aesthetic, or the number of bins to use for
    continuous colours.

  - A function which takes the number of colours to use as input and
    returns a character vector of colour names and / or hex values as
    output.

- center:

  If TRUE, center the projected data to (0, 0, 0).

- axes:

  Can be one of:

  - `TRUE` draw axes and use column names for axis labels

  - `FALSE` do not draw axes or labels

  - `NULL` draw axes with no labels

  - An unnamed vector of labels with the same length as `cols`

  - A named vector in the form `c("h" = "head")`, where `head` is
    renamed to `h`

- edges:

  A two column numeric matrix giving indices of ends of lines.

- paused:

  whether the widget should be initialised in the 'paused' state

- scale_factor:

  used as a multiplier for the point coordinates so they are displayed
  on a sensible range. Defaults to the reciprocal of maximum distance
  from a point to the origin.

- loop:

  whether to loop back to the beginning automatically when the animation
  reaches the end

## Value

An object of class `htmlwidget`

## Details

This display method produces an interactive scatterplot animation which
supports both 2D and 3D tours. Linked selection and filtering is also
supported using crosstalk. The set of interactive controls available
are:

- A timeline with a play / pause button and indicators at the position
  of each basis used. The basis indicators can be hovered with the mouse
  to show the index of the basis, or clicked to jump to that basis. The
  timeline also allows for clicking and dragging of the scrubber to move
  to any individual frame of the animation.

- Orbit controls. For the 2D variant, this allows the projection to be
  rotated by clicking and dragging from left to right. For the 3D
  variant, full orbit controls are available by clicking and dragging.
  For both orbit and pan controls, the scroll wheel can be used to zoom.

- Pan controls, which work similarly to orbit controls but move the
  camera laterally / vertically rather than rotating

- Resetting of the orbit and pan controls

- Selection and highlighting. Multiple selection is possible by using
  the shift key

- Colouring / brushing of highlighted points
