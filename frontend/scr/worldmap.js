class WorldMapUI {
    constructor() {
        this.all_mapping_vars = [];
        this.bounds; // bounds for choropleth map classes
        this.width = 460;
        this.height = 460;

        this.globe_scale = Math.min(this.width, this.height) / 2;

        this.case_date_parser = d3.timeParse("%m-%d-%Y");
        this.case_date_format = d3.timeFormat("%m/%d %I:%M %p");

        // scale globe to size of window
        this.globe_scale = Math.min(this.width, this.height) / 2;

        this.case_date_parser = d3.timeParse("%m-%d-%Y");
        this.case_date_format = d3.timeFormat("%m/%d %I:%M %p");

        // geoNaturalEarth1
        // geoEqualEarth
        // geoWinkel3
        // geoOrthographic
        // geoFahey


        this.projection = d3.geoOrthographic().rotate([-10, -40, 0]) // λ, ϕ, γ
            .scale(this.globe_scale) // percent within rectangle of width x height
            .translate([this.width / 2, this.weight / 2]);

        this.graticule = d3.geoGraticule();

        this.path = d3.geoPath().projection(this.projection);
        this.t = d3.transition(); // smooth

        this.colors = colorbrewer_min3['Greens']['3'];
        this.timelines_svg = null;


        this.radius = d3.scaleSqrt()
            .domain([0, 1e4])
            .range([0, 8]);

        this.worldmap_svg = d3.select("#world_map-content")
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height);

        // append g element for map
        this.worldmap = this.worldmap_svg.append("g");

        this.gpos0, this.o0, this.gpos1, this.o1;


        // enable drag
        this.drag = d3.drag()
            .on("start", this.dragstarted)
            .on("drag", this.dragged);

        this.worldmap_svg.call(this.drag);

        // enable zoom
        this.zoom = d3.zoom()
            .scaleExtent([0.95, 50]) //bound zoom
            .on("zoom", this.zoomed);


        this.worldmap_svg.call(this.zoom);

        d3.selection.prototype.moveToFront = function () {
            return this.each(function () {
                this.parentNode.appendChild(this);
            });
        };



        // var cur_date = 76; // will be actual date
        this.cur_case = 'confirmed';
        self = this
    }

    initiateWorldMap (){
        // TODO: add a date file here 
        var promises = [
            d3.json("https://luyuliu.github.io/data/COVID19_dashboard/covid-19-world-iso3dissolved-centroids.geojson"),
            d3.json("https://luyuliu.github.io/data/COVID19_dashboard/all-cases-data-processed-all.json"),
            d3.json("https://luyuliu.github.io/data/COVID19_dashboard/ne_110m_admin0sov_joined.topo.json")
        ];

        Promise.all(promises).then(this.data_ready);
    }

    getColorx(val, bounds) {
        for (var i = 1; i < bounds.length; i++)
            if (val >= bounds[i])
                return this.colors[bounds.length - i - 1];
        return '#ffffff';
    }

    get_var_bounds(mapdata) {
        mapdata.sort(d3.ascending);
        var minx = mapdata[0];
        var maxx = mapdata.slice(-1)[0];
        if (minx < 1 && minx > 0) minx = 0;
        setup.worldMapInstance.bounds = [maxx, d3.quantile(mapdata, 0.67), d3.quantile(mapdata, 0.33), minx];
        
    }

    // functions for dragging
    dragstarted(e) {
        this.gpos0 = this.projection.invert(d3.mouse(e));
        this.o0 = this.projection.rotate();
    }

    dragged(e) {
        this.gpos1 = this.projection.invert(d3.mouse(e));
        this.o0 = this.projection.rotate();
        this.o1 = eulerAngles(this.gpos0, this.gpos1, this.o0);
        // o1[1] = -35;
        this.o1[2] = 0;
        this.projection.rotate(o1);
        this.worldmap_svg.selectAll("path").attr("d", this.path);
    }

    // functions for zooming
    zoomed() {
        this.projection.scale(d3.event.transform.translate(this.projection).k * this.globe_scale)
        this.worldmap_svg.selectAll("path").attr("d", this.path);
    }

    data_ready(alldata) { // TODO: LONG function!
        var self = setup.worldMapInstance;
        var world_centroids = alldata[0];
        var all_cases = alldata[1];
        var world0 = alldata[2];
    
        console.log(self.worldmap_svg)

        /////////////////////////////////////////////////////////////////////////////
        // World choropleth map
        /////////////////////////////////////////////////////////////////////////////
    
        var world_regions = topojson.feature(world0, world0.objects.countries);
    
        var all_mapping_vars = [];
        var current_mapping_var = "POP_SR";
        for (var i = 0; i < world_regions.features.length; i++) {
            var val = world_regions.features[i]["properties"][current_mapping_var];
            if (val != null)
                all_mapping_vars[i] = val;
        }
        self.get_var_bounds(all_mapping_vars);
        // console.log(setup.worldMapInstance.bounds)
    
        self.worldmap_svg.append("path")
            .datum({ type: "Sphere" })
            .attr("class", "ocean")
            .attr("d", self.path);

        console.log(self.worldmap_svg)
    
        self.worldmap_svg.append("path")
            .datum(self.graticule)
            .attr("class", "graticule")
            .attr("d", self.path);
    
        self.worldmap_svg.append("path")
            .datum(self.graticule.outline)
            .attr("class", "graticule")
            .attr("d", self.path);
    
        self.worldmap_svg.selectAll(".world")
            .data(world_regions.features)
            .enter()
            .append("path")
            .attr("class", "land")
            .attr("d", self.path)
            .style("fill", function (d, i) {
                // if (i==0) alert("world again");
                return self.getColorx(d["properties"][current_mapping_var], self.bounds);
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
                    .style("fill", self.getColorx(d["properties"][current_mapping_var], self.bounds));
            });;
    
        // alert(all_cases["Mainland China"]["confirmed"]);
    
    
        //////////////////////////////////////////////////////////////////////////
        // centroids
        /////////////////////////////////////////////////////////////////////////
        self.worldmap_svg.selectAll(".symbol")
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
            // .attr("d", self.path)
            .attr("d", self.path.pointRadius(function (d, i) {
                // if (i==0) alert("symbols again");
                if (d.properties) {
                    var name = d.properties.NAME;
                    if (all_cases[name]) {
                        // console.log(d, i, all_cases[name]);
                        console.log(self.radius(all_cases[name][self.cur_case].slice(-1)[0]))
                        return self.radius(all_cases[name][self.cur_case].slice(-1)[0]);
                    }
                }
                // console.log(self.radius(0))
                return self.radius(0);
    
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
                self.worldmap_svg.selectAll(".world_symbol").classed("highlight", false); // clear 
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
    
        var timelines_margin = { top: 50, right: 150, bottom: 50, left: 50 };
        var timelines_width = self.width; // should change
        var timelines_height = 100;
    
        var xScale = d3.scaleLinear()
            .domain([0, n - 1]) // input
            .range([0, timelines_width]); // output
    
        // TODO: get dates from file
        var start_date = "01-22-2020";
        var end_date = "04-12-2020";
    
        var n = all_cases["USA"][self.cur_case].length; // TODO: get n 
    
        var xScale = d3.scaleTime()
            .domain([self.case_date_parser(start_date), self.case_date_parser(end_date)])
            .range([0, timelines_width]); // output
    
        var toXScale = d3.scaleLinear()
            .domain([0, n - 1])
            .range([self.case_date_parser(start_date), self.case_date_parser(end_date)])
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
                    y: all_cases[d][self.cur_case][i]
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
    
        var timelines_svg = d3.select("#timelines").append("svg")
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
    
        var timelines_rect = timelines_svg.append("rect")
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
                self.worldmap_svg.selectAll(".world_symbol")
                    .attr("d", self.path.pointRadius(function (d, i) {
                        if (d.properties) {
                            _case = all_cases[d.properties.NAME];
                            if (_case) {
                                y = _case[cur_case][ind];
                                return self.radius(y);
                            }
                        }
                        return self.radius(0);
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
                self.worldmap_svg.selectAll(".world_symbol").classed("highlight", function (dd, i) {
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
    


}

