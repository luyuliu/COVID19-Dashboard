var scatter_plot_grid_container_id = "#scatter_plot-grid-container";
var scatter_plot_id = "#scatter_plot-content";
var scatter_plot_affiliation_id = "#scatter_plot-affiliation";


var margin = { top: 10, right: 10, bottom: 20, left: 50 };
var width = $(scatter_plot_grid_container_id).width() - margin.left - margin.right;
var height = $(scatter_plot_grid_container_id).height() - margin.top - margin.bottom -30;

var color = d3.scaleOrdinal(d3.schemeCategory10);

var curr_state = "OH";

// add the graph canvas to the body of the webpage
var sp_svg = d3.select(scatter_plot_id).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


var se_ind_list = [["pct_chldn", "Children (Aged 0 - 14) (%)"], ["pct_youth", "Youth (Aged 15 - 24) (%)"],
				["pct_ad", "Adults (Aged 25 - 64) (%)"], ["pct_sr", "Seniors (Aged above 64) (%)"],
				["pct_wht", "White Population (%)"], ["pct_nwht", "Non-White Population (%)"],
				["med_hh_inc", "Median Household Income (U.S. Dollar)"], ["pct_blw_pov_rt", "Population Below Poverty Line (%)"]];

var se_ind_dropdown = d3.select(scatter_plot_affiliation_id)
    .insert("select", "svg")
    .attr("id", "se_ind")
    .attr("class", "select-css")
    .on("change", updateGraph);

se_ind_dropdown.selectAll("option")
	.data(se_ind_list)
    .enter().append("option")
    .attr("value", (d) => d[0])
    .text((d) => d[1]);

var se_ind = document.querySelector('#se_ind').value;

