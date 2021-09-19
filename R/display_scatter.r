
#' 3D Scatterplot display for tours
#'
#' Display method for a high performance 3D scatterplot.
#' Performance is achieved through the use of Three.js / WebGL.
#' @param mapping mapping created via `tour_aes()`. Currently only supports colour mapping.
#' @param center If TRUE, center the projected data to (0, 0, 0).
#' @param size point size, defaults to 1
#' @param labels axis labels. Can be:
#'  - `TRUE` to use column names for axis labels
#'  - `FALSE` for no labels
#'  - An unnamed vector of labels with the same length as `cols`
#'  - A named vector in the form `c("h" = "head")`, where `head` is renamed to `h`
#' @export
#' @examples
#' animate_tour(tourr::flea, -species, tourr::grand_tour(3), display_scatter())
display_scatter <- function(mapping = NULL, center = TRUE, size = 1, labels = TRUE) {
    init <- function(data, col_spec) {
        default_mapping <- list(colour = character(0))
        mapping <- purrr::map(mapping, get_mapping_cols, data)

        if ("colour" %in% names(mapping)) {
            mapping[["colour"]] <- vec_to_colour(mapping[["colour"]])
        }

        mapping <- merge_defaults_list(mapping, default_mapping)

        data_cols <- tidyselect::eval_select(col_spec, data)
        default_labels <- names(data_cols)

        if (identical(labels, TRUE)) {
            axis_labels <- default_labels
        }
        else if (identical(labels, FALSE)) {
            axis_labels <- character(0)
        }
        else if (rlang::is_named(labels)) {
            renamed <- tidyselect::eval_rename(labels, data_cols)
            axis_labels <- default_labels
            axis_labels[renamed] <- names(renamed)
        }
        else if (rlang::has_length(labels, length(data_cols))) {
            axis_labels <- as.character(labels)
        } else {
            rlang::abort(c(
                "length of `labels` argument should match the number of data columns.",
                i = sprintf("expected: %s", length(default_labels)),
                x = sprintf("got: %s", length(labels))
            ))
        }

        list(
            "mapping" = mapping,
            "plot" = list(
                "center" = center,
                "size" = size,
                "labels" = axis_labels
            ),
            "widget" = "display_scatter"
        )
    }
    list(
        "init" = init
    )
}