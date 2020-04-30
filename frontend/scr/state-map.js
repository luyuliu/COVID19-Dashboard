var state_map_container_id = "#state_map-grid-container";
var state_map_id = "#state_map-content";
var state_plot_id = "#state_plot-content";

var maptype = 'geojson';

var state_map_width = $(state_map_container_id).width();
var state_map_height = $(state_map_container_id).height()/4*3;

var state_map_margin = { top: 10, right: 10, bottom: 10, left: 10 };

var state_info_labels = null;
var cur_state_county = "39049";

var the_state = 'OH',
    state_geojson_fname = the_state + "_geog.geojson",
    state_centroids_fname = the_state + "_centroids.geojson";
    
var state_projection_angles = { 
    "OH": [83, -40, 0],
    "NY": [76, -42.6, 0]
}

var state_projection = d3.geoOrthographic().rotate(state_projection_angles[the_state]) // λ, ϕ, γ
    .scale(3500) // percent within rectangle of width x height
    .translate([state_map_width/2-state_map_margin.left-state_map_margin.right, 
        state_map_height/2+state_map_margin.top+state_map_margin.bottom]);

var state_radius = d3.scaleSqrt()
    .domain([0, 3e3])
    .range([0, 20]);

var state_path = d3.geoPath()
    .projection(state_projection);

var state_svg = d3.select(state_map_id).append("svg")
    .attr("width", state_map_width)
    .attr("height", state_map_height)
    .append("g")
    .attr("transform", "translate(" + state_map_margin.left + "," + state_map_margin.top + ")");

var state_promises = [
    d3.json("https://luyuliu.github.io/COVID19-Dashboard/frontend/data/state-counties/" + state_geojson_fname),
    d3.json("https://luyuliu.github.io/COVID19-Dashboard/frontend/data/state-counties/" + state_centroids_fname),
    d3.json("https://luyuliu.github.io/COVID19-Dashboard/frontend/data/all-cases-data-processed-counties.json")
];

Promise.all(state_promises).then(ready);
var state_all_cases = null;

