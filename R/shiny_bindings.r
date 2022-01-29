
#' Shiny bindings for detourr
#'
#' Output and render functions for using detourr with shiny. The output
#' function used must match both the display method and tour dim used,
#' or it will lead to strange behavour.
#'
#' @inheritParams htmlwidgets::shinyRenderWidget
#' @inheritParams htmlwidgets::shinyWidgetOutput
#'
#' @param output_id output variable to read from
#' @param expr an expression that generates a {detourr} widget, i.e. a call
#' to `animate_tourr`
#'
#' @name detourr-shiny

#' @export
shinyRenderTour <- function(expr, env = NULL) {
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

#' @rdname detourr-shiny
#' @export
displayScatter2dOutput <- function(output_id,
                                   width = "100%",
                                   height = "400px") {
  shinyTourOutput(output_id,
    widget_name = "display_scatter_2d",
    width = width,
    height = height
  )
}


#' @rdname detourr-shiny
#' @export
displayScatter3dOutput <- function(output_id,
                                   width = "100%",
                                   height = "400px") {
  shinyTourOutput(output_id,
    widget_name = "display_scatter_3d",
    width = width,
    height = height
  )
}

shinyTourOutput <- function(output_id,
                            widget_name = NULL,
                            width,
                            height) {
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
