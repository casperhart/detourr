const path = require("path");
const webpack = require("webpack");

module.exports = {
  mode: "production",
  entry: {
    show_scatter_2d: "./srcts/show_scatter_2d/index.ts",
    show_scatter_3d: "./srcts/show_scatter_3d/index.ts",
    show_sage_2d: "./srcts/show_sage_2d/index.ts",
    show_sage_3d: "./srcts/show_sage_3d/index.ts",
    show_slice_2d: "./srcts/show_slice_2d/index.ts",
    show_slice_3d: "./srcts/show_slice_3d/index.ts",
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
      {
        test: /\.wasm$/i,
        type: "javascript/auto",
        use: [
          {
            loader: "file-loader",
          },
        ],
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
