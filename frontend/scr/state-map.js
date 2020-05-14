var state_map_container_id = "#state_map-grid-container";
var state_map_id = "#state_map-content";
var state_plot_id = "#state_plot-content";
var state_affiliation_id = "#state_map-affiliation";

var the_state = 'OH',
    state_geojson_fname = the_state + "_geog.geojson",
    state_centroids_fname = the_state + "_centroids.geojson";

var maptype = 'geojson';

var state_map_width = $(state_map_container_id).width();
var state_map_height = $(state_map_container_id).height() - 135;

var state_timelines_margin = {top: 50, right: 60, bottom: 60, left: 40};
var state_timelines_width = $(state_plot_id).width() - state_timelines_margin.left - state_timelines_margin.right,
    state_timelines_height = $(state_plot_id).height() - state_timelines_margin.top - state_timelines_margin.bottom; 

var state_bounds = null;
var state_dropdown = null;
var state_timelines_hoverLine = null;
var state_timelines_lines = null;

var statemap_legend_width = $(state_affiliation_id).width(),
    statemap_legend_height = $(state_affiliation_id).height();

var state_map_margin = { top: 10, right: 10, bottom: 10, left: 10 };

var state_info_labels = null;
var cur_state_county = null; // "39049"; // TODO: get this automatically, using the max value and median

// 36.854458, -119.764541    
var state_projection_params = { 
    "AK": {"angles": [160, -60, 0], "scale": 600},
    "CA": {"angles": [120, -36.1, 0], "scale": 1600},
    "DC": {"angles": [77.03, -38.87, 0], "scale": 75000},
    "FL": {"angles": [83.5, -27.5, 0], "scale": 2000},
    "HI": {"angles": [158, -20.2, 0], "scale": 2000},
    "IA": {"angles": [93.5, -41.8, 0], "scale": 4000},
    "MD": {"angles": [77.5, -38.7, 0], "scale": 6000},
    "OH": {"angles": [83, -39.8, 0], "scale": 4000},
    "NY": {"angles": [76, -42.6, 0], "scale": 2500},
    "VA": {"angles": [79.5, -37.5, 0], "scale": 3000},
    "CT": {"angles": [73.1, 41.6, 0], "scale": 8000}
}

var mystates = d3.keys(state_projection_params);

var state_path = null; // set in init_state

var state_xScale = null;
var state_toXScale = null;
var state_yScale = null;

var state_geojson = null;
var state_centroids = null;
var state_all_cases = null;
var sorted_case_lasts = null;

var state_svg = d3.select(state_map_id).append("svg")
    .attr("width", state_map_width)
    .attr("height", state_map_height)
    .append("g")
    .attr("transform", "translate(" + state_map_margin.left + "," + state_map_margin.top + ")");

var state_radius = null;

var statemap_legend_svg = null;
    
var state_map_friendly_names = {"TOT_POP": "Total Population",
    "TOT_HH": "Total Household",
    "PCT_CHLDN": "Children (%)",
    "PCT_YOUTH": "Youth (%)",
    "PCT_AD": "Adult (%)",
    "PCT_SR": "Senior (%)",
    "PCT_WHT": "White (%)",
    "PCT_NWHT": "Non-white (%)",
    "MED_HH_INC": "Median household income ($)",
    "PCT_BLW_POV_RT": "Poverty Rate",
    "PCT_AGRI": "Job in agriculture (%)",
    "PCT_CONST": "Job in construction (%)",
    "PCT_MFG": "Job in manufacturing (%)",
    "PCT_WHLS_TRA": "Job in wholesale (%)",
    "PCT_RET_TRA": "Job in retail (%)",
    "PCT_TRANS": "Job in transportation (%)",
    "PCT_INFO": "Job in information (%)",
    "PCT_FIN": "Job in finance (%)",
    "PCT_PRO": "Job in frofession (%)",
    "PCT_EDU": "Job in education (%)",
    "PCT_REC": "Job in recreation (%)", 
    "PCT_OTHERS": "Job in others (%)",
    "PCT_PUB_ADMIN": "Job in administration (%)"
}

