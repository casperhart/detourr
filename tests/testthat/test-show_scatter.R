test_that("axes work", {

  # default
  axis_labels <- names(tourr::flea)[1:6]
  t <- detour(tourr::flea, mapping = tour_aes(projection = where(is.numeric))) |>
    tour_path(max_bases = 2) |>
    show_scatter()

  expect_equal(t$x$config$axisLabels, axis_labels)
  expect_equal(t$x$config$axes, TRUE)

  # named vector
  axis_labels[axis_labels == "head"] <- "h"
  t <- detour(tourr::flea, mapping = tour_aes(projection = where(is.numeric))) |>
    tour_path(max_bases = 2) |>
    show_scatter(axes = c("h" = "head"))

  expect_equal(t$x$config$axisLabels, axis_labels)
  expect_equal(t$x$config$axes, TRUE)

  # explicit labels
  t <- detour(tourr::flea, mapping = tour_aes(projection = where(is.numeric))) |>
    tour_path(max_bases = 2) |>
    show_scatter(axes = 1:6)
  expect_equal(t$x$config$axisLabels, as.character(1:6))
  expect_equal(t$x$config$axes, TRUE)

  # FALSE
  t <- detour(tourr::flea, mapping = tour_aes(projection = where(is.numeric))) |>
    tour_path(max_bases = 2) |>
    show_scatter(axes = FALSE)
  expect_equal(t$x$config$axisLabels, character(0))
  expect_equal(t$x$config$axes, FALSE)

  # NULL
  t <- detour(tourr::flea, mapping = tour_aes(projection = where(is.numeric))) |>
    tour_path(max_bases = 2) |>
    show_scatter(axes = NULL)
  expect_equal(t$x$config$axisLabels, character(0))
  expect_equal(t$x$config$axes, TRUE)
})


test_that("colours work", {
  n <- nrow(tourr::flea)

  # default, black
  t <- detour(tourr::flea, mapping = tour_aes(projection = where(is.numeric))) |>
    tour_path(max_bases = 2) |>
    show_scatter()

  expect_equal(t$x$mapping$colour, rep("#000000", n))
  expect_equal(t$x$mapping$label, character(0))

  # viridis, 3 colours
  pal <- viridisLite::viridis(3)[as.factor(tourr::flea$species)]
  pal <- substr(pal, 1, 7) # no alpha channel
  t <- detour(tourr::flea, mapping = tour_aes(projection = where(is.numeric), colour = species)) |>
    tour_path(max_bases = 2) |>
    show_scatter()
  expect_equal(t$x$mapping$colour, pal)

  # AsIs column
  flea <- tourr::flea
  flea$pal_col <- pal
  t <- detour(flea, mapping = tour_aes(projection = where(is.numeric), colour = I(pal_col))) |>
    tour_path(max_bases = 2) |>
    show_scatter()

  expect_equal(t$x$mapping$colour, pal)

  # AsIs literal value
  t <- detour(tourr::flea, mapping = tour_aes(
    projection = where(is.numeric),
    colour = I(c("red", "green"))
  )) |>
    tour_path(max_bases = 2) |>
    show_scatter()
  expect_equal(t$x$mapping$colour, rep(c("red", "green"), length.out = n))

  # background colour
  t <- detour(tourr::flea, mapping = tour_aes(
    projection = where(is.numeric),
    colour = I(c("red", "green"))
  )) |>
    tour_path(max_bases = 2) |>
    show_scatter(background_colour = "lightgray")

  expect_equal(t$x$config$backgroundColour, "#D3D3D3")

  # background colour, american spelling
  t <- detour(tourr::flea, mapping = tour_aes(
    projection = where(is.numeric),
    colour = I(c("red", "green"))
  )) |>
    tour_path(max_bases = 2) |>
    show_scatter(background_color = "lightgray")

  expect_equal(t$x$config$backgroundColour, "#D3D3D3")
})


test_that("labels work", {
  n <- nrow(tourr::flea)

  # single column aes
  t <- detour(tourr::flea, mapping = tour_aes(projection = where(is.numeric), label = species)) |>
    tour_path(max_bases = 2) |>
    show_scatter()
  expect_equal(t$x$mapping$label, paste("species:", tourr::flea$species))

  # two column aes
  t <- detour(tourr::flea, mapping = tour_aes(projection = where(is.numeric), label = c(head, species))) |>
    tour_path(max_bases = 2) |>
    show_scatter(background_colour = "lightgray")
  expect_equal(
    t$x$mapping$label,
    paste(paste("head:", tourr::flea$head),
      paste("species:", tourr::flea$species),
      sep = "<br>"
    )
  )

  # AsIs column
  t <- detour(tourr::flea, mapping = tour_aes(projection = where(is.numeric), label = I(species))) |>
    tour_path(max_bases = 2) |>
    show_scatter(background_colour = "lightgray")
  expect_equal(t$x$mapping$label, as.character(tourr::flea$species))

  # AsIs literal value
  t <- detour(tourr::flea, mapping = tour_aes(projection = where(is.numeric), label = I("I am a label"))) |>
    tour_path(max_bases = 2) |>
    show_scatter(background_colour = "lightgray")
  expect_equal(t$x$mapping$label, rep("I am a label", n))
})
