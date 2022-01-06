# prevent devtools::check from complaining about this function from tidyselect
# https://github.com/r-lib/tidyselect/issues/201
utils::globalVariables("where")

quiet <- function(x) {
  sink(tempfile())
  on.exit(sink())
  invisible(force(x))
}

compute_half_range <- function(half_range, data, center) {
  if (!is.null(half_range)) {
    return(half_range)
  }

  if (center) {
    data <- tourr::center(data)
  }
  half_range <- max(sqrt(rowSums(data^2)))
  message("Using half_range ", format(half_range, digits = 2))
  half_range
}

col2hex <- function(col) {
  grDevices::rgb(t(grDevices::col2rgb(col)), maxColorValue = 255)
}

merge_defaults_list <- function(l, default_l) {
  item_names <- intersect(names(l), names(default_l))
  default_l[item_names] <- l[item_names]
  default_l
}

get_tour_data_matrix <- function(data, col_spec) {
  tour_cols <- tidyselect::eval_select(col_spec, data)
  if (!all(sapply(tour_cols, is.numeric))) {
    rlang::abort("all specified cols must be numeric")
  }
  tour_cols <- as.matrix(data[tour_cols])
}

#' Aesthetic mapping for tours
#'
#' Aesthetic mapping for tours describing how variables in the data are
#' mapped to visual properties of the tour animation.
#' @param ... list of name-value pairs in the form 'aesthetic = variable'.
#' Variables are evaluated using {tidyselect} syntax.
#' @examples
#' animate_tour(
#'   tourr::flea,
#'   tourr::grand_tour(3),
#'   display_scatter(tour_aes(colour = species))
#' )
#' @export
tour_aes <- function(...) {
  rlang::enquos(...)
}

get_mapping_cols <- function(aes, data) {
  if (rlang::quo_is_call(aes, name = "I")) {
    aes_vals <- rlang::eval_tidy(aes, data)
    # recycle in case literal values are being used. E.g. "red" vs. red
    aes_vals <- rep(aes_vals, length.out = nrow(data))
    I(data.frame(aes_vals = aes_vals))
  } else {
    col <- tidyselect::vars_select(names(data), !!aes)
    data[col]
  }
}

vec_to_colour <- function(vec, pal) {
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
