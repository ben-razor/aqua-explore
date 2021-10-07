#!/usr/bin/env python3
import os, uuid
from aqua_compile import compile_aqua
from flask import Flask
from flask import Flask, request, url_for, render_template, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

script_dir = os.path.dirname(os.path.realpath(__file__))
os.chdir(script_dir)

@app.route("/")
def razor():
    return_code, result_string = compile_aqua('string_thing.aqua', 'js')
    return result_string 

@app.route("/api/compile_aqua", methods=['POST'])
def api_compile_aqua():
    """
    API Endpoint for compiling aqua code.

    params:
        aqua - The Aqua code to compile
        lang - ts|js|air

    returns:
        {
          'success': ,     // boolean - if compilation was successful
          'reason':        // An string error code like 'error-syntax-error'
          'resp': {
            output:        // The compiled code or error message 
          }      
        }
    """
    status = 200
    success = True
    reason = 'ok'
    resp = {}

    body = request.json

    aqua = body.get('aqua', '').strip()
    lang = body.get('lang', '').strip()

    session_id = uuid.uuid4().hex

    file_name = session_id + '.aqua'
    script_name = file_name
    script_name_base = script_name.split('.')[0]
    input_dir = './aqua_scripts'
    input_file = f'{input_dir}/{file_name}'

    with open(input_file, 'w') as f:
        f.write(aqua)

    return_code, result_string = compile_aqua(file_name, lang)

    if os.path.exists(input_file):
        os.remove(input_file)

    resp = {
        'output': result_string
    }

    if return_code == 0:
        pass
    else:
        success = False
        reason = 'compilation-failed'

    response = jsonify({'success': success, 'reason': reason, 'data': resp})

    origin = request.headers.get('Origin')
    origin_no_port = ':'.join(origin.split(':')[:2])
    allow_origin_list = ['https://aqua-explore.web.app', 'https://34.77.88.57']

    if 'localhost' in request.base_url:
        allow_origin_list = ['http://localhost']

    if origin_no_port in allow_origin_list:
        response.headers.add('Access-Control-Allow-Origin', origin)

    return response, status

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8868)