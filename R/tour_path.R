
#' Generate a tour path for a detour object
#'
#' This function takes a `detour` object as an input, and generates a
#' sequence of projection matrices for the tour. The return value is another
#' `detour` object with the tour path and other metadata attached. This can
#' then be passed to a `display_*`#' function to generate the detour
#' visualisation.
#'
#' @inheritParams tourr::animate
#' @param x a `detour` object
#' @param fps target frames per second
#' @param max_bases the maximum number of bases to generate
#' @export
tour_path <- function(x, tour_path = grand_tour(2),
                      start = NULL, aps = 1, fps = 30,
                      max_bases = 10) {
  if (!is_detour(x)) {
    rlang::abort(c("x must be a `detour` object", x = paste("got:", class(x)[1])))
  }
  d <- attributes(x)

  bases <- quiet(tourr::save_history(
    data = d$dataset,
    tour_path = tour_path,
    max_bases = max_bases,
    start = start
  ))

  projection_matrices <- quiet(tourr::interpolate(
    bases,
    aps / fps
  ))

  basis_indices <- numeric(0)
  if (!rlang::is_null(attr(projection_matrices, "new_basis"))) {
    basis_indices <- which(attr(projection_matrices, "new_basis")) - 1
  }
  projection_matrices <- purrr::array_branch(projection_matrices, 3)
  n_frames <- length(projection_matrices)

  d$config <- list(
    fps = fps,
    duration = n_frames / fps,
    basisIndices = basis_indices
  )

  x <- structure(projection_matrices)
  attributes(x) <- d
  x
}
