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
            'world_map':    { x: 0, y: 0, width: this.squareWidth, height: this.squareHeight*4, id: "world_map", title: '<div id="world-info">World</div>', type: "map"},
            'US_map':       { x: 4, y: 0, width: this.squareWidth, height: this.squareHeight*4, id: "US_map", title: '<div id="us-info">United States</div>', type: "map" },
            'state_map':    { x: 8, y: 0, width: this.squareWidth, height: this.squareHeight*4, id: "state_map", title: '<select id="select-state"></select><div id="state-info"></div>', type: "map" },
        };

        // this.defaultStateID = "OH";
        // this.USMapData = null;
        // this.worldCaseData = null;
        // 
        // this.worldTop5List = [];
        // this.USTop5List = ["New York"];
        // this.stateTop5List = [];
        // 

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
}

new Setup();
