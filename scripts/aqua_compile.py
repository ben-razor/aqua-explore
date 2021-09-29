import os, subprocess, shlex
import re

def compile_aqua(file_name, lang):  
    """
    Takes an input file_name of an aqua file and a lang. Tries to compile the code.

    :param file_name File name of a file containing Aqua code
    :param lang One of (js|ts|air)
    """
    print('DIR ', os.curdir)
    script_name = file_name
    script_name_base = script_name.split('.')[0]
    output_ext = lang
    output_dir = './compiled'

    input_file = f'./aqua_scripts/{script_name}'
    output_file = f'{output_dir}/{script_name_base}.{output_ext}'
    
    result_string = ''
    return_code = 0
   
    print('OUTPUT', output_dir)
    args = [f'-i {input_file} -o {output_dir}']
    if output_ext in ['js', 'air']:
      args.append(f'--{output_ext}')

    command = ["aqua", ' '.join(args)]
    print('COMMAND', command)
    
    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return_code = result.returncode
    print('RESULT', result)

    if return_code == 0:
      print(f'Ok: compiled written to {output_file}')

      with open(output_file) as f:
          result_string = f.read()
    else:
      error = result.stderr.decode('utf-8')
      ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
      error = ansi_escape.sub('', error)
      print('Error: ' + error)
      result_string = error

    if os.path.exists(input_file):
      os.remove(input_file)

    if os.path.exists(output_file):
      os.remove(output_file)

    return (return_code, result_string)

if __name__ == '__main__':
    compile_aqua()
