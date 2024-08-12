library(shiny)
library(detourr)

ui <- function() {
  fluidPage(
    fluidRow(
      column(6,displayScatter3dOutput("detourr_out", width = "100%", height = "400px")),
      column(6,textOutput("detourr_id"))
    )
  )
}

server <- function(input, output, session) {
  output$detourr_out <- shinyRenderDisplayScatter2d({
    detour(
      tourr::flea |> 
        dplyr::mutate(id = dplyr::row_number()), 
      tour_aes(projection = -species, colour = species, label = id)
    ) |>
      tour_path(grand_tour(3), fps = 60) |>
      show_scatter(alpha = 0.7, axes = TRUE)
  })

  output$detourr_id <- renderText({
    req(!is.null(input$detourr_out_detour_click))
    paste0("Clicked on id: ", input$detourr_out_detour_click)
  })

  observeEvent(input$detourr_out_detour_click, {
    print(input$detourr_out_detour_click)
  })
}

shinyApp(ui, server, options = list(port = 5534))