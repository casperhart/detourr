# generate sample data files for development

library(detourr)

set.seed(1)

p <- detour(tourr::flea, tour_aes(projection = where(is.numeric), color = species, label = species)) |>
  display_scatter()

writeLines(
  jsonlite::toJSON(unclass(p$x), auto_unbox = TRUE, null = "null"),
  "../dev/display_scatter_2d/static/sample_data.json"
)

set.seed(1)

p <- detour(tourr::flea, tour_aes(projection = where(is.numeric), color = species, label = species)) |>
  tour_path(grand_tour(3)) |>
  display_scatter()

writeLines(
  jsonlite::toJSON(unclass(p$x), auto_unbox = TRUE, null = "null"),
  "../dev/display_scatter_3d/static/sample_data.json"
)

set.seed(1)

p <- detour(tourr::flea, tour_aes(projection = where(is.numeric), color = species, label = species)) |>
  display_sage()

writeLines(
  jsonlite::toJSON(unclass(p$x), auto_unbox = TRUE, null = "null"),
  "../dev/display_sage_2d/static/sample_data.json"
)

p <- detour(tourr::flea, tour_aes(projection = where(is.numeric), color = species, label = species)) |>
  tour_path(grand_tour(3)) |>
  display_sage()

writeLines(
  jsonlite::toJSON(unclass(p$x), auto_unbox = TRUE, null = "null"),
  "../dev/display_sage_3d/static/sample_data.json"
)
