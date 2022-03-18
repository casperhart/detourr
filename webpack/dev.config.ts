const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "development",
  entry: {
    "display_scatter_2d/display_scatter_2d":
      "./srcts/display_scatter_2d/index.ts",
    "display_scatter_3d/display_scatter_3d":
      "./srcts/display_scatter_3d/index.ts",
    "display_sage_2d/display_sage_2d": "./srcts/display_sage_2d/index.ts",
    "display_sage_3d/display_sage_3d": "./srcts/display_sage_3d/index.ts",
    "display_slice_2d/display_slice_2d": "./srcts/display_slice_2d/index.ts",
    "display_slice_3d/display_slice_3d": "./srcts/display_slice_3d/index.ts",
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
          from: "dev/display_scatter_2d/static/",
          to: "display_scatter_2d",
        },
        {
          from: "dev/display_scatter_2d/static/",
          to: "display_scatter_2d",
        },
        {
          from: "dev/display_scatter_3d/static/",
          to: "display_scatter_3d",
        },
        {
          from: "dev/display_sage_2d/static/",
          to: "display_sage_2d",
        },
        {
          from: "dev/display_sage_3d/static/",
          to: "display_sage_3d",
        },
        {
          from: "dev/display_slice_2d/static/",
          to: "display_slice_2d",
        },
        {
          from: "dev/display_slice_3d/static/",
          to: "display_slice_3d",
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
