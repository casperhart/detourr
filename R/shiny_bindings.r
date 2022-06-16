
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
#' @param expr an expression that generates a {detourr} widget
#'
#' @return An output or render function that enables the use of the widget
#' within shiny applications
#' 
#' @name detour-shiny
#' @export
displayScatter3dOutput <- function(output_id,
                                   width = "100%",
                                   height = "400px") {
  htmltools::attachDependencies(
    shiny::tagList(
      htmlwidgets::shinyWidgetOutput(output_id, "show_scatter_3d",
        width, height,
        package = "detourr"
      )
    ),
    crosstalk::crosstalkLibs()
  )
}

#' @rdname detour-shiny
#' @export
displayScatter2dOutput <- function(output_id,
                                   width = "100%",
                                   height = "400px") {
  htmltools::attachDependencies(
    shiny::tagList(
      htmlwidgets::shinyWidgetOutput(output_id, "show_scatter_2d",
        width, height,
        package = "detourr"
      )
    ),
    crosstalk::crosstalkLibs()
  )
}

#' @rdname detour-shiny
#' @export
shinyRenderDisplayScatter2d <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) {
    expr <- substitute(expr)
  }
  htmlwidgets::shinyRenderWidget(expr, displayScatter2dOutput, quoted = TRUE, env = env)
}

#' @rdname detour-shiny
#' @export
shinyRenderDisplayScatter3d <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) {
    expr <- substitute(expr)
  }
  htmlwidgets::shinyRenderWidget(expr, displayScatter3dOutput, quoted = TRUE, env = env)
}
