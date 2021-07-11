
<!-- README.md is generated from README.Rmd. Please edit that file -->

# d3tourr

Animations for {tourr} using htmlwidgets for performance and
portability.

# Installation

This project uses TypeScript code which needs to be compiled and bundled
for the package to work. To do this, you will need `node.js`, and `yarn`
installed.

After cloning this repository, you can install the `R` package by
running the following code from the {d3tourr} folder:

``` bash
yarn install
yarn run build
```

Note: Installing using `remotes::install_github` does *not* work (yet).

# Examples

``` r
library(d3tourr)
animate_tour(
  tourr::flea,
  -species,
  render_opts = list(max_bases = 10)
)
```
