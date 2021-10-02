import { isLocal  } from './helpersHTML';

export class AquaCompile {

    constructor() {
        this.alreadyImported = [];
        this.serverSideIncludes = ['builtin.aqua', 'pubsub.aqua', 'dht.aqua'];
        this.unprocessedIncludes = []
        this.prevAqua;
        this.prevCompiledAqua;

        this.host = 'https://benrazor.net:8080';
        if(isLocal()) {
            this.host = 'http://localhost:8082';
        }
    }

    startPreprocessAqua(script) {
        this.alreadyImported = [];
        this.unprocessedIncludes = [];
        this.processedLines = this.preprocessAqua(script);

        return this.unprocessedIncludes.join('\n') + '\n\n' + this.processedLines.join('\n');
    }

    preprocessAqua(script) {
        const importsRegex = RegExp('import "(.*)"');

        let lines = script.split('\n');
        let outputLines = [];

        for(let line of lines) {
            let regexResult = importsRegex.exec(line);

            if(regexResult && regexResult.length == 2) {
                let importPath = regexResult[1];
                let importHandled = false;

                let importPathParts = importPath.split('/');
                let importName = importPathParts.slice(-1)[0];

                if(this.serverSideIncludes.includes(importName)) {
                    this.unprocessedIncludes.push(line);
                    importHandled = true;
                }
                else if(!this.alreadyImported.includes(importName)) {
                    for(let data of examplesData) {
                        if(data.name === importName) {
                            outputLines = outputLines.concat(preprocessAqua(data.aqua));
                            importHandled = true;
                            break;
                        }
                    }   
                }

                if(!importHandled) {
                    // Add non found imports to the script so the server can deal with it
                    this.unprocessedIncludes.push(line);
                }
            }
            else {
                outputLines.push(line);
            }
        }

        return outputLines;
    }

    processCompiledJS(jsFromAqua) {

        let inImport = false;
        let lines = jsFromAqua.split('\n');
        let cleanedLines = [];

        for(let line of lines) {
            if(line.startsWith('import')) {
                inImport = true;
            }
            if(!line) {
                inImport = false;
            }

            if(!inImport) {
                line = line.replace('export', '');
                line = line.replace('!incorrectServiceDefinitions', 'incorrectServiceDefinitions');
                cleanedLines.push(line);
            }
        }
        
        let cleanedJS = cleanedLines.join('\n');

        return cleanedJS;
    }

    async reqAquaCompile(aquaCode, outputLang) {
        let r = await fetch(`${this.host}/api/compile_aqua`, {method: 'POST',   headers : { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }, body: JSON.stringify({'aqua': aquaCode, 'lang': outputLang})})

        let j = await r.json();

        return j;
    }

    async compileAqua(script) {
        let success = false;
        let compiledJS = '';
        let result;
        let output;
        let cleanOutput;

        if(script === this.prevAqua) {
            script = this.prevAqua;
            result = this.prevCompiledAqua;
        }
        else {
            script = this.startPreprocessAqua(script);
            result = await this.reqAquaCompile(script, 'js');
        }

        output = result.data.output;

        if(result.success) {
            this.prevAqua = script; 
            this.prevCompiledAqua = result;
            success = true;
            cleanOutput = this.processCompiledJS(output);
        }

        return { success: success, rawOutput: output, cleanOutput: cleanOutput};
    }
}
