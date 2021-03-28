quiet <- function(x) {
  sink(tempfile())
  on.exit(sink())
  invisible(force(x))
}

char_to_json_list <- function(char) {
  paste0("[", paste0(char, collapse = ", "), "]")
}

matrix_to_list <- function(mat) {
  lst <- split(mat, row(mat))
  names(lst) <- NULL
  lst
}

compute_half_range <- function(half_range, data, center) {
  if (!is.null(half_range)) {
    return(half_range)
  }

  if (center) {
    data <- tourr::center(data)
  }
  half_range <- tourr:::max_dist(data, center)
  message("Using half_range ", format(half_range, digits = 2))
  half_range
}

col2hex <- function(col) {
  rgb(t(grDevices::col2rgb(col)), maxColorValue = 255)
}