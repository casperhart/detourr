
<!-- README.md is generated from README.Rmd. Please edit that file -->

# d3tourr

Animations for {tourr} using htmlwidgets for performance and
portability.

# Installation

Install this package by running
`remotes::install_github("casperhart/d3tourr")` in R.

# Development

This project uses TypeScript code which needs to be compiled and bundled
for the package to work. To do this, you will need `node.js`, and `yarn`
installed.

After cloning this repository, you can install the node.js dependencies
via:

``` bash
yarn install
```

Compile and bundle the TypeScript code and install the R package from
source by running:

``` bash
yarn run build
```

The TypeScript code which powers the HTMLWidgets can also be run as a
standalone app using `webpack-dev-server` as follows:

``` bash
yarn run start-dev
```

This will start the webpack dev server, which will automatically
recompile and reload the TypeScript code as changes are made. The sample
data and HTML used for development can be found in `./dev`

# Examples

``` r
library(d3tourr)
animate_tour(
  tourr::flea,
  -species,
  display = display_scatter(tour_aes(colour = species)),
  render_opts = list(max_bases = 10)
)
```
