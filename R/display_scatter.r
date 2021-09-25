
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
#' @param edges A two column data frame or numeric matrix giving indices of ends of lines.
#' @export
#' @examples
#' animate_tour(tourr::flea, -species, tourr::grand_tour(3), display_scatter())
display_scatter <- function(mapping = NULL, center = TRUE, size = 1, labels = TRUE, edges = NULL) {
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
        }
        else {
            rlang::abort(c(
                "length of `labels` argument should match the number of data columns.",
                i = sprintf("expected: %s", length(default_labels)),
                x = sprintf("got: %s", length(labels))
            ))
        }

        if (is.null(edges)) {
            edges <- character(0)
        }
        else if (is.null(dim(edges)) | length(dim(edges)) != 2) {
            rlang::abort(c("invalid edges argument", i = "expected a dataframe or matrix", x = sprintf("got a `%s`", typeof(edges))))
        }
        else if (ncol(edges) != 2) {
            rlang::abort(c("invalid edges argument", i = "expected 2 columns", x = sprintf("got %s columns", ncol(edges))))
        }
        else if (!is.numeric(as.matrix(edges))) {
            browser()
            rlang::abort(c("invalid edges argument",
                i = "expected all numeric values",
                x = sprintf("found column with types %s", typeof(as.matrix(edges)))
            ))
        }
        else if (any(is.na(edges))) {
            rlang::abort(c("invalid edges argument", i = "expected no NAs", x = sprintf("found %s NA(s)", sum(is.na(edges)))))
        }
        else {
            edges <- as.matrix(edges)
        }

        list(
            "mapping" = mapping,
            "plot" = list(
                "center" = center,
                "size" = size,
                "labels" = axis_labels,
                "edges" = edges
            ),
            "widget" = "display_scatter"
        )
    }
    list(
        "init" = init
    )
}