import csv, os, json
from datetime import date, timedelta
from pymongo import MongoClient, ASCENDING
from copy import deepcopy
import urllib.request
from tqdm import tqdm

client = MongoClient('mongodb://localhost:27017/')

db_case = client.corona
col_case = db_case.corona_cases_usafacts

# data_location = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) + "\\data\\COVID19_case_count\\allData.json"
# print(data_location)
col_case.drop()
first_date = date(2020, 1, 22)

with urllib.request.urlopen("https://usafactsstatic.blob.core.windows.net/public/2020/coronavirus-timeline/allData.json") as url:
    data = json.loads(url.read().decode())
    for each_county in tqdm(data):
        today_record = {}
        today_record['county_FIPS'] = each_county["countyFIPS"]
        today_record['county'] = each_county["county"]
        today_record['state'] = each_county["stateAbbr"]
        today_record['state_FIPS'] = each_county["stateFIPS"]
        death_time_series = each_county["deaths"]
        confirmed_time_series = each_county["confirmed"]
        collection = []

        for date_delta in range(len(death_time_series)):
            real_today_record = deepcopy(today_record)
            today_date = first_date + timedelta(days = date_delta)
            real_today_record["date"] = today_date.strftime("%Y%m%d")
            real_today_record["confirmed"] = confirmed_time_series[date_delta]
            real_today_record["death"] = death_time_series[date_delta]

            collection.append(real_today_record)

        col_case.insert_many(collection)