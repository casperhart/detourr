const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

const widgets = [
  "show_scatter_2d",
  "show_scatter_3d",
  "show_sage_2d",
  "show_sage_3d",
  "show_slice_2d",
  "show_slice_3d",
];

let entries = {};
widgets.map((w) => (entries[`${w}/${w}`] = `./srcts/${w}/index.ts`));

const copyStaticPatterns = widgets.map((w) => {
  return { from: `dev/${w}/static/`, to: `${w}` };
});

module.exports = {
  mode: "development",
  entry: entries,
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
    path: path.resolve(__dirname, "../dev_build/"),
    library: {
      name: "[name]",
      type: "umd",
    },
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        ...copyStaticPatterns,
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
