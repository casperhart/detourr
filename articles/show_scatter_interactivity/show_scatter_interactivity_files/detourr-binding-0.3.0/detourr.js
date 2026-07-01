HTMLWidgets.widget({
  name: "detourr",
  type: "output",

  factory: function (el, width, height) {
    let dt = new detourr.Detourr(el, width, height, HTMLWidgets.shinyMode);
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

if (HTMLWidgets.shinyMode) {
  // register shiny callbacks
  Shiny.addCustomMessageHandler("add-points", function (x) {
    var widget = HTMLWidgets.find(`#${x.id}`);
    try {
      var scatter = widget.s;
      scatter.addPoints(x.data, x.config.colour, x.config.size, x.config.alpha);
    } catch (error) {
      console.error(`Could not find detour widget ${x.id}`);
      console.error(error);
    }
  });

  Shiny.addCustomMessageHandler("add-edges", function (x) {
    var widget = HTMLWidgets.find(`#${x.id}`);
    try {
      var scatter = widget.s;
      scatter.addEdges(x.edges);
    } catch (error) {
      console.error(`Could not find detour widget ${x.id}`);
    }
  });

  Shiny.addCustomMessageHandler("highlight-points", function (x) {
    var widget = HTMLWidgets.find(`#${x.id}`);
    try {
      var scatter = widget.s;
      scatter.highlightPoints(x.point_list.map((x) => x - 1)); // adjusting for 0-indexing
    } catch (error) {
      console.error(`Could not find detour widget ${x.id}`);
    }
  });

  Shiny.addCustomMessageHandler("enlarge-points", function (x) {
    var widget = HTMLWidgets.find(`#${x.id}`);
    try {
      var scatter = widget.s;
      scatter.enlargePoints(
        x.enlarge_point_list.map((x) => x - 1),
        x.size
      ); // adjusting for 0-indexing
    } catch (error) {
      console.error(`Could not find detour widget ${x.id}`);
    }
  });

  Shiny.addCustomMessageHandler("clear-points", function (x) {
    var widget = HTMLWidgets.find(`#${x.id}`);
    try {
      var scatter = widget.s;
      scatter.clearPoints();
    } catch (error) {
      console.error(`Could not find detour widget ${x.id}`);
    }
  });

  Shiny.addCustomMessageHandler("clear-edges", function (x) {
    var widget = HTMLWidgets.find(`#${x.id}`);
    try {
      var scatter = widget.s;
      scatter.clearEdges();
    } catch (error) {
      console.error(`Could not find detour widget ${x.id}`);
    }
  });

  Shiny.addCustomMessageHandler("clear-highlight", function (x) {
    var widget = HTMLWidgets.find(`#${x.id}`);
    try {
      var scatter = widget.s;
      scatter.clearHighlight();
    } catch (error) {
      console.error(`Could not find detour widget ${x.id}`);
    }
  });

  Shiny.addCustomMessageHandler("clear-enlarge", function (x) {
    var widget = HTMLWidgets.find(`#${x.id}`);
    try {
      var scatter = widget.s;
      scatter.clearEnlarge();
    } catch (error) {
      console.error(`Could not find detour widget ${x.id}`);
    }
  });

  Shiny.addCustomMessageHandler("force-rerender", function (x) {
    var widget = HTMLWidgets.find(`#${x.id}`);
    try {
      var scatter = widget.s;
      scatter.forceRerender();
    } catch (error) {
      console.error(`Could not find detour widget ${x.id}`);
    }
  });
}
