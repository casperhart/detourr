HTMLWidgets.widget({

    name: "display_xy",
    type: "output",

    factory: function (el, width, height) {
        return {
            renderValue: function (x) {
                // set up svg
                var svg = d3.select(el).append("svg")
                    .attr("viewBox", [0, 0, width, height])
                    //.attr("preserveAspectRatio", "xMinYMin meet")
                    //.style("height", "auto")
                    .append('g')

                config = x.config;
                raw_data = x.data;
                proj_mats = x.projections;

                let axis_scale;
                let axis_pos;

                if (config.axes == "center") {
                    axis_scale = 2 / 3;
                    axis_pos = 0;
                } else if (config.axes == "bottomleft") {
                    axis_scale = 1 / 6;
                    axis_pos = -2 / 3;
                }

                // adding 5% padding
                let data_range = [-1.05, 1.05]

                let x_scale = d3.scaleLinear()
                    .domain(data_range)
                    .range([0, width]);

                let y_scale = d3.scaleLinear()
                    .domain(data_range)
                    .range([height, 0]);

                let axis_range = data_range.map(x => x * axis_scale + axis_pos)

                let x_axis_scale = d3.scaleLinear()
                    .domain(data_range)
                    .range(axis_range.map(x_scale));

                let y_axis_scale = d3.scaleLinear()
                    .domain(data_range)
                    .range(axis_range.map(y_scale));

                projections = proj_mats.map(proj_mat => math.multiply(raw_data, proj_mat));

                if (config.center) {
                    projections = projections.map(center_columns)
                }
                projections = projections.map(X => math.divide(X, config.half_range))

                // want one row per point
                proj_data = transpose(projections)
                axis_data = transpose(proj_mats)

                // colours ;
                proj_data = config.col.map(function (col, i) { return { col: col, coords: proj_data[i] } });
                // axis labels
                axis_data = config.labels.map((x, i) => [x, axis_data[i]]);

                points = svg
                    .selectAll("dot")
                    .data(proj_data)
                    .join("circle")
                    .attr("cx", d => x_scale(d["coords"][0][0]))
                    .attr("cy", d => y_scale(d["coords"][0][1]))
                    .attr("r", 3)
                    .attr("fill", d => d["col"]);

                axes = svg
                    .selectAll("axis")
                    .data(axis_data)
                    .join("line")
                    .attr("x1", x_axis_scale(0))
                    .attr("y1", y_axis_scale(0))
                    .attr("x2", d => x_axis_scale(d[1][0][0]))
                    .attr("y2", d => y_axis_scale(d[1][0][1]))
                    .attr("stroke", "black");

                labels = svg
                    .selectAll("axis_labels")
                    .data(axis_data)
                    .join("text")
                    .attr("x", d => x_axis_scale(d[1][0][0]))
                    .attr("y", d => y_axis_scale(d[1][0][1]))
                    .text(d => d[0])

                n_frames = proj_mats.length

                if (n_frames > 2) {
                    for (let i = 1; i < proj_mats.length; i++) {
                        points = points
                            .transition()
                            .ease(d3.easeLinear)
                            .delay(0)
                            .duration(1000 / config.fps)
                            .attr("cx", d => x_scale(d["coords"][i][0]))
                            .attr("cy", d => y_scale(d["coords"][i][1]));

                        axes = axes
                            .transition()
                            .ease(d3.easeLinear)
                            .delay(0)
                            .duration(1000 / config.fps)
                            .attr("x1", d => x_axis_scale(0))
                            .attr("x2", d => y_axis_scale(0))
                            .attr("x2", d => x_axis_scale(d[1][i][0]))
                            .attr("y2", d => y_axis_scale(d[1][i][1]));

                        labels = labels
                            .transition()
                            .ease(d3.easeLinear)
                            .delay(0)
                            .duration(1000 / config.fps)
                            .attr("x", d => x_axis_scale(d[1][i][0]))
                            .attr("y", d => y_axis_scale(d[1][i][1]));
                    }
                }
            }
        }
    }
})