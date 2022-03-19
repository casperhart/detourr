#' Initiate a detour visualisation
#'
#' This function initialises a `detour` object which, along with the
#' `tour_path` and `show_functions` is used to build a detour visualisation.
#'
#' @param .data a data frame, tibble, or crosstalk::SharedData object
#' @param mapping a mapping of data columns to aesthetic values using the
#' `tour_aes` function. The only required aesthetic is `projection`, which
#' determines which columns are used to generate the tour path and supports tidy selection.
#'
#' @importFrom utils object.size
#' @importFrom tibble new_tibble tibble
#' @examples
#' detour(tourr::flea, tour_aes(projection = -species, colour = species)) |>
#'   tour_path(grand_tour(3), fps = 60) |>
#'   show_scatter(alpha = 0.7, axes = FALSE)
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
  } else if (!is.data.frame(.data)) {
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

  new_tibble(tibble(is_new_basis = logical(0), projection_matrix = list()),
    mapping = mapping[!names(mapping) == "projection"],
    config = NULL,
    crosstalk = list(
      crosstalkIndex = crosstalk_key,
      crosstalkGroup = crosstalk_group,
      dependencies = crosstalk_dependencies
    ),
    dataset = dataset,
    class = "detour"
  )
}

# make a detourr object from a tibble + attributes
make_detour <- function(x, att) {
  new_tibble(x,
    mapping = att$mapping,
    config = att$config,
    crosstalk = att$crosstalk,
    dataset = att$dataset,
    class = "detour"
  )
}

#' @export
as.list.detour <- function(x, ...) {
  tour_attrs <- attributes(x)
  tour_attrs$config$basisIndices <- which(x$is_new_basis) - 1

  tour_attrs <- tour_attrs[c("mapping", "config", "crosstalk", "dataset")]

  tour_attrs$crosstalk$crosstalk_dependencies <- NULL

  append(
    list(projectionMatrices = x$projection_matrix),
    tour_attrs
  )
}

#' Test for detour-ness
#' @param x an object
#' @export
is_detour <- function(x) {
  inherits(x, "detour")
}

assert_is_detour <- function(x) {
  if (!is_detour(x)) {
    rlang::abort(c("argument `x` is invalid",
      i = "Expected a detour object",
      x = paste0("got: ", class(x)[1])
    ))
  }
}

tour_input_dim <- function(x) {
  assert_is_detour(x)
  ncol(attributes(x)$dataset)
}

tour_output_dim <- function(x) {
  assert_is_detour(x)

  if (nrow(x) == 0) {
    rlang::abort(c("Cannot get output dimension of an empty detour",
      i = "Has this `detour` object been passed to `tour_path()`?"
    ))
  }

  ncol(x$projection_matrix[[1]])
}
