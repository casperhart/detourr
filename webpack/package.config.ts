const path = require("path");
const webpack = require("webpack");

module.exports = {
  mode: "production",
  entry: {
    detourr: "./srcts/index.ts"
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
        use: [
          {
            loader: "url-loader",
            options: {
              mimetype: "application/wasm",
            },
          },
        ],
      },
    ],
  },
  resolve: {
    modules: ["node_modules"],
    extensions: [".ts", ".js"],
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
