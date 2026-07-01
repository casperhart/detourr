# Shiny bindings for detourr

Output and render functions for using detourr with shiny. The output
function used must match both the display method and tour dim used, or
it will lead to strange behavour.

Creates a proxy object that can be used to add or remove points to a
detour instance that has already being rendered using
`shinyRenderDetour`. To be used in Shiny apps only.

The given points will have the original opacity while the other points
will have reduced opacity

The given points will have a larger size while the rest remains the same

Useful when detourr will not update unless put on focus

## Usage

``` r
detourOutput(output_id, width = "100%", height = "400px")

shinyRenderDetour(expr, env = parent.frame(), quoted = FALSE)

detour_proxy(id, session = shiny::getDefaultReactiveDomain())

add_points(
  proxy,
  points,
  .data = NULL,
  .col_means = NULL,
  .scale_factor = NULL,
  colour = "black",
  size = 1,
  alpha = 1
)

add_edges(proxy, edge_list)

highlight_points(proxy, point_list, alpha = 0.3)

enlarge_points(proxy, point_list, size = 2)

clear_points(proxy)

clear_edges(proxy)

clear_highlight(proxy)

clear_enlarge(proxy)

force_rerender(proxy)
```

## Arguments

- output_id:

  output variable to read from

- width, height:

  Must be a valid CSS unit (like `"100%"`, `"400px"`, `"auto"`) or a
  number, which will be coerced to a string and have `"px"` appended.

- expr:

  an expression that generates a detourr widget

- env:

  The environment in which to evaluate `expr`.

- quoted:

  Is `expr` a quoted expression (with
  [`quote()`](https://rdrr.io/r/base/substitute.html))? This is useful
  if you want to save an expression in a variable.

- id:

  output id of the detour instance

- session:

  the Shiny session object used in the app. Default should work for most
  cases

- proxy:

  proxy object created by `detour_proxy`

- points:

  Data.frame of points

- .data:

  Original dataset used in creating the detourr instance

- .col_means:

  Vector of column means of the original dataset. Defaults to the result
  of `attributes(scale(.data))[["scaled:center"]]`

- .scale_factor:

  Numeric value to multiply the centered data. Defaults to
  `1 / max(sqrt(rowSums(scale(.data)^2)))`

- colour:

  Vector or single value containing hex values of colors (or web colors)

- size:

  the size of the points to be enlarged

- alpha:

  The transparency value of the points outside of the point_list

- edge_list:

  Data.frame with two columns with the `from` node at first. The
  indexing of points starts with the original dataset. If `add_points`
  has been called before hand, the indexing of these points starts from
  the end of the original dataset.

- point_list:

  Numeric vector. indexes to enlarge in the prinary dataset

## Value

An output or render function that enables the use of the widget within
shiny applications

Proxy object to be used for piping

Proxy object to be used for piping
