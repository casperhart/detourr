describe("add_points", {
  it("needs either the data or the column means and scale factor", {
    # Arrange
    proxy <- list(
      session = list(
        sendCustomMessage = \(x, y) "stubbed function"
      )
    )
    points <- data.frame(list(
      a = c(1, 2, 3),
      b = c(2, 3, 4)
    ))
    # Act and Assert
    expect_error(add_points(proxy, points))
    expect_error(add_points(proxy, points, .col_means = c(1, 2)))
    expect_error(add_points(proxy, points, .scale_factor = 2))
  })

  it("returns a proxy class object", {
    # Arrange
    proxy <- list(
      id = "id",
      session = list(
        sendCustomMessage = \(x, y) "stubbed function"
      )
    ) |> structure(class = "detour_proxy")
    points <- data.frame(list(
      a = c(1, 2, 3),
      b = c(2, 3, 4)
    ))

    # Act
    out <- add_points(proxy, iris[1:3, 1:4], iris[, 1:4])

    # Assert
    expect_s3_class(out, "detour_proxy")
    expect_vector(out$id, ptype = character(), size = 1)
  })
})

describe("add_edges", {
  it("returns a proxy class object", {
    # Arrange
    proxy <- list(
      id = "id",
      session = list(
        sendCustomMessage = \(x, y) "stubbed function"
      )
    ) |> structure(class = "detour_proxy")
    points <- data.frame(list(
      from = c(1, 2, 3),
      to = c(2, 3, 4)
    ))

    # Act
    out <- add_edges(proxy, points)

    # Assert
    expect_s3_class(out, "detour_proxy")
    expect_vector(out$id, ptype = character(), size = 1)
  })
})