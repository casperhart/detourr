library(shiny)
library(detourr)

dataset <- tourr::flea |> dplyr::mutate(id = dplyr::row_number())

ui <- function() {
  fluidPage(
    displayScatter3dOutput("detourr_out", width = "100%", height = "400px"),
    textOutput("detour_click_output")
  )
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
    print(input$detour_click)
  })

  observeEvent(input$detour_click, {
    req(!is.null(input$detour_click))
    print("observeEvent fired")
    print(input$detour_click)
    data_to_send <- dataset |>
      dplyr::select(-species) |>
      dplyr::filter(id == input$detour_click) |>
      dplyr::mutate(dplyr::across(-id, \(x) x + rnorm(1))) |>
      dplyr::select(-id)

    display_scatter_proxy("detourr_out") |>
      add_points(data_to_send)
  })
}

shinyApp(ui, server, options = list(port = 5534))
