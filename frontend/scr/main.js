class Setup {
    constructor() {

        this.squareWidth = 4;
        this.squareWidthNarrow = 4;
        this.squareHeight = 1;

        this.options = {
            verticalMargin: 10,
            handle: ".title-bar",
            cellHeight: window.innerWidth / 3,
            disableResize: true
        };

        $('.grid-stack').gridstack(this.options);
        this.grid = $('.grid-stack').data('gridstack');

        this.settingGrid = { // card congifuration, should be updated dynamically
            'world_map': { x: 0, y: 0, width: this.squareWidth, height: this.squareHeight, id: "world_map" },
            'US_map': { x: 4, y: 0, width: this.squareWidth, height: this.squareHeight, id: "US_map" },
            'state_map': { x: 8, y: 0, width: this.squareWidth, height: this.squareHeight, id: "state_map" },

        };

        this.defaultStateID = "OH"


        // ---------------- Setup functions ---------------- //
        // Initiate Grids
        this.initiateGrids();
        this.initiateStateMap();
        this.initiateUSMap();
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
        $("#" + node.id).append('<div class="grid-content" id="' + node.id + '-content">');
    }

    initiateStateMap() {
        var featureURL = "https://luyuliu.github.io/CURIO-Map/data/morpcCensus.json"
        // var featureURL = "https://luyuliu.github.io/Drag-Map/data/states/jsoncounties-"+this.defaultStateID+".min.js"
        var self = this;
        $.get(featureURL, function (mapData) {

            self.stateMap = L.map("state_map-content", {
                maxZoom: 19,
                minZoom: 0,
                zoomControl: false,
                attributionControl: false,
                scrollWheelZoom: true
            });
            self.stateMap.setView([39.95, -83.02], 8);
            new L.Control.Zoom({ position: 'topleft' }).addTo(self.stateMap);
            self.stateMapBaseLayer = L.esri.basemapLayer("DarkGray");
            self.stateMapBaseLayer.addTo(self.stateMap);


            console.log(featureURL)
            self.stateLayer = L.geoJson(null, {
                style: function (feature) {
                    console.log(feature)
                    var edgeColor = "#bdbdbd";
                    var fillColor = "#FFFFFF";
                    return {
                        color: edgeColor,
                        fillColor: fillColor,
                        opacity: 1,
                        opacity: 0.5,
                        weight: 0.5
                    }
                }
            });
            self.stateMap.addLayer(self.stateLayer);
            console.log(mapData)
            self.stateLayer.addData(mapData)
        })

    }

    initiateUSMap() {
        this.USMap = L.map("US_map-content", {
            maxZoom: 19,
            minZoom: 0,
            zoomControl: false,
            attributionControl: false,
            scrollWheelZoom: true
        });
        this.USMap.setView([39.95, -83.02], 4);
        new L.Control.Zoom({ position: 'topleft' }).addTo(this.USMap);
        this.USMapBaseLayer = L.esri.basemapLayer("DarkGray");
        this.USMapBaseLayer.addTo(this.USMap);
        var self = this;
        var USLayer = L.geoJson(null, {
            style: function (feature) {
                var edgeColor = "#bdbdbd";
                var fillColor = "#FFFFFF";
                return {
                    color: edgeColor,
                    fillColor: fillColor,
                    opacity: 1,
                    opacity: 0.5,
                    weight: 0.5
                }
            },
            onEachFeature: function (feature, layer) {
                layer.on({
                    click: function (e) {
                        self.stateMap.removeLayer(self.stateLayer);
                        self.stateLayer = L.geoJson(null, {
                            style: function (feature) {
                                console.log(feature)
                                var edgeColor = "#bdbdbd";
                                var fillColor = "#FFFFFF";
                                return {
                                    color: edgeColor,
                                    fillColor: fillColor,
                                    opacity: 1,
                                    opacity: 0.5,
                                    weight: 0.5
                                }
                            }
                        });
                        self.stateMap.addLayer(self.stateLayer);
                        var featureURL = "https://luyuliu.github.io/Drag-Map/data/states/jsoncounties-" + this.defaultStateID + ".min.js";
                        var featureURL = "https://luyuliu.github.io/data/morpc/DelawareFranklin.json"
                        console.log(featureURL)
                        $.get(featureURL, function (mapData) {
                            console.log(mapData)
                            self.stateLayer.addData(mapData)
                        })
                    }
                })
            }
        });
        this.USMap.addLayer(USLayer);

        var featureURL = "https://luyuliu.github.io/COVID19-Dashboard/data/us-states.geojson"
        $.get(featureURL, function (mapData) {
            USLayer.addData(mapData)
        })
    }
}

// ---------------- Setup ---------------- //

var setup = new Setup();