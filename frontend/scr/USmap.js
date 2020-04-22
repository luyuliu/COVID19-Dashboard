var maptype = 'geojson';


var US_map_width = $('#US_map-content').width() - 10;
var US_map_height = US_map_width / 4 * 3;

var US_map_margin = { top: 10, right: 10, bottom: 20, left: 10 };

var US_projection = d3.geoAlbersUsa()
    .scale(US_map_width * 4 / 3)
    .translate([US_map_width / 2, US_map_height / 2]);


var US_path = d3.geoPath()
    .projection(US_projection);


var US_svg = d3.select("#US_map-content").append("svg")
    .attr("width", US_map_width + US_map_margin.left + US_map_margin.right)
    .attr("height", US_map_height + US_map_margin.top + US_map_margin.bottom)
    .append("g")
    .attr("transform", "translate(" + US_map_margin.left + "," + US_map_margin.top + ")");


var US_promises = [
    d3.json("https://luyuliu.github.io/COVID19-Dashboard/data/us.geojson"),
    d3.json("https://luyuliu.github.io/COVID19-Dashboard/data/covid-19-us-centroids.geojson"),
    d3.json("https://luyuliu.github.io/COVID19-Dashboard/data/all-cases-data-processed-states.json")
];

Promise.all(US_promises).then(ready);

