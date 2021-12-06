
#' 3D Scatterplot display for tours
#'
#' Display method for a high performance 3D scatterplot.
#' Performance is achieved through the use of Three.js / WebGL.
#' @param mapping mapping created via `tour_aes()`. Currently supports `colour`
#' and (hover) `labels`.
#' @param palette Colour palette to use with the colour aesthetic. Can be:
#'  - A character vector of R colours. This should match the number of levels
#' of the colour aesthetic, or the number of bins to use for continuous colours.
#'  - A function which takes the number of colours to use as input and returns a
#' character vector of colour names and / or hex values as output.
#' Note that the alpha channel of `palette` is ignored. For opacity, please use
#' the `alpha` argument.
#' @param size point size, defaults to 1
#' @param alpha opacity of points ranging from 0 to 1. 0 is fully transparent
#' and 1 is fully opaque.
#' @param center If TRUE, center the projected data to (0, 0, 0).
#' @param axes Can be one of:
#'  - `TRUE` draw axes and use column names for axis labels
#'  - `FALSE` do not draw axes or labels
#'  - `NULL` draw axes with no labels
#'  - An unnamed vector of labels with the same length as `cols`
#'  - A named vector in the form `c("h" = "head")`, where `head` is renamed to
#' `h`
#' @param edges A two column numeric matrix giving indices of ends of lines.
#' @export
#' @examples
#' animate_tour(tourr::flea, -species, tourr::grand_tour(3), display_scatter())
display_scatter <- function(mapping = NULL,
                            palette = viridisLite::viridis,
                            size = 1,
                            alpha = 1,
                            center = TRUE,
                            axes = TRUE,
                            edges = NULL) {
  if ("color" %in% names(mapping)) {
    names(mapping)[names(mapping) == "color"] <- "colour"
  }

  if (missing(palette) && !("colour" %in% names(mapping))) palette <- "black"

  init <- function(data, col_spec, tour_dim) {
    default_mapping <- list(colour = character(0), label = character(0))
    mapping <- purrr::map(mapping, get_mapping_cols, data)

    colours <- get_colour_mapping(data, mapping, palette)
    mapping[["colour"]] <- colours[["colours"]]
    pal <- colours[["pal"]]

    mapping[["label"]] <- get_label_mapping(data, mapping)

    mapping <- merge_defaults_list(mapping, default_mapping)

    data_cols <- tidyselect::eval_select(col_spec, data)
    default_labels <- names(data_cols)
    axes <- validate_axes(axes, default_labels, data_cols)

    edges <- validate_edges(edges)
    alpha <- validate_alpha(alpha)

    widget <- dplyr::case_when(
      tour_dim == 2 ~ "display_scatter_2d",
      tour_dim == 3 ~ "display_scatter_3d"
    )

    list(
      "mapping" = mapping,
      "plot" = list(
        "center" = center,
        "size" = size,
        "axisLabels" = axes[["labels"]],
        "edges" = edges,
        "axes" = axes[["has_axes"]],
        "alpha" = alpha
      ),
      "widget" = widget
    )
  }
  list(
    "init" = init
  )
}

get_colour_mapping <- function(data, mapping, palette) {
  if ("colour" %in% names(mapping)) {
    colours <- vec_to_colour(mapping[["colour"]], palette)
  }
  else {
    colours <- vec_to_colour(data.frame(rep("", nrow(data))), palette)
  }
  colours
}

get_label_mapping <- function(data, mapping) {
  if ("label" %in% names(mapping)) {
    label <- mapping[["label"]]
    if (inherits(label, "AsIs")) {
      label <- as.character(label[[1]])
    }
    else {
      label <- purrr::map(names(label), ~ paste0(., ": ", label[[.]]))
      label <- do.call(paste, c(label, sep = "<br>"))
    }
  }
  else {
    label <- character(0)
  }
  label
}

validate_axes <- function(axes, default_labels, data_cols) {
  if (rlang::is_true(axes)) {
    axis_labels <- default_labels
  }
  else if (rlang::is_false(axes)) {
    axis_labels <- character(0)
  }
  else if (is.null(axes)) {
    axis_labels <- character(0)
    axes <- TRUE
  }
  else if (rlang::is_named(axes)) {
    renamed <- tidyselect::eval_rename(axes, data_cols)
    axis_labels <- default_labels
    axis_labels[renamed] <- names(renamed)
    axes <- TRUE
  }
  else if (rlang::has_length(axes, length(data_cols))) {
    axis_labels <- as.character(axes)
    axes <- TRUE
  }
  else {
    rlang::abort(c(
      "invalid `axes` argument",
      i = "see `?display_scatter` for valid options",
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
