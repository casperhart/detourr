HTMLWidgets.widget({
  name: "show_sage_2d",
  type: "output",

  factory: function (el, width, height) {
    let sage = new show_sage_2d.DisplaySage2d(el, width, height);
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