function ready(all_data) {
    var us_geojson = all_data[0]
    var US_centroids = all_data[1];
    var US_all_cases = all_data[2];

    //////////////////////////////////////////////////////////////////////////
    // US map
    /////////////////////////////////////////////////////////////////////////

    if (maptype === 'geojson') {
        var us = us_geojson;
        US_svg.append("g")
            .attr("class", "states")
            .selectAll("path")
            .data(us.features)
            .enter().append("path")
            .attr("d", US_path)
            .style("fill", "white")
            .style("stroke", "#999")
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
                    .style("fill", "white");
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
        .data(US_centroids.features)
        // .data(US_centroids.features.sort(function(a, b) { 
        //     if (a.properties && b.properties) {
        //         na = a.properties.NAME;
        //         nb = b.properties.NAME;
        //         if (US_all_cases[na] && US_all_cases[nb])
        //         return US_all_cases[na][cur_case][cur_date] - 
        //         US_all_cases[na][cur_case][cur_date]; 
        //     }
        // }))
        .enter().append("path")
        .attr("class", "US_symbol")
        // .attr("d", path)
        .attr("d", US_path.pointRadius(function (d, i) {
            // if (i==0) alert("symbols again");
            if (d.properties) {
                name = d.properties.name;
                if (US_all_cases[state_abbr[name]]) {
                    // console.log(d, i, US_all_cases[state_abbr[name]])
                    return radius(US_all_cases[state_abbr[name]][cur_case].slice(-1)[0]);
                }
            }
            return radius(0);

            // if (d.id) // strange trick to make it work. Otherwise will complain d.properties.population to be on none type
        }))
        .on("mouseenter", function (d) { // d is geojson obj
            // alert(d.properties.NAME + " " + d.properties.ISO_3);

            US_timelines_svg.selectAll(".line").classed("US_highlight", function (dd, i) {
                // if (dd == d.properties.NAME) alert(dd);
                return (dd == d.properties.name);
            });
            US_timelines_svg.selectAll(".text_label").style("display", function (dd) {
                if (dd.label == d.properties.name || state_names.includes(dd.label))
                    return "block";
                else
                    return "none";
            });
            US_svg.selectAll(".US_symbol").classed("highlight", false); // clear 
            d3.select(this).classed("highlight", true);
            d3.select(this).moveToFront();

        })
        .on("mouseout", function (d) {
            US_timelines_svg.selectAll(".line").classed("US_highlight", false);
            US_timelines_svg.selectAll(".text_label").style("display", function (dd) {
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

    var US_timelines_margin = { top: 10, right: 150, bottom: 50, left: 50 };
    var US_timelines_width = US_map_width / 6 * 5; // should change
    var US_timelines_height = US_timelines_width / 2;

    var US_xScale = d3.scaleLinear()
        .domain([0, US_length - 1]) // input
        .range([0, US_timelines_width]); // output

    // TODO: get dates from file
    var US_start_date = "01-22-2020";
    var US_end_date = "04-12-2020";

    var US_length = US_all_cases["OH"][cur_case].length; // TODO: get US_length 

    var US_xScale = d3.scaleTime()
        .domain([case_date_parser(US_start_date), case_date_parser(US_end_date)])
        .range([0, US_timelines_width]); // output

    var US_toXScale = d3.scaleLinear()
        .domain([0, US_length - 1])
        .range([case_date_parser(US_start_date), case_date_parser(US_end_date)])
        ;

    var US_yScale = d3.scaleLinear()
        .domain([0, 4e5]) // input  TODO: get max
        .range([US_timelines_height, 0]); // output 

    var state_names = []; //[ "Mainland China", "USA", "Italy", "Japan"];

    var US_sub_dataset = {};
    d3.keys(US_all_cases).forEach(function (d, i) {
        // if (state_names.includes(d))
        US_sub_dataset[d] = d3.range(US_length).map(function (i) {
            return {
                x: +US_toXScale(i),
                y: US_all_cases[d][cur_case][i]
            }
        })
    });

    // not useful
    var US_line_color = d3.scaleOrdinal(d3.schemeCategory10);
    US_line_color.domain(d3.keys(US_sub_dataset));

    var US_line = d3.line()
        .x(function (d) { return US_xScale(d.x); }) // set the x values for the line generator
        .y(function (d) { return US_yScale(d.y); }) // set the y values for the line generator 
        .curve(d3.curveMonotoneX) // apply smoothing to the line

    US_timelines_svg = d3.select("#US_plot").append("svg")
        .attr("width", US_timelines_width + US_timelines_margin.left + US_timelines_margin.right)
        .attr("height", US_timelines_height + US_timelines_margin.top + US_timelines_margin.bottom)
        .append("g")
        .attr("transform", "translate(" + US_timelines_margin.left + "," + US_timelines_margin.top + ")");

    US_timelines_svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + US_timelines_height + ")")
        .call(d3.axisBottom(US_xScale)); // Create an axis component with d3.axisBottom

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
        .attr("class", "hover-line-US")
        .append("line")
        .attr("id", "hover-line-US")
        .attr("x1", 10).attr("x2", 10)
        .style("pointer-events", "none") // Stop line interferring with cursor
        .style("opacity", 0); // Set opacity to zero

    US_timelines_hoverLine.attr("y1", 0).attr("y2", US_timelines_height + 10);

    US_timelines_rect = US_timelines_svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", US_timelines_width)
        .attr("height", US_timelines_height)
        .style("fill", "none")
        .style("pointer-events", "all")
        // .style("display", "none")
        .on("mousemove", function () {
            var xpos = d3.mouse(this)[0];
            var date = US_xScale.invert(xpos);
            console.log(xpos)
            var ind = parseInt(US_toXScale.invert(date));
            US_svg.selectAll(".US_symbol")
                .attr("d", US_path.pointRadius(function (d, i) {
                    if (d.properties) {
                        _case = US_all_cases[state_abbr[d.properties.name]];
                        if (_case) {
                            y = _case[cur_case][ind];
                            return radius(y);
                        }
                    }
                    return radius(0);
                }));

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

    var US_timelines_labels = null;

    var US_timelines_labels = US_timelines_svg.selectAll(".lines")
        .data(d3.keys(US_sub_dataset))
        .enter().append("g")
        .attr("class", "lines")

    US_timelines_labels.append("path")
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
                return (dd == d);
            });
            US_timelines_svg.selectAll(".text_label").style("display", function (dd) {
                if (dd.label == d || state_names.includes(dd.label)) return "block";
                else return "none";
            });
            US_svg.selectAll(".US_symbol").classed("highlight", function (dd, i) {
                return (dd.properties.NAME == d);
            });
            d3.select(this).moveToFront();

        })
        .on("mouseout", function (d) {
            // US_timelines_svg.selectAll(".text_label").style("display", function(d) {
            //     if (state_names.includes(d.label))
            //       return "block";
            //       else
            //       return "none";
            // 
            // }); 
            // 
        })
        ;


    US_timelines_labels = US_timelines_labels.append("text")
        .attr("class", "text_label")
        // .style("fill", function(d) { return US_line_color(d); })
        .text(function (d) {
            // if (state_names.includes(d))
            return d;
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
}