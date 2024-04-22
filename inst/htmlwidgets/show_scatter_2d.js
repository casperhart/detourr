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

if(HTMLWidgets.shinyMode) {
  // register shiny callbacks
  Shiny.addCustomMessageHandler("add-points", function(x) {
    var widget = HTMLWidgets.find(`#${x.id}`);
    try{
      var scatter = widget.s;
      scatter.addPoints(
        x.data,
        x.config.colour,
        x.config.size,
        x.config.alpha
      );
    } catch (error) {
      console.error(`Could not find detour widget ${x.id}`)
    }
  })

  Shiny.addCustomMessageHandler("add-edges", function(x) {
    var widget = HTMLWidgets.find(`#${x.id}`);
    try{
      var scatter = widget.s;
      scatter.addEdges(x.edges, x.config.color);
    } catch (error) {
      console.error(`Could not find detour widget ${x.id}`)
    }
    var scatter = widget.s;
    scatter.addEdges(x.edges, x.config.color);
  })

  Shiny.addCustomMessageHandler("highlight-points", function(x) {
    var widget = HTMLWidgets.find(`#${x.id}`);
    var scatter = widget.s;
    scatter.highlightPoints(x.point_list.map(x => x - 1)); // adjusting for 0-indexing
  })

  Shiny.addCustomMessageHandler("enlarge-points", function(x) {
    var widget = HTMLWidgets.find(`#${x.id}`);
    var scatter = widget.s;
    scatter.enlargePoints(x.enlarge_point_list.map(x => x - 1), x.size); // adjusting for 0-indexing
  })

  Shiny.addCustomMessageHandler("clear-points", function(x) {
    var widget = HTMLWidgets.find(`#${x.id}`);
    var scatter = widget.s;
    scatter.clearPoints();
  })

  Shiny.addCustomMessageHandler("clear-edges", function(x) {
    var widget = HTMLWidgets.find(`#${x.id}`);
    var scatter = widget.s;
    scatter.clearEdges();
  })

  Shiny.addCustomMessageHandler("clear-highlight", function(x) {
    var widget = HTMLWidgets.find(`#${x.id}`);
    var scatter = widget.s;
    scatter.clearHighlight();
  })

  Shiny.addCustomMessageHandler("clear-enlarge", function(x) {
    var widget = HTMLWidgets.find(`#${x.id}`);
    var scatter = widget.s;
    scatter.clearEnlarge();
  })

  Shiny.addCustomMessageHandler("force-rerender", function(x) {
    var widget = HTMLWidgets.find(`#${x.id}`);
    var scatter = widget.s;
    scatter.forceRerender();
  })
}
