var US_grid_container_id = "#US_map-grid-container";
var US_map_id = "#US_map-content";
var US_plot_id = "#US_plot-content";
var US_affiliation_id = "#US_map-affiliation";

var maptype = 'geojson';
var US_offset = 0
var US_names = ["NY", "OH"]; // some highlight USs? [ "NY", "OH"];

var US_map_width = $(US_grid_container_id).width() - US_offset;
var US_map_height = ($(US_grid_container_id).height() - US_offset) - 135;

var US_map_legend_width = $(US_affiliation_id).width(),
    US_map_legend_height = $(US_affiliation_id).height();

var US_map_margin = { top: 10, right: 10, bottom: 20, left: 10 };

var US_info_labels = null;
var cur_US_region = "NY";

var US_bounds = null;
var US_timelines_svg = null;

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

var US_timelines_lines = null;
var US_all_cases = null;
var US_cur_case = "confirmed";
var US_case_names_list = [
	["confirmed", "Confirmed"],
	["deaths", "Deaths"]];

function us_ready() {

    var US_start_date = start_date;
    var US_end_date = end_date;
    var n = total_days;
    var cur_date_US = cur_date_world;


    var US_actual_len = US_all_cases[d3.keys(US_all_cases)[0]]['confirmed'].length;
    US_cases_sum = {
        "confirmed": Array(US_actual_len).fill(0),
        "deaths": Array(US_actual_len).fill(0),
        // "recovered": Array(US_actual_len).fill(0)
    }

    /// GET MAX of cases
    var case_maxs = [];
    d3.keys(US_all_cases).forEach(function (d, i) {
        var val = US_all_cases[d][US_cur_case].slice(-1)[0];
        case_maxs[i] = val;
        for (j = 0; j < US_all_cases[d]["confirmed"].length; j++) {
            US_cases_sum["confirmed"][j] += US_all_cases[d]["confirmed"][j]
            US_cases_sum["deaths"][j] += US_all_cases[d]["deaths"][j]
            // US_cases_sum["recovered"][j] += US_all_cases[d]["recovered"][j]
        }
    });

    US_max = d3.max(case_maxs);

    ///////////////////////////

    var US_timelines_margin = { top: 50, right: 60, bottom: 60, left: 40 };
    var US_timelines_width = $(US_plot_id).width() - US_timelines_margin.left - US_timelines_margin.right,
        US_timelines_height = $(US_plot_id).height() - US_timelines_margin.top - US_timelines_margin.bottom;

    var US_xScale = d3.scaleTime()
        .domain([case_date_parser(US_start_date), case_date_parser(US_end_date)])
        .range([0, US_timelines_width]); // output

    var US_toXScale = d3.scaleLinear()
        .domain([0, n - 1])
        .range([case_date_parser(US_start_date), case_date_parser(US_end_date)]);

    var US_yScale = d3.scaleLinear()
        .domain([0, US_max]) // input  TODO: get max
        .range([US_timelines_height, 0]); // output 

    var radius = d3.scaleSqrt()
        .domain([0, US_max])
        .range([0, 50]);

    //////////////////////////////////////////////////////////////////////////
    // info on title bar
    /////////////////////////////////////////////////////////////////////////

    ind = all_cases["USA"]["confirmed"].length - 1;
    // var s1 = US_all_cases["USA"]["confirmed"][ind]
    // var s0 = ind==0 ? 0 : US_all_cases["USA"]["confirmed"][ind-1]
    // var s2 = US_all_cases["USA"]["deaths"][ind]
    // var s3 = US_all_cases["USA"]["recovered"][ind]
    // 
    // var title_info = `
    // ${case_date_format_full(cur_date_US)} <br/>
    // <span style="color: red">${d3.format(",")(s1)}</span> confirmed (+${s1-s0})<br/> 
    // ${d3.format(",")(s2)} deaths<br/>
    // ${d3.format(",")(s3)} recovered`
    // d3.selectAll("#us-info").html(title_info)

    update_title_info("#us-info",
        cur_date_US,
        all_cases["USA"]["confirmed"][ind],
        ind == 0 ? 0 : all_cases["USA"]["confirmed"][ind - 1],
        all_cases["USA"]["deaths"][ind],
        ind == 0 ? 0 : all_cases["USA"]["deaths"][ind - 1],
        all_cases["USA"]["recovered"][ind],
        ind == 0 ? 0 : all_cases["USA"]["recovered"][ind - 1]
    )

    //////////////////////////////////////////////////////////////////////////
    // US choropleth map
    /////////////////////////////////////////////////////////////////////////

    var US_map_friendly_names = {
        "Tot_pop": "Total Population",
        "Tot_HH": "Total Household",
        "Children": "Children (%)",
        "Youth": "Youth (%)",
        "Adult": "Adult (%)",
        "Senior": "Senior (%)",
        "White": "White (%)",
        "Non-White": "Non-white (%)",
        "Med_HH_Inc": "Median Household Income ($)",
        "Pct_below_Poverty_Rate": "Poverty Rate",
        "pct_agri": "Job in Agriculture (%)",
        "pct_Construction": "Job in Construction (%)",
        "pct_Manufacturing": "Job in Manufacturing (%)",
        "pct_Wholesale_trade": "Job in Wholesale (%)",
        "pct_Retail_trade": "Job in Retail (%)",
        "pct_Transportation": "Job in Transportation (%)",
        "pct_Information": "Job in Information (%)",
        "pct_Finance": "Job in Finance (%)",
        "pct_Professional": "Job in Professional (%)",
        "pct_Educational": "Job in Education (%)",
        "pct_recreational": "Job in Recreation (%)",
        "pct_Others": "Job in Others (%)",
        "pct_Public_administration": "Job in Publilc Administration (%)"
    }


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
        .range(d3.schemeGreys[3]);

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
                // if (i==0) alert("US again");
                return US_color_scheme(d["properties"][US_current_mapping_var]);
            })
            .style("stroke", "#aaa")
            .style("stroke-width", 0.5)
            .on("mouseover", function (d, i) { // choropleth
            	US_timelines_svg.selectAll(".line").classed("US_highlight " + US_cur_case, function (dd, i) {
                if (dd == d.properties.postal) {
                    // alert(this)
                    d3.select(this).raise();
                    cur_US_region = dd;
                    return true;
                }
                else return false;
            });
            
                d3.select(this).interrupt();
                d3.select(this)
                    // .transition(t)
                    .style("fill", "#efef65");
            
            var ind = parseInt(US_toXScale.invert(cur_date_US)) + 1;
            update_info_labels(US_info_labels, us_abbr_inv[cur_US_region], cur_date_US, ind, US_cur_case, US_all_cases[cur_US_region][US_cur_case][ind]);

            if (is_scatter_plot_on) {
                highlightDots(cur_US_region);
                highlight_paths(cur_US_region); }
            
            })
            .on("mouseout", function (d, i) {
            	US_timelines_svg.selectAll(".line").classed("US_highlight " + US_cur_case, false);
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
    const USmap_legend_svg = make_legend_svg(US_affiliation_id, US_map_legend_width, US_map_legend_height, "US-legend");

    // var US_legend_linear = d3.legendColor()
    //     .labelFormat(d3.format(".2f"))
    //     .labels(d3.legendHelpers.thresholdLabels)
    //     // .useClass(true)
    //     .scale(US_color_scheme)
    //     .shapeWidth(US_map_legend_width / 4.1)
    //     .orient('horizontal');
    // 
    // USmap_legend_svg.select("#US-legend")
    //     .call(US_legend_linear);

    make_legend(USmap_legend_svg, "#US-legend", US_color_scheme, US_map_legend_width, "vertical");


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
            // return d; // capitalize 1st letter
            return US_map_friendly_names[d];
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
                US_all_mapping_vars[i] = +val;
        }
        US_bounds = get_var_bounds(US_all_mapping_vars);

        US_color_scheme = d3.scaleThreshold()
            .domain(US_bounds)
            .range(d3.schemeGreys[3]);

        d3.selectAll(".US-land").transition()
            .duration(500)
            .style("fill", function (d) {
                return US_color_scheme(d["properties"][US_current_mapping_var])
            })

        make_legend(USmap_legend_svg, "#US-legend", US_color_scheme, US_map_legend_width, "vertical");

        // // Update legend
        // US_legend_linear = d3.legendColor()
        //     .labelFormat(d3.format(".2f"))
        //     .labels(d3.legendHelpers.thresholdLabels)
        //     // .useClass(true)
        //     .scale(US_color_scheme)
        //     .shapeWidth(US_map_legend_width / 4.1)
        //     .orient('horizontal');
        // 
        // USmap_legend_svg.select("#US-legend")
        //     .call(US_legend_linear);
    }

    //////////////////////////////////////////////////////////////////////////
    // centroids
    /////////////////////////////////////////////////////////////////////////
    US_svg.selectAll(".symbol")
        // .data(us_centroids.features)
        .data(us_centroids.features.sort(function (a, b) {
            if (a.properties && b.properties) {
                na = a.properties.postal;
                nb = b.properties.postal;
                if (US_all_cases[na] && US_all_cases[nb])
                    return d3.descending(US_all_cases[na][US_cur_case][n - 1], US_all_cases[nb][US_cur_case][n - 1]);
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
                if (US_all_cases[name]) {
                    return radius(US_all_cases[name][US_cur_case].slice(-1)[0]);
                }
            }
            return radius(0);

            // if (d.id) // strange trick to make it work. Otherwise will complain d.properties.population to be on none type
        }))
        .on("mouseenter", function (d) { // d is geojson obj
            US_timelines_svg.selectAll(".line").classed("US_highlight " + US_cur_case, function (dd, i) {
                if (dd == d.properties.postal) {
                    // alert(this)
                    d3.select(this).raise();
                    cur_US_region = dd;
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

            var ind = parseInt(US_toXScale.invert(cur_date_US)) + 1;
            update_info_labels(US_info_labels, us_abbr_inv[cur_US_region], cur_date_US, ind, US_cur_case, US_all_cases[cur_US_region][US_cur_case][ind]);

            if (is_scatter_plot_on) highlightDots(cur_US_region);
            if (is_pc_plot_on) highlight_paths(cur_US_region);
        })
        .on("mouseout", function (d) {
            US_timelines_svg.selectAll(".line").classed("US_highlight " + US_cur_case, false);
            // US_timelines_svg.selectAll(".text-label").style("display", function (dd) {
            //     if (US_names.includes(dd.label))
            //         return "block";
            //     else
            //         return "none";
            // 
            // });
            d3.select(this).classed("highlight", false);
        })
        ;



    var themeDropdown = d3.select("#US_map-content")
        .insert("select", "svg")
        .attr("id", "US-theme-select")
        .attr("class", "select-css theme")
        .style("position", "absolute")
        .on("change", USThemeDropdownChange);


    themeDropdown.selectAll("option")
        .data(US_case_names_list)
        .enter().append("option")
        .attr("value", function (d) { return d[0]; })
        .text(function (d) { return d[1]; })
        .property("selected", function (d) {
            if (d == US_cur_case) {
                return true;
            }
            else {
                return false;
            }
        })

    function USThemeDropdownChange(e) {
        US_cur_case = $(this).val();

        // d3.selectAll(".US_lines").remove();
        d3.selectAll(".US_line").remove();
        US_timelines_svg.selectAll(".text-label").remove();

        d3.selectAll(".US_symbol")
            // .transition()
            .style("fill", circle_symbol_fills[US_cur_case])

            .attr("d", US_path.pointRadius(function (d, i) {
                if (d.properties) {
                    name = d.properties.postal;
                    if (US_all_cases[name]) {
                        return radius(US_all_cases[name][US_cur_case].slice(-1)[0]);
                    }
                }
                return radius(0);
            }))

        // Update the labels
        var ind = parseInt(US_toXScale.invert(cur_date_US)) + 1;
        update_info_labels(US_info_labels, cur_US_region, cur_date_US, ind, US_cur_case, US_all_cases[cur_US_region][US_cur_case][ind]);

        // Create new data for the line chart
        US_sub_dataset = {};
        var case_maxs = [];

        d3.keys(US_all_cases).forEach(function (d, i) { // go through all countries
            var val = US_all_cases[d][US_cur_case].slice(-1)[0];
            case_maxs[i] = val;
        });

        US_max = d3.max(case_maxs);

        d3.keys(US_all_cases).forEach(function (d, i) {
            US_sub_dataset[d] = d3.range(n).map(function (i) {
                return {
                    x: +US_toXScale(i),
                    y: US_all_cases[d][US_cur_case][i]
                }
            })
        });

        US_yScale = d3.scaleLinear()
            .domain([0, US_max]) // input 
            .range([US_timelines_height, 0]); // output 

        // console.log(US_max)

        var US_line = d3.line()
            .x(function (d) { return US_xScale(d.x); }) // set the x values for the line generator
            .y(function (d) { return US_yScale(d.y); }) // set the y values for the line generator 
            .curve(d3.curveMonotoneX) // apply smoothing to the line

        d3.select("#y_axis_US").call(d3.axisLeft(US_yScale).ticks(4, "s"))

        US_timelines_svg.selectAll(".US_line")
            .data(d3.keys(US_sub_dataset)).enter()
            .append("path")
            .attr("class", "line US_line")
            .attr("d", function (d) { return US_line(US_sub_dataset[d]); })
            // .style("stroke-width", 1)
            // .style("stroke", function(d) { 
            //       if (country_names.includes(d))
            //           return "#777";
            //       else
            //           return "#cdcdcd";})
            .on("mouseover", us_lines_mouseover);
        
        US_timelines_lines.enter().append("text") // same code, need a func
            .attr("class", "text-label")
            .text(function (d) {
                // if (US_names.includes(d))
                return us_abbr_inv[d];
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
                if (US_names.includes(d.label)) return "block";
                else return "none";
            })
            ;

    } // USThemeDropdownChange

    /////////////////////////////////////////////////////////////////////////////
    // Multiple Line chart 
    /////////////////////////////////////////////////////////////////////////////


    var US_sub_dataset = {};
    d3.keys(US_all_cases).forEach(function (d, i) {
        // if (US_names.includes(d))
        US_sub_dataset[d] = d3.range(n).map(function (i) {
            return {
                x: +US_toXScale(i),
                y: US_all_cases[d][US_cur_case][i]
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
        .attr("id", "y_axis_US")
        .call(d3.axisLeft(US_yScale).ticks(4, "s")) // Create an axis component with d3.axisLeft
        ;

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
            cur_date_US = US_xScale.invert(xpos);
            ind = parseInt(US_toXScale.invert(cur_date_US)) + 1;

            US_svg.selectAll(".US_symbol")
                .attr("d", US_path.pointRadius(function (d, i) {
                    if (d.properties) {
                        _case = US_all_cases[d.properties.postal];
                        if (_case) {
                            y = _case[US_cur_case][ind];
                            return radius(y);
                        }
                    }
                    return radius(0);
                }));

            update_info_labels(US_info_labels, us_abbr_inv[cur_US_region], cur_date_US, ind, US_cur_case, US_all_cases[cur_US_region][US_cur_case][ind]);
            // 
            // var s1 = US_all_cases["USA"]["confirmed"][ind]
            // var s0 = ind==0 ? 0 : US_all_cases["USA"]["confirmed"][ind-1]
            // var s2 = US_all_cases["USA"]["deaths"][ind]
            // var s3 = US_all_cases["USA"]["recovered"][ind]
            // 
            // var title_info = `
            // ${case_date_format_full(cur_date_US)} <br/>
            // <span style="color: red">${d3.format(",")(s1)}</span> confirmed (+${s1-s0})<br/> 
            // ${d3.format(",")(s2)} deaths<br/>
            // ${d3.format(",")(s3)} recovered`
            // d3.selectAll("#us-info").html(title_info)
            update_title_info("#us-info",
                cur_date_US,
                all_cases["USA"]["confirmed"][ind],
                ind == 0 ? 0 : all_cases["USA"]["confirmed"][ind - 1],
                all_cases["USA"]["deaths"][ind],
                ind == 0 ? 0 : all_cases["USA"]["deaths"][ind - 1],
                all_cases["USA"]["recovered"][ind],
                ind == 0 ? 0 : all_cases["USA"]["recovered"][ind - 1]
            )

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
    // lines
    /////////////////////////////////////////////////////////////////////////////

    var US_timelines_lines = US_timelines_svg.selectAll(".lines")
        .data(d3.keys(US_sub_dataset))

    // .attr("class", "lines")

    function us_lines_mouseover(d) {
        US_timelines_svg.selectAll(".line").classed("US_highlight " + US_cur_case, function (dd, i) {
            if (dd == d) {
                cur_US_region = d;
                d3.select(this).raise();
                return true;
            }
            return false;
        });
        // timelines_svg.selectAll(".text-label").style("display", function(dd) {
        //     if (dd.label==d || country_names.includes(dd.label)) return "block";
        //     else return "none";
        // });
        US_svg.selectAll(".US_symbol").classed("highlight", function (dd, i) {
            return (dd.properties.postal == d);
        });

        var ind = parseInt(US_toXScale.invert(cur_date_US)) + 1;
        update_info_labels(US_info_labels, us_abbr_inv[cur_US_region], cur_date_US, ind, US_cur_case, US_all_cases[cur_US_region][US_cur_case][ind]);

        if (is_scatter_plot_on) highlightDots(cur_US_region);
        if (is_pc_plot_on) highlight_paths(cur_US_region);

    }
    
    US_timelines_lines.enter().append("path")
        .attr("class", "line US_line")
        .attr("d", function (d) { return US_line(US_sub_dataset[d]); })
        // .style("stroke-width", 1)
        // .style("stroke", function(d) { 
        //       if (US_names.includes(d))
        //           return "#777";
        //       else
        //           return "#cdcdcd";})
        .on("mouseover", us_lines_mouseover)
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

    /////////////////////////////////////////////////////////////////////////////
    // labels
    /////////////////////////////////////////////////////////////////////////////

    US_timelines_lines.enter().append("text")
        .attr("class", "text-label")
        .text(function (d) {
            // if (US_names.includes(d))
            return us_abbr_inv[d];
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
