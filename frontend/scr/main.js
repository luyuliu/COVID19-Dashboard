// friendly names to display type of cases
var case_names = {
    "confirmed": "Confirmed",
    "deaths": "Death",
    "recovered": "Recovered"
}

class Setup {
    constructor() {

        this.squareWidth = 4;
        this.squareWidthNarrow = 4;
        this.squareHeight = 1;

        this.options = {
            verticalMargin: 10,
            handle: ".title-bar",
            cellHeight: window.innerWidth / 3 / 4,
            disableResize: true
        };

        // $('.grid-stack').gridstack(this.options);
        this.grid = GridStack.init(this.options)

        this.settingGrid = { // card congifuration, should be updated dynamically
            'scatter_plot': { x: 0, y: 0, width: this.squareWidth, height: this.squareHeight*3, id: "scatter_plot", title: "Scatter plot", type: "plot" },
            'world_plot':   { x: 0, y: 0, width: this.squareWidth, height: this.squareHeight*3, id: "world_plot", title: "World cases", type: "plot" },
            'US_plot':      { x: 4, y: 0, width: this.squareWidth, height: this.squareHeight*3, id: "US_plot", title: "US cases", type: "plot" },
            'state_plot':   { x: 8, y: 0, width: this.squareWidth, height: this.squareHeight*3, id: "state_plot", title: "State cases", type: "plot" },
            'world_map':    { x: 0, y: 0, width: this.squareWidth, height: this.squareHeight*4, id: "world_map", title: '<div id="world-info">World</div>', type: "map" },
            'US_map':       { x: 4, y: 0, width: this.squareWidth, height: this.squareHeight*4, id: "US_map", title: '<div id="us-info">United States</div>', type: "map" },
            'state_map':    { x: 8, y: 0, width: this.squareWidth, height: this.squareHeight*4, id: "state_map", title: '<select id="select-state"></select><div id="state-info"></div>', type: "map" },
        };

        this.defaultStateID = "OH";
        this.USMapData = null;
        this.worldCaseData = null;

        this.worldTop5List = [];
        this.USTop5List = ["New York"];
        this.stateTop5List = [];


        // ---------------- Setup functions ---------------- //
        // Initiate Grids
        this.initiateGrids();
        // this.initiateStateMap();
        // this.initiateUSMap();
        // this.initiateUSTimeSeries();

        // this.worldMapInstance = new WorldMapUI();
        // this.worldMapInstance.initiateWorldMap();
    }

    initiateGrids() {
        var self = this;
        this.grid.removeAll();
        
        for (var key in this.settingGrid){
            var node = this.settingGrid[key];
            this.grid.addWidget($('<div><div class="grid-stack-item-content" style="left:0px; right: 5px ;" id="' + node.id + '"></div></div>'), node.x, node.y, node.width, node.height);
            this.grid.movable('.grid-stack-item', false);
            self.createGrid(node);
            // console.log("triggerd")
        }
    }

    createGrid(node) {
        $("#" + node.id).append('<div class="title-bar" id="' + node.id + '-title">');
        $("#" + node.id + '-title').append('<span class="graph-title">' + node.title + '</span>');
        $("#" + node.id).append('<div class="grid-container" id="' + node.id + '-grid-container">');
        $("#" + node.id + '-grid-container').append('<div class="'+ node.type +'-content" id="' + node.id + '-content">');

        // affiliation 
        $("#" + node.id + '-grid-container').append('<div class="' + node.type + '-affiliation-content" id="' + node.id + '-affiliation">');
        $("#" + node.id + '-affiliation').append('<div class="' + node.type + '-legend-content" id="' + node.id + '-legend">');
    }

    // initiateStateMap() {
    //     var featureURL = "https://luyuliu.github.io/CURIO-Map/data/morpcCensus.json"
    //     // var featureURL = "https://luyuliu.github.io/Drag-Map/data/states/jsoncounties-"+this.defaultStateID+".min.js"
    //     var self = this;
    //     $.get(featureURL, function (mapData) {

