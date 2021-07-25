#' Animate a tour path.
#'
#' This is the function that powers all of the tour animations.  If you want
#' to write your own tour animation method, the best place to
#' start is by looking at the code for animation methods that have already
#' implemented in the package.
#' @inheritParams tourr::animate
#' @param data data frame containing columns to use for the tour.
#' @param cols column selection for the tour. Specified columns must be numeric. Uses tidyselect syntax
#' @param display takes the display that is suppose to be used, defaults to
#'   the (3D) scatter display
#' @param render_opts list of render options containing some or all of:
#' - start:  projection to start at, if not specified, uses default associated with tour path \cr
#' - aps: target angular velocity (in radians per second)
#' - fps: target frames per second (defaults to 30)
#' - max_bases: the maximum number of bases to generate. Defaults to 1 Unlike the tourr package,
#'    d3tourr can only be used non-interactively so max_frames has to be a finite number. This is so that
#'    the resulting animations can remain independent of the R runtime.
#'
#' @param raw_json_outfile path to save data which is normally passed to htmlwidgets. Useful for devlelopment.
#' @export
#' @examples
#' animate_tour(tourr::flea, -species, tourr::grand_tour(3), display_scatter())
animate_tour <- function(data,
                         cols = everything(),
                         tour_path = tourr::grand_tour(d = 2),
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
  # todo: subtract aesthetic columns from col_spec if col_spec is not specified
  col_spec <- rlang::enquo(cols)
  tour_data <- get_tour_data_matrix(data, col_spec)

  # merge default render_opts with specified
  render_opts_defaults <- eval(formals()$render_opts)
  render_opts <- merge_defaults_list(render_opts, render_opts_defaults)

  if (rescale) tour_data <- tourr::rescale(tour_data)
  if (sphere) tour_data <- tourr::sphere_data(tour_data)

  # can only run non-interactively, unlike in tourr
  if (render_opts$max_bases == Inf) {
    rlang::abort("Argument `max_frames` must be a finite number.")
  }

  bases <- quiet(tourr::save_history(
    data = tour_data,
    tour_path = tour_path,
    max_bases = render_opts$max_bases,
    start = render_opts$start
  ))

  projectionMatrices <- quiet(tourr::interpolate(bases, render_opts$aps / render_opts$fps))
  projectionMatrices <- purrr::array_branch(projectionMatrices, 3)
  n_frames <- length(projectionMatrices)

  # todo: tidy this up
  config <- display$init(data)
  plot_config <- config[["plot"]]
  widget <- config[["widget"]]
  mapping <- config[["mapping"]]

  plot_config[["fps"]] <- render_opts$fps
  plot_config[["duration"]] <- n_frames / render_opts$fps

  plot_data <- list(
    "config" = plot_config,
    "dataset" = tour_data,
    "mapping" = mapping,
    "projectionMatrices" = projectionMatrices
  )

  # useful for regenerating sample data for development
  if (raw_json_outfile != "") {
    writeLines(jsonlite::toJSON(plot_data, digits = 4, auto_unbox = TRUE), raw_json_outfile)
  }

  htmlwidgets::createWidget(
    widget,
    plot_data,
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