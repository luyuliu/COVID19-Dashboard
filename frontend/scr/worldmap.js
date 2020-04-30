var world_grid_container_id = "#world_map-grid-container";
var world_map_id = "#world_map-content";
var world_plot_id = "#world_plot-content";
var varworld_affiliation_id = "#world_map-affiliation"

var all_mapping_vars = [];

var bounds; // bounds for choropleth map classes

var worldmap_width = $(world_grid_container_id).width(),
    worldmap_height = $(world_grid_container_id).height() / 4 * 3;

var worldmap_legend_width = $(varworld_affiliation_id).width(),
    worldmap_legend_height = $(varworld_affiliation_id).height();

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
var t = d3.transition(); // smooth

var colors = ["#f7f7f7", "#cccccc", "#969696", "#525252"];
var timelines_svg = null;

function getColorx(val, bounds) {
    for (i=1; i<bounds.length; i++)
	if (val >= bounds[i])
	    return colors[bounds.length-i-1];
    return '#ffffff';
}

function get_var_bounds(mapdata) {
    mapdata.sort(d3.ascending) ;
    minx = mapdata[0];
    maxx = mapdata.slice(-1)[0];
    if (minx<1 && minx>0) minx = 0;
    bounds = [maxx, d3.quantile(mapdata, 0.67), d3.quantile(mapdata, 0.33), minx];
    // console.log(bounds)
}

var radius = d3.scaleSqrt()
    .domain([0, 1e4])
    .range([0, 8]);

var worldmap_svg = d3.select("#world_map-content")
    .append("svg")
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
    o1[1] = -35;
    o1[2] = 0;
    projection.rotate(o1);
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

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};


// var cur_date = 76; // will be actual date
var cur_case = 'confirmed';

// TODO: add a date file here 
var promises = [
    d3.json("https://luyuliu.github.io/COVID19-Dashboard/frontend/data/covid-19-world-iso3dissolved-centroids.geojson"),
    d3.json("https://luyuliu.github.io/COVID19-Dashboard/frontend/data/all-cases-data-processed.json"),
    d3.json("https://luyuliu.github.io/COVID19-Dashboard/frontend/data/ne_110m_admin0sov_joined.topo.json"),
    // d3.json("data/all-cases-data-dates.json")
];

Promise.all(promises).then(data_ready);

