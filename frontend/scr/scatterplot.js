var scatter_plot_grid_container_id = "#scatter_plot-grid-container";
var scatter_plot_id = "#scatter_plot-content";
var scatter_plot_affiliation_id = "#scatter_plot-affiliation";

is_scatter_plot_on = true;

var margin = { top: 10, right: 10, bottom: 50, left: 50 };
var width = $(scatter_plot_grid_container_id).width() - margin.left - margin.right;
var height = $(scatter_plot_grid_container_id).height() - margin.top - margin.bottom - 30;

var color = d3.scaleOrdinal(d3.schemeCategory10);

var sp_dots = null;

var curr_state = "OH";
update_scatter_plot_title("#scatter-plot-title", curr_state);

var se_ind_list = [
    ["TOT_POP", "Total Population"],
    ["TOT_HH", "Total Household"],
    ["PCT_CHLDN", "Children (%)"],
    ["PCT_YOUTH", "Youth (%)"],
    ["PCT_AD", "Adult (%)"],
    ["PCT_SR", "Senior (%)"],
    ["PCT_WHT", "White (%)"],
    ["PCT_NWHT", "Non-white (%)"],
    ["MED_HH_INC", "Median Household Income ($)"],
    ["PCT_BLW_POV_RT", "Poverty Rate"],
    ["PCT_AGRI", "Job in Agriculture (%)"],
    ["PCT_CONST", "Job in Construction (%)"],
    ["PCT_MFG", "Job in Manufacturing (%)"],
    ["PCT_WHLS_TRA", "Job in Wholesale (%)"],
    ["PCT_RET_TRA", "Job in Retail (%)"],
    ["PCT_TRANS", "Job in Transportation (%)"],
    ["PCT_INFO", "Job in Information (%)"],
    ["PCT_FIN", "Job in Finance (%)"],
    ["PCT_PRO", "Job in Professional (%)"],
    ["PCT_EDU", "Job in Education (%)"],
    ["PCT_REC", "Job in Recreation (%)"],
    ["PCT_OTHERS", "Job in Others (%)"],
    ["PCT_PUB_ADMIN", "Job in Public Administration (%)"]];

var se_ind_dropdown = d3.select(scatter_plot_id)
    .insert("select", "svg")
    .attr("id", "se_ind")
    .attr("class", "select-css")
    .style("top", height + margin.top + 45)
    .style("position", "absolute")
    .on("change", updateGraph);

se_ind_dropdown.selectAll("option")
	.data(se_ind_list)
    .enter().append("option")
    .attr("value", function (d) { return d[0]; })
    .text(function (d) { return d[1]; })
    .property("selected", function (d) {
        if (d[0] == "MED_HH_INC") {
            return true;
        }
        else {
            return false;
        }
    })
;

se_ind = document.querySelector("#se_ind").value;
var se_ind = "PCT_PUB_ADMIN";
var data_se_cases;

// add the graph canvas to the body of the webpage
// var sp_svg = d3.select(scatter_plot_id).append("svg")
//     .attr("width", width + margin.left + margin.right)
//     .attr("height", height)
//     .append("g")
//     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
// 
// load data
d3.csv("data/us-counties-attributes.csv").then(function(data_ind) { 
	d3.json("data/all-cases-data-processed-counties.json").then(function(data_cases) { 
    	data_se_cases = convert_county_data(data_ind, data_cases);
    	drawGraph(se_ind, data_se_cases);
        handle_par_data(data_se_cases)
	});
});


