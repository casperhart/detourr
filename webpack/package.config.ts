const path = require('path');

module.exports = {
    mode: "production",
    entry: './srcts/scatter_widget/index.ts',
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
    output: {
        filename: 'scatter_widget.bundle.js',
        path: path.resolve(__dirname, "../inst/htmlwidgets/lib/scatter_widget"),
        library: "scatter_widget"
    }
};