const path = require('path');
const webpack = require('webpack');

module.exports = {
    mode: "production",
    entry: { scatter_widget: './srcts/scatter_widget/index.ts' },
    module: {
        rules: [{
            test: /\.ts$/,
            exclude: /node_modules/,
            use: 'ts-loader',
        }]
    },
    resolve: {
        modules: ['node_modules'],
        extensions: ['.ts', '.js'],
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name(module) {
                        const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
                        return packageName;
                    },
                },
            },
        },
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, "../inst/htmlwidgets/lib/scatter_widget"),
        library: "scatter_widget"
    }
};