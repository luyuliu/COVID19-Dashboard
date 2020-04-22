// set up layout
var margin = { top: 20, right: 20, bottom: 30, left: 60 },
    width = 720 - margin.left - margin.right,
    height = 375 - margin.top - margin.bottom;


// set up x
var se_ind = $("#se_ind").val();

var x_value = function (d) {
    if (se_ind == 'pct_chldn') {
        return d.PCT_CHLDN;
    } else if (se_ind == 'pct_youth') {
        return d.PCT_YOUTH;
    } else if (se_ind == 'pct_ad') {
        return d.PCT_AD;
    } else if (se_ind == 'pct_sr') {
        return d.PCT_SR;
    } else if (se_ind == 'pct_wht') {
        return d.PCT_WHT;
    } else if (se_ind == 'pct_nwht') {
        return d.PCT_NWHT;
    } else if (se_ind == 'med_hh_inc') {
        return d.MED_HH_INC;
    } else if (se_ind == 'pct_blw_pov_rt') {
        return d.PCT_BLW_POV_RT;
    }
};

var x_text = function (d) {
    if (se_ind == 'pct_chldn') {
        return 'Percentage of Children (Aged 0 - 14) (%)';
    } else if (se_ind == 'pct_youth') {
        return 'Percentage of Youth (Aged 15 - 24) (%)';
    } else if (se_ind == 'pct_ad') {
        return 'Percentage of Adults (Aged 25 - 64) (%)';
    } else if (se_ind == 'pct_sr') {
        return 'Percentage of Seniors (Aged above 64) (%)';
    } else if (se_ind == 'pct_wht') {
        return 'Percentage of White Population (%)';
    } else if (se_ind == 'pct_nwht') {
        return 'Percentage of Non-white Population (%)';
    } else if (se_ind == 'med_hh_inc') {
        return 'Median Household Income ($$)';
    } else if (se_ind == 'pct_blw_pov_rt') {
        return 'Percentage of Population Below Poverty Line (%)';
    }
};

var x = d3.scaleLinear().range([0, width]),
    xMap = function (d) { return x(x_value(d)); },
    xAxis = d3.axisBottom();


// set up y
var cases_ind = $("#cases_ind").val();

var y_value = function (d) {
    if (cases_ind == 'confirmed') {
        return d.CONFIRMED;
    } else if (cases_ind == 'deaths') {
        return d.DEATHS;
    }
};

var y_text = function (d) {
    if (cases_ind == 'confirmed') {
        return 'Total Confirmed (person)';
    } else if (cases_ind == 'deaths') {
        return 'Total Deaths (person)';
    }
};

var y = d3.scaleLinear().range([height, 0]),
    yMap = function (d) { return y(y_value(d)); },
    yAxis = d3.axisLeft();


color = d3.scaleOrdinal(d3.schemeCategory10);

// add the graph canvas to the body of the webpage
var svg = d3.select("#scatter_plot").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// load data
var data = convert_county_data($county_ind, $county_cases);
console.log(data[0]);

data.forEach(function (d) {
    if (se_ind == 'pct_chldn') {
        d.PCT_CHLDN = +d.PCT_CHLDN;
    } else if (se_ind == 'pct_youth') {
        d.PCT_YOUTH = +d.PCT_YOUTH;
    } else if (se_ind == 'pct_ad') {
        d.PCT_AD = +d.PCT_AD;
    } else if (se_ind == 'pct_sr') {
        d.PCT_SR = +d.PCT_SR;
    } else if (se_ind == 'pct_wht') {
        d.PCT_WHT = +d.PCT_WHT;
    } else if (se_ind == 'pct_nwht') {
        d.PCT_NWHT = +d.PCT_NWHT;
    } else if (se_ind == 'med_hh_inc') {
        d.MED_HH_INC = +d.MED_HH_INC;
    } else if (se_ind == 'pct_blw_pov_rt') {
        d.PCT_BLW_POV_RT = +d.PCT_BLW_POV_RT;
    }

    if (cases_ind == 'confirmed') {
        d.CONFIRMED = +d.CONFIRMED;
    } else if (cases_ind == 'deaths') {
        d.DEATHS = +d.DEATHS;
    }
});


// set axis domains
x.domain([d3.min(data, x_value) - 1, d3.max(data, x_value) + 1]);

var y_array = data.map(y_value);
y_array.sort(d3.ascending);
var q1 = d3.quantile(y_array, 0.25),
    q3 = d3.quantile(y_array, 0.75),
    iqr = q3 - q1,
    maxValue = q3 + iqr * 8;
console.log(maxValue);
y.domain([d3.min(data, y_value) - 1, maxValue - 1]);


// x-axis
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .append("text")
    .attr("class", "label")
    .attr("x", width)
    .attr("y", -6)
    .style("text-anchor", "end")
    .text(x_text);


// y-axis
svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("class", "label")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text(y_text)


// draw dots
svg.selectAll(".dot")
    .data(data)
    .enter().append("circle")
    .attr("class", function (d) { return "dot " + d.stateFIPS })
    .attr("r", 2)
    .attr("cx", xMap)
    .attr("cy", yMap)
    .style("opacity", function (d) {
        if (d.stateFIPS == $stateFIPS) {
            return 1.0;
        } else {
            return 0.5;
        }
    })
    .style("fill", function (d) {
        if (d.stateFIPS == $stateFIPS) {
            return "red";
        } else {
            return "lightgrey";
        }
    });


// draw legend
var legend = svg.selectAll(".legend")
    .data(color.domain())
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });


// draw legend colored rectangle
legend.append("rect")
    .attr("x", width - 18)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", color);


// draw legend text
legend.append("text")
    .attr("x", width - 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .text(function (d) { return d; });


// Link county-level datasets
function convert_county_data(ses, cases) {
    var data = [],
        keys = Object.keys(ses);

    keys.forEach(function (key) {
        var item = {},
            obj = ses[key];

        item['countyFIPS'] = obj['countyFIPS'],
            item['county'] = obj['county'],
            item['stateFIPS'] = obj['stateFIPS'],
            item['PCT_CHLDN'] = obj['PCT_CHLDN'],
            item['PCT_YOUTH'] = obj['PCT_YOUTH'],
            item['PCT_AD'] = obj['PCT_AD'],
            item['PCT_SR'] = obj['PCT_SR']
        item['PCT_WHT'] = obj['PCT_WHT'];
        item['PCT_NWHT'] = obj['PCT_NWHT'];
        item['MED_HH_INC'] = obj['MED_HH_INC'];
        item['PCT_BLW_POV_RT'] = obj['PCT_BLW_POV_RT'];

        item['CONFIRMED'] = null,
            item['DEATHS'] = null,
            keys_2 = Object.keys(cases);
        keys_2.forEach(function (key) {
            var item_2 = {},
                obj_2 = cases[key];

            if (obj_2['countyFIPS'] == item['countyFIPS']) {
                item['CONFIRMED'] = obj_2['confirmed'][obj_2['confirmed'].length - 1],
                    item['DEATHS'] = obj_2['deaths'][obj_2['deaths'].length - 1];
            }
        });
        data.push(item);
    });
    return data;
}