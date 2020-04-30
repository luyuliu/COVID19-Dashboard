import csv, os, json
from datetime import date, timedelta
from operator import add
import urllib.request

first_date = date(2020, 1, 22)

data_source = 'https://usafactsstatic.blob.core.windows.net/public/2020/coronavirus-timeline/allData.json'
url = urllib.request.urlopen(data_source)
data = json.loads(url.read().decode())
num_days = len(data[-1]['confirmed'])
print('Length of array/number of days:', num_days)

# assume all lists in each key has the same length of number of days

# get each state's and county's data
all_cases_states = {}
all_cases_counties = {}
for item in data:
    state = item['stateAbbr']
    # states
    if not state in all_cases_states:
        all_cases_states[state] = {
            'confirmed': [0] * num_days,
            'deaths': [0] * num_days,
            'recovered': [0] * num_days
        }
    all_cases_states[state]['confirmed'] = list(map(add, all_cases_states[state]['confirmed'], item['confirmed']))
    all_cases_states[state]['deaths'] = list(map(add, all_cases_states[state]['deaths'], item['deaths']))
    if not state in all_cases_counties:
        all_cases_counties[state] = {}
    countyFIPS = item['countyFIPS']
    if not countyFIPS in all_cases_counties[state]:
            all_cases_counties[state][countyFIPS] = {
                'confirmed': [0] * num_days,
                'deaths': [0] * num_days,
                'recovered': [0] * num_days
            }
    all_cases_counties[state][countyFIPS]['confirmed'] = list(map(add, all_cases_counties[state][countyFIPS]['confirmed'], item['confirmed']))
    all_cases_counties[state][countyFIPS]['deaths'] = list(map(add, all_cases_counties[state][countyFIPS]['deaths'], item['deaths']))

# save files: raw data, states, counties
fname = 'raw-covid-19-data-us-counties-usafacts.json'
f = open(fname, 'w+')
json.dump(data, f)
f.close()

fname_states = 'all-cases-data-processed-states.json'
f = open(fname_states, 'w+')
json.dump(all_cases_states, f)
f.close() 

fname_counties = 'all-cases-data-processed-counties.json'
f = open(fname_counties, 'w+')
json.dump(all_cases_counties, f)
f.close() 

print('Done! Three files created:\n\t', fname, '\n\t', fname_states, '\n\t', fname_counties)
