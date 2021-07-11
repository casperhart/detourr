
#' 3D Scatterplot display for tours
#'
#' Display method for a high performance 3D scatterplot.
#' Performance is achieved through the use of Three.js / WebGL.
#' @param mapping mapping created via `tour_aes()`. Currently only supports colour mapping.
#' @param center If TRUE, center the projected data to (0, 0, 0).
#' @param cache_frames if TRUE, cache projected data at each frame of the animation. Reduces CPU usage if the tour is cycling, but can increase memory usage considerably.
#' @export
#' @examples
#' animate_tour(tourr::flea, -species, tourr::grand_tour(3), display_scatter())
display_scatter <- function(mapping = NULL, center = TRUE, cache_frames = TRUE) {
    init <- function(data) {
        default_mapping <- list(colour = character(0))
        mapping <- purrr::map(mapping, get_mapping_cols, data)

        if ("colour" %in% names(mapping)) {
            mapping[["colour"]] <- vec_to_colour(mapping[["colour"]])
        }

        mapping <- merge_defaults_list(mapping, default_mapping)

        list(
            "mapping" = mapping,
            "plot" = list("center" = center, "cacheFrames" = cache_frames),
            "widget" = "display_scatter"
        )
    }
    list(
        "init" = init
    )
}