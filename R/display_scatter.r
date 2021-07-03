display_scatter <- function(cache_frames = TRUE) {
    init <- function(data) {
        list(
            "plot" = list(cacheFrames = cache_frames),
            "widget" = "display_scatter"
        )
    }
    list(
        "init" = init
    )
}