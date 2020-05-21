//*********************add these lines to index.html *************************/
//<link href="./css/introjs.min.css" rel="stylesheet">
//<script src="./js/intro.min.js"></script>
//<script src="./scr/tutorial.js"></script>
//************************************************************************** */

$("#tutorial-click").click(the_tutorial);
$("#tutorial-click2").click(function(d) {
    d3.select("#about").style("display", "none")
    the_tutorial();
});

function the_tutorial () { //id of tutorial button
    var intro = introJs();
    intro.setOptions({
        steps: [
            {
                element: '#mynav',
                intro: 'Thank you for using the <span class="tutorial-highlight">COVID-19 Dashboard</span>. We use Ohio as the default state, but you can directly show any state by typing something like the following in the URL bar of your browser:<br/><br/>https://gis.osu.edu/COVID19-Dashboard/<b>?state=NY</b></span><br/>.',
                position: 'bottom'
            },
            {
                element: '#world_map', 
                intro: 'This map shows the cases of the world regions. You can drag to <span class="tutorial-highlight">rotate</span> and scroll the mouse wheel to <span class="tutorial-highlight">zoom</span> this map. Clicking on a circle will <span class="tutorial-highlight">lock</span> the region. Click again to unlock it. The base map shows the social-economic data that is explained at underneath the map.',
                position: 'bottom'
            },
            {
                element: '#world-theme-select',
                intro: 'Click here to choose to show cases for confirmed , deaths, or recovered as circles on the map. (Note recovered data is only available for the world map.)',
                position: 'bottom'

            },
            {
                element: '#world-choropleth-select',
                intro: 'Click here to select the variables to show on the base map.',
                position: 'bottom'
            },
            {
                element: '#world_plot', 
                intro: 'This plot shows the cases for world regions through dates. You can <span class="tutorial-highlight">hover</span> the mouse over the lines to highlight the corresponding region in the above map. <span class="tutorial-highlight">Clicking</span> on the line will <span class="tutorial-highlight">lock</span> the region so that the numbers will be fixed to this region. Click the line again to <span class="tutorial-highlight">unlock</span>. Move the mouse left and right will also dynamically change the size of the circles in the map to show the trend.',
                position: 'bottom'
            },
            {
                element: '#US_map', 
                intro: 'This map shows the cases in the United States at the state level. Similar to the world map, where the states can be <span class="tutorial-highlight">locked</span> or <span class="tutorial-highlight">unlocked</span> by clicking upon. The <span class="tutorial-highlight">two dropdown lists</span> can be used to change the cases and social-economic variables. We currently do not have data for the recovered cases.',
                position: 'bottom'
            },
            {
                element: '#US_plot', 
                intro: 'This plot shows the cases for the states through time. The lines can also be <span class="tutorial-highlight">locked</span> or <span class="tutorial-highlight">unlocked</span> by clicking upon.',
                position: 'bottom'
            },
            {
                element: '#state_map', 
                intro: 'This map shows the cases of the counties in a state. Each county can be <span class="tutorial-highlight">locked</span> or <span class="tutorial-highlight">unlocked</span> by clicking upon. The <span class="tutorial-highlight">three dropdown lists</span> (from top to bottom) can be used to change the state, cases, or social-economic variables',
                position: 'bottom'
            },
            {
                element: '#select-state',
                intro: 'Click here to switch states.',
                position: 'bottom'
            },
            {
                element: '#state_plot', 
                intro: 'This plot shows the cases for the counties through time. The lines can also be <span class="tutorial-highlight">locked</span> or <span class="tutorial-highlight">unlocked</span> by clicking upon.',
                position: 'bottom'
            },

            {
                element: '#parcoords_plot', 
                intro: 'This parallel coordinates plot contains more than 3000 lines. Click on <span class="tutorial-highlight">[&#9740; Unlinked]</span> to turn on the dynamic link to with the U.S. map and plot. Click on <span class="tutorial-highlight">title</span> of a coordinate to sort the lines using the values in that coordinate. <b>Note:</b> turning on the link may slow down the performance. You can turn it off by clicking it again.',
                position: 'bottom'
            },
            {
                element: '#scatter_plot', 
                intro: 'This scatter plot contains more than 3000 dots. Click on <span class="tutorial-highlight">[&#9740; Unlinked]</span> to turn on the dynamic link with the U.S. map and plot. <b>Note:</b> turning on the link may slow down the performance. You can turn it off by clicking it again.',
                position: 'bottom'
            },
            {
                element: '#case_ind',
                intro: 'Click here to choose different case data to be the Y axis of the scatter plot.',
                position: 'bottom'
            },
            {
                element: '#se_ind',
                intro: 'Click here to choose different social-economic variables to be the X axis of the scatter plot.',
                position: 'top'
            }

        ]
    });

    intro.start();

}
