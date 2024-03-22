
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

#' Send commands to a detourr instance in a Shiny app
#'
#' Creates a proxy object that can be used to add
#' or remove points to a detour instance that has
#' already being rendered using \code{\link{shinyRenderDisplayScatter3d}}.
#' To be used in Shiny apps only.
#' #TODO: Check if namespaced modules can work as well
#' @param id output id of the detourr instance
#' @param session the Shiny session object used in the app.
#' Default should work for most cases
#'
#' @rdname detour-shiny
#' @export
display_scatter_proxy <- function(id, session = shiny::getDefaultReactiveDomain()) { #nolint
  structure(list(id = id, session = session), class = "detourr_proxy")
}

#' @rdname detour-shiny
#' @export
add_points <- function(proxy, data) {
  # need to project it to 3 dimensions?
  message <- list(id = proxy$id, data = apply(data, 1, as.list))
  proxy$session$sendCustomMessage("add-points", message)
}
