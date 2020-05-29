// ---------------- data loading etc. ---------------- //

var all_promises = [
    d3.json("data/all-cases-data-dates.json"),

    d3.json("data/covid-19-world-iso3dissolved-centroids.geojson"),
    d3.json("data/all-cases-data-processed.json"),
    d3.json("data/ne_110m_admin0sov_joined.topo.json"),

    d3.json("data/us-states-attributes.geojson"),
    d3.json("data/covid-19-us-centroids.geojson"),
    d3.json("data/all-cases-data-processed-states.json"),
    d3.json("data/state_abbr_inv.json"),

    d3.json("data/state-counties/" + state_geojson_fname),
    d3.json("data/state-counties/" + state_centroids_fname),
    d3.json("data/all-cases-data-processed-counties.json"),
    d3.csv("data/us-counties-attributes.csv")
];


Promise.all(all_promises).then(all_ready);

function all_ready(all_data) {

    dates_data = all_data[0];

    start_date = dates_data['first'];
    end_date = dates_data['last'];
    cur_date_world = case_date_parser(end_date);
    cur_date_us = case_date_parser(end_date);
    cur_date_state = case_date_parser(end_date);
    state_start_date = start_date;
    state_end_date = end_date;
    total_days = d3.timeDay.count(case_date_parser(start_date), case_date_parser(end_date));

    world_centroids = all_data[1];
    all_cases = all_data[2];
    world0 = all_data[3];

    US_geojson = all_data[4];
    us_centroids = all_data[5];
    US_all_cases = all_data[6];
    us_abbr_inv = all_data[7];

    state_geojson = all_data[8]
    state_centroids = all_data[9];
    state_all_cases = all_data[10][the_state];


    // state stuff will be loaded by calling init_state(0)

    world_ready();
    us_ready();

    init_state(0);
    state_ready();

    data_se_cases = convert_county_data(all_data[11], all_data[10]);
    drawGraph(se_ind, case_ind, data_se_cases);
    handle_par_data(data_se_cases)

    // d3.csv("data/us-counties-attributes.csv").then(function(data_ind) { 
    //     d3.json("data/all-cases-data-processed-counties.json").then(function(data_cases) { 
    //         data_se_cases = convert_county_data(data_ind, data_cases);
    //         drawGraph(se_ind, case_ind, data_se_cases);
    //         handle_par_data(data_se_cases)
    //     });
    // });
    
    
}
