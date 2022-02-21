library(shiny)
library(crosstalk)
library(d3scatter)
library(detourr)
library(dplyr)

ui <- fluidPage(
  fluidRow(
    column(4, selectInput("species", "Species",
      levels(iris$Species),
      multiple = TRUE
    )),
    column(4, numericInput("seed", "Random Number Seed", "123")),
    column(4, sliderInput("max_bases", "Max. Bases", 3, 50, 10))
  ),
  fluidRow(
    column(4, d3scatterOutput("d3scatter", height = "400px")),

    # output function used matches display method (display_scatter) and tour
    # dimension (3d)
    column(8, displayScatter3dOutput("detour", height = "800px"))
  )
)

server <- function(input, output, session) {
  # updating data set based on user selection. This is different to linked
  # filtering in `demo/crosstalk.rmd` because a new tour is generated each time
  # the selection is changed.
  user_iris <- reactive({
    iris[is.null(input$species) | iris$Species %in% input$species, ]
  })

  shared_iris <- SharedData$new(user_iris)

  output$d3scatter <- renderD3scatter({
    d3scatter(
      shared_iris,
      ~Petal.Length, ~Petal.Width, ~Species
    )
  })

  output$detour <- shinyRenderDisplayScatter3d({
    set.seed(input$seed)

    detour(shared_iris, tour_aes(projection = -Species, colour = Species)) |>
      tour_path(grand_tour(3), max_bases = input$max_bases) |>
      display_scatter()
  })
}

shinyApp(ui, server)
