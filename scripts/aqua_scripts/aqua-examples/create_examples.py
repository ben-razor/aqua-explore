import os, json

if __name__ == '__main__':
    base_dir = './dht'
    file_names =  os.listdir(base_dir)
    print(file_names)
    example_details = []

    for file_name in file_names:
        if not file_name.endswith('aqua'):
            continue

        with open(os.path.join(base_dir, file_name)) as f:
            aqua = f.read()
            example_details.append({
                'title': file_name.split('.')[0],
                'name': file_name,
                'aqua': aqua
            })

    json_str = json.dumps(example_details, indent=4, sort_keys=True)
    with open('examples_dht.json', 'w') as f:
        f.write(json_str)
    print(json_str)

