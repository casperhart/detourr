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