function drawGraph(se_ind, data) {		
	d3.select(scatter_plot_id).selectAll("svg").remove();

	// add the graph canvas to the body of the webpage
	var sp_svg = d3.select(scatter_plot_id).append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	    .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
	// set up x
	var x_value = function(d) { return d[se_ind]; };

	var x = d3.scaleLinear().range([0, width]),
	    xMap = function(d) { return x(x_value(d));},
	    xAxis = d3.axisBottom(x).ticks(4, "s");


	// set up y
	var y_value = function(d) {return d.CONFIRMED;};

	var y_text = function(d) {return "Confirmed cases (per 1,000)";};

	var y = d3.scaleLinear().range([height, 0]),
	    yMap = function(d) { return y(y_value(d));},
	    yAxis = d3.axisLeft(y).ticks(4, "s");

	data.forEach(function(d) { 
		d[se_ind] = +d[se_ind];
	    d["CONFIRMED"] = +d["CONFIRMED"];
    });

	// set axis domains
	x.domain([d3.min(data, x_value) - 1, d3.max(data, x_value) + 1]);

	var y_array = data.map(y_value);
	y_array.sort(d3.ascending);
	var q1 = d3.quantile(y_array,.10),
	    q3 = d3.quantile(y_array, .99),
	    iqr = q3 - q1,
	    maxValue = q3,// + iqr * 8;
        minValue = d3.min(data, y_value)
        // maxValue = d3.max(y_array);
	y.domain([minValue, maxValue]);

	// x-axis
	sp_svg.append("g")
		.attr("class", "x axis")
		.call(xAxis)
		.attr("transform", "translate(0," + height + ")")
	// sp_svg.append("text")
	// 	.attr("transform", "translate(0," + height + ")")
	// 	.attr("class", "label")
	// 	.attr("x", width)
	// 	.attr("y", margin.top)
	// 	.style("text-anchor", "end");

	// y-axis
	sp_svg.append("g")
		.attr("class", "y axis")
		.call(yAxis)
	sp_svg.append("text")
		.attr("class", "text-label")
		.attr("transform", "rotate(-90)")
		.attr("x", -height/2)
		.attr("y", -margin.left + 15)
		.style("text-anchor", "middle")
		.text(y_text)

	// draw dots
	// console.log(curr_state);
	sp_dots = sp_svg.selectAll(".dot")
	  .data(data)
	  .enter().append("circle")
	  .attr("class", function (d) { return "dot " + d.state} )
	  .attr("cx", xMap)
	  .attr("cy", yMap)
	  .attr("r", function(d) { 
          if (d.state == curr_state) {
              return 2;
          } else {
              return 2;}
           })
	  .style("opacity", function(d) { 
	              if (d.state == curr_state) {
	                  return 1.0;
	              } else {
	                  return 0.5;}
	               })
	  .style("fill", function(d) { 
	              if (d.state == curr_state) {
                      d3.select(this).raise();
	                  return "red";
	              } else {
	                  return "lightgrey";}
	               })
        .style("stroke-width", 0);


	// draw legend
	var legend = sp_svg.selectAll(".legend")
	  .data(color.domain())
	  .enter().append("g")
	  .attr("class", "legend")
	  .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

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
	  .text(function(d) { return d; });
}

function highlightDots(state) {
	curr_state = state;
    update_scatter_plot_title("#scatter-plot-title", curr_state);
    
    sp_dots
    	.transition()
    	.duration(200)
    	.each(function(d) {
                this_dot = d3.select(this);
                if (d.state == curr_state) {
                    this_dot.style("opacity", 0.8).style("fill", "red").attr("r", 2).raise(); 
                }
                else {
                    this_dot.style("opacity", 0.5).style("fill", "lightgrey").attr("r", 2);
                }
        })
}

function updateGraph() {
	//d3.select("#graph-div").selectAll("svg").remove();
	se_ind = document.querySelector("#se_ind").value;

	drawGraph(se_ind, data_se_cases);
}


