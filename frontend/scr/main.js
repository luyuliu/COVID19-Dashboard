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

var default_case_name = "confirmed";

var is_scatter_plot_on = false;

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

// update the labels on the plot 
function update_info_labels(labs, place, datev, datei, casename, val) {
    labs[0].text(`${case_date_format_MD(datev)}: ${place}`); //  - Day ${datei}
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


// ---------------- Setup ---------------- //

var start_date = null;
var end_date = null;
var cur_date_world = null;
var cur_date_us = null;
var cur_date_state = null;
var sync_time_lines = true;
var fips_to_name = null;
var us_abbr_inv = null;
var total_days = null;
var state_start_date = null;
var state_end_date = null;

var case_date_parser = d3.timeParse("%m-%d-%Y");
var case_date_parser_inv = d3.timeFormat("%m-%d-%Y");
var case_date_format = d3.timeFormat("%m/%d");
var case_date_format_MD = d3.timeFormat("%B %d");
var case_date_format_full = d3.timeFormat("%B %d, %Y");

var world_centroids = null;
var all_cases = null;;
var world0 = null;;

var US_geojson = null;
var us_centroids = null;
var US_all_cases = null;
var us_abbr_inv = null;

var all_promises = [
    d3.json("data/all-cases-data-dates.json"),

    d3.json("data/covid-19-world-iso3dissolved-centroids.geojson"),
    d3.json("data/all-cases-data-processed.json"),
    d3.json("data/ne_110m_admin0sov_joined.topo.json"),

    d3.json("data/us-states-attributes.geojson"),
    d3.json("data/covid-19-us-centroids.geojson"),
    d3.json("data/all-cases-data-processed-states.json"),
    d3.json("data/state_abbr_inv.json"),

    // d3.json("data/state-counties/" + state_geojson_fname),
    // d3.json("data/state-counties/" + state_centroids_fname),
    // d3.json("data/all-cases-data-processed-counties.json")
];

Promise.all(all_promises).then(all_ready);

function all_ready(all_data) {

    dates_data = all_data[0];

    start_date = dates_data['first'];
    end_date = dates_data['last'];
    cur_date_world = case_date_parser(end_date);
    cur_date_us = case_date_parser(end_date);
    cur_date_state = case_date_parser(end_date);
    state_start_date = start_date;
    state_end_date = end_date;
    total_days = d3.timeDay.count(case_date_parser(start_date), case_date_parser(end_date));

    world_centroids = all_data[1];
    all_cases = all_data[2];
    world0 = all_data[3];

    US_geojson = all_data[4];
    us_centroids = all_data[5];
    US_all_cases = all_data[6];
    us_abbr_inv = all_data[7];

    // state stuff will be loaded by calling init_state(0)

    world_ready();
    us_ready();

    init_state(0);
}
