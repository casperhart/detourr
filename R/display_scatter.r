
#' 3D Scatterplot display for tours
#'
#' Display method for a high performance 3D scatterplot.
#' Performance is achieved through the use of Three.js / WebGL.
#' @param mapping mapping created via `tour_aes()`. Currently supports `colour` and (hover) `labels`.
#' @param palette Colour palette to use with the colour aesthetic. Can be:
#'  - A character vector of R colours. This should match the number of levels of the colour aesthetic,
#' or the number of bins to use for continuous colours.
#'  - A function which takes the number of colours to use as input and returns a character vector of colour
#' names and / or hex values as output.
#'  Note that the alpha channel of `palette` is ignored. For opacity, please use the `alpha` argument.
#' @param size point size, defaults to 1
#' @param alpha opacity of points ranging from 0 to 1. 0 is fully transparent and 1 is fully opaque.
#' @param center If TRUE, center the projected data to (0, 0, 0).
#' @param axes Whether to draw axes. TRUE or FALSE
#' @param labels axis labels. Can be:
#'  - `TRUE` to use column names for axis labels
#'  - `FALSE` for no labels
#'  - An unnamed vector of labels with the same length as `cols`
#'  - A named vector in the form `c("h" = "head")`, where `head` is renamed to `h`
#' @param edges A two column numeric matrix giving indices of ends of lines.
#' @export
#' @examples
#' animate_tour(tourr::flea, -species, tourr::grand_tour(3), display_scatter())
display_scatter <- function(mapping = NULL, palette = viridisLite::viridis, size = 1, alpha = 1,
                            center = TRUE, axes = TRUE, labels = TRUE, edges = NULL) {
  if (missing(palette) && !("colour" %in% names(mapping))) palette <- "black"

  init <- function(data, col_spec) {
    default_mapping <- list(colour = character(0), label = character(0))
    mapping <- purrr::map(mapping, get_mapping_cols, data)

    if ("colour" %in% names(mapping)) {
      colours <- vec_to_colour(mapping[["colour"]][[1]], palette)
    }
    else {
      colours <- vec_to_colour(rep("", nrow(data)), palette)
    }

    mapping[["colour"]] <- colours[["colours"]]
    pal <- colours[["pal"]]

    if ("label" %in% names(mapping)) {
      point_labels <- mapping[["label"]]
      if (inherits(point_labels, "AsIs")) {
        point_labels <- as.character(point_labels)
      }
      else {
        point_labels <- purrr::map(names(point_labels), ~ paste0(., ": ", point_labels[[.]]))
        point_labels <- do.call(paste, c(point_labels, sep = "<br>"))
      }
      mapping[["label"]] <- point_labels
    }

    mapping <- merge_defaults_list(mapping, default_mapping)

    data_cols <- tidyselect::eval_select(col_spec, data)
    default_labels <- names(data_cols)
    labels <- validate_labels(labels, default_labels)

    edges <- validate_edges(edges)
    alpha <- validate_alpha(alpha)

    if (rlang::is_false(axes)) {
      labels <- character(0)
    }
    else if (!rlang::is_true(axes)) {
      rlang::abort(c("invalid `axes` argument",
        i = "expected `TRUE` or `FALSE`"
      ))
    }

    list(
      "mapping" = mapping,
      "plot" = list(
        "center" = center,
        "size" = size,
        "axisLabels" = labels,
        "edges" = edges,
        "axes" = axes,
        "alpha" = alpha
      ),
      "widget" = "display_scatter"
    )
  }
  list(
    "init" = init
  )
}

validate_labels <- function(labels, default_labels) {
  if (rlang::is_true(labels)) {
    axis_labels <- default_labels
  }
  else if (rlang::is_false(labels)) {
    axis_labels <- character(0)
  }
  else if (rlang::is_named(labels)) {
    renamed <- tidyselect::eval_rename(labels, data_cols)
    axis_labels <- default_labels
    axis_labels[renamed] <- names(renamed)
  }
  else if (rlang::has_length(labels, length(data_cols))) {
    axis_labels <- as.character(labels)
  }
  else {
    rlang::abort(c(
      "length of `labels` argument should match the number of data columns.",
      i = sprintf("expected: %s", length(default_labels)),
      x = sprintf("got: %s", length(labels))
    ))
  }
  axis_labels
}

validate_edges <- function(edges) {
  if (is.matrix(edges)) {
    if (ncol(edges) != 2) {
      rlang::abort(c("invalid edges argument",
        i = "expected 2 columns",
        x = sprintf("got %s columns", ncol(edges))
      ))
    }
    else if (!is.numeric(edges)) {
      rlang::abort(c("invalid edges argument",
        i = "expected a numeric matrix",
        x = sprintf("got a %s matrix", typeof(edges))
      ))
    }
    else if (anyNA(edges)) {
      rlang::abort(c("invalid edges argument", x = "NA values not allowed"))
    }
  } else if (is.null(edges)) {
    edges <- character(0)
  }
  else {
    rlang::abort(c("invalid edges argument", i = "expected a matrix", x = sprintf("got a `%s`", class(edges)[1])))
  }
  edges
}

validate_alpha <- function(alpha) {
  if (!is.numeric(alpha) || length(alpha) != 1 || alpha < 0 || alpha > 1) {
    rlang::abort(c("invalid alpha argument", i = "expected a single numeric value between 0 and 1"))
  }
  alpha
}
