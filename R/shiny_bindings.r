
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
#' @param id output id of the detourr instance
#' @param session the Shiny session object used in the app.
#' Default should work for most cases
#'
#' @rdname detour-shiny
#' @export
display_scatter_proxy <- function(id, session = shiny::getDefaultReactiveDomain()) { #nolint
  structure(list(id = id, session = session), class = "detourr_proxy")
}

#' @title Add a set of points to an existing detourr instance in Shiny
#' @param proxy Proxy object created by \code{\link{display_scatter_proxy}}
#' @param points Data.frame of points
#' @param .data Original dataset used in creating the detourr instance
#' @param .col_means Vector of column means of the original dataset.
#'  Defaults to the result of `attributes(scale(.data))[["scaled:center"]]`
#' @param .scale_factor Numeric value to multiply the centered data.
#' Defaults to `1 / max(sqrt(rowSums(scale(.data)^2)))`
#' @param colour Vector or single value containing hex values of colors (or web colors)
#' @param size Numeric value for the size of the added points
#' @param alpha Transparency of the added points
#' @return Proxy object to be used for piping
#' @rdname detour-shiny
#' @export
add_points <- function(
  proxy,
  points,
  .data = NULL,
  .col_means = NULL,
  .scale_factor = NULL,
  colour = "black",
  size =  1,
  alpha = 1
) {
  if (is.null(.data)) {
    if (is.null(.col_means) || is.null(.scale_factor)) {
      cli::cli_abort(c(
        "Either {.var .data} or both {.var .col_means} and {.var .scale_factor} should be given",
        "i" = "Pass the data used to create the detourr instance as {.var .data}"
      ))
    }
  } else {
    scaled_data <- scale(.data, scale = FALSE)
    .col_means <- attributes(scaled_data)[["scaled:center"]]
    .scale_factor <- 1 / max(sqrt(rowSums(scaled_data^2)))
  }
  points <- unname(as.matrix(points)) |>
    scale(
      center = .col_means,
      scale = FALSE
    )
  points <- points * .scale_factor
  message <- list(
    id = proxy$id,
    data = apply(points, 1, as.list),
    config = list(
      colour = colour,
      size = size,
      alpha = alpha
    )
  )
  if (!is.null(proxy$message)) {
    # previous proxy message exists
    proxy$message$data <- message$data
    proxy$message$config <- message$config
  } else {
    proxy$message <- message
  }
  proxy$session$sendCustomMessage("add-points", proxy$message)
  return(proxy)
}

#' @title Function to add a bunch of lines to existing shiny instance
#'
#' @param proxy Proxy object created by \code{\link{display_scatter_proxy}}
#' @param edge_list Data.frame with two columns with the `from` node at first.
#' The indexing of points starts with the original dataset.
#' If \code{\link{add_points}} has been called before hand,
#' the indexing of these points starts from the end of the original dataset.
#' @return Proxy object to be used for piping
#' @rdname detour-shiny
#' @export
add_edges <- function(proxy, edge_list) {
  edge_list <- edge_list |> as.matrix() |> unname()
  proxy$message$edges <- apply(edge_list, 1, as.list)
  proxy$session$sendCustomMessage("add-edges", proxy$message)
  return(proxy)
}

#' Function to highlight a given set of points
#'
#' The given points will have the original opacity while the other points
#' will have reduced opacity
#'
#' @param proxy proxy object created by \code{\link{display_scatter_proxy}}
#' @param point_list Numeric vector. indexes to highlight in the prinary dataset
#' @param alpha The transparency value of the points outside of the point_list
#' @rdname detour-shiny
#' @export
highlight_points <- function(proxy, point_list, alpha = 0.3) {
  if (length(point_list) == 1) {
    point_list <- list(point_list)
  }
  proxy$message$point_list <- point_list
  proxy$session$sendCustomMessage("highlight-points", proxy$message)
  return(proxy)
}

#' Function to enlarge a given set of points
#'
#' The given points will have a larger size while the rest
#' remains the same
#'
#' @param proxy proxy object created by \code{\link{display_scatter_proxy}}
#' @param point_list Numeric vector. indexes to enlarge in the prinary dataset
#' @param size the size of the points to be enlarged
#' @rdname detour-shiny
#' @export
enlarge_points <- function(proxy, point_list, size = 2) {
  if (length(point_list) == 1) {
    point_list <- list(point_list)
  }
  proxy$message$enlarge_point_list <- point_list
  proxy$message$size <- size
  proxy$session$sendCustomMessage("enlarge-points", proxy$message)
  return(proxy)
}


#' Function to clear added points
#' @param proxy proxy object created by \code{\link{display_scatter_proxy}}
#' @rdname detour-shiny
#' @export
clear_points <- function(proxy) {
  proxy$session$sendCustomMessage("clear-points", list(id = proxy$id))
  return(proxy)
}

#' Function to clear added edges
#' @param proxy proxy object created by \code{\link{display_scatter_proxy}}
#' @rdname detour-shiny
#' @export
clear_edges <- function(proxy) {
  proxy$session$sendCustomMessage("clear-edges", list(id = proxy$id))
  return(proxy)
}

#' Function to clear highlighted points
#' @param proxy proxy object created by \code{\link{display_scatter_proxy}}
#' @rdname detour-shiny
#' @export
clear_highlight <- function(proxy) {
  proxy$session$sendCustomMessage("clear-highlight", list(id = proxy$id))
  return(proxy)
}

#' Function to clear enlarged points
#' @param proxy proxy object created by \code{\link{display_scatter_proxy}}
#' @rdname detour-shiny
#' @export
clear_enlarge <- function(proxy) {
  proxy$session$sendCustomMessage("clear-enlarge", list(id = proxy$id))
  return(proxy)
}

#' Function to force rerender of detourr
#'
#' Useful when detourr will not update unless put on focus
#' @param proxy proxy object created by \code{\link{display_scatter_proxy}}
#' @rdname detour-shiny
#' @export
force_rerender <- function(proxy) {
  proxy$session$sendCustomMessage("clear-enlarge", list(id = proxy$id))
  return(proxy)
}