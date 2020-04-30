var US_grid_container_id = "#US_map-grid-container";
var US_map_id = "#US_map-content";
var US_plot_id = "#US_plot-content";
var US_affiliation_id = "#US_map-affiliation";

var maptype = 'geojson';
var US_offset = 0

var US_map_width = $(US_grid_container_id).width() - US_offset;
var US_map_height = ($(US_grid_container_id).height() - US_offset) / 4 * 3;

var US_map_legend_width = $(US_affiliation_id).width(),
    US_map_legend_height = $(US_affiliation_id).height();

var US_map_margin = { top: 10, right: 10, bottom: 20, left: 10 };

var US_info_labels = null;
var cur_us_US = "NY";

var US_bounds = null;

var US_projection = d3.geoAlbersUsa()
    .scale(US_map_width * 5 / 4)
    .translate([US_map_width / 2, US_map_height / 2]);


var US_path = d3.geoPath()
    .projection(US_projection);

var US_svg = d3.select(US_map_id).append("svg")
    .attr("width", US_map_width)
    .attr("height", US_map_height)
    .append("g")
    .attr("transform", "translate(" + US_map_margin.left + "," + US_map_margin.top + ")");

var US_promises = [
    d3.json("https://luyuliu.github.io/COVID19-Dashboard/frontend/data/us-states-attributes.geojson"),
    d3.json("https://luyuliu.github.io/COVID19-Dashboard/frontend/data/covid-19-us-centroids.geojson"),
    d3.json("https://luyuliu.github.io/COVID19-Dashboard/frontend/data/all-cases-data-processed-states.json"),
    d3.json("https://luyuliu.github.io/COVID19-Dashboard/frontend/data/state_abbr_inv.json")
];

var US_timelines_lines = null;
var us_all_cases = null;

Promise.all(US_promises).then(ready);

