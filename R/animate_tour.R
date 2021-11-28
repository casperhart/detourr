#' Animate a tour path.
#'
#' This is the function that powers all of the tour animations.  If you want
#' to write your own tour animation method, the best place to
#' start is by looking at the code for animation methods that have already
#' implemented in the package.
#' @inheritParams tourr::animate
#' @param data data frame containing columns to use for the tour.
#' @param cols column selection for the tour. Specified columns must be numeric.
#' Uses tidyselect syntax
#' @param display takes the display that is suppose to be used, defaults to
#'   the (3D) scatter display
#' @param render_opts list of render options containing some or all of:
#' - start:  projection to start at, if not specified, uses default associated
#' with tour path
#' - aps: target angular velocity (in radians per second)
#' - fps: target frames per second (defaults to 30). Higher fps can give
#' smoother animations, but at the expense of memory usage.
#' - max_bases: the maximum number of bases to generate. Defaults to 1 Unlike
#' the tourr package, d3tourr can only be used non-interactively so max_frames
#' has to be a finite number. This is so that the resulting animations can
#' remain independent of the R runtime.
#' @param width passed to htmlwidgets::htmlwidget
#' @param height passed to htmlwidgets::htmlwidget
#' @export
#' @examples
#' animate_tour(tourr::flea, -species, tourr::grand_tour(3), display_scatter())
animate_tour <- function(data,
                         cols = where(is.numeric),
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
                         width = NULL,
                         height = NULL) {
  col_spec <- rlang::enquo(cols)

  if (crosstalk::is.SharedData(data)) {
    crosstalk_key <- data$key()
    crosstalk_group <- data$groupName()
    data <- data$origData()
  }
  else {
    crosstalk_key <- NULL
    crosstalk_group <- NULL
  }

  tour_data <- get_tour_data_matrix(data, col_spec)

  if (!is.numeric(tour_data)) {
    rlang::abort(c("Tour data must be numeric",
      i = "Select numeric columns using the `cols` argument"
    ))
  }

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

  projection_matrices <- quiet(tourr::interpolate(
    bases,
    render_opts$aps / render_opts$fps
  ))
  projection_matrices <- purrr::array_branch(projection_matrices, 3)
  n_frames <- length(projection_matrices)

  # todo: tidy this up
  config <- display$init(data, col_spec)
  plot_config <- config[["plot"]]
  widget <- config[["widget"]]
  mapping <- config[["mapping"]]

  plot_config[["fps"]] <- render_opts$fps
  plot_config[["duration"]] <- n_frames / render_opts$fps

  plot_data <- list(
    config = plot_config,
    crosstalk = list(
      crosstalkIndex = crosstalk_key,
      crosstalkGroup = crosstalk_group
    ),
    mapping = mapping,
    dataset = tour_data,
    projectionMatrices = projection_matrices
  )

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
    width = width,
    height = height,
    package = "d3tourr",
    dependencies = crosstalk::crosstalkLibs(),
  )
}