    //         self.stateMap = L.map("state_map-content", {
    //             maxZoom: 19,
    //             minZoom: 0,
    //             zoomControl: false,
    //             attributionControl: false,
    //             scrollWheelZoom: true
    //         });
    //         self.stateMap.setView([39.95, -83.02], 8);
    //         new L.Control.Zoom({ position: 'topleft' }).addTo(self.stateMap);
    //         self.stateMapBaseLayer = L.esri.basemapLayer("DarkGray");
    //         self.stateMapBaseLayer.addTo(self.stateMap);


    //         // console.log(featureURL)
    //         self.stateLayer = L.geoJson(null, {
    //             style: function (feature) {
    //                 var edgeColor = "#bdbdbd";
    //                 var fillColor = "#FFFFFF";
    //                 return {
    //                     color: edgeColor,
    //                     fillColor: fillColor,
    //                     opacity: 1,
    //                     opacity: 0.5,
    //                     weight: 0.5
    //                 }
    //             }
    //         });
    //         self.stateMap.addLayer(self.stateLayer);
    //         // console.log(mapData)
    //         self.stateLayer.addData(mapData)
    //     })

    // }

//     initiateUSMap() {
//         this.USMap = L.map("US_map-content", {
//             maxZoom: 19,
//             minZoom: 0,
//             zoomControl: false,
//             attributionControl: false,
//             scrollWheelZoom: true
//         });
//         this.USMap.setView([39.95, -83.02], 4);
//         new L.Control.Zoom({ position: 'topleft' }).addTo(this.USMap);
//         this.USMapBaseLayer = L.esri.basemapLayer("DarkGray");
//         this.USMapBaseLayer.addTo(this.USMap);
//         var self = this;
//         var USLayer = L.geoJson(null, {
//             style: function (feature) {
//                 var edgeColor = "#bdbdbd";
//                 var fillColor = "#FFFFFF";
//                 return {
//                     color: edgeColor,
//                     fillColor: fillColor,
//                     opacity: 1,
//                     opacity: 0.5,
//                     weight: 0.5
//                 }
//             },
//             onEachFeature: function (feature, layer) {
//                 layer.on({
//                     click: function (e) {
//                         self.stateMap.removeLayer(self.stateLayer);
//                         self.stateLayer = L.geoJson(null, {
//                             style: function (feature) {
//                                 // console.log(feature)
//                                 var edgeColor = "#bdbdbd";
//                                 var fillColor = "#FFFFFF";
//                                 return {
//                                     color: edgeColor,
//                                     fillColor: fillColor,
//                                     opacity: 1,
//                                     opacity: 0.5,
//                                     weight: 0.5
//                                 }
//                             }
//                         });
//                         self.stateMap.addLayer(self.stateLayer);
//                         var featureURL = "https://luyuliu.github.io/Drag-Map/data/states/jsoncounties-" + this.defaultStateID + ".min.js";
//                         var featureURL = "https://luyuliu.github.io/data/morpc/DelawareFranklin.json"
//                         // console.log(featureURL)
//                         $.get(featureURL, function (mapData) {
//                             self.stateLayer.addData(mapData)
//                         })
//                     }
//                 })
//             }
//         });
//         this.USMap.addLayer(USLayer);

//         var featureURL = "https://luyuliu.github.io/COVID19-Dashboard/data/us-states.geojson"
//         $.get(featureURL, function (mapData) {
//             self.USMapData = mapData;
//             USLayer.addData(mapData);
//         })
//     }

    // initiateUSTimeSeries() {
    //     var self = this;
    //     // var url = 'http://127.0.0.1:21232/corona_cases_state_level?where={"Region":"USA"}'
    //     var url = 'http://127.0.0.1:21232/corona_cases_state_level?sort=[("Date", 1)]'
    //     $.get(url, function (data) {
    //         var data = data._items;
    //         // console.log(data);
    //         var today = new Date();
    //         var dd = String(today.getDate()).padStart(2, '0');
    //         var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    //         var yyyy = today.getFullYear();
    //         today = mm + '-' + dd + '-' + yyyy;
            
