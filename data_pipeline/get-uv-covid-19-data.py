import csv, json
from datetime import date, datetime, timedelta
import urllib.request
import codecs
from os.path import isfile

source_template = "https://nssac.bii.virginia.edu/covid-19/dashboard/data/nssac-ncov-sd-{}.csv"
start_date = date(2020, 1,22)
end_date = date.today()
all_dates = [start_date + timedelta(days=i) for i in range((end_date-start_date).days)]

fname = 'raw-covid-19-data-world-regions-uv.csv'
csvout = open(fname, 'w', newline='', encoding='utf-8')
writer = csv.writer(csvout, delimiter=',')

for a_date in all_dates:
    a_date_string = a_date.strftime('%m-%d-%Y')
    data_source = source_template.format(a_date_string)

    responses = urllib.request.urlopen(data_source)
    text = codecs.iterdecode(responses, 'utf-8')
    csv_reader = csv.reader(text, delimiter=',')

    header = next(csv_reader)
    header.append('Date')

    if a_date == start_date:
        writer.writerow(header)
    for row in csv_reader:
        row.append(a_date_string)
        writer.writerow(row)

csvout.close()


## clean up date and create a json for each region
regions = []
all_objs = []

with open(fname, encoding="utf-8-sig") as csvfile:
    reader = csv.DictReader(csvfile)
    for obj in reader:
        all_objs.append(obj)
        region = obj['Region']
        if not region in regions:
            regions.append(region)

#
# The code will look for the following geojson file to get the common regions
# so that all the regions in the output will have coordinates.
# If the geojson is not present, it will use all the regions from the raw data.
# In this case, there may be regions that do not have coordinates to map.
#
fname2 = 'covid-19-world-iso3dissolved-centroids.geojson'
if isfile(fname2):
    print('Use common regions with centroids')
    centroids = json.load(open(fname2))
    centroids_names = [f['properties']['NAME'] for f in centroids['features']]
    centroids_names.sort()
    common_regions = [r for r in regions if r in centroids_names]
    not_in_centroids = [r for r in regions if not r in centroids_names]
    print('These regions are not in centroids data:', not_in_centroids)
else:
    print('Use all regions in raw data')
    common_regions = regions

print('Number of regions:', len(common_regions))

all_dates = []
for row in all_objs:
    d = row['Date']
    if not d in all_dates:
        all_dates.append(d)
        
all_cases = {}
for r in common_regions:
    all_cases[r] = [ ]

for d in all_dates:
    one_day_data = [row for row in all_objs if row['Date']==d]
    for a in all_cases:
        all_cases[a].append([0, 0, 0])
    for row in one_day_data:
        region = row['Region']
        if region in common_regions:
            all_cases[region][-1][0] += int(row['Confirmed'])
            all_cases[region][-1][1] += int(row['Deaths'])
            all_cases[region][-1][2] += int(row['Recovered'])
            
all_cases = {}
for r in common_regions:
    all_cases[r] = {
        'confirmed': [],
        'deaths': [],
        'recovered': [] }
        
for d in all_dates:
    one_day_data = [row for row in all_objs if row['Date']==d]
    for a in all_cases:
        all_cases[a]['confirmed'].append(0)
        all_cases[a]['deaths'].append(0)
        all_cases[a]['recovered'].append(0)
    for row in one_day_data:
        region = row['Region']
        if region in common_regions:
            all_cases[region]['confirmed'][-1] += int(row['Confirmed'])
            all_cases[region]['deaths'][-1] += int(row['Deaths'])
            all_cases[region]['recovered'][-1] += int(row['Recovered'])

print('Lenth of list/number of days:', len(all_cases[common_regions[0]]['confirmed']))

fname_out = 'all-cases-data-processed.json'
f = open(fname_out, 'w+')
json.dump(all_cases, f)
f.close() 

fname_dates = 'all-cases-data-dates.json'
f = open(fname_dates, 'w+')
critical_dates = {
    'first': all_dates[0],
    'last': all_dates[-1]
    }
json.dump(critical_dates, f)
f.close()

print('Done! Three files created:\n\t', fname, '\n\t', fname_out, '\n\t', fname_dates)
