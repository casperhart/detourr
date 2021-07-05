#' Animate a tour path.
#'
#' This is the function that powers all of the tour animations.  If you want
#' to write your own tour animation method, the best place to
#' start is by looking at the code for animation methods that have already
#' implemented in the package.
#'
#' @param data matrix, or data frame containing numeric columns
#' @param tour_path tour path generator, defaults to 2d grand tour
#' @param start projection to start at, if not specified, uses default
#'   associated with tour path
#' @param display takes the display that is suppose to be used, defaults to
#'   the xy display
#' @param render_opts list lof render options. \cr
#' start:  projection to start at, if not specified, uses default associated with tour path \cr
#' aps: target angular velocity (in radians per second) \cr
#' fps: target frames per second (defaults to 10 \cr
#' max_bases: the maximum number of bases to generate. Defaults to 1 Unlike the tourr package,
#'    d3tourr can only be used non-interactively so max_frames has to be a finite number. This is so that
#'    the resulting animations can remain independent of the R runtime.
#' @param rescale if true, rescale all variables to range [0,1]
#' @param sphere if true, sphere all variables
#' @param ... ignored
#' @param raw_json_outfile path to save data which is normally passed to htmlwidgets. Useful for devlelopment.
#' @return an (invisible) list of bases visited during this tour
#' @references Hadley Wickham, Dianne Cook, Heike Hofmann, Andreas Buja
#'   (2011). tourr: An R Package for Exploring Multivariate Data with
#'   Projections. Journal of Statistical Software, 40(2), 1-18.
#'   \url{https://www.jstatsoft.org/v40/i02/}.
#' @export
#' @examples
#' f <- flea[, 1:6]
#' animate_tour(f, tourr::grand_tour(), display_xy())
animate_tour <- function(data,
                         tour_path = tourr::grand_tour(d = 3),
                         display = d3tourr::display_scatter(),
                         render_opts = list(
                           start = NULL,
                           aps = 1,
                           fps = 30,
                           max_bases = 2
                         ),
                         rescale = TRUE,
                         sphere = FALSE,
                         raw_json_outfile = "") {

  # merge default render_opts with specified
  render_opts_defaults <- eval(formals()$render_opts)
  for (key in names(render_opts)) {
    render_opts_defaults[[key]] <- render_opts[[key]]
  }
  render_opts <- render_opts_defaults

  if (!is.matrix(data)) {
    if (verbose) {
      message("Converting input data to the required matrix format.")
    }
    data <- as.matrix(data)
  }

  if (rescale) data <- tourr::rescale(data)
  if (sphere) data <- tourr::sphere_data(data)
  # can only run non-interactively, unlike in tourr
  if (render_opts$max_bases == Inf) {
    abort("Argument max_frames must be a finite number")
  }

  bases <- tourr::save_history(
    data = data,
    tour_path = tour_path,
    max_bases = render_opts$max_bases,
    start = render_opts$start
  )

  projectionMatrices <- tourr::interpolate(bases, render_opts$aps / render_opts$fps)
  projectionMatrices <- apply(projectionMatrices, 3, identity, simplify = FALSE)
  n_frames <- length(projectionMatrices)

  config <- display$init(data)
  plot_config <- config[["plot"]]
  widget <- config[["widget"]]

  plot_config[["fps"]] <- render_opts$fps
  plot_config[["duration"]] <- n_frames / render_opts$fps

  data <- list(
    "config" = plot_config,
    "dataset" = data,
    "projectionMatrices" = projectionMatrices
  )

  # useful for regenerating sample data for development
  if (raw_json_outfile != "") {
    writeLines(jsonlite::toJSON(data, digits = 4, auto_unbox = TRUE), raw_json_outfile)
  }

  htmlwidgets::createWidget(
    widget,
    data,
    sizingPolicy = htmlwidgets::sizingPolicy(
      viewer.padding = 0,
      viewer.paneHeight = 500,
      browser.fill = TRUE,
      knitr.defaultWidth = 800,
      knitr.defaultHeight = 500
    ),
    package = "d3tourr",
  )
}