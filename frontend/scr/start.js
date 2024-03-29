class Setup {
    constructor() {

        this.squareWidth = 4;
        this.squareWidthNarrow = 4;
        this.squareHeight = 1;
        var baseCellHeight = window.innerWidth / 3;
        if (window.innerWidth < 700){
            baseCellHeight = window.innerWidth;
        }


        this.options = {
            verticalMargin: 10,
            handle: ".title-bar",
            cellHeight: baseCellHeight / 4,
            disableResize: true
        };

        // $('.grid-stack').gridstack(this.options);
        this.grid = GridStack.init(this.options)

        this.settingGrid = { // when in one column, this is the reversed order
            'parcoords':    {x: 0, y: 4, width: this.squareWidth*2, height: this.squareHeight*3, 
                id: "parcoords_plot", title: '<div id="pc-plot-title">Parallel coordinates</div>', type: "plot"},
            'scatter_plot': { x: 8, y: 4, width: this.squareWidth, height: this.squareHeight*3, 
                id: "scatter_plot", title: '<div id="scatter-plot-title">Scatter plot</div>', type: "plot" },
            'state_plot':   { x: 8, y: 0, width: this.squareWidth, height: this.squareHeight*3, 
                id: "state_plot", title: '<div id="state-plot-title">State cases by county</div>', type: "plot" },
            'state_map':    { x: 8, y: 0, width: this.squareWidth, height: this.squareHeight*4, 
                id: "state_map", title: '<select id="select-state"></select><div id="state-info"></div>', type: "map" },
            'US_plot':      { x: 4, y: 0, width: this.squareWidth, height: this.squareHeight*3, 
                id: "US_plot", title: "U.S. cases by state", type: "plot" },
            'US_map':       { x: 4, y: 0, width: this.squareWidth, height: this.squareHeight*4, 
                id: "US_map", title: '<div id="us-info">United States</div>', type: "map" },
            'world_plot':   { x: 0, y: 0, width: this.squareWidth, height: this.squareHeight*3, 
                id: "world_plot", title: "World cases by region", type: "plot" },
            'world_map':    { x: 0, y: 0, width: this.squareWidth, height: this.squareHeight*4, 
                id: "world_map", title: '<div id="world-info">World</div>', type: "map"}
        };

        // ---------------- Setup functions ---------------- //
        // Initiate Grids
        this.initiateGrids();
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
}


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

var is_scatter_plot_on = false;
var is_pc_plot_on = false;
var link_pc_paths = false;
var link_sp_dots = false;

var default_case_name = "confirmed";

var the_state = null;
var url_str = window.location.search;
var url_len = url_str.length;

var search_keys = ['?state=', '?STATE=', '?State=']
// check if the last of url is like this: ?state=OH
// this is to make sure it is a search using ?state=, instead of just using the last two chars
// the get the last two chars
// the last two chars can be any chars, state-map.js will set default to OH 
if (search_keys.includes(url_str.substring(url_len-10, url_len-2))) { 
    the_state = url_str.substring(url_len-2)
}

new Setup();
