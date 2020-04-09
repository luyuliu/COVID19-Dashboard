class Setup {
    constructor() {

        this.squareWidth = 4;
        this.squareWidthNarrow = 4;
        this.squareHeight = 1;

        this.options = {
            verticalMargin: 10,
            handle: ".title-bar",
            cellHeight: window.innerWidth/3,
            disableResize: true
        };

        $('.grid-stack').gridstack(this.options);
        this.grid = $('.grid-stack').data('gridstack');

        this.settingGrid = { // card congifuration, should be updated dynamically
            'world_map': { x: 0, y: 0, width: this.squareWidth, height: this.squareHeight, id: "world_map" },
            'US_map': { x: 4, y: 0, width: this.squareWidth, height: this.squareHeight, id: "US_map" },
            'state_map': { x: 8, y: 0, width: this.squareWidth, height: this.squareHeight, id: "state_map" },

        };


        // ---------------- Setup functions ---------------- //
        // Initiate Grids
        this.initiateGrids();
    }

    initiateGrids() {
        var self = this;
        this.grid.removeAll();

        _.each(this.settingGrid, function (node) {
            this.grid.addWidget($('<div><div class="grid-stack-item-content" style="left:0px; right: 5px ;" id="' + node.id + '"></div></div>'), node.x, node.y, node.width, node.height);
            this.grid.movable('.grid-stack-item', false);
            self.createGrid(node);
            console.log("triggerd")
        }, this);
    }

    createGrid(node) {
        $("#" + node.id).append('<div class="title-bar" id="' + node.id + '-title">');
        $("#" + node.id + '-title').append('<span class="graph-title">' + node.id + '</span>');
    }



}


// ---------------- Setup ---------------- //

var setup = new Setup();