function ready(all_data) {
    var state_geojson = all_data[0]
    var state_centroids = all_data[1];
    state_all_cases = all_data[2][the_state];

    /// GET MAX of cases
    var case_maxs = [];
    d3.keys(state_all_cases).forEach(function(d, i) {
        var val = state_all_cases[d][cur_case].slice(-1)[0]; 
        case_maxs[i] = val;
    });

    state_max = d3.max(case_maxs);

    /// GET a dictionary FIPS -> NAME
    fips_to_name = {}
    state_geojson.features.forEach(function(d) {
        fips_to_name[d.properties.GEOID] = d.properties.NAME;
    })

    //////////////////////////////////////////////////////////////////////////
    // State map
    /////////////////////////////////////////////////////////////////////////

    all_mapping_vars = [];
    state_current_mapping_var = "MED_HH_INC";
    for (i=0; i<state_geojson.features.length; i++) {
		var val = state_geojson.features[i]["properties"][state_current_mapping_var];
		if (val != null)
        	all_mapping_vars[i] = val;
    }
    state_bounds = get_var_bounds(all_mapping_vars);

    if (maptype === 'geojson') {
        var us = state_geojson;
        state_svg.append("g")
            .attr("class", "states")
            .selectAll("path")
            .data(state_geojson.features)
            .enter().append("path")
            .attr("d", state_path)
            // .style("fill", "white")
            .style("fill", function(d, i) {
    			// if (i==0) alert("world again");
                return getColorx(d["properties"][state_current_mapping_var], state_bounds);
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
                    .style("fill", getColorx(d["properties"][state_current_mapping_var], state_bounds));
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
                name = d.properties.GEOID;
                if (state_all_cases[name]) {
                    // console.log(d, i, state_all_cases[state_abbr[name]])
                    return state_radius(state_all_cases[name][cur_case].slice(-1)[0]);
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
            state_info_labels[0].text(`${fips_to_name[cur_state_county]} ${case_date_format(cur_date_state)} [Day ${ind}]`);
            state_info_labels[1].text(`${case_names[cur_case]}: ${state_all_cases[cur_state_county][cur_case][ind]}`);

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

    var state_timelines_margin = {top: 50, right: 60, bottom: 30, left: 40};
    var state_timelines_width = $(state_plot_id).width() - state_timelines_margin.left - state_timelines_margin.right,
        state_timelines_height = $(state_plot_id).height() - state_timelines_margin.top - state_timelines_margin.bottom - 50; 

    // var state_xScale = d3.scaleLinear()
    //     .domain([0, state_length - 1]) // input
    //     .range([0, state_timelines_width]); // output
    // 
    // TODO: get dates from file
    var state_start_date = start_date;
    var state_end_date = end_date;

    var n = total_days;

    var state_xScale = d3.scaleTime()
        .domain([case_date_parser(state_start_date), case_date_parser(state_end_date)])
        .range([0, state_timelines_width]); // output

    var state_toXScale = d3.scaleLinear()
        .domain([0, n-1])
        .range([case_date_parser(state_start_date), case_date_parser(state_end_date)])
        ;

    var state_yScale = d3.scaleLinear()
        .domain([0, state_max]) // input  TODO: get max
        .range([state_timelines_height, 0]); // output 

    var state_names = ["39049"];  // TODO: get these automatically for county FIPS (sort state_all_cases)

    var state_sub_dataset = {};
    d3.keys(state_all_cases).forEach(function (d, i) {
        // if (state_names.includes(d))
        state_sub_dataset[d] = d3.range(n).map(function (i) {
            return {
                x: +state_toXScale(i),
                y: state_all_cases[d][cur_case][i]
            }
        })
    });

    // not useful
    var state_line_color = d3.scaleOrdinal(d3.schemeCategory10);
    state_line_color.domain(d3.keys(state_sub_dataset));

    var state_line = d3.line()
        .x(function (d) { return state_xScale(d.x); }) // set the x values for the line generator
        .y(function (d) { return state_yScale(d.y); }) // set the y values for the line generator 
        .curve(d3.curveMonotoneX) // apply smoothing to the line

    state_timelines_svg = d3.select(state_plot_id).append("svg")
        .attr("width", state_timelines_width + state_timelines_margin.left + state_timelines_margin.right)
        .attr("height", state_timelines_height + state_timelines_margin.top + state_timelines_margin.bottom)
        .append("g")
        .attr("transform", "translate(" + state_timelines_margin.left + "," + state_timelines_margin.top + ")");

    state_timelines_svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + state_timelines_height + ")")
        .call(d3.axisBottom(state_xScale).ticks(6)); // Create an axis component with d3.axisBottom

    state_timelines_svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(state_yScale).ticks(4, "s")) // Create an axis component with d3.axisLeft
        ;

    state_timelines_svg.append("path")
        .datum(state_sub_dataset) // 10. Binds data to the line 
        .attr("class", "line") // Assign a class for styling 
        .attr("d", state_line); // 11. Calls the line generator 

    state_timelines_svg.append("rect")
        .attr("class", "overlay")
        .attr("width", state_timelines_width)
        .attr("height", state_timelines_height)


    /////////////////////////////////////////////////////////////////////////////
    // hover lines on the line chart
    /////////////////////////////////////////////////////////////////////////////

    var state_timelines_hoverLine = state_timelines_svg.append("g")
        .attr("class", "hover-line")
        .append("line")
        .attr("id", "hover-line-state")
        .attr("x1", state_xScale(case_date_parser(state_end_date))).attr("x2", state_xScale(case_date_parser(state_end_date)))
        .style("pointer-events", "none") // Stop line interferring with cursor
        .style("opacity", 1); 

    state_timelines_hoverLine.attr("y1", 0).attr("y2", state_timelines_height + 10);

    state_timelines_rect = state_timelines_svg.append("rect")
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
            state_info_labels[0].text(`${fips_to_name[cur_state_county]} ${case_date_format(cur_date_state)} [Day ${ind}]`);
            state_info_labels[1].text(`${case_names[cur_case]}: ${state_all_cases[cur_state_county][cur_case][ind]}`);

            d3.select("#hover-line-state") // select hover-line and change position
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

    var state_timelines_lines = null;

    var state_timelines_lines = state_timelines_svg.selectAll(".lines")
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
        // .style("fill", function(d) { return state_line_color(d); })
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
