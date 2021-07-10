
#' Animate a tour path.
#'
#' Display method for a high performance 3D scatterplot.
#' Performance is achieved through the use of Three.js / WebGL.
#' @param center If TRUE, center the projected data to (0, 0, 0).
#' @param cache_frames if TRUE, cache projected data at each frame of the animation. Reduces CPU usage if the tour is cycling, but can increase memory usage considerably.
#' @export
#' @examples
#' animate_tour(tourr::flea, -species, tourr::grand_tour(3), display_scatter())
display_scatter <- function(center = TRUE, cache_frames = TRUE) {
    init <- function(data) {
        list(
            "plot" = list(center = center, cacheFrames = cache_frames),
            "widget" = "display_scatter"
        )
    }
    list(
        "init" = init
    )
}