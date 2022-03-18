#' 2D and 3D Slice Display for Tours
#'
#' @description
#' An implementation of the Slice Tour described in Laa et al., 2020. Points
#' close to the projection plane are highlighted, and those far away are
#' faded out.
#'
#' @inherit display_scatter_internal details
#' @inheritParams display_scatter_internal
#' @param slice_relative_volume number default 0.1. Controls the relative
#' volume of the slice and thus the number of points which are highlighted.
#' This is an approximate value and is only accurate for values << 1
#' @references
#' Laa, U., Cook, D., & Valencia, G. (2020). A slice tour for finding
#' hollowness in high-dimensional data. Journal of Computational and
#' Graphical Statistics, 29(3), 681-687.
#' @examples
#' x <- geozoo::torus(p = 4, n = 10000)$points |>
#'   tibble::as_tibble(.name_repair = "unique")
#'
#' detour(x, tour_aes(projection = everything())) |>
#'   tour_path(grand_tour(2)) |>
#'   display_slice(slice_relative_volume = 0.1)
#' @seeAlso display_scatter
#' @export
display_slice <- function(x,
                          ...,
                          palette = viridisLite::viridis,
                          center = TRUE,
                          axes = TRUE,
                          edges = NULL,
                          paused = TRUE,
                          scale_factor = NULL,
                          slice_relative_volume = 0.1) {
  dots <- list(...)

  x <- display_scatter_internal(x,
    ...,
    palette = palette, center = center,
    axes = axes,
    edges = edges,
    paused = paused,
    scale_factor = scale_factor
  )

  p <- tour_input_dim(x)

  d <- attributes(x)

  d$config$epsilon <- slice_relative_volume^(1 / (p - tour_output_dim(x)))

  x <- make_detour(x, d)

  widget <- paste0("display_slice", "_", tour_output_dim(x), "d")

  make_widget(x, widget, dots$width, dots$height, d$crosstalk$crosstalk_libs)
}
