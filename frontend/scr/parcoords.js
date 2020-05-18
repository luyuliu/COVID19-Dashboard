// set the dimensions and margins of the graph
var parcoords_id = "#parcoords_plot-content";

is_pc_plot_on = true;

var se_var_friendly = {
    "TOT_POP": "Population",
    "TOT_HH": "Household",
    "PCT_CHLDN": "Children",
    "PCT_YOUTH": "Youth",
    "PCT_AD": "Adult",
    "PCT_SR": "Senior",
    "PCT_WHT": "White",
    "PCT_NWHT": "Non-white",
    "MED_HH_INC": "Income",
    "PCT_BLW_POV_RT": "Poverty",
    "PCT_AGRI": "Agriculture",
    "PCT_CONST": "Construction",
    "PCT_MFG": "Manufacturing",
    "PCT_WHLS_TRA": "Wholesale",
    "PCT_RET_TRA": "Retail",
    "PCT_TRANS": "Transportation",
    "PCT_INFO": "Information",
    "PCT_FIN": "Finance",
    "PCT_PRO": "Professional",
    "PCT_EDU": "Education",
    "PCT_REC": "Recreation",
    "PCT_OTHERS": "Other jobs",
    "PCT_PUB_ADMIN": "Public Admin",
    "CONFIRMED": "Confirmed",
    "DEATHS": "Deaths"
}

var parcoords_margin = {top: 40, right: 10, bottom: 50, left: 10},
    parcoords_width = $(parcoords_id).width() - parcoords_margin.left - parcoords_margin.right,
    parcoords_height = $(parcoords_id).height() - parcoords_margin.top - parcoords_margin.bottom;

var parcoords_svg = d3.select(parcoords_id)
    .append("svg")
    .attr("id", "parcoord_svg")
    .attr("width", parcoords_width + parcoords_margin.left + parcoords_margin.right)
    .attr("height", parcoords_height + parcoords_margin.top + parcoords_margin.bottom)
    .append("g")
    .attr("transform", "translate(" + parcoords_margin.left + "," + parcoords_margin.top + ")");

var pc_all_paths = null;
var pc_cur_state = "OH";
update_pc_plot_title("#pc-plot-title", pc_cur_state);

function handle_par_data(data) {

    dimensions = d3.keys(data[0]).filter(function(d) { return d != "countyFIPS" && d != "county" && d != "stateFIPS" && d != "state" && d != "county"})

    // use a linear scale. then store all in a y object
    var y = {}
    for (i in dimensions) {
        name = dimensions[i]
        y[name] = d3.scaleLinear()
            .domain( d3.extent(data, function(d) { return +d[name]; }) )
            .range([parcoords_height, 0])
    }

    // Build the X scale -> it find the best position for each Y axis
    x = d3.scalePoint()
        .range([0, parcoords_width])
        .padding(1)
        .domain(dimensions);

    // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
    function path(d) {
        return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
    }


    // set the scale for paths
// sort_var = dimensions[0];
// alert(y[sort_var]) ;
// d3.extent(data, function(d) { return +d[name]; })

    // Draw the lines
    pc_all_paths = parcoords_svg
        .selectAll("parcoords_paths")
        .data(data)
        .enter()
        .append("path")
        .attr("d",  path)
        .style("fill", "none")
        // .style("stroke", "#69b3a2")
        .style("stroke", function(d, i) {
            if (d.state == pc_cur_state) {
                d3.select(this).raise();
                return "#ff3a3a";
            }
            return "grey"
        })
        .style("opacity", 0.5)
        .on("mouseover", function(d) {
            update_pc_plot_title("#pc-plot-title", d.county + ", " + d.state);
            // d3.select(this).style("stroke", "yellow");
        })
        .on("mouseout", function(d) {
            update_pc_plot_title("#pc-plot-title", pc_cur_state);
        //     c = "grey"
        //     if (d.state == pc_cur_state) c = "#ff3a3a";
        //     d3.select(this).style("stroke", c);
        })

    // Draw the axis:
    parcoords_svg.selectAll("myAxis")
        // For each dimension of the dataset I add a 'g' element:
        .data(dimensions).enter()
        .append("g")
        // I translate this element to its right position on the x axis
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        // And I build the axis with the call function
        .each(function(d) { 
            d3.select(this)
                .call(d3.axisLeft()
                    .ticks(2, "s")
                    .scale(y[d])); 
            })
        // Add axis title
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", function(d, i) {
            if (i%2) return -15;
            return -5;
        })
        .text(function(d) { return se_var_friendly[d]; })
        .style("fill", "lightgrey")

}


function highlight_paths(state) {
	pc_cur_state = state;
    update_pc_plot_title("#pc-plot-title", pc_cur_state);

    pc_all_paths
    	.transition()
    	.duration(200)
    	.each(function(d) {
                this_dot = d3.select(this);
                if (d.state == curr_state) {
                    this_dot.style("opacity", 0.8).style("stroke", "#ff3a3a").attr("r", 2).raise(); 
                }
                else {
                    this_dot.style("opacity", 0.5).style("stroke", "grey").attr("r", 2);
                }
        })
}
