const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: "development",
    entry: './srcts/scatter_widget/index.ts',
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: 'ts-loader',
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
        ]
    },
    resolve: {
        modules: ['node_modules'],
        extensions: ['.ts', '.js'],
    },
    output: {
        filename: 'scatter_widget.bundle.js',
        path: path.resolve(__dirname, "../dev_build/scatter_widget"),
        library: {
            name: "scatter_widget",
            type: "umd"
        }
    },
    plugins: [
        new CopyPlugin({
            patterns: [{ from: 'dev/scatter_widget/static/' }]
        }),
    ],
    devServer: {
        port: 9000
    },
};