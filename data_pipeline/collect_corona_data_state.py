import csv, os, time, io
from datetime import date, datetime, timedelta
from pymongo import MongoClient, ASCENDING
from tqdm import tqdm
import urllib.request
import codecs

client = MongoClient('mongodb://localhost:27017/')

db_case = client.corona
col_case = db_case.corona_cases_state_level
col_case.drop()
def collect_single_date(today_date):
    today_date_string = today_date.strftime("%m-%d-%Y")
    data_location = "https://nssac.bii.virginia.edu/covid-19/dashboard/data/nssac-ncov-sd-{}.csv".format(today_date_string)
    response = urllib.request.urlopen(data_location)
    text = codecs.iterdecode(response, 'utf-8')
    collection = []

    the_reader = csv.reader(text, delimiter=',')
    line_count = 0
    field_names = []

    for row in (the_reader):
        insertion = {}
        if line_count == 0:
            for each_item in row:
                field_names.append(each_item)
        else:
            numbers = row
            for index in range(len(numbers)):
                value = numbers[index]
                key = field_names[index]
                insertion[key] = value
            insertion["Date"] = today_date_string
            collection.append(insertion)
        line_count += 1
    col_case.insert_many(collection)


def daterange(start_date, end_date):
    for n in range(int((end_date - start_date).days)):
        yield start_date + timedelta(n)

start_date = date(2020, 1,22)
end_date = date.today()
for each_date in tqdm(list(daterange(start_date, end_date))):
    collect_single_date(each_date)