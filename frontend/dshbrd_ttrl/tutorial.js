//*********************add these lines to index.html *************************/
//<link href="./css/introjs.min.css" rel="stylesheet">
//<script src="./js/intro.min.js"></script>
//<script src="./scr/tutorial.js"></script>
//************************************************************************** */

$("#aaaaa").click(function () {//id of tutorial button
    console.log("tttt")
var intro = introJs();
intro.setOptions({
    steps: [
        {
            element: '#mynav', //id of the item you want to zoom in
            intro: 'The title and navigation bar. Click on the "Hamburg" button to pull down the menu.',
            position: 'bottom'
        },
        {
            element: '#world_map', //id of the item you want to zoom in
            intro: 'This map shows the cases of the world regions. You can <b>rotate</b> and <b>zoom</b> this map. Click on the dropdown box that initially listed as "Confirmed" to choose to show the confirmed cases, deaths, and recovered. Clicking on a circle will <b>lock</b> the region. Click again to unlock it. The base map shows some social-economic information about the regions and you can click on the dropdown list underneath the map to choose different variables to show.',
            position: 'bottom'
        },
        {
            element: '#world_plot', //id of the item you want to zoom in
            intro: 'This plot shows the cases for world regions through time. You can <b>hover</b> the mouse over the lines to highlight the corresponding region in the above map. <b>Clicking</b> on the curve will lock the region so that the numbers of this region will always show. Click again to unlock. Move the mouse left and right will also dynamically change the size of the circles in the map to show the trend.',
            position: 'bottom'
        },
        {
            element: '#US_map', //id of the item you want to zoom in
            intro: 'This map shows the cases in the United States at the state level. Click on the dropdown box that initially listed as "Confirmed" to choose to show the confirmed cases and deaths. Clicking on a circle will <b>lock</b> the region. Click again to unlock it. We currently do not have data for the recovered cases. The base map can be used to show different social-economic information and you can click on the dropdown list underneath the map to choose different variables to show.',
            position: 'bottom'
        },
        {
            element: '#US_plot', //id of the item you want to zoom in
            intro: 'This plot shows the cases for the states through time. When hovering the mouse over the lines, the corresponding region will be highlighted in the above map. <b>Clicking</b> on the curve will lock the region so that the numbers of this region will always show. Click again to unlock. Move the mouse left and right will also dynamically change the size of the circles in the map to show the trend.',
            position: 'bottom'
        },
        {
            element: '#state_map', //id of the item you want to zoom in
            intro: 'This map shows the cases of the counties in a state. You can click on the dropdown box at the top to choose different states. You can also change the data to show cases of either confirmed or deaths. Clicking on a circle will <b>lock</b> the region. Click again to unlock it. We currently do not have data for the recovered cases. The base map can be used to show different social-economic information and you can click on the dropdown list underneath the map to choose different variables to show.',
            position: 'bottom'
        },

        {
            element: '#state_plot', //id of the item you want to zoom in
            intro: 'This plot shows the cases for the counties through time. When hovering the mouse over the lines, the corresponding region will be highlighted in the above map. <b>Clicking</b> on the curve will lock the region so that the numbers of this region will always show. Click again to unlock. Move the mouse left and right will also dynamically change the size of the circles in the map to show the trend.',
            position: 'bottom'
        },

        {
            element: '#parcoords_plot', //id of the item you want to zoom in
            intro: 'This is a parallel coordinates plot. It contains more than 3000 lines. Due to the computational intensity, by default the dynamic linkages between the lines and the U.S. map and U.S. case plot is turned off. Click on [&#9740; Unlinked] to turn it on. <b>Caution:</b> turning on the link will significantly slow down the performance. You can turn it off by clicking it again.',
            position: 'bottom'
        },
        {
            element: '#scatter_plot', //id of the item you want to zoom in
            intro: 'This is a scatter plot that contains more than 3000 dots. Due to the computational intensity, by default the dynamic linkages between the dots and the U.S. map and U.S. case plot is turned off. Click on [&#9740; Unlinked] to turn it on. <b>Caution:</b> turning on the link will significantly slow down the performance. You can turn it off by clicking it again.',
            position: 'bottom'
        }

    ]
});

intro.start();

})
