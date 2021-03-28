display_xy <- function(center = TRUE, axes = "center", half_range = NULL, col = "black") {
    init <- function(data) {
        half_range <- compute_half_range(half_range, data, center)
        labels <- abbreviate(colnames(data), 3, named = FALSE)
        if (!tourr::areColors(col)) {
            col <- tourr::mapColors(col)
        }
        col <- sapply(col, col2hex, USE.NAMES = FALSE)

        if (length(col) == 1) {
            col <- rep(col, nrow(data))
        } else if (length(col) != nrow(data)) {
            stop(paste0("Length of 'col' argument should be 1 or nrow(data). Got ", length(col)))
        }

        if (!is.vector(col)) {
            stop("Argument 'col' must be a vector")
        }

        # TODO Add edges argument
        list(
            "plot" = list(
                "labels" = labels,
                "axes" = axes,
                "center" = center,
                "col" = col,
                "half_range" = half_range
            ),
            "js" = list(
                "script" = system.file("d3/display_xy.js", package = "d3tourr"),
                "dependencies" = c(system.file("js/math.min.js", package = "d3tourr"), system.file("js/utils.js", package = "d3tourr"))
            )
        )
    }
    list(
        "init" = init
    )
}