import csv
import json
import sys

def csv_to_json(csv_filepath, json_filepath):
    data = []

    with open(csv_filepath, 'r') as csv_file:
        csv_reader = csv.DictReader(csv_file)

        for row in csv_reader:
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(row['Longitude']), float(row['Latitude'])]
                },
                "properties": {
                    "Name": row['Name'],
                    "Description": row['Description']
                }
            }
            data.append(feature)

    with open(json_filepath, 'w') as json_file:
        json.dump(data, json_file, indent=4)

if __name__ == "__main__":
    input_file = sys.argv[1]
    if len(sys.argv) > 2:
        output_file = sys.argv[2]
    else:
        output_file = input_file.split('.')[0] + '.json'
    
    csv_to_json(input_file, output_file)
