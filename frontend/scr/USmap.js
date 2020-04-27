var us_map_id = "#US_map-content";
var us_plot_id = "#US_plot";

var maptype = 'geojson';

var US_map_width = $(us_map_id).width() - 10;
var US_map_height = $(us_map_id).height() - 10;

var US_map_margin = { top: 10, right: 10, bottom: 20, left: 10 };

var US_info_labels = null;
var cur_us_state = "NY";

var US_projection = d3.geoAlbersUsa()
    .scale(US_map_width * 4 / 3)
    .translate([US_map_width / 2, US_map_height / 2]);


var US_path = d3.geoPath()
    .projection(US_projection);

var US_svg = d3.select(us_map_id).append("svg")
    .attr("width", US_map_width)
    .attr("height", US_map_height)
    .append("g")
    .attr("transform", "translate(" + US_map_margin.left + "," + US_map_margin.top + ")");

var US_promises = [
    d3.json("data/us-states-attributes.geojson"),
    d3.json("data/covid-19-us-centroids.geojson"),
    d3.json("data/all-cases-data-processed-states.json"),
    d3.json("data/state_abbr_inv.json")
];

var US_timelines_lines = null;
var us_all_cases = null;

Promise.all(US_promises).then(ready);

function ready(all_data) {
    var us_geojson = all_data[0];
    var us_centroids = all_data[1];
    us_all_cases = all_data[2];
    state_abbr_inv = all_data[3];

    // set in main.js, reading from a file
    var US_start_date = start_date;
    var US_end_date = end_date;
    var n = total_days;

    /// GET MAX of cases
    var case_maxs = [];
    d3.keys(us_all_cases).forEach(function(d, i) {
        var val = us_all_cases[d][cur_case].slice(-1)[0]; 
        case_maxs[i] = val;
    });

    US_max = d3.max(case_maxs);

///////////////////////////
    
    var US_timelines_margin = {top: 50, right: 60, bottom: 30, left: 40};
    var US_timelines_width = $(us_plot_id).width() - US_timelines_margin.left - US_timelines_margin.right,
        US_timelines_height = $(us_plot_id).height() - US_timelines_margin.top - US_timelines_margin.bottom - 50; 

    var US_xScale = d3.scaleTime()
        .domain([case_date_parser(US_start_date), case_date_parser(US_end_date)])
        .range([0, US_timelines_width]); // output

    var US_toXScale = d3.scaleLinear()
        .domain([0, n-1])
        .range([case_date_parser(US_start_date), case_date_parser(US_end_date)]);

    var US_yScale = d3.scaleLinear()
        .domain([0, US_max]) // input  TODO: get max
        .range([US_timelines_height, 0]); // output 

    //////////////////////////////////////////////////////////////////////////
    // US choropleth map
    /////////////////////////////////////////////////////////////////////////

    all_mapping_vars = [];
    us_current_mapping_var = "Med_HH_Inc";
    for (i=0; i<us_geojson.features.length; i++) {
		var val = us_geojson.features[i]["properties"][us_current_mapping_var];
		if (val != null)
        	all_mapping_vars[i] = val;
    }
    us_bounds = get_var_bounds(all_mapping_vars);

    if (maptype === 'geojson') {
        var us = us_geojson;
        US_svg.append("g")
            .attr("class", "states")
            .selectAll("path")
            .data(us_geojson.features)
            .enter().append("path")
            .attr("d", US_path)
            // .style("fill", "white")
            .style("fill", function(d, i) {
    			// if (i==0) alert("world again");
                return getColorx(d["properties"][us_current_mapping_var], us_bounds);
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
                    .style("fill", getColorx(d["properties"][us_current_mapping_var], us_bounds));
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
            .datum(topojson.mesh(us, us.objects.states, function (a, b) { return a !== b; }))
            .attr("class", "states")
            .attr("d", US_path);

    }


    //////////////////////////////////////////////////////////////////////////
    // centroids
    /////////////////////////////////////////////////////////////////////////
    US_svg.selectAll(".symbol")
        // .data(us_centroids.features)
        .data(us_centroids.features.sort(function(a, b) { 
            if (a.properties && b.properties) {
                na = a.properties.NAME;
                nb = b.properties.NAME;
                if (us_all_cases[na] && us_all_cases[nb])
                    return d3.descending(us_all_cases[na][cur_case][n-1], us_all_cases[nb][cur_case][n-1]); 
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
                    // console.log(d, i, us_all_cases[state_abbr[name]])
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
                    cur_us_state = dd;
                    return true;
                }
                else return false;
            });
            // US_timelines_svg.selectAll(".text-label").style("display", function (dd) {
            //     if (dd.label == d.properties.postal || state_names.includes(dd.label))
            //         return "block";
            //     else
            //         return "none";
            // });
            US_svg.selectAll(".US_symbol").classed("highlight", false); // clear 
            d3.select(this).classed("highlight", true);
            
            var ind = parseInt(US_toXScale.invert(cur_date_us)) + 1;
            US_info_labels[0].text(`${state_abbr_inv[cur_us_state]} ${case_date_format(cur_date_us)} [Day ${ind}]`);
            US_info_labels[1].text(`${case_names[cur_case]}: ${us_all_cases[cur_us_state][cur_case][ind]}`);
        })
        .on("mouseout", function (d) {
            US_timelines_svg.selectAll(".line").classed("US_highlight", false);
            US_timelines_svg.selectAll(".text-label").style("display", function (dd) {
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

    var state_names = ["NY", "OH"]; // some highlight states? [ "NY", "OH"];

    var US_sub_dataset = {};
    d3.keys(us_all_cases).forEach(function (d, i) {
        // if (state_names.includes(d))
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

    US_timelines_svg = d3.select("#US_plot").append("svg")
        .attr("width", $(us_plot_id).width())
        .attr("height", $(us_plot_id).height())
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
        .attr("width", US_timelines_width+1)  // quick fix of not getting the last date on mousemove!
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

            US_info_labels[0].text(`${state_abbr_inv[cur_us_state]} ${case_date_format(cur_date_us)} [Day ${ind}]`);
            US_info_labels[1].text(`${case_names[cur_case]}: ${us_all_cases[cur_us_state][cur_case][ind]}`);
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
        //       if (state_names.includes(d))
        //           return "#777";
        //       else
        //           return "#cdcdcd";})
        .on("mouseover", function (d) {
            US_timelines_svg.selectAll(".line").classed("US_highlight", function (dd, i) {
                if (dd == d) {
                    cur_us_state = d;
                    return true;
                }
                else return false;
            });
            // US_timelines_svg.selectAll(".text-label").style("display", function (dd) {
            //     if (dd.label == d || state_names.includes(dd.label)) return "block";
            //     else return "none";
            // });
            US_svg.selectAll(".US_symbol").classed("highlight", function (dd, i) {
                return (dd.properties.postal == d);
            });
            d3.select(this.parentNode).raise(); 

        })
        .on("mouseout", function (d) {
            // US_timelines_svg.selectAll(".text-label").style("display", function(d) {
            //     if (state_names.includes(d.label))
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
            // if (state_names.includes(d))
            return state_abbr_inv[d];
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
            if (state_names.includes(d.label))
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
