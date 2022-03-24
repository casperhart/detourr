HTMLWidgets.widget({
  name: "show_slice_2d",
  type: "output",

  factory: function (el, width, height) {
    let slice = new show_slice_2d.DisplaySlice2d(el, width, height);
    return {
      renderValue: function (x) {
        slice.renderValue(x);
      },
      resize: function (width, height) {
        slice.resize(width, height);
      },
      s: slice,
    };
  },
});
