HTMLWidgets.widget({
  name: "show_scatter_2d",
  type: "output",

  factory: function (el, width, height) {
    let scatter = new show_scatter_2d.DisplayScatter2d(el, width, height);
    return {
      renderValue: function (x) {
        scatter.renderValue(x);
      },
      resize: function (width, height) {
        scatter.resize(width, height);
      },
      s: scatter,
    };
  },
});
