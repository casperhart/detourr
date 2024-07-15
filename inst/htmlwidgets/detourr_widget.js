HTMLWidgets.widget({
  name: "detourr_widget",
  type: "output",

  factory: function (el, width, height) {
    let dt = new detourr.Detourr(el, width, height);
    return {
      renderValue: function (x) {
        dt.renderValue(x);
      },
      resize: function (width, height) {
        dt.resize(width, height);
      },
      s: dt,
    };
  },
});
