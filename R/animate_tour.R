#' Animate a tour path.
#'
#' This is the function that powers all of the tour animations.  If you want
#' to write your own tour animation method, the best place to
#' start is by looking at the code for animation methods that have already
#' implemented in the package.
#' @inheritParams tourr::animate
#' @param data data frame containing columns to use for the tour.
#' @param display takes the display that is suppose to be used, defaults to
#'   the (2D) scatter display
#' @param cols column selection for the tour. Specified columns must be numeric.
#' Uses tidyselect syntax, and defaults to all numeric columns.
#' @param ... used to pass additional arguments `start`, `aps`, `fps`,
#' and `max_bases` through to {tourr}, as well as `width` and
#' `height` to {HTMLWidgets}
#' @importFrom utils object.size
#' @export
#' @examples
#' animate_tour(tourr::flea, tourr::grand_tour(3), display_scatter())
animate_tour <- function(data,
                         tour_path = tourr::grand_tour(d = 2),
                         display = display_scatter(),
                         cols = where(is.numeric),
                         ...,
                         rescale = TRUE,
                         sphere = FALSE) {
  col_spec <- rlang::enquo(cols)
  dots <- list(...)
  check_dots(
    dots,
    c("width", "height", "start", "aps", "fps", "max_bases")
  )

  if (inherits(data, "SharedData")) {
    crosstalk_key <- data$key()
    crosstalk_group <- data$groupName()
    data <- data$origData()
    crosstalk_dependencies <- crosstalk::crosstalkLibs()
  } else {
    crosstalk_key <- NULL
    crosstalk_group <- NULL
    crosstalk_dependencies <- NULL
  }

  tour_data <- get_tour_data_matrix(data, col_spec)

  # for large data sets, matrix multiplication is a bottleneck in the browser
  # TODO: WASM library for matrix multiplication?
  if (object.size(tour_data) > 1e6) {
    rlang::warn(paste(
      "It seems your data is quite large, and may lead",
      "to performance issues in the browser."
    ))
  }

  if (!is.numeric(tour_data)) {
    rlang::abort(c("Tour data must be numeric",
      i = "Select numeric columns using the `cols` argument"
    ))
  }

  # merge default render_opts with specified
  render_opts_defaults <- list(
    start = NULL,
    aps = 1,
    fps = 30,
    max_bases = 10
  )
  render_opts <- merge_defaults_list(dots, render_opts_defaults)

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

  basis_indices <- numeric(0)
  if (!rlang::is_null(attr(projection_matrices, "new_basis"))) {
    basis_indices <- which(attr(projection_matrices, "new_basis")) - 1
  }

  projection_matrices <- purrr::array_branch(projection_matrices, 3)
  n_frames <- length(projection_matrices)

  # todo: tidy this up

  config <- display$init(data, col_spec, dim(bases)[2])
  plot_config <- config[["plot"]]
  widget <- config[["widget"]]
  mapping <- config[["mapping"]]

  plot_config[["fps"]] <- render_opts$fps
  plot_config[["duration"]] <- n_frames / render_opts$fps
  plot_config[["basisIndices"]] <- basis_indices
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
    package = "detourr",
    dependencies = crosstalk_dependencies,
    width = dots$width,
    height = dots$height
  )
}


#' Shiny bindings for detourr
#'
#' Output and render functions for using detourr with shiny
#'
#' @inheritParams htmlwidgets::shinyRenderWidget
#' @inheritParams htmlwidgets::shinyWidgetOutput
#'
#' @param output_id output variable to read from
#' @param widget_name name of {detourr} widget being used.
#' E.g. `display_scatter_2d`, `display_scatter_3d`
#' @param expr an expression that generates a {detourr} widget, i.e. a call
#' to `animate_tourr`
#'
#' @name detourr-shiny
#'
#' @export
detourrOutput <- function(output_id,
                          widget_name = NULL,
                          width = "100%",
                          height = "400px") {
  if (rlang::is_null(widget_name)) {
    rlang::abort(c("`widget_name` not supplied",
      i = "expected widget name, e.g. `display_scatter_2d`"
    ))
  }
  htmltools::attachDependencies(
    shiny::tagList(
      htmlwidgets::shinyWidgetOutput(output_id, widget_name,
        width, height,
        package = "detourr"
      )
    ),
    crosstalk::crosstalkLibs()
  )
}

#' @rdname detourr-shiny
#' @export
renderDetourr <- function(expr, env = NULL) {
  expr <- rlang::enquo(expr)
  env <- env %||% rlang::quo_get_env(expr)
  expr <- rlang::quo_get_expr(expr)

  # get call to animate_tour, so we can figure out which widget is being used
  if (rlang::call_name(expr) == "animate_tour") {
    fn <- expr
  } else if (rlang::call_name(expr) == "{") {
    # get call to animate tour from within {}
    animate_calls <- which(purrr::map_lgl(
      expr,
      ~ is.call(.) && rlang::call_name(.) == "animate_tour"
    ))
    fn <- expr[[animate_calls]]
  }

  call_params <- as.list(fn[-1])
  default_params <- formals("animate_tour")

  # get tour path from call to animate_tour
  tour_path <- call_params[["tour_path"]] %||% default_params[["tour_path"]]
  tour_path <- match.call(rlang::call_fn(tour_path), call = tour_path)
  dim <- as.list(tour_path)$d

  # get display method from call to animate_tour
  display <- call_params[["display"]] %||% default_params[["display"]]
  display <- rlang::call_name(display)

  widget <- infer_widget(display, dim)
  widget_fun <- function(...) detourrOutput(..., widget = widget)

  htmlwidgets::shinyRenderWidget(expr, widget_fun, quoted = TRUE, env = env)
}
