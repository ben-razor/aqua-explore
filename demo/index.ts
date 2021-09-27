import * as CodeMirror from 'codemirror'
import { loadWASM } from 'onigasm'
import 'codemirror/lib/codemirror.css'
var cookies = require('browser-cookies');
import './index.css';
import { Fluence, FluencePeer } from "@fluencelabs/fluence";
import { krasnodar } from "@fluencelabs/fluence-network-environment";
import { getExamples } from './examples';

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

const defaultAqua = `import "@fluencelabs/aqua-lib/builtin.aqua"

service HelloWorld("hello-world"):
    hello(str: string)
    
func sayHello() -> string:
    HelloWorld.hello("Hello. Welcome to the Aqua Playground.")
    <- "Hello. Welcome to the Aqua Playground."
    
func getRelayTime() -> u64:
    on HOST_PEER_ID:
        ts <- Peer.timestamp_ms()
    <- ts
`;

const defaultJS = `registerHelloWorld({
    hello: async (str) => {
        console.log(str)
    }
});

const helloBtnOnClick = async () => {
    const message = await sayHello();
    const relayTime = await getRelayTime();
    const dateStr = new Date(relayTime).toLocaleString();
    
    setOutput(message + '<br /><br />Time on host: ' + dateStr);
};

helloBtnOnClick();`;

let defaultExample =     {
    "aqua": defaultAqua,
    "js": defaultJS,
    "name": "helloAqua",
    "title": "Hello Aqua"
};

let liveJS = defaultJS;

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
        mode: 'typescript',
        lineWrapping: true;
    })
    editor.setValue(defaultAqua);

    const jsEditor = CodeMirror.fromTextArea(document.getElementById('cm-js-editor') as HTMLTextAreaElement, {
        lineNumbers: true,
        lineWrapping: true,
        mode: 'javascript'
    })
    jsEditor.setValue(liveJS);
    elemById('cm-js-container').style.display = 'none';

    const viewer = CodeMirror.fromTextArea(document.getElementById('cm-viewer') as HTMLTextAreaElement, {
        lineNumbers: false,
        lineWrapping: true,
        readOnly: true,
        mode: 'javascript'
    })

    const themeX: ITextmateThemePlus = {
        ...(await import('./tm/themes/OneDark.tmTheme.json')),
        gutterSettings: {
            background: '#1d1f25',
            divider: '#1d1f25'
        }
    }
    addTheme(themeX)
    viewer.setOption('theme', themeX.name)

    let session_id = cookies.get('session_id');

    let host = 'http://34.77.88.57:8080/';
    async function compileAqua(aquaCode, outputLang) {
        let r = await fetch(`${host}/api/compile_aqua`, {method: 'POST',   headers : { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }, body: JSON.stringify({'aqua': aquaCode, 'lang': outputLang, 'id': session_id})})

        let j = await r.json();

        return j;
    }

    await Fluence.start({ connectTo: krasnodar[2] });

    function elemById(id) {
        return document.getElementById(id);
    }
    function showElem(id) {
        elemById(id).style.display = 'initial';
    }
    function hideElem(id) {
        elemById(id).style.display = 'none';
    }
    function showCompilingOverlay() {
        showElem('playground-compiling-overlay');
        setTimeout(() => {
            // In case something goes wrong with the compile
            hideElem('playground-compiling-overlay');
        }, 10000);
    }
    function setContent(id, text) {
        elemById(id).innerHTML = text;
    }
    let setTab = (elemID) => {
        elemById(elemID).classList.add('playground-tab-selected');
        if(elemID === 'playground-tab-aqua') {
            elemById('playground-tab-js').classList.remove('playground-tab-selected');
            elemById('cm-aqua-container').style.display = 'initial';
            elemById('cm-js-container').style.display = 'none';
            editor.refresh();
        }
        else {
            elemById('playground-tab-aqua').classList.remove('playground-tab-selected');
            elemById('cm-aqua-container').style.display = 'none';
            elemById('cm-js-container').style.display = 'initial';
            jsEditor.refresh();
        }
    }

    let setOutputTab = (elemID) => {
        elemById(elemID).classList.add('playground-tab-selected');
        if(elemID === 'playground-tab-output') {
            elemById('playground-tab-compiled').classList.remove('playground-tab-selected');
            elemById('playground-run-output').style.display = 'initial';
            elemById('playground-compiled-viewer').style.display = 'none';
        }
        else {
            elemById('playground-tab-output').classList.remove('playground-tab-selected');
            elemById('playground-run-output').style.display = 'none';
            elemById('playground-compiled-viewer').style.display = 'initial';
            viewer.refresh();
        }
    }


    window['selectTab'] = (elem) {
        let elemID = elem.id;
        setTab(elemID)
    }

    window['selectOutputTab'] = (elem) {
        let elemID = elem.id;
        setOutputTab(elemID)
    }
    
    window['setOutput'] = text => {
        document.getElementById('playground-run-output').innerHTML = text;
    }

    async function runScript() {
        setContent('playground-run-output', '');
        showCompilingOverlay();
        let script = editor.getValue();
        let jsScript = jsEditor.getValue();
        let result = await compileAqua(script, 'js');

        // Viewer will either contain compiled js or the error message
        viewer.setValue(result.data.output);
        elemById('playground-compiled-viewer').style.display = 'initial';
        elemById('playground-run-output').style.display = 'initial';
        viewer.refresh();

        if(result.success) {
            cookies.set('session_id', result.data.id);
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
            let code = cleanedJS + ';' + jsScript;

            setContent('playground-run-output', 'The script produced no output.<br /><br />Use setOutput in JS to output to this console.');
            eval(code);
        }
        else {
            setContent('playground-run-output', 'There was an error while compiling the Aqua.');
            elemById('playground-compiled-viewer').style.display = 'initial';
            elemById('playground-run-output').style.display = 'none';
            viewer.refresh();
        }
        hideElem('playground-compiling-overlay');
    }

    let button = document.getElementById('run-script-button');
    button.onclick = runScript; 

    document.getElementById('playground-content').style.opacity = '1';
    document.getElementById('playground-content').style.position = 'relative';
    document.getElementById('playground-loading').style.display = 'none';

    let {success, examplesData} = await getExamples();
    examplesData.unshift(defaultExample); 

    window["exampleChanged"] = (e) => {
        let selValue = e.options[e.selectedIndex].value;
        console.log(selValue);
        for(let data of examplesData) {
            if(data.name === selValue) {
                setTab('playground-tab-aqua');
                editor.setValue(data.aqua);
                jsEditor.setValue(data.js || '');
                editor.refresh();
                jsEditor.refresh();
                break;
            }
        }
    }

    if(success) {
        console.log(examplesData);
        let select = `<select class="playground-examples-select" 
                              id="playground-examples-select" onchange="exampleChanged(this)">"`
        for(let data of examplesData) {
            select += `<option value="${data.name}">${data.title}</option>`;
        }
        select += '</select>';

        elemById('example-select-holder').innerHTML = select;
    }
    else {
        console.log('failed to get examples data'); 
    }
})()
