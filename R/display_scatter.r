
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
#' @param edges A two column numeric matrix giving indices of ends of lines.
#' @param axes Whether to draw axes. TRUE or FALSE
#' @param palette Colour palette to use with the colour aesthetic. Can be:
#'  - A character vector of R colours. This should match the number of levels of the colour aesthetic, or the number of bins to use
#'  for continuous colours.
#'  - A function which takes the number of colours to use as input and returns a character vector of colour names and / or hex values as output.
#' @export
#' @examples
#' animate_tour(tourr::flea, -species, tourr::grand_tour(3), display_scatter())
display_scatter <- function(mapping = NULL, center = TRUE, size = 1,
                            labels = TRUE, edges = NULL, axes = TRUE,
                            palette = viridis::viridis) {
    init <- function(data, col_spec) {
        default_mapping <- list(colour = character(0))
        mapping <- purrr::map(mapping, get_mapping_cols, data)

        if ("colour" %in% names(mapping)) {
            colours <- vec_to_colour(mapping[["colour"]], palette)
        }
        else {
            colours <- vec_to_colour(rep("", nrow(data)), palette)
        }

        mapping[["colour"]] <- colours[["colours"]]
        pal <- colours[["pal"]]

        mapping <- merge_defaults_list(mapping, default_mapping)

        data_cols <- tidyselect::eval_select(col_spec, data)
        default_labels <- names(data_cols)

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

        if (is.matrix(edges)) {
            if (ncol(edges) != 2) {
                rlang::abort(c("invalid edges argument", i = "expected 2 columns", x = sprintf("got %s columns", ncol(edges))))
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
                "labels" = axis_labels,
                "edges" = edges,
                "axes" = axes
            ),
            "widget" = "display_scatter"
        )
    }
    list(
        "init" = init
    )
}