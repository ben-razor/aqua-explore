import os, subprocess, shlex
import re

def compile_aqua(file_name, lang):  
    """
    Takes an input file_name of an aqua file and a lang. Tries to compile the code.

    :param file_name File name of a file containing Aqua code
    :param lang One of (js|ts|air)
    """
    real_dir = os.path.dirname(os.path.realpath(__file__))
    print('real_dir', real_dir)
    script_name = file_name
    script_name_base = script_name.split('.')[0]
    output_ext = lang
    output_dir = os.path.join(real_dir, 'compiled')

    input_file = os.path.join(real_dir, f'aqua_scripts/{script_name}')
    output_file = f'{output_dir}/{script_name_base}.{output_ext}'
    
    result_string = ''
    return_code = 0
   
    print('OUTPUT', output_dir)
    args = ['-i', f'{input_file}', '-o', f'{output_dir}']
    if output_ext in ['js', 'air']:
      args.append(f'--{output_ext}')

    command = ["aqua"]
    command.extend(args)
    command = ' '.join(command)
    print('COMMAND', command)

    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
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

    if os.path.exists(output_file):
      os.remove(output_file)

    # Compiler is generating .d.ts files along with js
    output_file_d_ts = output_file.replace('.js', '.d.ts')
    if os.path.exists(output_file_d_ts):
      os.remove(output_file_d_ts) 

    return (return_code, result_string)

if __name__ == '__main__':
    compile_aqua()