function data_ready(alldata) { // TODO: LONG function!

    world_centroids = alldata[0];
    all_cases = alldata[1];
    world0 = alldata[2];

    /// GET MAX of cases
    var case_maxs = [];
    d3.keys(all_cases).forEach(function (d, i) {
        var val = all_cases[d][cur_case].slice(-1)[0];
        case_maxs[i] = val;
    });

    world_max = d3.max(case_maxs);

    var world_cases = []; // TODO: summarize world cases!

    ///////////////////////////

    var timelines_margin = { top: 50, right: 60, bottom: 30, left: 40 };
    var timelines_width = $(world_plot_id).width() - timelines_margin.left - timelines_margin.right,
        timelines_height = $(world_plot_id).height() - timelines_margin.top - timelines_margin.bottom - 50;

    // TODO: get dates from file -- DONE
    // var start_date = "01-22-2020";
    // var end_date = "04-12-2020";

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



    // alert(all_cases['USA'][cur_case].length + " " + total_days)

    /////////////////////////////////////////////////////////////////////////////
    // World choropleth map
    /////////////////////////////////////////////////////////////////////////////

    var world_regions = topojson.feature(world0, world0.objects.countries);

    all_mapping_vars = [];
    current_mapping_var = "POP_SR";
    for (i = 0; i < world_regions.features.length; i++) {
        var val = world_regions.features[i]["properties"][current_mapping_var];
        if (val != null)
            all_mapping_vars[i] = val;
    }
    get_var_bounds(all_mapping_vars);

    var world_color_scheme = d3.scaleThreshold()
        .domain(bounds)
        .range(colors);

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
        .attr("class", "land")
        .attr("d", path)
        .style("fill", function (d, i) {
            // if (i==0) alert("world again");
            // console.log((d["properties"][current_mapping_var]))
            return world_color_scheme(d["properties"][current_mapping_var]);
        })
        // .style("stroke", "#999")
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
                .style("fill", world_color_scheme(d["properties"][current_mapping_var]));
        });;

    // alert(all_cases["Mainland China"]["confirmed"]);


    //////////////////////////////////////////////////////////////////////////
    // legend
    /////////////////////////////////////////////////////////////////////////

    var worldmap_legend_svg = d3.select(world_map_id)
        .append("svg")
        .attr("width", worldmap_legend_width)
        .attr("height", worldmap_legend_height);

    worldmap_legend_svg.append("g")
        .attr("id", "world-legend")
        .attr("transform", "translate(20,20)");

    var legend_linear = d3.legendColor()
        .labelFormat(d3.format(".2f"))
        .labels(d3.legendHelpers.thresholdLabels)
        .useClass(true)
        .scale(world_color_scheme)
        // .orient('horizontal');

    worldmap_legend_svg.select("#world-legend")
        .call(legend_linear);
    // // Create element for legend
    // var g = worldmap_legend_svg.append("g")
    //     .attr("class", "key")
    //     .attr("transform", "translate(0,0)");

    // // Legend color scale
    // g.selectAll("rect")
    //     .data(color.range().map(function (d) {
    //         d = color.invertExtent(d);
    //         if (d[0] == null) d[0] = x.domain()[0];
    //         if (d[1] == null) d[1] = x.domain()[1];
    //         return d;
    //     }))
    //     .enter().append("rect")
    //     .attr("height", 8)
    //     .attr("x", function (d) { return x(d[0]); })
    //     .attr("width", function (d) { return x(d[1]) - x(d[0]); })
    //     .attr("fill", function (d) { return world_color_scheme(d[0]); });

    // // Legend title - "Unemployment rate"
    // g.append("text")
    //     .attr("class", "caption")
    //     .attr("x", x.range()[0])
    //     .attr("y", -6)
    //     .attr("fill", "#000")
    //     .attr("text-anchor", "start")
    //     .attr("font-weight", "bold")
    //     .text("Unemployment rate");

    // // Legend markings - 2%, 3%, etc.
    // g.call(d3.axisBottom(x)
    //     .tickSize(13)
    //     .tickFormat(function (x, i) { return i ? x : x + "%"; })
    //     .tickValues(color.domain()))
    //     .select(".domain")
    //     .remove();

    //////////////////////////////////////////////////////////////////////////
    // centroids
    /////////////////////////////////////////////////////////////////////////
    worldmap_svg.selectAll(".symbol")
        // .data(world_centroids.features)
        .data(world_centroids.features.sort(function (a, b) {
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
        .on("mouseenter", function (d) { // d is geojson obj
            timelines_svg.selectAll(".line").classed("world_highlight", function (dd, i) {
                if (dd == d.properties.NAME) {
                    d3.select(this.parentNode).raise();
                    cur_world_region = dd;
                    return true;
                }
                else return false;
            });
            timelines_svg.selectAll(".text_label").style("display", function(dd) {
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
            timelines_svg.selectAll(".text-label").style("display", function (dd) {
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
    
    var timelines_margin = {top: 10, right: 150, bottom: 50, left: 50};
    var timelines_width = worldmap_width /6*5; // should change
    var timelines_height = timelines_width/2;

    var xScale = d3.scaleLinear()
        .domain([0, n-1]) // input
        .range([0, timelines_width]); // output

    // TODO: get dates from file
    var start_date = "01-22-2020";
    var end_date = "04-12-2020";

    var n = all_cases["USA"][cur_case].length; // TODO: get n 

    var xScale = d3.scaleTime()
        .domain([case_date_parser(start_date), case_date_parser(end_date)])
        .range([0, timelines_width]); // output

    var toXScale = d3.scaleLinear()
        .domain([0, n-1])
        .range([case_date_parser(start_date), case_date_parser(end_date)])
        ;
    
    var yScale = d3.scaleLinear()
        .domain([0, 6e5]) // input  TODO: get max
        .range([timelines_height, 0]); // output 

    var country_names = ["Mainland China", "USA", "Italy", "Japan"];

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

    var line_generator = d3.line()
        .x(function (d) { return xScale(d.x); }) // set the x values for the line generator
        .y(function (d) { return yScale(d.y); }) // set the y values for the line generator 
        .curve(d3.curveMonotoneX) // apply smoothing to the line

    timelines_svg = d3.select("#world_plot").append("svg")
        .attr("width", timelines_width + timelines_margin.left + timelines_margin.right)
        .attr("height", timelines_height + timelines_margin.top + timelines_margin.bottom)
        .append("g")
        .attr("transform", "translate(" + timelines_margin.left + "," + timelines_margin.top + ")")
        ;

    timelines_svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + timelines_height + ")")
        .call(d3.axisBottom(xScale).ticks(6)); // Create an axis component with d3.axisBottom

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
        .style("opacity", 1);

    timelines_hoverLine.attr("y1", 0).attr("y2", timelines_height + 10);

    function hover_line_symbol(target_svg, obj_id, the_path, the_key, the_data, ind, xpos, hover_line_id, radius_func) {
        target_svg.selectAll(obj_id)
            .attr("d", the_path.pointRadius(function (d) {
                if (d.properties) {
                    if (the_data[d.properties[the_key]]) {
                        y = the_data[d.properties[the_key]][cur_case][ind];
                        return radius_func(y);
                    }
                }
                return radius_func(0);
            }));

        d3.select(hover_line_id) // select hover-line and change position
            .attr("x1", xpos)
            .attr("x2", xpos)
        // .style("opacity", 1); // Making line visible
    }

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
            cur_date_world = xScale.invert(xpos);
            cur_date_us = cur_date_world;
            var ind = parseInt(toXScale.invert(cur_date_world)) + 1;
            hover_line_symbol(worldmap_svg, ".world_symbol", path, "NAME", all_cases, ind, xpos, "#hover-line-world", radius);
            if (sync_time_lines) {
                hover_line_symbol(US_svg, ".US_symbol", US_path, "postal", us_all_cases, ind, xpos, "#hover-line-US", radius);
                hover_line_symbol(state_svg, ".state_symbol", state_path, "GEOID", state_all_cases, ind, xpos, "#hover-line-state", state_radius);

                US_info_labels[0].text(`${state_abbr_inv[cur_us_state]} ${case_date_format(cur_date_world)} [Day ${ind}]`);
                US_info_labels[1].text(`${case_names[cur_case]}: ${us_all_cases[cur_us_state][cur_case][ind]}`);

                state_info_labels[0].text(`${fips_to_name[cur_state_county]} ${case_date_format(cur_date_world)} [Day ${ind}]`);
                state_info_labels[1].text(`${case_names[cur_case]}: ${state_all_cases[cur_state_county][cur_case][ind]}`);

            }
            world_info_labels[0].text(`${cur_world_region} ${case_date_format(cur_date_world)} [Day ${ind}]`);
            world_info_labels[1].text(`${case_names[cur_case]}: ${all_cases[cur_world_region][cur_case][ind]}`);


            // worldmap_svg.selectAll(".world_symbol")
            //   .attr("d", path.pointRadius(function(d, i) {
            //       if (d.properties) {
            //       _case = all_cases[d.properties.NAME];
            //       if (_case) {
            //           y = _case[cur_case][ind];
            //           return radius(y);
            //       }}
            //       return radius(0);
            //   })); 
            // 
            //   d3.select("#hover-line-world") // select hover-line and change position
            //       .attr("x1", xpos)
            //       .attr("x2", xpos)
            //       .style("opacity", 1); // Making line visible
            //   d3.select("#hover-line-US") // select hover-line and change position
            //       .attr("x1", xpos)
            //       .attr("x2", xpos)
            //       .style("opacity", 1); // Making line visible
            //   d3.select("#hover-line-state") // select hover-line and change position
            //       .attr("x1", xpos)
            //       .attr("x2", xpos)
            //       .style("opacity", 1); // Making line visible
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
        .attr("d", function (d) { return line_generator(sub_dataset[d]); })
        // .style("stroke-width", 1)
        // .style("stroke", function(d) { 
        //       if (country_names.includes(d))
        //           return "#777";
        //       else
        //           return "#cdcdcd";})
        .on("mouseover", function (d) {
            timelines_svg.selectAll(".line").classed("world_highlight", function (dd, i) {
                if (dd == d) {
                    cur_world_region = d;
                    d3.select(this.parentNode).raise();
                    return true;
                }
                return false;
            });
            // timelines_svg.selectAll(".text-label").style("display", function(dd) {
            //     if (dd.label==d || country_names.includes(dd.label)) return "block";
            //     else return "none";
            // });
            worldmap_svg.selectAll(".world_symbol").classed("highlight", function (dd, i) {
                return (dd.properties.NAME == d);
            });

        })
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
        .attr("x", function (d) { return xScale(d.x) + 4; })
        .attr("y", function (d) { return yScale(d.y); })
        .style("display", function (d) {
            if (country_names.includes(d.label)) return "block";
            else return "none";
        })
        ;
    // 
    // svg.selectAll("text.label")
    //         .data(xAxisHeaderAr)
    //         .enter()
    //         .append("text")
    //         .attr("class", "label")
    //         .text(function (d) { return d; });
    // 
    world_info_labels = []
    world_info_labels[0] = timelines_svg
        .append('text')
        .attr("class", "hover-text")
        .attr("style", "fill: #ababab")
        .attr("x", 20)
        .attr("y", -5);
    world_info_labels[1] = timelines_svg
        .append('text')
        .attr("class", "hover-text")
        .attr("style", "font-size: 22px")
        .attr("x", 20)
        .attr("y", 20);
}
