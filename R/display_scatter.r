
#' 2D and 3D Scatterplot display for tours
#'
#' Display method for a high performance 2D or 3D scatterplot.
#' Performance is achieved through the use of Three.js / WebGL, and the 2D or
#' 3D variant is selected automatically based on the tour generator provided.
#'
#' This display method produces an interactive scatterplot animation which
#' supports both 2D and 3D tours. Linked selection and filtering is also
#' supported using {crosstalk}. The set of interactive controls available are:
#' - A timeline with a play / pause button and indicators at the position of
#' each basis used. The basis indicators can be hovered with the mouse to show
#' the index of the basis, or clicked to jump to that basis. The timeline
#' also allows for clicking and dragging of the scrubber to move to any
#' individual frame of the animation.
#' - Orbit controls. For the 2D variant, this allows the projection to be
#' rotated by clicking and dragging from left to right. For the 3D variant,
#' full orbit controls are available by clicking and dragging. For both orbit
#' and pan controls, the scroll wheel can be used to zoom.
#' - Pan controls, which work similarly to orbit controls but move the camera
#' laterally / vertically rather than rotating
#' - Resetting of the orbit and pan controls
#' - Selection and highlighting. Multiple selection is possible by using the
#' shift key
#' - Colouring / brushing of highlighted points
#'
#' @param x a `detour` object
#' @param ... used to support aesthetic parameters for the plot, including
#' - size: point size, defaults to 1
#' - alpha: point opacity, defaults to 1
#' - background_colour: defaults to "white"
#' @param palette Colour palette to use with the colour aesthetic. Can be:
#'  - A character vector of R colours. This should match the number of levels
#' of the colour aesthetic, or the number of bins to use for continuous colours.
#'  - A function which takes the number of colours to use as input and returns a
#' character vector of colour names and / or hex values as output.
#' @param center If TRUE, center the projected data to (0, 0, 0).
#' @param axes Can be one of:
#'  - `TRUE` draw axes and use column names for axis labels
#'  - `FALSE` do not draw axes or labels
#'  - `NULL` draw axes with no labels
#'  - An unnamed vector of labels with the same length as `cols`
#'  - A named vector in the form `c("h" = "head")`, where `head` is renamed to
#' `h`
#' @param edges A two column numeric matrix giving indices of ends of lines.
#' @param paused whether the widget should be initialised in the 'paused' state
#' @param scale_factor used as a multiplier for the point coordinates so they
#' are displayed on a sensible range. Defaults to the reciprocal of maximum distance
#' from a point to the origin.
#' @importFrom rlang `%||%`
#' @export
#' @examples
#' detour(tourr::flea, tour_aes(projection = -species, colour = species)) |>
#'   tour_path(grand_tour(3), fps = 60) |>
#'   display_scatter(alpha = 0.7, axes = FALSE)
#' @export
display_scatter <- function(x,
                            ...,
                            palette = viridisLite::viridis,
                            center = TRUE,
                            axes = TRUE,
                            edges = NULL,
                            paused = TRUE,
                            scale_factor = NULL) {
  if (!is_detour(x)) {
    rlang::abort(c("x must be a `detour` object", x = paste("got:", class(x)[1])))
  }

  if (length(x$projection_matrix) == 0) {
    x <- tour_path(x)
  }

  d <- attributes(x)

  dots <- list(...)
  names(dots) <- sub("color", "colour", names(dots))
  check_dots(dots, c("size", "alpha", "background_colour"))
  size <- dots[["size"]] %||% 1
  alpha <- dots[["alpha"]] %||% 1
  background_colour <- dots[["background_colour"]] %||% "white"

  if (missing(palette) && !("colour" %in% names(d$mapping))) palette <- "black"

  colours <- get_colour_mapping(nrow(d$dataset), d$mapping$colour, palette)
  d$mapping[["colour"]] <- colours[["colours"]]
  pal <- colours[["pal"]]

  d$mapping[["label"]] <- get_label_mapping(d$mapping$label)

  default_labels <- colnames(d$dataset)
  axes <- validate_axes(axes, default_labels)

  edges <- validate_edges(edges)
  alpha <- validate_alpha(alpha)

  if (center) {
    d$dataset <- scale(d$dataset, center = TRUE, scale = FALSE)
  }

  if (is.null(scale_factor)) {
    scale_factor <- 1 / max(sqrt(rowSums(d$dataset^2)))
  }

  d$dataset <- d$dataset * scale_factor

  # only include supported mappings
  d$mapping <- d$mapping[names(d$mapping) %in% c("colour", "label")]

  d$config <- append(d$config, list(
    size = size,
    axisLabels = axes[["labels"]],
    edges = edges,
    axes = axes[["has_axes"]],
    alpha = alpha,
    backgroundColour = col2hex(background_colour),
    paused = paused
  ))

  widget <- infer_widget("display_scatter", ncol(x$projection_matrix[[1]]))

  x <- make_detour(x, d) |> as.list()

  htmlwidgets::createWidget(
    widget,
    x,
    sizingPolicy = htmlwidgets::sizingPolicy(
      viewer.padding = 0,
      viewer.paneHeight = 500,
      browser.fill = TRUE,
      knitr.defaultWidth = 800,
      knitr.defaultHeight = 500
    ),
    package = "detourr",
    dependencies = x$crosstalk$dependencies,
    width = dots$width,
    height = dots$height
  )
}

