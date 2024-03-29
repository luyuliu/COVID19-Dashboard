var world_grid_container_id = "#world_map-grid-container";
var world_map_id = "#world_map-content";
var world_plot_id = "#world_plot-content";
var world_affiliation_id = "#world_map-affiliation" // TODO: program this, and other id's?

var all_mapping_vars = [];
var country_names = ["USA"]; // ["Mainland China", "USA", "Italy", "Japan"];

var bounds = null; // bounds for choropleth map classes
var timelines_lines = null;
var locked_region = null;

var worldmap_width = $(world_grid_container_id).width(),
    worldmap_height = $(world_grid_container_id).height() - 145; // need 135 for both dropdown and legend

var worldmap_legend_width = $(world_affiliation_id).width(),
    worldmap_legend_height = $(world_affiliation_id).height();

// scale globe to size of window
var globe_scale = Math.min(worldmap_width, worldmap_height) / 3;

// geoNaturalEarth1
// geoEqualEarth
// geoWinkel3
// geoOrthographic
// geoFahey

var projection = d3.geoOrthographic().rotate([-10, -40, 0]) // λ, ϕ, γ
    .scale(globe_scale) // percent within rectangle of width x height
    .translate([worldmap_width / 2, worldmap_height / 2]);

var graticule = d3.geoGraticule();

var path = d3.geoPath().projection(projection);
// var t = d3.transition(); // smooth

var timelines_svg = null;

var world_info_labels = null;
var world_summary_info_labels = null;

var worldmap_svg = d3.select(world_map_id)
    .append("svg")
    .attr("id", "world_svg")
    .attr("width", worldmap_width)
    .attr("height", worldmap_height);

// append g element for map
var worldmap = worldmap_svg.append("g");

var gpos0, o0, gpos1, o1;

// functions for dragging
function dragstarted() {
    gpos0 = projection.invert(d3.mouse(this));
    o0 = projection.rotate();
}

function dragged() {
    gpos1 = projection.invert(d3.mouse(this));
    o0 = projection.rotate();
    o1 = eulerAngles(gpos0, gpos1, o0);
    if (o1) { // sometimes o1 is null, and this will help
        // o1[1] = -35;
        o1[2] = 0;
        projection.rotate(o1);
    }
    worldmap_svg.selectAll("path").attr("d", path);
}

// enable drag
var drag = d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged);

worldmap_svg.call(drag);

// functions for zooming
function zoomed() {
    projection.scale(d3.event.transform.translate(projection).k * globe_scale)
    worldmap_svg.selectAll("path").attr("d", path);
}

// enable zoom
var zoom = d3.zoom()
    .scaleExtent([0.95, 50]) //bound zoom
    .on("zoom", zoomed);

worldmap_svg.call(zoom);


var cur_case = "confirmed";
var cur_world_region = "USA";
var world_case_names_list = [
	["confirmed", "Confirmed"],
	["deaths", "Deaths"],
	["recovered", "Recovered"]];

