library(shiny)
library(detourr)

ui <- function() {
  fluidPage(
    displayScatter3dOutput("detourr_out", width = "100%", height = "400px"),
    textOutput("detour_click_output")
  )
}

server <- function(input, output, session) {
  output$detourr_out <- shinyRenderDisplayScatter2d({
    detour(
      tourr::flea |> dplyr::mutate(id = dplyr::row_number()), tour_aes(projection = -species, colour = species, label = id)
    ) |>
      tour_path(grand_tour(3), fps = 60) |>
      show_scatter(alpha = 0.7, axes = TRUE)
  })

  output$detour_click_output <- renderText({
    print(input$detour_click)
  })
}

shinyApp(ui, server, options = list(port = 5534))