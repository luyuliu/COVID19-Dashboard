var maptype = 'geojson';


var US_map_width = $('#US_map-content').width() - 10;
var US_map_height = US_map_width / 4 * 3;

var US_map_margin = { top: 10, right: 10, bottom: 20, left: 10 };

var US_projection = d3.geoAlbersUsa()
    .scale(US_map_width * 4 / 3)
    .translate([US_map_width / 2, US_map_height / 2]);


var US_path = d3.geoPath()
    .projection(US_projection);


var svg = d3.select("#US_map-content").append("svg")
    .attr("width", US_map_width + US_map_margin.left + US_map_margin.right)
    .attr("height", US_map_height + US_map_margin.top + US_map_margin.bottom)
    .append("g")
    .attr("transform", "translate(" + US_map_margin.left + "," + US_map_margin.top + ")");


var US_promises = [
    d3.json("https://luyuliu.github.io/COVID19-Dashboard/data/us.geojson"),
    d3.json("https://luyuliu.github.io/COVID19-Dashboard/data/all-cases-data-processed-all.json")
];

Promise.all(US_promises).then(ready);

function ready(all_data) {
    var us_geojson = all_data[0]
    if (maptype === 'geojson') {
        var us = us_geojson;
        svg.append("g")
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


    // // TOPOJSON
    //   else if (maptype === 'topojson') {
    //     var us = us_topojson;

    //     svg.append("g")
    //         .attr("class", "counties")
    //       .selectAll("path")
    //         .data(topojson.feature(us, us.objects.counties).features)
    //       .enter().append("path")
    //         .attr("d", path);

    //     svg.append("path")
    //         .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
    //         .attr("class", "states")
    //         .attr("d", path);

    //   }


    //////////////////////////////////////////////////////////////////////////
    // centroids
    /////////////////////////////////////////////////////////////////////////
    worldmap_svg.selectAll(".symbol")
        .data(world_centroids.features)
        // .data(world_centroids.features.sort(function(a, b) { 
        //     if (a.properties && b.properties) {
        //         na = a.properties.NAME;
        //         nb = b.properties.NAME;
        //         if (all_cases[na] && all_cases[nb])
        //         return all_cases[na][cur_case][cur_date] - 
        //         all_cases[na][cur_case][cur_date]; 
        //     }
        // }))
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
        .on("mouseenter", function (d) { // d is geojson obj
            // alert(d.properties.NAME + " " + d.properties.ISO_3);

            timelines_svg.selectAll(".line").classed("world_highlight", function (dd, i) {
                // if (dd == d.properties.NAME) alert(dd);
                return (dd == d.properties.NAME);
            });
            timelines_svg.selectAll(".text_label").style("display", function (dd) {
                if (dd.label == d.properties.NAME || country_names.includes(dd.label))
                    return "block";
                else
                    return "none";
            });
            worldmap_svg.selectAll(".world_symbol").classed("highlight", false); // clear 
            d3.select(this).classed("highlight", true);
            d3.select(this).moveToFront();

        })
        .on("mouseout", function (d) {
            timelines_svg.selectAll(".line").classed("world_highlight", false);
            timelines_svg.selectAll(".text_label").style("display", function (dd) {
                if (country_names.includes(dd.label))
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

    var timelines_margin = { top: 10, right: 150, bottom: 50, left: 50 };
    var timelines_width = worldmap_width / 6 * 5; // should change
    var timelines_height = timelines_width / 2;

    var xScale = d3.scaleLinear()
        .domain([0, n - 1]) // input
        .range([0, timelines_width]); // output

    // TODO: get dates from file
    var start_date = "01-22-2020";
    var end_date = "04-12-2020";

    var n = all_cases["USA"][cur_case].length; // TODO: get n 

    var xScale = d3.scaleTime()
        .domain([case_date_parser(start_date), case_date_parser(end_date)])
        .range([0, timelines_width]); // output

    var toXScale = d3.scaleLinear()
        .domain([0, n - 1])
        .range([case_date_parser(start_date), case_date_parser(end_date)])
        ;

    var yScale = d3.scaleLinear()
        .domain([0, 6e5]) // input  TODO: get max
        .range([timelines_height, 0]); // output 

    var country_names = []; //[ "Mainland China", "USA", "Italy", "Japan"];

    var sub_dataset = {};
    d3.keys(all_cases).forEach(function (d, i) {
        // if (country_names.includes(d))
        sub_dataset[d] = d3.range(n).map(function (i) {
            return {
                x: +toXScale(i),
                y: all_cases[d][cur_case][i]
            }
        })
    });

    // not useful
    var line_color = d3.scaleOrdinal(d3.schemeCategory10);
    line_color.domain(d3.keys(sub_dataset));

    var line = d3.line()
        .x(function (d) { return xScale(d.x); }) // set the x values for the line generator
        .y(function (d) { return yScale(d.y); }) // set the y values for the line generator 
        .curve(d3.curveMonotoneX) // apply smoothing to the line

    timelines_svg = d3.select("#world_plot").append("svg")
        .attr("width", timelines_width + timelines_margin.left + timelines_margin.right)
        .attr("height", timelines_height + timelines_margin.top + timelines_margin.bottom)
        .append("g")
        .attr("transform", "translate(" + timelines_margin.left + "," + timelines_margin.top + ")");

    timelines_svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + timelines_height + ")")
        .call(d3.axisBottom(xScale)); // Create an axis component with d3.axisBottom

    timelines_svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(yScale).ticks(4, "s")) // Create an axis component with d3.axisLeft
        ;

    timelines_svg.append("path")
        .datum(sub_dataset) // 10. Binds data to the line 
        .attr("class", "line") // Assign a class for styling 
        .attr("d", line); // 11. Calls the line generator 

    timelines_svg.append("rect")
        .attr("class", "overlay")
        .attr("width", timelines_width)
        .attr("height", timelines_height)


    /////////////////////////////////////////////////////////////////////////////
    // hover lines on the line chart
    /////////////////////////////////////////////////////////////////////////////

    var timelines_hoverLine = timelines_svg.append("g")
        .attr("class", "hover-line-world")
        .append("line")
        .attr("id", "hover-line-world")
        .attr("x1", 10).attr("x2", 10)
        .style("pointer-events", "none") // Stop line interferring with cursor
        .style("opacity", 0); // Set opacity to zero

    timelines_hoverLine.attr("y1", 0).attr("y2", timelines_height + 10);

    timelines_rect = timelines_svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", timelines_width)
        .attr("height", timelines_height)
        .style("fill", "none")
        .style("pointer-events", "all")
        // .style("display", "none")
        .on("mousemove", function () {
            var xpos = d3.mouse(this)[0];
            var date = xScale.invert(xpos);
            var ind = parseInt(toXScale.invert(date));
            worldmap_svg.selectAll(".world_symbol")
                .attr("d", path.pointRadius(function (d, i) {
                    if (d.properties) {
                        _case = all_cases[d.properties.NAME];
                        if (_case) {
                            y = _case[cur_case][ind];
                            return radius(y);
                        }
                    }
                    return radius(0);
                }));

            d3.select("#hover-line-world") // select hover-line and change position
                .attr("x1", xpos)
                .attr("x2", xpos)
                .style("opacity", 1); // Making line visible
        })
        .on("mouseout", function (d) {
            // d3.select("#hover-line-world").style("opacity", 0); // hover line invisible
        })
        ;


    /////////////////////////////////////////////////////////////////////////////
    // labels
    /////////////////////////////////////////////////////////////////////////////

    var timelines_labels = null;

    var timelines_lines = timelines_svg.selectAll(".lines")
        .data(d3.keys(sub_dataset))
        .enter().append("g")
        .attr("class", "lines")

    timelines_lines.append("path")
        .attr("class", "line")
        .attr("d", function (d) { return line(sub_dataset[d]); })
        // .style("stroke-width", 1)
        // .style("stroke", function(d) { 
        //       if (country_names.includes(d))
        //           return "#777";
        //       else
        //           return "#cdcdcd";})
        .on("mouseover", function (d) {
            timelines_svg.selectAll(".line").classed("world_highlight", function (dd, i) {
                return (dd == d);
            });
            timelines_svg.selectAll(".text_label").style("display", function (dd) {
                if (dd.label == d || country_names.includes(dd.label)) return "block";
                else return "none";
            });
            worldmap_svg.selectAll(".world_symbol").classed("highlight", function (dd, i) {
                return (dd.properties.NAME == d);
            });
            d3.select(this).moveToFront();

        })
        .on("mouseout", function (d) {
            // timelines_svg.selectAll(".text_label").style("display", function(d) {
            //     if (country_names.includes(d.label))
            //       return "block";
            //       else
            //       return "none";
            // 
            // }); 
            // 
        })
        ;


    timelines_labels = timelines_lines.append("text")
        .attr("class", "text_label")
        // .style("fill", function(d) { return line_color(d); })
        .text(function (d) {
            // if (country_names.includes(d))
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
        .attr("x", function (d) { return xScale(d.x) + 3; })
        .attr("y", function (d) { return yScale(d.y); })
        .style("display", function (d) {
            if (country_names.includes(d.label))
                return "block";
            else
                return "none";
        })
        ;
}