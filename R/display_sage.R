#' 2D and 3D Sage Tour Display
#'
#' @description
#' An implementation of the Sage Tour described in Laa et al., 2021. It uses
#' a radial transformation on the projected data so that the relative volume
#' is preserved when the data is projected. I.e. a uniform distribution in
#' the original space will remain uniformly distributed in the projected space.
#' Includes both 2D and 3D variations.
#'
#' @inherit display_scatter_internal details
#' @inheritParams display_scatter_internal
#' @param gamma the gamma parameter for scaling the effective dimensionality
#' for the sage tour radial transformation. defaults to 1
#' @param R scale for the radial transformation. Defaults to `scale_factor` times
#' the maximum distance from the origin to each row of data. If the default
#' `scale_factor` is used this will result in `R=1`. Because the `R` and
#' `scale_factor` parameters interact with one another, it is recommended to
#' leave `scale_factor` at its default value, and modify `R` if needed.
#' @references
#' Laa, U., Cook, D., & Lee, S. (2021). Burning sage: Reversing the curse of
#' dimensionality in the visualization of high-dimensional data. Journal of
#' Computational and Graphical Statistics, 1-10.
#' @examples
#' detour(tourr::flea, tour_aes(projection = -species, colour = species)) |>
#'   tour_path(grand_tour(3), fps = 60) |>
#'   display_sage(gamma = 2)
#' @seeAlso display_scatter
#' @export
display_sage <- function(x,
                         ...,
                         palette = viridisLite::viridis,
                         center = TRUE,
                         axes = TRUE,
                         edges = NULL,
                         paused = TRUE,
                         scale_factor = NULL,
                         gamma = 1,
                         R = NULL) {
  dots <- list(...)

  x <- display_scatter_internal(x,
    ...,
    palette = palette, center = center,
    axes = axes,
    edges = edges,
    paused = paused,
    scale_factor = scale_factor
  )

  d <- attributes(x)

  if (rlang::is_null(R)) {
    R <- max(sqrt(rowSums(d$dataset^2)))
  }

  d$config$R <- R
  d$config$effectiveInputDim <- gamma * tour_input_dim(x)

  x <- make_detour(x, d)

  widget <- paste0("display_sage", "_", tour_output_dim(x), "d")

  make_widget(x, widget, dots$width, dots$height, d$crosstalk$crosstalk_libs)
}
