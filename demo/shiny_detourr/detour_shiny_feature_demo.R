library(shiny)
library(detourr)

dataset <- tourr::flea |>
  dplyr::mutate(id = dplyr::row_number())

create_fake_box <- function(datum) {
  # expected tibble needs to have two rows with ncols(datum) + 1 columns
  box_dist <- rnorm(1, mean = 3)
  bounds_list <- rbind(datum + box_dist, datum - box_dist) |>
    as.list()
  do.call(tidyr::expand_grid, bounds_list)
}

main_ui <- function(id) {
  ns <- NS(id)
  fluidPage(
    column(6,
      displayScatter2dOutput(
        ns("detourr_out"), width = "100%", height = "400px"
      ),
      textOutput(ns("detour_click_output"))
    ),
    column(6,
      h1(
        "Tour of aesthetic changes",
        "for points and edges added to detourr through Shiny"
      ),
      p(
        "In this demonstration,",
        "clicking on points on the detourr instance to the left",
        "adds a box around the point.",
        "Click on the play button to view the box in different projections"
      ),
      p(
        "The points inside the box will be highlighted",
        "(By having a higher opacity than others)",
        "The point clicked on has a bigger radius",
        "These can be achieved by "
      ),
      p(
        "Click on an empty space in the dataset",
        "to remove the aesthetics completely.",
        "Or else click on the sweep (clear) button",
        "on the right handside of the controls" 
      )
    )
  )
}

main_server <- function(id) {
  moduleServer(id, function(input, output, session){
    output$detourr_out <- shinyRenderDisplayScatter2d({
      detour(dataset,
        tour_aes(projection = -c(id, species), colour = species, label = id)
      ) |>
        tour_path(grand_tour(2), fps = 60) |>
        show_scatter(
          alpha = 0.7,
          axes = TRUE
        )
    })

    output$detour_click_output <- renderText({
      input$detourr_out_detour_click
    })

    observeEvent(input$detourr_out_detour_click, {
      if (
        is.null(
          input$detourr_out_detour_click
          ) || input$detourr_out_detour_click == -1
      ) {
        display_scatter_proxy(session$ns("detourr_out")) |>
          clear_points() |>
          clear_edges() |>
          clear_highlight() |>
          clear_enlarge()
      }
      req(
        !is.null(input$detourr_out_detour_click),
        input$detourr_out_detour_click != -1
      )
      data_to_send <- dataset |>
        dplyr::select(-species) |>
        dplyr::filter(id == input$detourr_out_detour_click) |>
        dplyr::select(-id)

      box_to_send <- data_to_send |> create_fake_box()

      cube_box <- geozoo::cube.iterate(p = ncol(data_to_send))

      display_scatter_proxy(session$ns("detourr_out")) |>
        add_points(
          box_to_send,
          .data = dataset |> dplyr::select(-c(id, species)),
          colour = sample(
            c(
              "#d62b4d",
              "#01a760",
              "#9a0582",
              "#626300",
              "#ff9d4a"
            ),
            nrow(box_to_send),
            replace = TRUE
          ),
          size = 1,
          alpha = 0.6
        ) |>
        add_edges(
          edge_list = cube_box$edges
        ) |>
        highlight_points(
          point_list = sample(seq_len(nrow(dataset)))
        ) |>
        enlarge_points(
          input$detourr_out_detour_click, size = 3
        )
    })

  })
}

ui <- function() {
  main_ui("main")
}

server <- function(input, output, session) {
  main_server("main")
}

shinyApp(ui, server, options = list(port = 5534))
