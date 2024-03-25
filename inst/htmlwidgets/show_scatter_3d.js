HTMLWidgets.widget({
  name: "show_scatter_3d",
  type: "output",

  factory: function (el, width, height) {
    let scatter = new show_scatter_3d.DisplayScatter3d(el, width, height);
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

if(HTMLWidgets.shinyMode) {
  // register shiny callbacks
  Shiny.addCustomMessageHandler("add-points", function(x) {
    var widget = HTMLWidgets.find(`#${x.id}`);
    var scatter = widget.s;
    scatter.addPoints(x.data)
  })

  Shiny.addCustomMessageHandler("add-edges", function(x) {
    var widget = HTMLWidgets.find(`#${x.id}`);
    var scatter = widget.s;
    scatter.addEdges(x.edges);
  })
}
