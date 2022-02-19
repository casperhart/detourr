#' Initiate a detour visualisation
#'
#' This function initialises a `detour` object which, along with the
#' `tour_path` and `display_functions` is used to build a detour visualisation.
#'
#' @param .data a data frame, tibble, or crosstalk::SharedData object
#' @param mapping a mapping of data columns to aesthetic values using the
#' `tour_aes` function. The only required aesthetic is `projection`, which
#' determines which columns are used to generate the tour path.
#'
#' @importFrom utils object.size
#' @examples
#' detour(tourr::flea, tour_aes(projection = -species, colour = species)) %>%
#'   tour_path(grand_tour(3), fps = 60) %>%
#'   display_scatter(alpha = 0.7, axes = FALSE)
#' @export
detour <- function(.data, mapping) {
  names(mapping) <- sub("color", "colour", names(mapping))

  if (!"projection" %in% names(mapping)) {
    rlang::abort("`projection` is a required aesthetic",
      i = paste(
        "specify a mapping containing a `projection` aesthetic.",
        "e.g. `mapping = tour_aes(projection = where(is.numeric))`"
      )
    )
  }

  if (inherits(.data, "SharedData")) {
    crosstalk_key <- .data$key()
    crosstalk_group <- .data$groupName()
    .data <- .data$origData()
    crosstalk_dependencies <- crosstalk::crosstalkLibs()
  } else if (!inherits(.data, "data.frame")) {
    rlang::abort(c("argument `.data` is invalid",
      i = "Expected a data frame or crosstalk::SharedData object",
      x = paste0("got: ", class(.data)[1])
    ))
  } else {
    crosstalk_key <- NULL
    crosstalk_group <- NULL
    crosstalk_dependencies <- NULL
  }

  # evaluate mapping in the context of the data
  mapping <- purrr::map(mapping, get_mapping_cols, .data)
  dataset <- as.matrix(mapping[["projection"]])
  mapping <- mapping[names(mapping) != "projection"]

  if (!is.numeric(dataset)) {
    rlang::abort(c("Tour data must be numeric",
      i = "Select numeric columns using the `cols` argument"
    ))
  }

  if (object.size(dataset) > 1e6) {
    rlang::warn(paste(
      "It seems your data is quite large, and may lead",
      "to performance issues in the browser."
    ))
  }

  structure(list(
    mapping = mapping[!names(mapping) == "projection"],
    config = NULL,
    widget = NULL,
    crosstalk = list(
      crosstalkIndex = crosstalk_key,
      crosstalkGroup = crosstalk_group
    ),
    projectionMatrices = NULL,
    dataset = dataset,
    crosstalk_dependencies = crosstalk_dependencies
  ), class = "detour")
}
