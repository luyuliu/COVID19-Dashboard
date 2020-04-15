// var margin = {top: 50, right: 50, bottom: 50, left: 50};
// var timelines_width = width; // same as worldmap
// var height = 200;
// timelines_svg = d3.select("#timelines").append("svg");
// 
// var xScale = d3.scaleLinear()
//     .domain([0, n-1]) // input
//     .range([0, width]); // output
// 
// var yScale = d3.scaleLinear()
//     .domain([0, 1]) // input 
//     .range([height, 0]); // output 
// 
// var line = d3.line()
//     .x(function(d, i) { return xScale(i); }) // set the x values for the line generator
//     .y(function(d) { return yScale(d.y); }) // set the y values for the line generator 
//     .curve(d3.curveMonotoneX) // apply smoothing to the line
// 
// var n = all_cases["USA"]["confirmed"].length;
// 
// alert(n);
// 
// // var line_data = d3.range
// 
// timelines_svgg = timelines_svg
//     .append("g")
//     // .attr("transform", "translate(" + tweets_margin.left + "," + tweets_margin.top + ")")
//     ;
