#!/usr/bin/env python3
from aqua_compile import compile_aqua
from flask import Flask
from flask import Flask, request, url_for, render_template, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

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

    file_name = 'playground.aqua'
    script_name = file_name
    script_name_base = script_name.split('.')[0]
    input_dir = './aqua_scripts'
    input_file = f'{input_dir}/{file_name}'

    with open(input_file, 'w') as f:
        f.write(aqua)

    return_code, result_string = compile_aqua(file_name, lang)

    resp = {
        'output': result_string
    }

    if return_code == 0:
        pass
    else:
        success = False
        reason = 'compilation-failed'

    response = jsonify({'success': success, 'reason': reason, 'data': resp})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response, status



if __name__ == '__main__':
    app.run(debug=True)