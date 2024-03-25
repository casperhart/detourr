library(shiny)
library(detourr)

dataset <- tourr::flea |> dplyr::mutate(id = dplyr::row_number())
dataset_scaled <- dataset |> dplyr::select(-c(id, species)) |> scale(scale = FALSE)
dataset_scale_factor <- 1 / max(sqrt(rowSums(dataset_scaled^2)))

ui <- function() {
  fluidPage(
    displayScatter3dOutput("detourr_out", width = "100%", height = "400px"),
    textOutput("detour_click_output")
  )
}

create_fake_box <- function(datum) {
  # expected tibble needs to have two rows with ncols(datum) + 1 columns
  box_dist <- rnorm(1, mean = 3)
  bounds_list <- rbind(datum + box_dist, datum - box_dist) |>
    as.list()
  do.call(tidyr::expand_grid, bounds_list)
}

server <- function(input, output, session) {
  output$detourr_out <- shinyRenderDisplayScatter2d({
    detour(dataset,
      tour_aes(projection = -c(id, species), colour = species, label = id)
    ) |>
      tour_path(grand_tour(3), fps = 60) |>
      show_scatter(alpha = 0.7, axes = TRUE)
  })

  output$detour_click_output <- renderText({
    input$detour_click
  })

  observeEvent(input$detour_click, {
    req(!is.null(input$detour_click))
    data_to_send <- dataset |>
      dplyr::select(-species) |>
      dplyr::filter(id == input$detour_click) |>
      dplyr::select(-id)

    box_to_send <- data_to_send |> create_fake_box()
    darg <- data_to_send |>
      as.matrix() |>
      unname() |>
      scale(
        center = attributes(dataset_scaled)[["scaled:center"]],
        scale = FALSE
      )

    display_scatter_proxy("detourr_out") |>
      add_points(
        box_to_send,
        scale_attr = attributes(dataset_scaled),
        scale_factor =  dataset_scale_factor
      )
  })
}

shinyApp(ui, server, options = list(port = 5534))