function init_choropleth(the_var, geojson_data, var_list, all_var) {
    for (i=0; i<geojson_data.features.length; i++) {
        if (i == 0) {
            var properties = geojson_data.features[i]["properties"];
            for (var key in properties) {
                var node = properties[key];
                if (!isNaN(+node) && key!='GEOID') {
                    var_list.push(key);
                }
            }
        }
        var val = geojson_data.features[i]["properties"][the_var];
        if (val != null)
            all_var[i] = val;
    }

}

d3.select("#select-state")
    .on("change", function (e) {
        the_state = $("#select-state").val();
        state_geojson_fname = the_state + "_geog.geojson",
        state_centroids_fname = the_state + "_centroids.geojson";
        init_state(1);
    })
    .selectAll("option")
    .data(mystates)
    .enter()
    .append("option")
    .attr("value", function(d) {return d;})
    .property("selected", function(d) { return d == the_state; })
    .text(function(d) { return d; })
    ;

// status = 0 --- first every call
// status = 1 --- switch to diff state
function init_state(status) {
    var state_projection = d3.geoOrthographic().rotate(state_projection_params[the_state].angles) // λ, ϕ, γ
        .scale(state_projection_params[the_state].scale) // percent within rectangle of width x height
        .translate([state_map_width/2-state_map_margin.left-state_map_margin.right, 
            state_map_height/2+state_map_margin.top+state_map_margin.bottom]);

    state_path = d3.geoPath()
        .projection(state_projection);

    if (status == 0) {

        state_timelines_svg = d3.select(state_plot_id).append("svg")
            .attr("width", state_timelines_width + state_timelines_margin.left + state_timelines_margin.right)
            .attr("height", state_timelines_height + state_timelines_margin.top + state_timelines_margin.bottom)
            .append("g")
            .attr("transform", "translate(" + state_timelines_margin.left + "," + state_timelines_margin.top + ")");

    }

    if (status == 1) { // need to remove svg elements and redo them in the ready function
        state_svg.selectAll(".states").remove();
        state_svg.selectAll(".symbol").remove();
        state_svg.selectAll(".state_symbol").remove();
        statemap_legend_svg.remove();
        state_dropdown.remove(); 
        
        state_timelines_svg.selectAll(".x.axis").remove();
        state_timelines_svg.selectAll(".y.axis").remove();
        state_timelines_svg.selectAll(".text-label").remove();
        state_timelines_svg.selectAll(".hover-text").remove();
        state_timelines_svg.selectAll(".overlay").remove();
        state_timelines_svg.selectAll(".hover-rect").remove();
        state_timelines_lines.remove();
        state_timelines_hoverLine.remove();
    }

    var state_promises = [
        d3.json("data/state-counties/" + state_geojson_fname),
        d3.json("data/state-counties/" + state_centroids_fname),
        d3.json("data/all-cases-data-processed-counties.json")
    ];
    
    Promise.all(state_promises).then(state_ready);

}