function world_ready() { // TODO: LONG function!

    // total_days is one day less since not inclusive
    // use the size of the array in all_cases
    actual_len = all_cases[d3.keys(all_cases)[0]]['confirmed'].length;
    world_cases_sum = {
        "confirmed": Array(actual_len).fill(0),
        "deaths": Array(actual_len).fill(0),
        "recovered": Array(actual_len).fill(0)
    }
    var case_maxs = [];

    d3.keys(all_cases).forEach(function (d, i) { // go through all countries
        var val = all_cases[d][cur_case].slice(-1)[0];
        case_maxs[i] = val;
        for (j = 0; j < all_cases[d]["confirmed"].length; j++) {
            world_cases_sum["confirmed"][j] += all_cases[d]["confirmed"][j]
            world_cases_sum["deaths"][j] += all_cases[d]["deaths"][j]
            world_cases_sum["recovered"][j] += all_cases[d]["recovered"][j]
        }
    });

    world_max = d3.max(case_maxs);

    ///////////////////////////

    var timelines_margin = { top: 50, right: 60, bottom: 60, left: 40 };
    var timelines_width = $(world_plot_id).width() - timelines_margin.left - timelines_margin.right,
        timelines_height = $(world_plot_id).height() - timelines_margin.top - timelines_margin.bottom;

    var n = total_days;

    // date -> x-coordinate
    var xScale = d3.scaleTime()
        .domain([case_date_parser(start_date), case_date_parser(end_date)])
        .range([0, timelines_width]); // output

    // index -> date
    var toXScale = d3.scaleLinear()
        .domain([0, n - 1])
        .range([case_date_parser(start_date), case_date_parser(end_date)]);

    var yScale = d3.scaleLinear()
        .domain([0, world_max]) // input 
        .range([timelines_height, 0]); // output 

    ///////////////////////////

    var radius = d3.scaleSqrt()
        .domain([0, world_max])
        .range([0, 70]);

    //////////////////////////////////////////////////////////////////////////
    // info on title bar
    /////////////////////////////////////////////////////////////////////////

    ind = world_cases_sum["confirmed"].length - 1;

    update_title_info("#world-info",
        cur_date_world,
        world_cases_sum["confirmed"][ind],
        ind == 0 ? 0 : world_cases_sum["confirmed"][ind - 1],
        world_cases_sum["deaths"][ind],
        ind == 0 ? 0 : world_cases_sum["deaths"][ind - 1],
        world_cases_sum["recovered"][ind],
        ind == 0 ? 0 : world_cases_sum["recovered"][ind - 1]
    )

    /////////////////////////////////////////////////////////////////////////////
    // World choropleth map
    /////////////////////////////////////////////////////////////////////////////

    var world_regions = topojson.feature(world0, world0.objects.countries);

    var world_map_friendly_names = {
        "POP_SR": "Senior (%)",
        "POP_CHLDN": "Children (%)",
        "POP_AD": "Adults (%)",
        "POP_YOUTH": "Youth (%)",
        "ECON_GNI": "GNI Per Capita ($)"
    }

    all_mapping_vars = [];
    list_mapping_var = [];
    current_mapping_var = "POP_SR";
    for (i = 0; i < world_regions.features.length; i++) {
        if (i == 0) {
            var properties = world_regions.features[i]["properties"];
            for (var key in properties) {
                var node = properties[key];
                if (!isNaN(+node)) {
                    list_mapping_var.push(key);
                }
            }
        }
        var val = world_regions.features[i]["properties"][current_mapping_var];
        if (val != null)
            all_mapping_vars[i] = +val;
    }
    bounds = get_var_bounds(all_mapping_vars);

    var world_color_scheme = d3.scaleThreshold()
        .domain(bounds)
        .range(d3.schemeGreys[3]);

    worldmap_svg.append("path")
        .datum({ type: "Sphere" })
        .attr("class", "ocean")
        .attr("d", path);

    worldmap_svg.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);

    worldmap_svg.append("path")
        .datum(graticule.outline)
        .attr("class", "graticule")
        .attr("d", path);

    worldmap_svg.selectAll(".world")
        .data(world_regions.features)
        .enter()
        .append("path")
        .attr("class", "world-land")
        .attr("d", path)
        .style("fill", function (d, i) {
            // if (i==0) alert("world again");
            // console.log((d["properties"][current_mapping_var]))
            return world_color_scheme(d["properties"][current_mapping_var]);
        })
        // .style("stroke", "#999")
        .on("mouseover", function (d) { // choropleth map - d is a geojson obj
            d3.select(this)
                .interrupt()
                // .transition(t)
                .style("fill", "#efef65");

            // reset line colors first
            timelines_svg.selectAll(".line")
                .classed("world_highlight "+ cur_case, function (dd, i) {
                    if (dd == d.properties.Country_Region) {
                        d3.select(this).raise();
                        cur_world_region = dd;
                        return true;
                    }
                    else return false;
                });

            // rest labels too
            timelines_svg.selectAll(".text-label").style("display", function(dd) {
                if (dd.label == d.properties.Country_Region || country_names.includes(dd.label) || dd.label==locked_region) 
                    return "block";
                else
                    return "none";
            });
    
            // handle null region names or names not having cases
            if (!locked_region) {
                region = d.properties.Country_Region?d.properties.Country_Region:d.properties.SOV_A3;
                if (!d3.keys(all_cases).includes(region)) { 
                    world_info_labels[0].attr("class", "hover-text grey").text(region)
                    world_info_labels[1].text("(no data)")
                    return
                }
            }

            worldmap_svg.selectAll(".world_symbol").classed("highlight", false); // clear first 

            var ind = parseInt(toXScale.invert(cur_date_world)) + 1;
            region = locked_region?locked_region:cur_world_region;
            update_info_labels(world_info_labels, region, cur_date_world, ind, cur_case, all_cases[region][cur_case][ind], locked_region);
        })
        .on("click", handle_click)
        .on("mouseout", function (d) {
            d3.select(this).interrupt()
                // .transition(10)
                .style("fill", world_color_scheme(d["properties"][current_mapping_var]));
            // timelines_svg.selectAll(".line").classed("world_highlight "+ cur_case, false);
            // timelines_svg.selectAll(".text-label").style("display", function(dd) {
            //     if (country_names.includes(dd.label) || dd.label==locked_region) 
            //         return "block";
            //     else
            //         return "none";
            // }); 
    
        });

    //////////////////////////////////////////////////////////////////////////
    // legend
    /////////////////////////////////////////////////////////////////////////

    var worldmap_legend_svg = make_legend_svg(world_affiliation_id, worldmap_legend_width, worldmap_legend_height, "world-legend");

    var legendg = make_legend(worldmap_legend_svg, "#world-legend", world_color_scheme, worldmap_legend_width, "vertical");

    var dropdown = d3.select(world_affiliation_id)
        .insert("select", "svg")
        .attr("id", "world-choropleth-select")
        .attr("class", "select-css")
        .on("change", worldDropdownChange);

    dropdown.selectAll("option")
        .data(list_mapping_var)
        .enter().append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) {
            return world_map_friendly_names[d];
        })
        .property("selected", function (d) {
            if (d == current_mapping_var) {
                return true;
            }
            else {
                return false;
            }
        })

    // Update choropleth map
    function worldDropdownChange(e) {
        current_mapping_var = $("#world-choropleth-select").val();
        for (i = 0; i < world_regions.features.length; i++) {
            if (i == 0) {
                var properties = world_regions.features[i]["properties"];
                for (var key in properties) {
                    var node = properties[key];
                    if (!isNaN(+node)) {
                        list_mapping_var.push(key);
                    }
                }
            }
            var val = world_regions.features[i]["properties"][current_mapping_var];
            if (val != null)
                all_mapping_vars[i] = val;
        }
        bounds = get_var_bounds(all_mapping_vars);

        world_color_scheme = d3.scaleThreshold()
            .domain(bounds)
            .range(d3.schemeGreys[3]);

        d3.selectAll(".world-land").transition()
            .duration(500)
            .style("fill", function (d) {
                return world_color_scheme(d["properties"][current_mapping_var])
            })

        make_legend(worldmap_legend_svg, "#world-legend", world_color_scheme, worldmap_legend_width, "vertical");

        // // Update legend
        // legend_linear = d3.legendColor()
        //     .labelFormat(d3.format(".2f"))
        //     .labels(d3.legendHelpers.thresholdLabels)
        //     // .useClass(true)
        //     .scale(world_color_scheme)
        //     .shapeWidth(worldmap_legend_width / 4.1)
        //     .orient('vertical');
        // 
        // worldmap_legend_svg.select("#world-legend")
        //     .call(legend_linear);
    }

    //////////////////////////////////////////////////////////////////////////
    // centroids
    /////////////////////////////////////////////////////////////////////////

    worldmap_svg.selectAll(".symbol")
        // .data(world_centroids.features)
        .data(world_centroids.features.sort(function (a, b) { // specify and sort data
            if (a.properties && b.properties) {
                na = a.properties.NAME;
                nb = b.properties.NAME;
                if (all_cases[na] && all_cases[nb])
                    return d3.descending(all_cases[na][cur_case][n - 1], all_cases[nb][cur_case][n - 1]);
                return -1;
            }
        }))
        .enter().append("path")
        .attr("class", "world_symbol")
        // .attr("d", path)
        .attr("d", path.pointRadius(function (d, i) {
            // if (i==0) alert("symbols again");
            if (d.properties) {
                name = d.properties.NAME;
                if (all_cases[name]) {
                    // console.log(d, i, all_cases[name])
                    return radius(all_cases[name][cur_case].slice(-1)[0]);
                }
            }
            return radius(0);

            // if (d.id) // strange trick to make it work. Otherwise will complain d.properties.population to be on none type
        }))
        .on("mouseenter", function (d) { // d is geojson obj of the circle
            timelines_svg.selectAll(".line").classed("world_highlight "+ cur_case, function (dd, i) {
                if (dd == d.properties.NAME) {
                    d3.select(this).raise();
                    cur_world_region = dd;
                    return true;
                }
                else return false;
            });

            timelines_svg.selectAll(".text-label").style("display", function(dd) {
                if (dd.label == d.properties.NAME || country_names.includes(dd.label) || dd.label==locked_region) 
                    return "block";
                else
                    return "none";
            }); 
            worldmap_svg.selectAll(".world_symbol").classed("highlight", false); // clear 
            d3.select(this).classed("highlight", true);

            var ind = parseInt(toXScale.invert(cur_date_world)) + 1;
            region = locked_region?locked_region:cur_world_region;
            update_info_labels(world_info_labels, region, cur_date_world, ind, cur_case, all_cases[region][cur_case][ind], locked_region);
        })
        .on("click", handle_click)
        .on("mouseout", function (d) {
            // timelines_svg.selectAll(".line").classed("world_highlight "+ cur_case, false);
            // timelines_svg.selectAll(".text-label").style("display", function (dd) {
            //     if (country_names.includes(dd.label) || dd.label==locked_region)
            //         return "block";
            //     else
            //         return "none";
            // });
            // d3.select(this).classed("highlight", false);
        });


    // handle click on either a circle symbol or polygon
    function handle_click(d) {
        obj = d3.select(this);

        if (obj.classed("world_symbol") && d.properties.NAME)
            clicked_name = d.properties.NAME;
        else if (obj.classed("world-land") && d.properties.Country_Region)
            clicked_name = d.properties.Country_Region?d.properties.Country_Region:d.properties.SOV_A3; // there are regions without name: ATA, CYN, SOL, VUT, SLB
        else if (obj.classed("world_line"))
            clicked_name = d;
        else
            return

        // return if the country name does not have case data -- 
        if (!d3.keys(all_cases).includes(clicked_name)) {
            // no need to do anything -- mouseenter takes care of this
            // world_info_labels[0].attr("class", "hover-text grey").text(clicked_name)
            // world_info_labels[1].text("(no data)")
            return
        }

        if (clicked_name != locked_region) { // lock this one
            locked_region = clicked_name;

            worldmap_svg.selectAll(".world_symbol")
                .classed("locked", false) // clear all first 
                .classed("locked", function(dd) {
                    if (dd.properties.NAME == clicked_name) return true;
                    return false;
                });
        
            timelines_svg.selectAll(".line")
                .classed("world_highlight " + cur_case, false)
                .classed("world_highlight_locked", function (dd) {
                    if (dd == locked_region) {
                        d3.select(this).raise();
                        return true;
                    }
                    else return false;
                });
        }
        else { // unlock
            // d3.select(this).classed("locked", false); // symbol
            worldmap_svg.selectAll(".world_symbol").classed("locked", false) // clear all first 

            timelines_svg.selectAll(".line")
                .classed("world_highlight_locked " + cur_case, false)
                .classed("world_highlight " + cur_case, function (dd) {
                    if (dd == locked_region) {
                        d3.select(this).raise();
                        return true;
                    }
                    else return false;
                });
            locked_region = null;
        }

        // reset line labels
        timelines_svg.selectAll(".text-label").style("display", function (dd) {
            if (country_names.includes(dd.label) || dd.label==clicked_name)
                return "block";
            else
                return "none";
        });

        var ind = parseInt(toXScale.invert(cur_date_world)) + 1;
        region = locked_region?locked_region:cur_world_region;
        update_info_labels(world_info_labels, region, cur_date_world, ind, cur_case, all_cases[region][cur_case][ind], locked_region);
    }

    var themeDropdown = d3.select("#world_map-content")
        .insert("select", "svg")
        .attr("id", "world-theme-select")
        .attr("class", "select-css theme")
        .style("position", "absolute")
        .on("change", worldThemeDropdownChange);

    themeDropdown.selectAll("option")
        .data(world_case_names_list)
        .enter().append("option")
        .attr("value", function (d) { return d[0]; })
        .text(function (d) { return d[1]; })
        .property("selected", function (d) {
            if (d == cur_case) {
                return true;
            }
            else {
                return false;
            }
        })

    function worldThemeDropdownChange(e) { // TODO: a lot here are identical to before

        cur_case = $(this).val();
        
        timelines_lines.remove();
        // d3.selectAll(".world_lines").remove();
        d3.selectAll(".world_line").remove();
        timelines_svg.selectAll(".text-label").remove();
        
        var ind = parseInt(toXScale.invert(cur_date_world)) + 1;

        // update the circles
        d3.selectAll(".world_symbol")
            // .transition()
            .style("fill", circle_symbol_fills[cur_case])
            .attr("d", path.pointRadius(function (d, i) {
                if (d.properties) {
                    name = d.properties.NAME;
                    if (all_cases[name]) {
                        return radius(all_cases[name][cur_case][ind]);
                    }
                }
                return radius(0);
            }))

        // Update the labels
        var ind = parseInt(toXScale.invert(cur_date_world)) + 1;
        region = locked_region?locked_region:cur_world_region;
        update_info_labels(world_info_labels, region, cur_date_world, ind, cur_case, all_cases[region][cur_case][ind], locked_region);
    
        // Create new data for the line chart
        sub_dataset = {};
        var case_maxs = [];

        d3.keys(all_cases).forEach(function (d, i) { // go through all countries
            var val = all_cases[d][cur_case].slice(-1)[0];
            case_maxs[i] = val;
        });

        world_max = d3.max(case_maxs);

        d3.keys(all_cases).forEach(function (d, i) {
            sub_dataset[d] = d3.range(n).map(function (i) {
                return {
                    x: +toXScale(i),
                    y: all_cases[d][cur_case][i]
                }
            })
        });

        yScale = d3.scaleLinear()
            .domain([0, world_max]) // input 
            .range([timelines_height, 0]); // output 

        // console.log(world_max)

        line_generator = d3.line()
            .x(function (d) { return xScale(d.x); }) // set the x values for the line generator
            .y(function (d) { return yScale(d.y); }) // set the y values for the line generator 
            .curve(d3.curveMonotoneX) // apply smoothing to the line

        d3.select("#y_axis_world").call(d3.axisLeft(yScale).ticks(4, "s"))

        timelines_svg.selectAll(".world_line")
            .data(d3.keys(sub_dataset)).enter()
            .append("path")
            .attr("class", "line world_line")
            .classed("world_highlight_locked " + cur_case, function (dd) {
                if (dd == locked_region) {
                    d3.select(this).raise();
                    cur_world_region = dd; //???
                    return true;
                }
                else return false;
            })

            .attr("d", function (d) { return line_generator(sub_dataset[d]); })
            .on("mouseover", world_lines_mouseover)
            .on("click", handle_click);

        timelines_lines.enter().append("text") // same code, need a func
            .attr("class", "text-label")
            .text(function (d) {
                return d;
            })
            .attr("dy", ".35em")
            .datum(function (d) {
                return {
                    label: d,
                    x: sub_dataset[d].slice(-1)[0].x,
                    y: sub_dataset[d].slice(-1)[0].y
                };
            })
            .attr("x", function (d) { return xScale(d.x) + 4; })
            .attr("y", function (d) { return yScale(d.y); })
            .style("display", function (d) {
                if (country_names.includes(d.label) || d.label==locked_region) return "block";
                else return "none";
            })
            ;


    } // end of worldThemeDropdownChange

    /////////////////////////////////////////////////////////////////////////////
    // Multiple Line chart 1. SVG etc.
    /////////////////////////////////////////////////////////////////////////////

    // just get those for the cur_case
    var sub_dataset = {};
    d3.keys(all_cases).forEach(function (d, i) {
        sub_dataset[d] = d3.range(n).map(function (i) {
            return {
                x: +toXScale(i),
                y: all_cases[d][cur_case][i]
            }
        })
    });

    var line_generator = d3.line()
        .x(function (d) { return xScale(d.x); }) // set the x values for the line generator
        .y(function (d) { return yScale(d.y); }) // set the y values for the line generator 
        .curve(d3.curveMonotoneX) // apply smoothing to the line

    timelines_svg = d3.select(world_plot_id).append("svg")
        .attr("width", $(world_plot_id).width())
        .attr("height", $(world_plot_id).height())
        .append("g")
        .attr("transform", "translate(" + timelines_margin.left + "," + timelines_margin.top + ")")
        ;

    timelines_svg.append("g")
        .attr("class", "x axis")
        .attr("id", "x_axis_world")
        .attr("transform", "translate(0," + timelines_height + ")")
        .call(d3.axisBottom(xScale).ticks(6)); // Create an axis component with d3.axisBottom

    timelines_svg.append("g")
        .attr("class", "y axis")
        .attr("id", "y_axis_world")
        .call(d3.axisLeft(yScale).ticks(4, "s")) // Create an axis component with d3.axisLeft
        ;

    // now bind data later
    // timelines_svg.append("path")
    //     .data(sub_dataset) // 10. Binds data to the line 
    //     .attr("class", "line")// Assign a class for styling 
    //     .attr("d", line_generator); // 11. Calls the line generator 

    timelines_svg.append("rect")
        .attr("class", "overlay")
        .attr("width", timelines_width)
        .attr("height", timelines_height)


    /////////////////////////////////////////////////////////////////////////////
    // hover lines on the line chart
    /////////////////////////////////////////////////////////////////////////////

    var timelines_hoverLine = timelines_svg.append("g")
        .attr("class", "hover-line")
        .append("line")
        .attr("id", "hover-line-world")
        .attr("x1", xScale(cur_date_world)).attr("x2", xScale(cur_date_world))
        .style("pointer-events", "none") // Stop line interferring with cursor
        .style("opacity", 1);

    timelines_hoverLine.attr("y1", 0).attr("y2", timelines_height + 10);

    timelines_rect = timelines_svg.append("rect")
        .attr("id", "world_rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", timelines_width)
        .attr("height", timelines_height)
        .style("fill", "none")
        .style("pointer-events", "all")
        // .style("display", "none")
        .on("mousemove", function () {
            var xpos = d3.mouse(this)[0];
            cur_date_world = xScale.invert(xpos);
            cur_date_us = cur_date_world;
            var ind = parseInt(toXScale.invert(cur_date_world)) + 1;
            hover_line_symbol(worldmap_svg, ".world_symbol", path, "NAME", all_cases, ind, xpos, "#hover-line-world", radius, cur_case);

            if (sync_time_lines) {
                hover_line_symbol(US_svg, ".US_symbol", US_path, "postal", US_all_cases, ind, xpos, "#hover-line-US", radius, US_cur_case);
                hover_line_symbol(state_svg, ".state_symbol", state_path, "GEOID", state_all_cases, ind, xpos, "#hover-line-state", state_radius, state_cur_case);

                region = locked_state?locked_state:cur_US_region;
                update_info_labels(US_info_labels, us_abbr_inv[region], cur_date_world, ind, US_cur_case, US_all_cases[region][US_cur_case][ind], locked_state);

                region = locked_county?locked_county:cur_state_region;
                update_info_labels(state_info_labels, fips_to_name[region], cur_date_world, ind, state_cur_case, state_all_cases[region][state_cur_case][ind], locked_county);

                update_title_info("#us-info",
                    cur_date_world,
                    all_cases["USA"]["confirmed"][ind],
                    ind == 0 ? 0 : all_cases["USA"]["confirmed"][ind - 1],
                    all_cases["USA"]["deaths"][ind],
                    ind == 0 ? 0 : all_cases["USA"]["deaths"][ind - 1],
                    all_cases["USA"]["recovered"][ind],
                    ind == 0 ? 0 : all_cases["USA"]["recovered"][ind - 1]
                )
                update_title_info("#state-info",
                    cur_date_world,
                    US_all_cases[the_state]["confirmed"][ind],
                    ind == 0 ? 0 : US_all_cases[the_state]["confirmed"][ind - 1],
                    US_all_cases[the_state]["deaths"][ind],
                    ind == 0 ? 0 : US_all_cases[the_state]["deaths"][ind - 1],
                    null,
                    null
                )

            }

            region = locked_region?locked_region:cur_world_region;
            update_info_labels(world_info_labels, region, cur_date_world, ind, cur_case, all_cases[region][cur_case][ind], locked_region);

            update_title_info("#world-info",
                cur_date_world,
                world_cases_sum["confirmed"][ind],
                ind == 0 ? 0 : world_cases_sum["confirmed"][ind - 1],
                world_cases_sum["deaths"][ind],
                ind == 0 ? 0 : world_cases_sum["deaths"][ind - 1],
                world_cases_sum["recovered"][ind],
                ind == 0 ? 0 : world_cases_sum["recovered"][ind - 1]
            )

        })
        .on("mouseout", function (d) {
            // d3.select("#hover-line-world").style("opacity", 0); // hover line invisible
        })
        ;


    /////////////////////////////////////////////////////////////////////////////
    // lines
    /////////////////////////////////////////////////////////////////////////////

    timelines_lines = timelines_svg.selectAll(".line")
        .data(d3.keys(sub_dataset));

    function world_lines_mouseover(d) { // lines, after theme change
        timelines_svg.selectAll(".line").classed("world_highlight " + cur_case, function (dd, i) {
            if (dd == d) {
                cur_world_region = d;
                d3.select(this).raise();
                return true;
            }
            return false;
        });
        timelines_svg.selectAll(".text-label").style("display", function(dd) {
            if (dd.label==d || country_names.includes(dd.label) || dd.label==locked_region) return "block";
            else return "none";
        });

        worldmap_svg.selectAll(".world_symbol").classed("highlight", function (dd, i) {
            return (dd.properties.NAME == d);
        });

        var ind = parseInt(toXScale.invert(cur_date_world)) + 1;
        region = locked_region?locked_region:cur_world_region;
        update_info_labels(world_info_labels, region, cur_date_world, ind, cur_case, all_cases[region][cur_case][ind], locked_region);
    }

    timelines_lines.enter()
        .append("path")
        .attr("class", "line world_line")
        .attr("d", function (d) { return line_generator(sub_dataset[d]); })
        // .style("stroke-width", 1)
        // .style("stroke", function(d) { 
        //       if (country_names.includes(d))
        //           return "#777";
        //       else
        //           return "#cdcdcd";})
        .on("mouseover", world_lines_mouseover)
        .on("click", handle_click)
        .on("mouseout", function (d) {
            // d3.select(this).classed("world_highlight", false); 

            // timelines_svg.selectAll(".text-label").style("display", function(d) {
            //     if (country_names.includes(d.label))
            //       return "block";
            //       else
            //       return "none";
            // 
            // }); 
            // 
        })
        ;

    /////////////////////////////////////////////////////////////////////////////
    // labels
    /////////////////////////////////////////////////////////////////////////////

    timelines_lines.enter().append("text")
        .attr("class", "text-label")
        // .style("fill", function(d) { return line_color(d); })
        .text(function (d) {
            return d;
        })
        .attr("dy", ".35em")
        .datum(function (d) {
            // alert(sub_dataset[d].slice(-1)[0].y);
            return {
                label: d,
                x: sub_dataset[d].slice(-1)[0].x,
                y: sub_dataset[d].slice(-1)[0].y
            };
        })
        .attr("x", function (d) { return xScale(d.x) + 4; })
        .attr("y", function (d) { return yScale(d.y); })
        .style("display", function (d) {
            if (country_names.includes(d.label) || d.label==locked_region) return "block";
            else return "none";
        })
        ;

    world_info_labels = []
    world_info_labels[0] = timelines_svg
        .append('text')
        .attr("id", "world_hover_text_1")
        .attr("class", "hover-text grey")
        .attr("x", 20)
        .attr("y", -5);
    world_info_labels[1] = timelines_svg
        .append('text')
        .attr("id", "world_hover_text_2")
        .attr("class", "hover-text red")
        .attr("x", 20)
        .attr("y", 20);

    var ind = parseInt(toXScale.invert(cur_date_world)) + 1;
    region = locked_region?locked_region:cur_world_region;
    update_info_labels(world_info_labels, region, cur_date_world, ind, cur_case, all_cases[region][cur_case][ind], locked_region);

}
