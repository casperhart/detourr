test_that("axes work", {

  # default
  axis_labels <- names(tourr::flea)[1:6]
  t <- animate_tour(
    tourr::flea,
    display = display_scatter(max_bases = 2),
    tour_path = tourr::grand_tour(3)
  )
  expect_equal(t$x$config$axisLabels, axis_labels)
  expect_equal(t$x$config$axes, TRUE)

  # named vector
  axis_labels[axis_labels == "head"] <- "h"
  t <- animate_tour(
    tourr::flea,
    display = display_scatter(
      max_bases = 2,
      axes = c("h" = "head")
    ),
    tour_path = tourr::grand_tour(3)
  )
  expect_equal(t$x$config$axisLabels, axis_labels)
  expect_equal(t$x$config$axes, TRUE)

  # explicit labels
  t <- animate_tour(
    tourr::flea,
    display = display_scatter(
      max_bases = 2,
      axes = 1:6
    ),
    tour_path = tourr::grand_tour(3)
  )
  expect_equal(t$x$config$axisLabels, as.character(1:6))
  expect_equal(t$x$config$axes, TRUE)

  # FALSE
  t <- animate_tour(
    tourr::flea,
    display = display_scatter(
      max_bases = 2,
      axes = FALSE
    ),
    tour_path = tourr::grand_tour(3)
  )
  expect_equal(t$x$config$axisLabels, character(0))
  expect_equal(t$x$config$axes, FALSE)

  # NULL
  t <- animate_tour(
    tourr::flea,
    display = display_scatter(
      max_bases = 2,
      axes = NULL
    ),
    tour_path = tourr::grand_tour(3)
  )
  expect_equal(t$x$config$axisLabels, character(0))
  expect_equal(t$x$config$axes, TRUE)
})


test_that("colours work", {
  n <- nrow(tourr::flea)

  # default, black
  t <- animate_tour(
    tourr::flea,
    display = display_scatter(max_bases = 2)
  )
  expect_equal(t$x$mapping$colour, rep("#000000", n))
  expect_equal(t$x$mapping$label, character(0))

  # viridis, 3 colours
  pal <- viridisLite::viridis(3)[as.factor(tourr::flea$species)]
  pal <- substr(pal, 1, 7) # no alpha channel
  t <- animate_tour(
    tourr::flea,
    display = display_scatter(
      tour_aes(colour = species),
      max_bases = 2
    )
  )
  expect_equal(t$x$mapping$colour, pal)

  # AsIs column
  flea <- tourr::flea
  flea$pal_col <- pal
  t <- animate_tour(
    flea,
    display = display_scatter(
      tour_aes(colour = I(pal_col)),
      max_bases = 2
    )
  )
  expect_equal(t$x$mapping$colour, pal)

  # AsIs literal value
  t <- animate_tour(
    flea,
    display = display_scatter(
      tour_aes(colour = I(c("red", "green"))),
      max_bases = 2
    )
  )
  expect_equal(t$x$mapping$colour, rep(c("red", "green"), length.out = n))
})


test_that("labels work", {
  n <- nrow(tourr::flea)

  # single column aes
  t <- animate_tour(
    tourr::flea,
    display = display_scatter(
      tour_aes(label = species),
      max_bases = 2
    )
  )
  expect_equal(t$x$mapping$label, paste("species:", tourr::flea$species))

  # two column aes
  t <- animate_tour(
    tourr::flea,
    display = display_scatter(
      tour_aes(label = c(head, species)),
      max_bases = 2
    )
  )
  expect_equal(
    t$x$mapping$label,
    paste(paste("head:", tourr::flea$head),
      paste("species:", tourr::flea$species),
      sep = "<br>"
    )
  )

  # AsIs column
  t <- animate_tour(
    tourr::flea,
    display = display_scatter(
      tour_aes(label = I(species)),
      max_bases = 2
    )
  )
  expect_equal(t$x$mapping$label, as.character(tourr::flea$species))

  # AsIs literal value
  t <- animate_tour(
    tourr::flea,
    display = display_scatter(
      tour_aes(label = I("I am a label")),
      max_bases = 2
    )
  )
  expect_equal(t$x$mapping$label, rep("I am a label", n))
})
