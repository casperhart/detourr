# prevent devtools::check from complaining about this function from tidyselect
# https://github.com/r-lib/tidyselect/issues/201
utils::globalVariables("where")

quiet <- function(x) {
  sink(tempfile())
  on.exit(sink())
  invisible(force(x))
}

col2hex <- function(col) {
  grDevices::rgb(t(grDevices::col2rgb(col)), maxColorValue = 255)
}

merge_defaults_list <- function(l, default_l) {
  item_names <- intersect(names(l), names(default_l))
  default_l[item_names] <- l[item_names]
  default_l
}

#' Aesthetic mapping for tours
#'
#' Aesthetic mapping for tours describing how variables in the data are
#' mapped to visual properties of the tour animation.
#' @param ... list of name-value pairs in the form 'aesthetic = variable'.
#' Variables are evaluated using {tidyselect} syntax.
#' @return a list of quosures
#' @examples
#' detour(tourr::flea, tour_aes(projection = -species, colour = species)) |>
#'   tour_path(grand_tour(3), fps = 60) |>
#'   show_scatter(alpha = 0.7, axes = FALSE)
#' @export
tour_aes <- function(...) {
  rlang::enquos(...)
}

get_mapping_cols <- function(mapping, .data) {
  if (rlang::quo_is_call(mapping, name = "I")) {
    aes_vals <- rlang::eval_tidy(mapping, .data)
    # recycle in case literal values are being used. E.g. "red" vs. red
    aes_vals <- rep(aes_vals, length.out = nrow(.data))
    I(data.frame(aes_vals = aes_vals))
  } else {
    col <- tidyselect::eval_select(mapping, .data)
    .data[col]
  }
}


df_to_colour <- function(vec, pal) {
  if (inherits(vec, "AsIs")) {
    vec <- as.factor(vec[[1]])
    pal <- col2hex(levels(vec))
    names(pal) <- levels(vec)
    vec <- as.character(vec)
  } else {
    vec <- vec[[1]]
    if (is.numeric(vec)) {
      if (is.function(pal)) {
        n <- 8
        pal <- pal(n)
      } else {
        n <- length(pal)
      }
      vec <- cut(vec, n)
    } else {
      if (is.character(vec) || is.logical(vec)) {
        vec <- as.factor(vec)
      } else if (!is.factor(vec)) {
        rlang::abort(c("invalid type for colour aesthetic",
          x = "expected numeric, character, factor, or logical vector",
          i = sprintf("got %s", class(vec))
        ))
      }

      if (is.function(pal)) {
        pal <- pal(length(levels(vec)))
      }

      if (!is.character(pal)) {
        rlang::abort("Invalid palette",
          x = "expected character vector",
          sprintf("got: %s", class(pal))
        )
      }

      if (length(pal) != length(levels(vec))) {
        rlang::abort(paste(
          "Number of colours in `palette` does not match",
          "the number of levels of the colour aesthetic"
        ))
      }
    }


    # convert colour names and rgba values to rgb hex
    pal <- col2hex(pal)

    names(pal) <- levels(vec)
    vec <- unname(pal[vec])
  }
  list(
    colours = vec,
    pal = pal
  )
}

check_dots <- function(dots, supported_arg_names) {
  unknown_args <- !(names(dots) %in% supported_arg_names)
  if (any(unknown_args)) {
    rlang::warn(c("unused arguments found in `...`",
      i = paste0(
        "expected any of: `",
        paste0(supported_arg_names, collapse = "`, `"),
        "`"
      ),
      x = paste0(
        "got: `",
        paste0(names(dots)[unknown_args], collapse = "`, `"),
        "`"
      )
    ))
  }
}

make_widget <- function(x, widget, width, height, dependencies) {
  htmlwidgets::createWidget(
    widget,
    as.list(x),
    sizingPolicy = htmlwidgets::sizingPolicy(
      viewer.padding = 0,
      viewer.paneHeight = 500,
      browser.fill = TRUE,
      knitr.defaultWidth = 800,
      knitr.defaultHeight = 500
    ),
    package = "detourr",
    dependencies = dependencies,
    width = width,
    height = height
  )
}