function ready(all_data) {
    var US_geojson = all_data[0];
    var us_centroids = all_data[1];
    us_all_cases = all_data[2];
    US_abbr_inv = all_data[3];

    // set in main.js, reading from a file
    var US_start_date = start_date;
    var US_end_date = end_date;
    var n = total_days;

    /// GET MAX of cases
    var case_maxs = [];
    d3.keys(us_all_cases).forEach(function (d, i) {
        var val = us_all_cases[d][cur_case].slice(-1)[0];
        case_maxs[i] = val;
    });

    US_max = d3.max(case_maxs);

    ///////////////////////////

    var US_timelines_margin = { top: 50, right: 60, bottom: 30, left: 40 };
    var US_timelines_width = $(US_plot_id).width() - US_timelines_margin.left - US_timelines_margin.right,
        US_timelines_height = $(US_plot_id).height() - US_timelines_margin.top - US_timelines_margin.bottom - 50;

    var US_xScale = d3.scaleTime()
        .domain([case_date_parser(US_start_date), case_date_parser(US_end_date)])
        .range([0, US_timelines_width]); // output

    var US_toXScale = d3.scaleLinear()
        .domain([0, n - 1])
        .range([case_date_parser(US_start_date), case_date_parser(US_end_date)]);

    var US_yScale = d3.scaleLinear()
        .domain([0, US_max]) // input  TODO: get max
        .range([US_timelines_height, 0]); // output 

    //////////////////////////////////////////////////////////////////////////
    // US choropleth map
    /////////////////////////////////////////////////////////////////////////

    US_all_mapping_vars = [];
    US_list_mapping_var = [];
    US_current_mapping_var = "Med_HH_Inc";
    for (i = 0; i < US_geojson.features.length; i++) {
        if (i == 0) {
            var properties = US_geojson.features[i]["properties"];
            for (var key in properties) {
                var node = properties[key];
                if (!isNaN(+node)) {
                    US_list_mapping_var.push(key);
                }
            }
        }
        var val = US_geojson.features[i]["properties"][US_current_mapping_var];
        if (val != null)
        US_all_mapping_vars[i] = val;
    }
    US_bounds = get_var_bounds(US_all_mapping_vars);
    var US_color_scheme = d3.scaleThreshold()
        .domain(US_bounds)
        .range(d3.schemeGreys[4]);

    if (maptype === 'geojson') {
        var us = US_geojson;
        US_svg.append("g")
            .attr("class", "USs")
            .selectAll("path")
            .data(US_geojson.features)
            .enter().append("path")
            .attr("d", US_path)
            .attr("class", "US-land")
            // .style("fill", "white")
            .style("fill", function (d, i) {
                // if (i==0) alert("world again");
                return US_color_scheme(d["properties"][US_current_mapping_var]);
            })
            .style("stroke", "#aaa")
            .style("stroke-width", 0.5)
            .on("mouseover", function (d, i) {
                d3.select(this).interrupt();
                d3.select(this)
                    // .transition(t)
                    .style("fill", "#efef65");
            })
            .on("mouseout", function (d, i) {
                d3.select(this).interrupt();
                d3.select(this)
                    // .transition(t)
                    // .style("fill", "white");
                    .style("fill", US_color_scheme(d["properties"][US_current_mapping_var]));
            });;
    }
    else if (maptype === 'topojson') {
        var us = us_topojson;

        US_svg.append("g")
            .attr("class", "counties")
            .selectAll("path")
            .data(topojson.feature(us, us.objects.counties).features)
            .enter().append("path")
            .attr("d", US_path);

        US_svg.append("path")
            .datum(topojson.mesh(us, us.objects.USs, function (a, b) { return a !== b; }))
            .attr("class", "USs")
            .attr("d", US_path);

    }


    //////////////////////////////////////////////////////////////////////////
    // legend
    /////////////////////////////////////////////////////////////////////////

    const USmap_legend_svg = d3.select(US_affiliation_id)
        .append("svg")
        .attr("width", US_map_legend_width)
        .attr("height", US_map_legend_height);

    var legendg = USmap_legend_svg.append("g")
        .attr("id", "US-legend")
        .attr("transform", "translate(0,30)");

    var US_legend_linear = d3.legendColor()
        .labelFormat(d3.format(".2f"))
        .labels(d3.legendHelpers.thresholdLabels)
        // .useClass(true)
        .scale(US_color_scheme)
        .shapeWidth(US_map_legend_width / 4.1)
        .orient('horizontal');

    USmap_legend_svg.select("#US-legend")
        .call(US_legend_linear);

    // // Legend title 
    // legendg.append("text")
    //     .attr("class", "caption")
    //     .attr("x", 0)
    //     .attr("y", -6)
    //     .attr("fill", "#000")
    //     .attr("font-size", "20px")
    //     .attr("text-anchor", "start")
    //     .attr("font-weight", "bold")
    //     .text(US_current_mapping_var)

    var US_dropdown = d3.select(US_affiliation_id)
        .insert("select", "svg")
        .attr("id", "US-choreopleth-select")
        .attr("class", "select-css")
        .on("change", USDropdownChange);

    US_dropdown.selectAll("option")
        .data(US_list_mapping_var)
        .enter().append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) {
            return d; // capitalize 1st letter
        })
        .property("selected", function (d) {
            if (d == US_current_mapping_var) {
                return true;
            }
            else {
                return false;
            }
        })

    // Update choreopleth map
    function USDropdownChange(e) {
        US_current_mapping_var = $("#US-choreopleth-select").val();
        for (i = 0; i < US_geojson.features.length; i++) {
            if (i == 0) {
                var properties = US_geojson.features[i]["properties"];
                for (var key in properties) {
                    var node = properties[key];
                    if (!isNaN(+node)) {
                        US_list_mapping_var.push(key);
                    }
                }
            }
            var val = US_geojson.features[i]["properties"][US_current_mapping_var];
            if (val != null)
            US_all_mapping_vars[i] = val;
        }
        US_bounds = get_var_bounds(US_all_mapping_vars);

        US_color_scheme = d3.scaleThreshold()
            .domain(US_bounds)
            .range(d3.schemeGreys[4]);

        d3.selectAll(".US-land").transition()
            .duration(500)
            .style("fill", function (d) {
                return US_color_scheme(d["properties"][US_current_mapping_var])
            })

        // Update legend
        US_legend_linear = d3.legendColor()
            .labelFormat(d3.format(".2f"))
            .labels(d3.legendHelpers.thresholdLabels)
            // .useClass(true)
            .scale(US_color_scheme)
            .shapeWidth(US_map_legend_width / 4.1)
            .orient('horizontal');

        USmap_legend_svg.select("#US-legend")
            .call(US_legend_linear);
    }

    //////////////////////////////////////////////////////////////////////////
    // centroids
    /////////////////////////////////////////////////////////////////////////
    US_svg.selectAll(".symbol")
        // .data(us_centroids.features)
        .data(us_centroids.features.sort(function (a, b) {
            if (a.properties && b.properties) {
                na = a.properties.NAME;
                nb = b.properties.NAME;
                if (us_all_cases[na] && us_all_cases[nb])
                    return d3.descending(us_all_cases[na][cur_case][n - 1], us_all_cases[nb][cur_case][n - 1]);
                return -1;
            }
        }))
        .enter().append("path")
        .attr("class", "US_symbol")
        // .attr("d", path)
        .attr("d", US_path.pointRadius(function (d, i) {
            // if (i==0) alert("symbols again");
            if (d.properties) {
                name = d.properties.postal;
                if (us_all_cases[name]) {
                    return radius(us_all_cases[name][cur_case].slice(-1)[0]);
                }
            }
            return radius(0);

            // if (d.id) // strange trick to make it work. Otherwise will complain d.properties.population to be on none type
        }))
        .on("mouseenter", function (d) { // d is geojson obj
            US_timelines_svg.selectAll(".line").classed("US_highlight", function (dd, i) {
                if (dd == d.properties.postal) {
                    d3.select(this.parentNode).raise();
                    cur_us_US = dd;
                    return true;
                }
                else return false;
            });
            // US_timelines_svg.selectAll(".text-label").style("display", function (dd) {
            //     if (dd.label == d.properties.postal || US_names.includes(dd.label))
            //         return "block";
            //     else
            //         return "none";
            // });
            US_svg.selectAll(".US_symbol").classed("highlight", false); // clear 
            d3.select(this).classed("highlight", true);

            var ind = parseInt(US_toXScale.invert(cur_date_us)) + 1;
            US_info_labels[0].text(`${US_abbr_inv[cur_us_US]} ${case_date_format(cur_date_us)} [Day ${ind}]`);
            US_info_labels[1].text(`${case_names[cur_case]}: ${us_all_cases[cur_us_US][cur_case][ind]}`);
        })
        .on("mouseout", function (d) {
            US_timelines_svg.selectAll(".line").classed("US_highlight", false);
            US_timelines_svg.selectAll(".text-label").style("display", function (dd) {
                if (US_names.includes(dd.label))
                    return "block";
                else
                    return "none";

            });
            d3.select(this).classed("highlight", false);
        })
        ;

    /////////////////////////////////////////////////////////////////////////////
    // Multiple Line chart 
    /////////////////////////////////////////////////////////////////////////////

    var US_names = ["NY", "OH"]; // some highlight USs? [ "NY", "OH"];

    var US_sub_dataset = {};
    d3.keys(us_all_cases).forEach(function (d, i) {
        // if (US_names.includes(d))
        US_sub_dataset[d] = d3.range(n).map(function (i) {
            return {
                x: +US_toXScale(i),
                y: us_all_cases[d][cur_case][i]
            }
        })
    });

    var US_line = d3.line()
        .x(function (d) { return US_xScale(d.x); }) // set the x values for the line generator
        .y(function (d) { return US_yScale(d.y); }) // set the y values for the line generator 
        .curve(d3.curveMonotoneX) // apply smoothing to the line

    US_timelines_svg = d3.select(US_plot_id).append("svg")
        .attr("width", $(US_plot_id).width())
        .attr("height", $(US_plot_id).height())
        .append("g")
        .attr("transform", "translate(" + US_timelines_margin.left + "," + US_timelines_margin.top + ")");

    US_timelines_svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + US_timelines_height + ")")
        .call(d3.axisBottom(US_xScale).ticks(6)); // Create an axis component with d3.axisBottom

    US_timelines_svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(US_yScale).ticks(4, "s")) // Create an axis component with d3.axisLeft
        ;

    US_timelines_svg.append("path")
        .datum(US_sub_dataset) // 10. Binds data to the line 
        .attr("class", "line") // Assign a class for styling 
        .attr("d", US_line); // 11. Calls the line generator 

    US_timelines_svg.append("rect")
        .attr("class", "overlay")
        .attr("width", US_timelines_width)
        .attr("height", US_timelines_height)


    /////////////////////////////////////////////////////////////////////////////
    // hover lines on the line chart
    /////////////////////////////////////////////////////////////////////////////

    var US_timelines_hoverLine = US_timelines_svg.append("g")
        .attr("class", "hover-line")
        .append("line")
        .attr("id", "hover-line-US")
        .attr("x1", US_xScale(case_date_parser(US_end_date))).attr("x2", US_xScale(case_date_parser(US_end_date)))
        // .attr("x1", 10).attr("x2", 10)
        .style("pointer-events", "none") // Stop line interferring with cursor
        .style("opacity", 1);

    US_timelines_hoverLine.attr("y1", 0).attr("y2", US_timelines_height + 10);

    US_timelines_rect = US_timelines_svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", US_timelines_width + 1)  // quick fix of not getting the last date on mousemove!
        .attr("height", US_timelines_height)
        .style("fill", "none")
        .style("pointer-events", "all")
        // .style("display", "none")
        .on("mousemove", function () {
            var xpos = d3.mouse(this)[0];
            cur_date_us = US_xScale.invert(xpos);
            ind = parseInt(US_toXScale.invert(cur_date_us)) + 1;

            US_svg.selectAll(".US_symbol")
                .attr("d", US_path.pointRadius(function (d, i) {
                    if (d.properties) {
                        _case = us_all_cases[d.properties.postal];
                        if (_case) {
                            y = _case[cur_case][ind];
                            return radius(y);
                        }
                    }
                    return radius(0);
                }));

            US_info_labels[0].text(`${US_abbr_inv[cur_us_US]} ${case_date_format(cur_date_us)} [Day ${ind}]`);
            US_info_labels[1].text(`${case_names[cur_case]}: ${us_all_cases[cur_us_US][cur_case][ind]}`);
            d3.select("#hover-line-US") // select hover-line and change position
                .attr("x1", xpos)
                .attr("x2", xpos)
                .style("opacity", 1); // Making line visible
        })
        .on("mouseout", function (d) {
            // d3.select("#hover-line-US").style("opacity", 0); // hover line invisible
        })
        ;


    /////////////////////////////////////////////////////////////////////////////
    // labels
    /////////////////////////////////////////////////////////////////////////////

    var US_timelines_lines = US_timelines_svg.selectAll(".lines")
        .data(d3.keys(US_sub_dataset))
        .enter().append("g")
    // .attr("class", "lines")

    US_timelines_lines.append("path")
        .attr("class", "line")
        .attr("d", function (d) { return US_line(US_sub_dataset[d]); })
        // .style("stroke-width", 1)
        // .style("stroke", function(d) { 
        //       if (US_names.includes(d))
        //           return "#777";
        //       else
        //           return "#cdcdcd";})
        .on("mouseover", function (d) {
            US_timelines_svg.selectAll(".line").classed("US_highlight", function (dd, i) {
                if (dd == d) {
                    cur_us_US = d;
                    return true;
                }
                else return false;
            });
            // US_timelines_svg.selectAll(".text-label").style("display", function (dd) {
            //     if (dd.label == d || US_names.includes(dd.label)) return "block";
            //     else return "none";
            // });
            US_svg.selectAll(".US_symbol").classed("highlight", function (dd, i) {
                return (dd.properties.postal == d);
            });
            d3.select(this.parentNode).raise();

        })
        .on("mouseout", function (d) {
            // US_timelines_svg.selectAll(".text-label").style("display", function(d) {
            //     if (US_names.includes(d.label))
            //       return "block";
            //       else
            //       return "none";
            // 
            // }); 
            // 
        })
        ;

    US_timelines_lines.append("text")
        .attr("class", "text-label")
        .text(function (d) {
            // if (US_names.includes(d))
            return US_abbr_inv[d];
        })
        .attr("dy", ".35em")
        .datum(function (d) {
            // alert(US_sub_dataset[d].slice(-1)[0].y);
            return {
                label: d,
                x: US_sub_dataset[d].slice(-1)[0].x,
                y: US_sub_dataset[d].slice(-1)[0].y
            };
        })
        .attr("x", function (d) { return US_xScale(d.x) + 3; })
        .attr("y", function (d) { return US_yScale(d.y); })
        .style("display", function (d) {
            if (US_names.includes(d.label))
                return "block";
            else
                return "none";
        })
        ;
    US_info_labels = []
    US_info_labels[0] = US_timelines_svg
        .append('text')
        .attr("class", "hover-text")
        .attr("style", "fill: #ababab")
        .attr("x", 20)
        .attr("y", -5);
    US_info_labels[1] = US_timelines_svg
        .append('text')
        .attr("class", "hover-text")
        .attr("style", "font-size: 22px")
        .attr("x", 20)
        .attr("y", 20);
}