    //         self.worldCaseData = {};

    //         for (var i = 0; i < data.length; i++){
    //             var item = data[i];
    //             var name = item.name;
    //             var region = item.Region;
    //             if (self.worldCaseData[name] == null){
    //                 self.worldCaseData[name] = {};
    //                 self.worldCaseData[name]['start_date'] = item["Date"]
    //                 self.worldCaseData[name]["confirmed"] = [item["confirmed"]]
    //                 self.worldCaseData[name]["death"] = [item["death"]]
    //                 self.worldCaseData[name]["recovered"] = [item["recovered"]]
    //                 self.worldCaseData[name]['Region'] = item["Region"]
    //                 self.worldCaseData[name]['start_date'] = item["Date"]
    //             } 
    //             else{
    //                 self.worldCaseData[name]["confirmed"].push(item["confirmed"])
    //                 self.worldCaseData[name]["death"].push(item["death"])
    //                 self.worldCaseData[name]["recovered"].push(item["recovered"])
    //             }

    //         }


    //     })
    // }
}

function get_var_bounds(mapdata) {
    mapdata.sort(d3.ascending) ;
    minx = +mapdata[0];
    maxx = +d3.max(mapdata);
    if (minx<1 && minx>0) minx = 0;
    // return [maxx, d3.quantile(mapdata, 0.67), d3.quantile(mapdata, 0.33), minx];
    
    return [d3.quantile(mapdata, 0.33), d3.quantile(mapdata, 0.67), maxx];
    // console.log(bounds)
}

function getColorx(val, bounds) {
    for (i=1; i<bounds.length; i++)
	if (val >= bounds[i])
	    return colors[bounds.length-i-1];
    return '#ffffff';
}

// date the info on the title bar
function update_title_info(the_id, the_date, casenum1, casenum10, casenum2, casenum20, casenum3, casenum30) {
    var title_info = `${case_date_format_full(the_date)} <br/>
        <span style="color: red">${d3.format(",")(casenum1)}</span> confirmed (+${d3.format(",")(casenum1-casenum10)})<br/>
        ${d3.format(",")(casenum2)} deaths (+${d3.format(",")(casenum2-casenum20)})`
    if (casenum3 != null) 
        title_info += `<br/>${d3.format(",")(casenum3)} recovered (+${d3.format(",")(casenum3-casenum30)})`
    d3.selectAll(the_id).html(title_info)
}

// update the labels on the plot 
function update_info_labels(labs, place, datev, datei, casename, val) {
    labs[0].text(`${place} ${case_date_format_MD(datev)} (Day ${datei})`);
    labs[1].text(`${case_names[casename]}: ${d3.format(",")(val)}`);
}

function make_legend_svg(container_id, w, h, the_id) {
    var the_svg = d3.select(container_id)
        .append("svg")
        .attr("width", w)
        .attr("height", h)
    the_svg.append("g")
        .attr("id", the_id)
        .attr("transform", "translate(25, 5)")
        .attr("class", "legend")
        
    return the_svg;
}

// make or update legend
function make_legend(the_ele, the_id, color_scheme, width, orientation) {
    var a_legend = d3.legendColor().ascending(false)
        .labelFormat(d3.format(",.1f"))
        .labels(function({i, genLength, generatedLabels, labelDelimiter}) {
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

d3.json("data/all-cases-data-dates.json").then(function(data) {
    start_date = data['first'];
    end_date = data['last'];
    cur_date_world = case_date_parser(end_date);
    cur_date_us = case_date_parser(end_date);
    cur_date_state = case_date_parser(end_date);
    state_start_date = start_date;
    state_end_date = end_date;
    total_days = d3.timeDay.count(case_date_parser(start_date), case_date_parser(end_date)); 
});

new Setup();
