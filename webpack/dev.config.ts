const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "development",
  entry: {
    "show_scatter_2d/show_scatter_2d": "./srcts/show_scatter_2d/index.ts",
    "show_scatter_3d/show_scatter_3d": "./srcts/show_scatter_3d/index.ts",
    "show_sage_2d/show_sage_2d": "./srcts/show_sage_2d/index.ts",
    "show_sage_3d/show_sage_3d": "./srcts/show_sage_3d/index.ts",
    "show_slice_2d/show_slice_2d": "./srcts/show_slice_2d/index.ts",
    "show_slice_3d/show_slice_3d": "./srcts/show_slice_3d/index.ts",
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
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "../dev_build/"),
    library: {
      name: "[name]",
      type: "umd",
    },
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: "dev/show_scatter_2d/static/",
          to: "show_scatter_2d",
        },
        {
          from: "dev/show_scatter_2d/static/",
          to: "show_scatter_2d",
        },
        {
          from: "dev/show_scatter_3d/static/",
          to: "show_scatter_3d",
        },
        {
          from: "dev/show_sage_2d/static/",
          to: "show_sage_2d",
        },
        {
          from: "dev/show_sage_3d/static/",
          to: "show_sage_3d",
        },
        {
          from: "dev/show_slice_2d/static/",
          to: "show_slice_2d",
        },
        {
          from: "dev/show_slice_3d/static/",
          to: "show_slice_3d",
        },
        {
          from: "dev/index.html",
          to: "",
        },
      ],
    }),
  ],
  devServer: {
    port: 9000,
  },
};
