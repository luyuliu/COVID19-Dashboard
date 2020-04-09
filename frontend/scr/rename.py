import glob, os

file_list = glob.glob("C:\\Users\\liu.6544\\Documents\\GitHub\\COVID19-Dashboard\\data\\states\\*.js")

for each_name in file_list:
    print(each_name)
    newname = each_name.split("\.")
    os.rename(each_name, newname[0] +".geojson")