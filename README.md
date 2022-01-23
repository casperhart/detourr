
<!-- README.md is generated from README.Rmd. Please edit that file -->

# detourr

Animations for {tourr} using htmlwidgets for performance and
portability.

# Installation

Install this package by running the following in R:

``` r
remotes::install_github("casperhart/detourr")
```

# Examples

``` r
# 2D scatter
library(tourr)
library(detourr)
animate_tour(
   olive,
   display = display_scatter(tour_aes(colour = region)),
)
```

``` r
# 3D scatter
animate_tour(
   flea,
   grand_tour(3),
   display_scatter(tour_aes(colour = species))
)
```

# Development

## Getting Started

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
data and HTML used by the dev server can be found in `./dev`, and are
loaded in to memory based on the configuration in
`webpack/dev.config.ts`

If you wish to make changes to the HTML files in `dev/`, or debug the
`yarn run start-dev` command, you can instead run `yarn run build-dev`.
This will load the files in `dev/` in to a folder called `dev_build/`
rather than in to memory, which can make debugging easier.
