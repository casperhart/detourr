HTMLWidgets.widget({
  name: "show_sage_3d",
  type: "output",

  factory: function (el, width, height) {
    let sage = new show_sage_3d.DisplaySage3d(el, width, height);
    return {
      renderValue: function (x) {
        sage.renderValue(x);
      },
      resize: function (width, height) {
        sage.resize(width, height);
      },
      s: sage,
    };
  },
});
