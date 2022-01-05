# generate sample data files for development

library(detourr)

set.seed(1)

p <- animate_tour(
  tourr::flea,
  display = display_scatter(tour_aes(color = species, label = species)),
  tour_path = tourr::grand_tour(2)
)

writeLines(
  jsonlite::toJSON(p$x, auto_unbox = TRUE, null = "null"),
  "../dev/display_scatter_2d/static/sample_data.json"
)

set.seed(1)

p <- animate_tour(
  tourr::flea,
  display = display_scatter(tour_aes(color = species, label = species)),
  tour_path = tourr::grand_tour(3)
)

writeLines(
  jsonlite::toJSON(p$x, auto_unbox = TRUE, null = "null"),
  "../dev/display_scatter_3d/static/sample_data.json"
)
