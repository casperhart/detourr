# Generate a tour path for a detour object

This function takes a `detour` object as an input, and generates a
sequence of projection matrices for the tour. The return value is
another `detour` object with the tour path and other metadata attached.
This can then be passed to a `show_*`\#' function to generate the detour
visualisation.

## Usage

``` r
tour_path(
  x,
  tour_path = grand_tour(2),
  start = NULL,
  aps = 1,
  fps = 30,
  max_bases = 10
)
```

## Arguments

- x:

  a `detour` object

- tour_path:

  tour path generator, defaults to 2d grand tour

- start:

  projection to start at, if not specified, uses default associated with
  tour path

- aps:

  target angular velocity (in radians per second)

- fps:

  target frames per second

- max_bases:

  the maximum number of bases to generate

## Value

A `detour` object containing information about the tour path and its
parameters
