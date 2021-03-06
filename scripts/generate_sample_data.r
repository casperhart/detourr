# generate sample data files for development

library(detourr)
library(geozoo)
library(tidyverse)

set.seed(1)

p <- detour(tourr::flea, tour_aes(projection = where(is.numeric), color = species, label = species)) |>
  show_scatter()

writeLines(
  jsonlite::toJSON(unclass(p$x), auto_unbox = TRUE, null = "null"),
  "../dev/show_scatter_2d/static/sample_data.json"
)

set.seed(1)

p <- detour(tourr::flea, tour_aes(projection = where(is.numeric), color = species, label = species)) |>
  tour_path(grand_tour(3)) |>
  show_scatter()

writeLines(
  jsonlite::toJSON(unclass(p$x), auto_unbox = TRUE, null = "null"),
  "../dev/show_scatter_3d/static/sample_data.json"
)

set.seed(1)

p <- detour(tourr::flea, tour_aes(projection = where(is.numeric), color = species, label = species)) |>
  show_sage()

writeLines(
  jsonlite::toJSON(unclass(p$x), auto_unbox = TRUE, null = "null"),
  "../dev/show_sage_2d/static/sample_data.json"
)

set.seed(1)

p <- detour(tourr::flea, tour_aes(projection = where(is.numeric), color = species, label = species)) |>
  tour_path(grand_tour(3)) |>
  show_sage()

writeLines(
  jsonlite::toJSON(unclass(p$x), auto_unbox = TRUE, null = "null"),
  "../dev/show_sage_3d/static/sample_data.json"
)

set.seed(1)

x <- geozoo::roman.surface(n = 200)$points |>
  as_tibble(.name_repair = "unique")

p <- detour(x, tour_aes(projection = everything())) |>
  tour_path(grand_tour(2), max_bases = 10) |>
  show_slice(slice_relative_volume = 0.1)

writeLines(
  jsonlite::toJSON(unclass(p$x), auto_unbox = TRUE, null = "null"),
  "../dev/show_slice_2d/static/sample_data.json"
)

set.seed(1)

x <- geozoo::sphere.hollow(p = 4, n = 200)$points |>
  as_tibble(.name_repair = "unique")

p <- detour(x, tour_aes(projection = everything())) |>
  tour_path(grand_tour(3)) |>
  show_slice(slice_relative_volume = 0.3)

writeLines(
  jsonlite::toJSON(unclass(p$x), auto_unbox = TRUE, null = "null"),
  "../dev/show_slice_3d/static/sample_data.json"
)
