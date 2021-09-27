import * as CodeMirror from 'codemirror'
import { loadWASM } from 'onigasm'
import 'codemirror/lib/codemirror.css'
import './index.css';
import { Fluence, FluencePeer } from "@fluencelabs/fluence";
import { krasnodar } from "@fluencelabs/fluence-network-environment";

import {
    ResultCodes,
    RequestFlow,
    RequestFlowBuilder,
    CallParams,
} from '@fluencelabs/fluence/dist/internal/compilerSupport/v1.js'

window['Fluence'] = Fluence;
window['FluencePeer'] = FluencePeer;
window['ResultCodes'] = ResultCodes;
window['RequestFlow'] = RequestFlow;
window['RequestFlowBuilder'] = RequestFlowBuilder;

import {
    activateLanguage,
    addGrammar,
    addTheme,
    ITextmateThemePlus,
    linkInjections,
} from 'codemirror-textmate'

let defaultAqua = `import "@fluencelabs/aqua-lib/builtin.aqua"

service HelloWorld("hello-world"):
    hello(str: string)
    
func sayHello() -> string:
    HelloWorld.hello("Hello, world!")
    <- "hello"
    
func getRelayTime() -> u64:
    on HOST_PEER_ID:
        ts <- Peer.timestamp_ms()
    <- ts
`;

(async () => {
    await loadWASM(
        // webpack has been configured to resolve `.wasm` files to actual 'paths" as opposed to using the built-in wasm-loader
        // oniguruma is a low-level library and stock wasm-loader isn't equipped with advanced low-level API's to interact with libonig
        require('onigasm/lib/onigasm.wasm'))

        const grammars = {
            'source.aqua': {
                loader: () => import('./tm/grammars/aqua.tmLanguage.json'),
                language: 'typescript',
                priority: 'asap'
            },
            'source.js': {
                loader: () => import('./tm/grammars/JavaScript.tmLanguage.json'),
                language: 'javascript',
                priority: 'asap'
            }
        }

    // To avoid FOUC, await for high priority languages to get ready (loading/compiling takes time, and it's an async process for which CM won't wait)
    await Promise.all(Object.keys(grammars).map(async scopeName => {
        const { loader, language, priority } = grammars[scopeName]

        addGrammar(scopeName, loader)

        if (language) {
            const prom = activateLanguage(scopeName, language, priority)

            // We must "wait" for high priority languages to load/compile before we render editor to avoid FOUC (Flash of Unstyled Content)
            if (priority === 'now') {
                await prom
            }

            return;
        }
    }))

    const editor = CodeMirror.fromTextArea(document.getElementById('cm-host') as HTMLTextAreaElement, {
        lineNumbers: true,
        mode: 'typescript'
    })
    editor.setValue(defaultAqua)


    const viewer = CodeMirror.fromTextArea(document.getElementById('cm-viewer') as HTMLTextAreaElement, {
        lineNumbers: true,
        lineWrapping: true,
        mode: 'javascript'
    })

    let liveJS = `
    registerHelloWorld({
        hello: async (str) => {
            console.log(str)
        }
    });

    const helloBtnOnClick = async () => {
        const message = await sayHello();
        const relayTime = await getRelayTime();
        setHelloMessage(message);
    };

    function setHelloMessage(msg) {
        console.log(msg);
        document.getElementById('playground-run-output').innerHTML = msg;
    }

    helloBtnOnClick();
    `;

    let host = 'http://127.0.0.1:5000';
    async function compileAqua(aquaCode, outputLang) {
        let r = await fetch(`${host}/api/compile_aqua`, {method: 'POST',   headers : { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }, body: JSON.stringify({'aqua': aquaCode, 'lang': outputLang})})

        let j = await r.json();

        return j;
    }

    await Fluence.start({ connectTo: krasnodar[2] });

    async function runScript() {
        let script = editor.getValue();
        let result = await compileAqua(script, 'js');

        viewer.setValue(result.data.output);

        if(result.success) {
            let jsFromAqua = result.data.output; 

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
            let code = cleanedJS + ';' + liveJS;
            eval(code);
        }
    }

    let button = document.getElementById('run-script-button');
    button.onclick = runScript; 

})()