function state_ready(all_data) {

    state_geojson = all_data[0]
    state_centroids = all_data[1];
    state_all_cases = all_data[2][the_state];

    /// GET MAX of cases, and geog
    /// accurately, use the last value of each county, so may not necessarily be the max
    var case_lasts = [];
    d3.keys(state_all_cases).forEach(function(d, i) {
        var val = state_all_cases[d][cur_case].slice(-1)[0]; 
        case_lasts[i] = {"cnty": d, "val": val};
    });

    sorted_case_lasts = case_lasts.slice().sort((a, b) => d3.descending(a.val, b.val))
    state_max = sorted_case_lasts[0].val;

    cur_state_county = sorted_case_lasts[0].cnty; // "39049"; // TODO: get this automatically, using the max value and median
    mid = parseInt(sorted_case_lasts.length/2);
    
    var state_names = [cur_state_county, sorted_case_lasts[mid].cnty]; // max and middle

    /// GET a dictionary FIPS -> NAME
    fips_to_name = {}
    state_geojson.features.forEach(function(d) {
        fips_to_name[d.properties.GEOID] = d.properties.NAME;
    })
    fips_to_name["00"] = "State Wide";


    state_radius = d3.scaleSqrt()
        .domain([0, state_max])
        .range([0, 30]);

    /////////////////////////////////////////////////////////////////////////////
    // Necessary scales  
    /////////////////////////////////////////////////////////////////////////////

    var n = total_days;
    
    state_xScale = d3.scaleTime()
        .domain([case_date_parser(state_start_date), case_date_parser(state_end_date)])
        .range([0, state_timelines_width]); // output
    
    state_toXScale = d3.scaleLinear()
        .domain([0, n-1])
        .range([case_date_parser(state_start_date), case_date_parser(state_end_date)])
        ;

    //////////////////////////////////////////////////////////////////////////
    // State choropleth map
    /////////////////////////////////////////////////////////////////////////


    state_all_mapping_vars = [];
    state_list_mapping_var = [];
    state_current_mapping_var = "MED_HH_INC";
    init_choropleth(state_current_mapping_var, state_geojson, state_list_mapping_var, state_all_mapping_vars);

    // for (i=0; i<state_geojson.features.length; i++) {
    //     if (i == 0) {
    //         var properties = state_geojson.features[i]["properties"];
    //         for (var key in properties) {
    //             var node = properties[key];
    //             if (!isNaN(+node) && key!='GEOID') {
    //                 state_list_mapping_var.push(key);
    //             }
    //         }
    //     }
	// 	var val = state_geojson.features[i]["properties"][state_current_mapping_var];
	// 	if (val != null)
    //     	state_all_mapping_vars[i] = val;
    // }
    state_bounds = get_var_bounds(state_all_mapping_vars);
    var state_color_scheme = d3.scaleThreshold()
        .domain(state_bounds)
        .range(d3.schemeGreys[3]);

    if (maptype === 'geojson') {
        var us = state_geojson;
        state_svg.append("g")
            .attr("class", "states")
            .selectAll("path")
            .data(state_geojson.features)
            .enter().append("path")
            .attr("d", state_path)
            .attr("class", "state-land")
            .style("fill", function(d, i) {
    			// if (i==0) alert("state again");
                return state_color_scheme(d["properties"][state_current_mapping_var]);
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
                    .style("fill", state_color_scheme(d["properties"][state_current_mapping_var]));
            });;
    }
    else if (maptype === 'topojson') {
        var us = state_topojson;

        state_svg.append("g")
            .attr("class", "counties")
            .selectAll("path")
            .data(topojson.feature(us, us.objects.counties).features)
            .enter().append("path")
            .attr("d", state_path);

        state_svg.append("path")
            .datum(topojson.mesh(us, us.objects.states, function (a, b) { return a !== b; }))
            .attr("class", "states")
            .attr("d", state_path);

    }

    
    //////////////////////////////////////////////////////////////////////////
    // legend
    /////////////////////////////////////////////////////////////////////////

    statemap_legend_svg = make_legend_svg(state_affiliation_id, statemap_legend_width, statemap_legend_height, "state-legend");

    make_legend(statemap_legend_svg, "#state-legend", state_color_scheme, statemap_legend_width, "vertical");

    // var state_legend_linear = d3.legendColor()
    //     .labelFormat(d3.format(".2f"))
    //     .labels(d3.legendHelpers.thresholdLabels)
    //     // .useClass(true)
    //     .scale(state_color_scheme)
    //     .shapeWidth(statemap_legend_width / 4.1)
    //     .orient('horizontal');
    // 
    // statemap_legend_svg.select("#state-legend")
    //     .call(state_legend_linear);

    // // Legend title 
    // legendg.append("text")
    //     .attr("class", "caption")
    //     .attr("x", 0)
    //     .attr("y", -6)
    //     .attr("fill", "#000")
    //     .attr("font-size", "20px")
    //     .attr("text-anchor", "start")
    //     .attr("font-weight", "bold")
    //     .text(state_current_mapping_var)

    state_dropdown = d3.select(state_affiliation_id)
        .insert("select", "svg")
        .attr("id", "state-choreopleth-select")
        .attr("class", "select-css")
        .on("change", stateDropdownChange);

    state_dropdown.selectAll("option")
        .data(state_list_mapping_var)
        .enter().append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) {
            return state_map_friendly_names[d]; // capitalize 1st letter
        })
        .property("selected", function (d) {
            if (d == state_current_mapping_var) {
                return true;
            }
            else {
                return false;
            }
        })

    // Update choreopleth map
    function stateDropdownChange(e) {
        state_current_mapping_var = $("#state-choreopleth-select").val();
        init_choropleth(state_current_mapping_var, state_geojson, state_list_mapping_var, state_all_mapping_vars);
        // for (i = 0; i < state_geojson.features.length; i++) {
        //     if (i == 0) {
        //         var properties = state_geojson.features[i]["properties"];
        //         for (var key in properties) {
        //             var node = properties[key];
        //             if (!isNaN(+node)) {
        //                 state_list_mapping_var.push(key); // 
        //                 alert(key)
        //             }
        //         }
        //     }
        //     var val = state_geojson.features[i]["properties"][state_current_mapping_var];
        //     if (val != null)
        //         state_all_mapping_vars[i] = val;
        // }
        state_bounds = get_var_bounds(state_all_mapping_vars);

        state_color_scheme = d3.scaleThreshold()
            .domain(state_bounds)
            .range(d3.schemeGreys[3]);

        d3.selectAll(".state-land").transition()
            .duration(500)
            .style("fill", function (d) {
                return state_color_scheme(d["properties"][state_current_mapping_var])
            })

        make_legend(statemap_legend_svg, "#state-legend", state_color_scheme, statemap_legend_width, "vertical");

        // // Update legend
        // state_legend_linear = d3.legendColor()
        //     .labelFormat(d3.format(".2f"))
        //     .labels(d3.legendHelpers.thresholdLabels)
        //     // .useClass(true)
        //     .scale(state_color_scheme)
        //     .shapeWidth(statemap_legend_width / 4.1)
        //     .orient('horizontal');
        // 
        // statemap_legend_svg.select("#state-legend")
        //     .call(state_legend_linear);
    }

    //////////////////////////////////////////////////////////////////////////
    // centroids
    /////////////////////////////////////////////////////////////////////////

    state_svg.selectAll(".symbol")
        // .data(state_centroids.features)
        .data(state_centroids.features.sort(function(a, b) { 
            if (a.properties && b.properties) {
                na = a.properties.NAME;
                nb = b.properties.NAME;
                if (state_all_cases[na] && state_all_cases[nb])
                    return d3.descending(state_all_cases[na][cur_case][n-1], state_all_cases[nb][cur_case][n-1]); 
                else return -1;
            }
        }))
        .enter().append("path")
        .attr("class", "state_symbol")
        // .attr("d", path)
        .attr("d", state_path.pointRadius(function (d, i) {
            if (d.properties) {
                name = d.properties.GEOID; // xxxx
                if (state_all_cases[name]) {
                    // console.log(d, i, state_all_cases[state_abbr[name]])
                    var ind = parseInt(state_toXScale.invert(cur_date_state)) + 1;
                    return state_radius(state_all_cases[name][cur_case][ind]);
                }
            }
            return state_radius(0);

            // if (d.id) // strange trick to make it work. Otherwise will complain d.properties.population to be on none type
        }))
        .on("mouseenter", function (d) { // d is geojson obj
            state_timelines_svg.selectAll(".line").classed("state_highlight", function (dd, i) {
                if (dd == d.properties.GEOID) {
                    d3.select(this.parentNode).raise(); 
                    cur_state_county = dd;
                    return true;
                }
                else return false;
            });
            // state_timelines_svg.selectAll(".text-label").style("display", function (dd) {
            //     if (dd.label == d.properties.GEOID || state_names.includes(dd.label))
            //         return "block";
            //     else
            //         return "none";
            // });
            state_svg.selectAll(".state_symbol").classed("highlight", false); // clear 
            d3.select(this).classed("highlight", true);
            var ind = parseInt(state_toXScale.invert(cur_date_state)) + 1;
            update_info_labels(state_info_labels, fips_to_name[cur_state_county], cur_date_state, ind, cur_case, state_all_cases[cur_state_county][cur_case][ind]);
        })
        .on("mouseout", function (d) {
            state_timelines_svg.selectAll(".line").classed("state_highlight", false);
            state_timelines_svg.selectAll(".text-label").style("display", function (dd) {
                if (state_names.includes(dd.label))
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
    state_yScale = d3.scaleLinear()
        .domain([0, state_max]) // input  TODO: get max
        .range([state_timelines_height, 0]); // output 
    
    state_timelines_svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + state_timelines_height + ")")
        .call(d3.axisBottom(state_xScale).ticks(6)); // Create an axis component with d3.axisBottom
    
    state_timelines_svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(state_yScale).ticks(4, "s")) // Create an axis component with d3.axisLeft
        ;

    var state_sub_dataset = {};
    d3.keys(state_all_cases).forEach(function (d, i) {
        // if (state_names.includes(d))
        state_sub_dataset[d] = d3.range(total_days).map(function (i) {
            return {
                x: +state_toXScale(i),
                y: state_all_cases[d][cur_case][i]
            }
        })
    });

    var state_line = d3.line()
        .x(function (d) { return state_xScale(d.x); }) // set the x values for the line generator
        .y(function (d) { return state_yScale(d.y); }) // set the y values for the line generator 
        .curve(d3.curveMonotoneX) // apply smoothing to the line

    state_timelines_svg.append("path")
        .datum(state_sub_dataset) // 10. Binds data to the line 
        .attr("class", "line") // Assign a class for styling 
        // .attr("d", state_line); // 11. Calls the line generator 

    // state_timelines_svg.append("rect")
    //     .attr("class", "overlay")
    //     .attr("width", state_timelines_width)
    //     .attr("height", state_timelines_height)
    // 

    /////////////////////////////////////////////////////////////////////////////
    // hover lines on the line chart
    /////////////////////////////////////////////////////////////////////////////

    state_timelines_hoverLine = state_timelines_svg
        .append("g")
        .attr("class", "hover-line")
        .append("line")
        .attr("id", "hover-line-state")
        .attr("x1", state_xScale(cur_date_state))
        .attr("x2", state_xScale(cur_date_state))
        .style("pointer-events", "none") // Stop line interferring with cursor
        .style("opacity", 1); 

    state_timelines_hoverLine.attr("y1", 0).attr("y2", state_timelines_height + 10);

    state_timelines_rect = state_timelines_svg.append("rect")
        .attr("class", "hover-rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", state_timelines_width)
        .attr("height", state_timelines_height)
        .style("fill", "none")
        .style("pointer-events", "all")
        // .style("display", "none")
        .on("mousemove", function () {
            var xpos = d3.mouse(this)[0];
            cur_date_state = state_xScale.invert(xpos);
            var ind = parseInt(state_toXScale.invert(cur_date_state)) + 1;
            state_svg.selectAll(".state_symbol")
                .attr("d", state_path.pointRadius(function (d, i) {
                    if (d.properties) {
                        _case = state_all_cases[d.properties.GEOID];
                        if (_case) {
                            y = _case[cur_case][ind];
                            return state_radius(y);
                        }
                    }
                    return state_radius(0);
                }));
                
                
            // cur_state_county must be set correctly

            update_info_labels(state_info_labels, fips_to_name[cur_state_county], cur_date_state, ind, cur_case, state_all_cases[cur_state_county][cur_case][ind]);

            update_title_info("#state-info", 
                cur_date_state, 
                us_all_cases[the_state]["confirmed"][ind],
                ind==0 ? 0 : us_all_cases[the_state]["confirmed"][ind-1], 
                us_all_cases[the_state]["deaths"][ind], 
                ind==0 ? 0 : us_all_cases[the_state]["deaths"][ind-1], 
                null, 
                null
            )

            d3.select("#hover-line-state") // select hover-line and change position
                .attr("x1", xpos)
                .attr("x2", xpos)
                .style("opacity", 1); // Making line visible
        })
        .on("mouseout", function (d) {
            // d3.select("#hover-line-US").style("opacity", 0); // hover line invisible
        })
        ;

    //////////////////////////////////////////////////////////////////////////
    // info on title bar
    /////////////////////////////////////////////////////////////////////////
    var ind = parseInt(state_toXScale.invert(cur_date_state)) + 1;
    
    update_title_info("#state-info", 
        cur_date_state, 
        us_all_cases[the_state]["confirmed"][ind],
        ind==0 ? 0 : us_all_cases[the_state]["confirmed"][ind-1], 
        us_all_cases[the_state]["deaths"][ind], 
        ind==0 ? 0 : us_all_cases[the_state]["deaths"][ind-1], 
        null, 
        null
    )

    /////////////////////////////////////////////////////////////////////////////
    // labels
    /////////////////////////////////////////////////////////////////////////////

    state_timelines_lines = state_timelines_svg.selectAll(".lines")
        .data(d3.keys(state_sub_dataset))
        .enter().append("g")
        .attr("class", "lines")

    state_timelines_lines.append("path")
        .attr("class", "line")
        .attr("d", function (d) { return state_line(state_sub_dataset[d]); })
        // .style("stroke-width", 1)
        // .style("stroke", function(d) { 
        //       if (state_names.includes(d))
        //           return "#777";
        //       else
        //           return "#cdcdcd";})
        .on("mouseover", function (d) {
            state_timelines_svg.selectAll(".line").classed("state_highlight", function (dd, i) {
                if (dd == d) {
                    cur_state_county = dd;
                    return true;
                }
                else return false;
            });
            // state_timelines_svg.selectAll(".text-label").style("display", function (dd) {
            //     if (dd.label == d || state_names.includes(dd.label)) return "block";
            //     else return "none";
            // });
            state_svg.selectAll(".state_symbol").classed("highlight", function (dd, i) {
                return (dd.properties.GEOID == d);
            });
            d3.select(this.parentNode).raise(); 
        })
        .on("mouseout", function (d) {
            // state_timelines_svg.selectAll(".text-label").style("display", function(d) {
            //     if (state_names.includes(d.label))
            //       return "block";
            //       else
            //       return "none";
            // 
            // }); 
            // 
        })
        ;


    state_timelines_lines.append("text")
        .attr("class", "text-label")
        .text(function (d) {
            // if (state_names.includes(d))
            return fips_to_name[d];
        })
        .attr("dy", ".35em")
        .datum(function (d) {
            // alert(state_sub_dataset[d].slice(-1)[0].y);
            return {
                label: d,
                x: state_sub_dataset[d].slice(-1)[0].x,
                y: state_sub_dataset[d].slice(-1)[0].y
            };
        })
        .attr("x", function (d) { return state_xScale(d.x) + 3; })
        .attr("y", function (d) { return state_yScale(d.y); })
        .style("display", function (d) {
            if (state_names.includes(d.label))
                return "block";
            else
                return "none";
        });

    state_info_labels = []
    state_info_labels[0] = state_timelines_svg
        .append('text')
        .attr("class", "hover-text")
        .attr("style", "fill: #ababab")
        .attr("x", 20)
        .attr("y", -5);
    state_info_labels[1] = state_timelines_svg
        .append('text')
        .attr("class", "hover-text")
        .attr("style", "font-size: 22px")
        .attr("x", 20)
        .attr("y", 20);


}
