var maptype = 'geojson';


var US_map_width = $('#US_map-content').width() - 10;
var US_map_height = US_map_width;

var US_map_margin = {top: 10, right: 10, bottom: 20, left: 10};

var US_projection = d3.geoAlbersUsa()
    .scale(US_map_width*4/3)
    .translate([US_map_width / 2, US_map_height / 2]);


var US_path = d3.geoPath()
    .projection(US_projection);


var svg = d3.select("#US_map-content").append("svg")
    .attr("width", US_map_width + US_map_margin.left + US_map_margin.right)
    .attr("height", US_map_height + US_map_margin.top + US_map_margin.bottom)
    .append("g")
    .attr("transform", "translate(" + US_map_margin.left + "," + US_map_margin.top + ")");



var US_promises = [
    d3.json("https://luyuliu.github.io/data/COVID19_dashboard/us.geojson")
];

Promise.all(US_promises).then(ready);

function ready(all_data) {
    var us_geojson = all_data[0]

    // GEOJSON  
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
            .on("mouseover", function(d, i) {
                d3.select(this).interrupt();
                d3.select(this)
                    // .transition(t)
                    .style("fill", "#efef65");
            })
            .on("mouseout", function(d, i) {
                d3.select(this).interrupt();
                d3.select(this)
                // .transition(t)
                .style("fill", "white");
            });;
    
        // the three commented lines below are a longer version of the line above
        /*
         .attr("d", function(d) {
          return path(d);
         })
        */
        // .classed('make-it-red', function(d) {
        //   if (d.properties.name === "Mississippi" || d.properties.name === "Oregon") {
        //     return true;
        //   }
        //   else {
        //     return false;
        //   }
        // })


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


}