get_colour_mapping <- function(n, colour_df, palette) {
  if (!is.null(colour_df)) {
    colours <- df_to_colour(colour_df, palette)
  } else {
    colours <- df_to_colour(data.frame(rep("", n)), palette)
  }
  colours
}

get_label_mapping <- function(label_df) {
  if (!is.null(label_df)) {
    if (inherits(label_df, "AsIs")) {
      label <- as.character(label_df[[1]])
    } else {
      label <- purrr::map(names(label_df), ~ paste0(., ": ", label_df[[.]]))
      label <- do.call(paste, c(label, sep = "<br>"))
    }
  } else {
    label <- character(0)
  }
  label
}

validate_axes <- function(axes, default_labels) {
  if (rlang::is_true(axes)) {
    axis_labels <- default_labels
  } else if (rlang::is_false(axes)) {
    axis_labels <- character(0)
  } else if (is.null(axes)) {
    axis_labels <- character(0)
    axes <- TRUE
  } else if (rlang::is_named(axes)) {
    # renamed <- tidyselect::eval_rename(axes, data_cols)
    axes <- axes[axes %in% default_labels]
    default_labels[match(axes, default_labels)] <- names(axes)
    axis_labels <- default_labels
    axes <- TRUE
  } else if (rlang::has_length(axes, length(default_labels))) {
    axis_labels <- as.character(axes)
    axes <- TRUE
  } else {
    rlang::abort(c(
      "invalid `axes` argument",
      i = "see `?display_scatter` for valid options"
    ))
  }
  list(
    labels = axis_labels,
    has_axes = axes
  )
}

validate_edges <- function(edges) {
  if (is.matrix(edges)) {
    if (ncol(edges) != 2) {
      rlang::abort(c("invalid edges argument",
        i = "expected 2 columns",
        x = sprintf("got %s columns", ncol(edges))
      ))
    } else if (!is.numeric(edges)) {
      rlang::abort(c("invalid edges argument",
        i = "expected a numeric matrix",
        x = sprintf("got a %s matrix", typeof(edges))
      ))
    } else if (anyNA(edges)) {
      rlang::abort(c("invalid edges argument", x = "NA values not allowed"))
    }
  } else if (is.null(edges)) {
    edges <- character(0)
  } else {
    rlang::abort(c("invalid edges argument",
      i = "expected a matrix",
      x = sprintf("got a `%s`", class(edges)[1])
    ))
  }
  edges
}

validate_alpha <- function(alpha) {
  if (!is.numeric(alpha) || length(alpha) != 1 || alpha < 0 || alpha > 1) {
    rlang::abort(c("invalid alpha argument",
      i = "expected a single numeric value between 0 and 1"
    ))
  }
  alpha
}
