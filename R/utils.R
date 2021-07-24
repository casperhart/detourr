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
  half_range <- tourr:::max_dist(data, center)
  message("Using half_range ", format(half_range, digits = 2))
  half_range
}

col2hex <- function(col) {
  rgb(t(grDevices::col2rgb(col)), maxColorValue = 255)
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
#' Aesthetic mapping for tours describing how variables in the data are mapped to
#' visual properties of the tour animation.
#' @param ... list of name-value pairs in the form 'aesthetic = variable'. Variables are evaluated
#' using {tidyselect} syntax.
#' @examples
#' animate_tour(
#'   tourr::flea,
#'   -species,
#'   grand_tour(3),
#'   display_scatter(tour_aes(colour = species))
#' )
#' @export
tour_aes <- function(...) {
  rlang::enquos(...)
}

get_mapping_cols <- function(q, data) {
  col <- tidyselect::vars_pull(names(data), !!q)
  data[[col]]
}

pal_discrete <- function(n) {
  hues <- seq(15, 375, length = n + 1)
  hcl(h = hues, l = 65, c = 100)[1:n]
}

vec_to_colour <- function(vec) {
  if (is.numeric(vec)) {
    rlang::warn("`colour` aesthetic is numeric, but only discrete colours are implemented")
  }
  vec <- as.factor(vec)
  pal <- pal_discrete(length(unique(vec)))
  pal[vec]
}