// load data
d3.json("data/us-counties-attributes.json").then(function(data_ind) { 
	d3.json("data/all-cases-data-processed-counties.json").then(function(data_cases) { 
    	data = convert_county_data(data_ind, data_cases);
    	drawGraph(se_ind, data);
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
	var x_value = function(d) {
	    if (se_ind == 'pct_chldn'){
	        return d.PCT_CHLDN;
	    } else if (se_ind == 'pct_youth'){
	        return d.PCT_YOUTH;
	    } else if (se_ind == 'pct_ad'){
	        return d.PCT_AD;
	    } else if (se_ind == 'pct_sr'){
	        return d.PCT_SR;
	    } else if (se_ind == 'pct_wht'){
	        return d.PCT_WHT;
	    } else if (se_ind == 'pct_nwht'){
	        return d.PCT_NWHT;
	    } else if (se_ind == 'med_hh_inc'){
	        return d.MED_HH_INC;
	    } else if (se_ind == 'pct_blw_pov_rt'){
	        return d.PCT_BLW_POV_RT;
	    }
	};

	var x_text = function(d) {
	    if (se_ind == 'pct_chldn'){
	        return 'Children (Aged 0 - 14) (%)';
	    } else if (se_ind == 'pct_youth'){
	        return 'Youth (Aged 15 - 24) (%)';
	    } else if (se_ind == 'pct_ad'){
	        return 'Adults (Aged 25 - 64) (%)';
	    } else if (se_ind == 'pct_sr'){
	        return 'Seniors (Aged above 64) (%)';
	    } else if (se_ind == 'pct_wht'){
	        return 'White Population (%)';
	    } else if (se_ind == 'pct_nwht'){
	        return 'Non-white Population (%)';
	    } else if (se_ind == 'med_hh_inc'){
	        return 'Median Household Income ($)';
	    } else if (se_ind == 'pct_blw_pov_rt'){
	        return 'Population Below Poverty Line (%)';
	    }
	};

	var x = d3.scaleLinear().range([0, width]),
	    xMap = function(d) { return x(x_value(d));},
	    xAxis = d3.axisBottom(x);


	// set up y
	var y_value = function(d) {return d.CONFIRMED;};

	var y_text = function(d) {return 'Confirmed cases';};

	var y = d3.scaleLinear().range([height, 0]),
	    yMap = function(d) { return y(y_value(d));},
	    yAxis = d3.axisLeft(y);;

	data.forEach(function(d) {
	    if (se_ind == 'pct_chldn'){
	        d.PCT_CHLDN = +d.PCT_CHLDN;
	    } else if (se_ind == 'pct_youth'){
	        d.PCT_YOUTH = +d.PCT_YOUTH;
	    } else if (se_ind == 'pct_ad'){
	        d.PCT_AD = +d.PCT_AD;
	    } else if (se_ind == 'pct_sr'){
	        d.PCT_SR = +d.PCT_SR;
	    } else if (se_ind == 'pct_wht'){
	        d.PCT_WHT = +d.PCT_WHT;
	    } else if (se_ind == 'pct_nwht'){
	        d.PCT_NWHT = +d.PCT_NWHT;
	    } else if (se_ind == 'med_hh_inc'){
	        d.MED_HH_INC = +d.MED_HH_INC;
	    } else if (se_ind == 'pct_blw_pov_rt'){
	        d.PCT_BLW_POV_RT = +d.PCT_BLW_POV_RT;
	    }
	    
	    d.CONFIRMED = +d.CONFIRMED;
    });

	// set axis domains
	x.domain([d3.min(data, x_value) - 1, d3.max(data, x_value) + 1]);

	var y_array = data.map(y_value);
	y_array.sort(d3.ascending);
	var q1 = d3.quantile(y_array, 0.25),
	    q3 = d3.quantile(y_array, 0.75),
	    iqr = q3 - q1,
	    maxValue = q3 + iqr * 8;
	y.domain([d3.min(data, y_value) - 1, maxValue - 1]);

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
	// 	.style("text-anchor", "end")
	// 	.text(x_text);

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
	console.log(curr_state);
	sp_svg.selectAll(".dot")
	  .data(data)
	  .enter().append("circle")
	  .attr("class", function (d) { return "dot " + d.state} )
	  .attr("cx", xMap)
	  .attr("cy", yMap)
	  .attr("r", function(d) { 
          if (d.state == curr_state) {
              return 3;
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
	                  return "red";
	              } else {
	                  return "lightgrey";}
	               });


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

    d3.select("svg").selectAll(".dot")
    	.transition()
    	.duration(200)
    	.attr("r", 2)
    	.style("opacity", 0.5)
    	.style("fill", "lightgrey")
    
    d3.select("svg").selectAll("." + curr_state)
    	.transition()
    	.duration(200)
    	.attr("r", 3)
    	.style("opacity", 1)
    	.style("fill", "red")
}

function updateGraph() {
	//d3.select("#graph-div").selectAll("svg").remove();
	se_ind = document.querySelector('#se_ind').value;
	
	drawGraph(se_ind, data);
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
        	
        	item['countyFIPS'] = key,
        	item['CONFIRMED'] = obj2['confirmed'][obj2['confirmed'].length - 1],
            item['DEATHS'] = obj2['deaths'][obj2['deaths'].length - 1];
            
            item['state'] = null,
        	item['stateFIPS'] = null,
    		item['PCT_CHLDN'] = null,
	        item['PCT_YOUTH'] = null, 
	        item['PCT_AD'] = null, 
	        item['PCT_SR'] = null,
	        item['PCT_WHT'] = null,
	        item['PCT_NWHT'] = null,
	        item['MED_HH_INC'] = null,
	        item['PCT_BLW_POV_RT'] = null;
	        
	        t = 0;
            keys3 = Object.keys(ses);
	        keys3.forEach(function(key) {
	        	obj3 = ses[key];
	        	
		        if (key == item['countyFIPS']) {
		        	t = 1;
		        	item['state'] = obj3['state'],
			        item['stateFIPS'] = obj3['stateFIPS'],
			        item['PCT_CHLDN'] = obj3['PCT_CHLDN'],
			        item['PCT_YOUTH'] = obj3['PCT_YOUTH'], 
			        item['PCT_AD'] = obj3['PCT_AD'], 
			        item['PCT_SR'] = obj3['PCT_SR'],
			        item['PCT_WHT'] = obj3['PCT_WHT'],
			        item['PCT_NWHT'] = obj3['PCT_NWHT'],
			        item['MED_HH_INC'] = obj3['MED_HH_INC'],
					item['PCT_BLW_POV_RT'] = obj3['PCT_BLW_POV_RT']; }
	        });
	        if (t == 1){
	        	data.push(item);
	        }
        });
	});
    return data;
}