// Link county-level datasets
function convert_county_data(ses, cases) {
    var data = [],
    	keys1 = Object.keys(cases);
    
    keys1.forEach(function(key) {
        var obj1 = cases[key],
        	keys2 = Object.keys(obj1);
        
        keys2.forEach(function(key) {
        	var item = {},
        	obj2 = obj1[key];
        	
        	item["countyFIPS"] = key,
        	item["CONFIRMED"] = obj2["confirmed"][obj2["confirmed"].length - 1],
            item["DEATHS"] = obj2["deaths"][obj2["deaths"].length - 1];
            
            item["state"] = null,
        	item["stateFIPS"] = null,
			item["TOT_POP"] = null,
			item["TOT_HH"] = null,
    		item["PCT_CHLDN"] = null,
	        item["PCT_YOUTH"] = null, 
	        item["PCT_AD"] = null, 
	        item["PCT_SR"] = null,
	        item["PCT_WHT"] = null,
	        item["PCT_NWHT"] = null,
	        item["MED_HH_INC"] = null,
	        item["PCT_BLW_POV_RT"] = null,
			item["PCT_AGRI"] = null,
			item["PCT_CONST"] = null,
			item["PCT_CONST"] = null,
			item["PCT_MFG"] = null,
			item["PCT_WHLS_TRA"] = null,
			item["PCT_RET_TRA"] = null,
			item["PCT_TRANS"] = null,
			item["PCT_INFO"] = null,
			item["PCT_FIN"] = null,
			item["PCT_PRO"] = null,
			item["PCT_EDU"] = null,
			item["PCT_PRO"] = null,
			item["PCT_REC"] = null,
			item["PCT_OTHERS"] = null,
			item["PCT_PUB_ADMIN"] = null;
	        
	        t = 0;
	        ses.forEach(function(obj3) {	        	
		        if (obj3["countyFIPS"] == item["countyFIPS"]) {
		        	t = 1;
		        	item["state"] = obj3["state"],
		        	item["stateFIPS"] = obj3["stateFIPS"],
		        	item["TOT_POP"] = parseFloat(obj3["TOT_POP"]),
			        item["TOT_HH"] = parseFloat(obj3["TOT_POP"]),
			        item["PCT_CHLDN"] = parseFloat(obj3["PCT_CHLDN"]),
			        item["PCT_YOUTH"] = parseFloat(obj3["PCT_YOUTH"]),
			        item["PCT_AD"] = parseFloat(obj3["PCT_AD"]),
			        item["PCT_SR"] = parseFloat(obj3["PCT_SR"]),
			        item["PCT_WHT"] = parseFloat(obj3["PCT_WHT"]),
			        item["PCT_NWHT"] = parseFloat(obj3["PCT_NWHT"]),
			        item["MED_HH_INC"] = parseFloat(obj3["MED_HH_INC"]),
					item["PCT_BLW_POV_RT"] = parseFloat(obj3["PCT_BLW_POV_RT"]),
					item["PCT_AGRI"] = parseFloat(obj3["PCT_AGRI"]),
					item["PCT_CONST"] = parseFloat(obj3["PCT_CONST"]),
					item["PCT_CONST"] = parseFloat(obj3["PCT_CONST"]),
					item["PCT_MFG"] = parseFloat(obj3["PCT_MFG"]),
					item["PCT_WHLS_TRA"] = parseFloat(obj3["PCT_WHLS_TRA"]),
					item["PCT_RET_TRA"] = parseFloat(obj3["PCT_RET_TRA"]),
					item["PCT_TRANS"] = parseFloat(obj3["PCT_TRANS"]),
					item["PCT_INFO"] = parseFloat(obj3["PCT_INFO"]),
					item["PCT_FIN"] = parseFloat(obj3["PCT_FIN"]),
					item["PCT_PRO"] = parseFloat(obj3["PCT_PRO"]),
					item["PCT_EDU"] = parseFloat(obj3["PCT_EDU"]),
					item["PCT_PRO"] = parseFloat(obj3["PCT_PRO"]),
					item["PCT_REC"] = parseFloat(obj3["PCT_REC"]),
					item["PCT_OTHERS"] = parseFloat(obj3["PCT_OTHERS"]),
					item["PCT_PUB_ADMIN"] = parseFloat(obj3["PCT_PUB_ADMIN"]),
					
                    item["CONFIRMED"] = 1000 * item["CONFIRMED"] / obj3["TOT_POP"];
                }
	        });
	        if (t == 1){
	        	data.push(item);
	        }
        });
	});
    return data;
}
