
#' 3D Scatterplot display for tours
#'
#' Display method for a high performance 3D scatterplot.
#' Performance is achieved through the use of Three.js / WebGL.
#' @param mapping mapping created via `tour_aes()`. Currently only supports colour mapping.
#' @param center If TRUE, center the projected data to (0, 0, 0).
#' @param size point size, defaults to 1
#' @param labels character vector of axis labels. The default of `labels=NULL` will give abbreviated column names. Use `labels=character(0)` to remove axis labels entirely.
#' @export
#' @examples
#' animate_tour(tourr::flea, -species, tourr::grand_tour(3), display_scatter())
display_scatter <- function(mapping = NULL, center = TRUE, size = 1, labels = NULL) {
    init <- function(data, col_spec) {
        default_mapping <- list(colour = character(0))
        mapping <- purrr::map(mapping, get_mapping_cols, data)

        if ("colour" %in% names(mapping)) {
            mapping[["colour"]] <- vec_to_colour(mapping[["colour"]])
        }

        mapping <- merge_defaults_list(mapping, default_mapping)

        default_labels <- abbreviate(names(tidyselect::eval_select(col_spec, data)))

        if (is.null(labels)) {
            labels <- unname(default_labels)
        } else if (!length(labels) %in% c(0, length(default_labels))) {
            rlang::abort(
                paste(
                    "length of `labels` argument should match the number of data columns.",
                    "expected:", length(default_labels),
                    "got:", length(labels)
                )
            )
        }

        list(
            "mapping" = mapping,
            "plot" = list(
                "center" = center,
                "size" = size,
                "labels" = as.character(labels)
            ),
            "widget" = "display_scatter"
        )
    }
    list(
        "init" = init
    )
}