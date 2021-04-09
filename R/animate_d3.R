#' Animate a tour path.
#'
#' This is the function that powers all of the tour animations.  If you want
#' to write your own tour animation method, the best place to
#' start is by looking at the code for animation methods that have already
#' implemented in the package.
#'
#' See \code{\link{render}} to render animations to disk.
#'
#' @param data matrix, or data frame containing numeric columns
#' @param tour_path tour path generator, defaults to 2d grand tour
#' @param start projection to start at, if not specified, uses default
#'   associated with tour path
#' @param display takes the display that is suppose to be used, defaults to
#'   the xy display
#' @param aps target angular velocity (in radians per second)
#' @param fps target frames per second (defaults to 10
#' @param max_frames the maximum number of bases to generate. Defaults to 1 Unlike the tourr package,
#'    d3tourr can only be used non-interactively so max_frames has to be a finite number. This is so that
#'    the resulting animations can remain independent of the R runtime.
#' @param rescale if true, rescale all variables to range [0,1]?
#' @param sphere if true, sphere all variables
#' @param ... ignored
#' @return an (invisible) list of bases visited during this tour
#' @references Hadley Wickham, Dianne Cook, Heike Hofmann, Andreas Buja
#'   (2011). tourr: An R Package for Exploring Multivariate Data with
#'   Projections. Journal of Statistical Software, 40(2), 1-18.
#'   \url{https://www.jstatsoft.org/v40/i02/}.
#' @export
#' @examples
#' f <- flea[, 1:6]
#' animate_d3(f, tourr::grand_tour(), display_xy())
#' # or in short
#' animate(f)
#' animate(f, max_frames = 30)
#' \dontrun{
#' animate(f, max_frames = 10, fps = 1, aps = 0.1)
#' }
animate_d3 <- function(data, tour_path = tourr::grand_tour(), display = d3tourr::display_xy(),
                       start = NULL, aps = 1, fps = 10, max_duration_seconds, max_frames = 2,
                       rescale = TRUE, sphere = FALSE, verbose = FALSE, ...) {
  if (!missing(max_duration_seconds)) {
    max_frames <- max_duration_seconds * fps
  }

  record <-
    dplyr::tibble(
      basis = list(),
      index_val = numeric(),
      info = character(),
      method = character(),
      alpha = numeric(),
      tries = numeric(),
      loop = numeric()
    )
  if (!is.matrix(data)) {
    if (verbose) {
      message("Converting input data to the required matrix format.")
    }
    data <- as.matrix(data)
  }

  if (rescale) data <- tourr::rescale(data)
  if (sphere) data <- tourr::sphere_data(data)

  # can only run non-interactively, unlike in tourr
  if (max_frames == Inf) {
    stop("Argument max_frames must be a finite number")
  }

  tour <- tourr::new_tour(data, tour_path, start, ...)
  start <- tour(0, ...)

  projections <- vector("list", max_frames)

  # convert projection matrix to a list so it can later be serialised to json
  for (i in 1:max_frames) {
    proj_mat <- quiet(tour(aps / fps, ...)$proj)
    projections[[i]] <- (proj_mat)
  }

  config <- display$init(data)
  plot_config <- config[["plot"]]
  widget <- config[["widget"]]

  plot_config[["fps"]] <- fps

  data <- list(
    "config" = plot_config,
    "data" = data,
    "projections" = projections
  )

  htmlwidgets::createWidget(widget, data, width = 900, height = 900, package = "d3tourr")
}