const path = require("path");
const webpack = require("webpack");

module.exports = {
  mode: "production",
  entry: {
    display_scatter_2d: "./srcts/display_scatter_2d/index.ts",
    display_scatter_3d: "./srcts/display_scatter_3d/index.ts",
    display_sage_2d: "./srcts/display_sage_2d/index.ts",
    display_sage_3d: "./srcts/display_sage_3d/index.ts",
    display_slice_2d: "./srcts/display_slice_2d/index.ts",
    display_slice_3d: "./srcts/display_slice_3d/index.ts",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: "ts-loader",
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    modules: ["node_modules"],
    extensions: [".ts", ".js"],
  },
  optimization: {
    runtimeChunk: "single",
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(
              /[\\/]node_modules[\\/](.*?)([\\/]|$)/
            )[1];
            return packageName.replace("@", "");
          },
          chunks: "all",
        },
      },
    },
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "../inst/htmlwidgets/lib"),
    library: {
      name: "[name]",
      type: "umd",
    },
  },
};
