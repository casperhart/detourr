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


test_that("crosstalk SharedData attaches dependencies (#137)", {
  skip_if_not_installed("crosstalk")

  flea_shared <- crosstalk::SharedData$new(tourr::flea)
  t <- detour(flea_shared, mapping = tour_aes(projection = where(is.numeric), colour = species)) |>
    tour_path(max_bases = 2) |>
    show_scatter()

  # crosstalk metadata is passed through to the widget
  expect_equal(t$x$crosstalk$crosstalkIndex, flea_shared$key())
  expect_equal(t$x$crosstalk$crosstalkGroup, flea_shared$groupName())

  # crosstalk JS/CSS dependencies must be attached, otherwise the widget
  # renders blank with "crosstalk is not defined" in the browser console
  dep_names <- vapply(t$dependencies, function(d) d$name, character(1))
  expect_true("crosstalk" %in% dep_names)

  # non-serialisable dependency objects must not leak into the JSON payload
  expect_null(t$x$crosstalk$dependencies)
})


test_that("plain data frame attaches no crosstalk dependencies", {
  t <- detour(tourr::flea, mapping = tour_aes(projection = where(is.numeric))) |>
    tour_path(max_bases = 2) |>
    show_scatter()

  expect_null(t$x$crosstalk$crosstalkIndex)
  dep_names <- vapply(t$dependencies, function(d) d$name, character(1))
  expect_false("crosstalk" %in% dep_names)
})
