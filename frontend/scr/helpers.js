// friendly names to display type of cases
var case_names = {
    "confirmed": "Confirmed",
    "deaths": "Deaths",
    "recovered": "Recovered"
}

var circle_symbol_fills = {
    "confirmed": "#de2d26",
    "deaths": "#1e1e1e",
    "recovered": "#30a326"
}

// structures used in the title of PC and SP
var link_status = {
    0: {"text": "[&#9740; Unlinked]", "class": "text-button-down"},  // &#9740; &#9783; &#9867;
    1: {"text": "[&#9741; Linked]", "class": "text-button"}          // &#9741; &#9776; &#9866;
}

var title_text = {
    "par_coords_btn": "Parallel coordinates",
    "scatter_plot_btn": "Scatter plot"
}

function link_clicked(x) {
    id = x.id;
    if (id == "par_coords_btn") {
        link_pc_paths = !link_pc_paths;
        pc_title_str = `<span id="par_coords_btn" class="${link_status[+link_pc_paths].class}" onclick="link_clicked(this)">${link_status[+link_pc_paths].text}</span> ${title_text[id]}`;
        update_plot_title("#pc-plot-title", pc_title_str, pc_cur_state);
        update_paths();
    }
    else if (id == "scatter_plot_btn") {
        link_sp_dots = !link_sp_dots;
        sp_title_str = `<span id="scatter_plot_btn" class="${link_status[+link_sp_dots].class}" onclick="link_clicked(this)">${link_status[+link_sp_dots].text}</span> Scatter plot`; 
        update_plot_title("#scatter-plot-title", sp_title_str, sp_curr_state);
        update_dots();
    }
}


function get_var_bounds(mapdata) {
    mapdata.sort(d3.ascending);
    minx = +mapdata[0];
    maxx = +d3.max(mapdata);
    if (minx < 1 && minx > 0) minx = 0;
    // return [maxx, d3.quantile(mapdata, 0.67), d3.quantile(mapdata, 0.33), minx];

    return [d3.quantile(mapdata, 0.33), d3.quantile(mapdata, 0.67), maxx];
    // console.log(bounds)
}

function getColorx(val, bounds) {
    for (i = 1; i < bounds.length; i++)
        if (val >= bounds[i])
            return colors[bounds.length - i - 1];
    return '#ffffff';
}

// date the info on the title bar
function update_title_info(the_id, the_date, casenum1, casenum10, casenum2, casenum20, casenum3, casenum30) {
    var title_info = `${case_date_format_full(the_date)} <br/>
        <span style="color: ${circle_symbol_fills["confirmed"]}">${d3.format(",")(casenum1)}</span> confirmed (+${d3.format(",")(casenum1 - casenum10)})<br/>
        <span style="color: ${circle_symbol_fills["deaths"]}">${d3.format(",")(casenum2)}</span> deaths (+${d3.format(",")(casenum2 - casenum20)})`
    if (casenum3 != null)
        title_info += `<br/><span style="color: ${circle_symbol_fills["recovered"]}">${d3.format(",")(casenum3)}</span> recovered (+${d3.format(",")(casenum3 - casenum30)})`
    d3.selectAll(the_id).html(title_info)
}

function update_plot_title(the_id, heading1, heading2) {
    d3.selectAll(the_id).html(`${heading1}: ${heading2}`);
}


// function update_scatter_plot_title(the_id, newtitle) {
//     d3.selectAll(the_id).html(`Scatter plot: ${newtitle}`);
// }
// function update_pc_plot_title(the_id, newtitle) {
//     d3.selectAll(the_id).html(`Parallel coordinates: ${newtitle}`);
// }

// update the labels on the plot 
function update_info_labels(labs, place, datev, datei, casename, val, locked=null) {
    if (locked)
        labs[0].attr("class", "hover-text highlight")
    else 
        labs[0].attr("class", "hover-text grey")
    labs[0].text(`${case_date_format_MD(datev)}: ${place}`);
    labs[1].text(`${case_names[casename]}: ${d3.format(",")(val)}`).style("fill", function (e) {
        return circle_symbol_fills[casename];
    });
}

// update the symbols on the map
function hover_line_symbol(target_svg, obj_id, the_path, the_key, the_data, ind, xpos, hover_line_id, radius_func, casename) {
    target_svg.selectAll(obj_id)
        .attr("d", the_path.pointRadius(function (d) {
            if (d.properties) {
                if (the_data[d.properties[the_key]]) {
                    y = the_data[d.properties[the_key]][casename][ind];
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


function make_legend_svg(container_id, w, h, the_id) {
    var the_svg = d3.select(container_id)
        .append("svg")
        .attr("width", w)
        .attr("height", h)
    the_svg.append("g")
        .attr("id", the_id)
        .attr("transform", "translate(25, 5)") // a gap between legend and dropdown
        .attr("class", "legend")

    return the_svg;
}

// make or update legend
function make_legend(the_ele, the_id, color_scheme, width, orientation) {
    var a_legend = d3.legendColor().ascending(false)
        .labelFormat(d3.format(",.1f"))
        .labels(function ({ i, genLength, generatedLabels, labelDelimiter }) {
            if (i === 0) {
                const values = generatedLabels[i].split(` ${labelDelimiter} `)
                return `< ${values[1]}`
            } else if (i === genLength - 1) {
                const values = generatedLabels[i].split(` ${labelDelimiter} `)
                return `≥ ${values[0]}`
            }
            else {
                const values = generatedLabels[i].split(` ${labelDelimiter} `)
                return `${values[0]} - ${values[1]}`
            }
            return generatedLabels[i]
        })
        // .useClass(true)
        .scale(color_scheme)
        .shapeWidth(width / 3.5)
        .shapePadding(-2)
        .shapeHeight(10)
        .orient("horizontal");

    the_ele.select(the_id)
        .call(a_legend);

    return a_legend;
}
