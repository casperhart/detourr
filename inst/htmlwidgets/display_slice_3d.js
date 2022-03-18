HTMLWidgets.widget({
  name: "display_slice_3d",
  type: "output",

  factory: function (el, width, height) {
    let slice = new display_slice_3d.DisplaySlice3d(el, width, height);
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
