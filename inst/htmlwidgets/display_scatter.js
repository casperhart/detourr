HTMLWidgets.widget({

    name: "display_scatter",
    type: "output",

    factory: function (el, width, height) {
        let scatter = new scatter_widget.ScatterWidget(el, width, height);
        return {
            renderValue: function (x) {
                scatter.renderValue(x);
            },
            resize: function (width, height) {
                scatter.resize(width, height)
            },
            s: scatter
        }
    }
})