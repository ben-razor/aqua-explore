import * as CodeMirror from 'codemirror'
import { loadWASM } from 'onigasm'
import 'codemirror/lib/codemirror.css'
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
import { start } from 'repl';
import { remove } from 'js-cookie';

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

const testAquaService = async () => {
    const message = await sayHello();
    const relayTime = await getRelayTime();
    const dateStr = new Date(relayTime).toLocaleString();
    
    setOutput(message + '<br /><br />Time on host: ' + dateStr);
};

testAquaService();`;

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

    let host = 'https://benrazor.net:8080';
    if(isLocal()) {
        host = 'http://localhost:8082';
    }
    async function compileAqua(aquaCode, outputLang) {
        let r = await fetch(`${host}/api/compile_aqua`, {method: 'POST',   headers : { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }, body: JSON.stringify({'aqua': aquaCode, 'lang': outputLang})})

        let j = await r.json();

        return j;
    }

    function hideError() {
        let errorElem = elemById('error-alert');
        errorElem.style.display = 'none';
        let errorText = elemById('error-text');
        errorText.innerHTML = '';
    }
    function showError(message) {
        let errorElem = elemById('error-alert');
        errorElem.style.display = '';
        let errorText = elemById('error-text');
        errorText.innerHTML = message;
    }
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
    function addClass(elemID, className) {
        elemById(elemID).classList.add(className);
    }
    function removeClass(elemID, className) {
        elemById(elemID).classList.remove(className);
    }
    function triggerAnimClass(elemID, className) {
        removeClass(elemID, className);
        setTimeout(() => { 
            addClass(elemID, className); 
            elemById(elemID).addEventListener('animationend', () => {
                removeClass(elemID, className);
            })
        }, 1);
    }
    let setTab = (elemID) => {
        addClass(elemID, 'playground-tab-selected')
        if(elemID === 'playground-tab-aqua') {
            removeClass('playground-tab-js', 'playground-tab-selected')
            elemById('cm-aqua-container').style.display = 'initial';
            elemById('cm-js-container').style.display = 'none';
            editor.refresh();
        }
        else {
            removeClass('playground-tab-aqua', 'playground-tab-selected');
            elemById('cm-aqua-container').style.display = 'none';
            elemById('cm-js-container').style.display = 'initial';
            jsEditor.refresh();
        }
    }

    let setOutputTab = (elemID) => {
        addClass(elemID, 'playground-tab-selected');
        if(elemID === 'playground-tab-output') {
            removeClass('playground-tab-compiled', 'playground-tab-selected');
            elemById('playground-run-output').style.display = 'initial';
            elemById('playground-compiled-viewer').style.display = 'none';
        }
        else {
            removeClass('playground-tab-output', 'playground-tab-selected');
            elemById('playground-run-output').style.display = 'none';
            elemById('playground-compiled-viewer').style.display = 'initial';
            viewer.refresh();
        }
    }
    function resetOutput() {
        setContent('playground-run-output-text', 'Use setOutput in JS to output to this console.');
    }
    function isLocal() {
        return window.location.href.includes('localhost');
    }

    window['selectTab'] = elem => {
        let elemID = elem.id;
        setTab(elemID)
    }

    window['selectOutputTab'] = elem => {
        let elemID = elem.id;
        setOutputTab(elemID)
    }
    
    window['setOutput'] = text => {
        document.getElementById('playground-run-output-text').innerHTML = text;
    }

    let attemptingConnect = true;
    async function connectToHost() {
        let connected = false;
        for(let node of krasnodar) {
            try {
                await Fluence.start({ connectTo: node });
                connected = true;
                break;
            }
            catch(e) { 
                await Fluence.stop();
            } 
        }

        attemptingConnect = false;
        if(connected) {
            hideError();
        }
        else {
            showError('krasnodar is down. refresh later.');
        }
    }

    connectToHost();

    let alreadyImported = [];
    let serverSideIncludes = ['builtin.aqua', 'pubsub.aqua', 'dht.aqua'];
    let unprocessedIncludes = []

    function startPreprocessAqua(script) {
        alreadyImported = [];
        unprocessedIncludes = [];
        let processedLines = preprocessAqua(script);

        return unprocessedIncludes.join('\n') + '\n\n' + processedLines.join('\n');
    }

    function preprocessAqua(script) {
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

                if(serverSideIncludes.includes(importName)) {
                    unprocessedIncludes.push(line);
                    importHandled = true;
                }
                else if(!alreadyImported.includes(importName)) {
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
                    unprocessedIncludes.push(line);
                }
            }
            else {
                outputLines.push(line);
            }
        }

        return outputLines;
    }

    let prevAqua;
    let prevCompiledAqua;

    async function runScript() {
        setContent('playground-run-output-text', '');
        showCompilingOverlay();
        let script = editor.getValue();
        let result;

        if(script === prevAqua) {
            script = prevAqua;
            result = prevCompiledAqua;
        }
        else {
            prevAqua = script; 
            script = startPreprocessAqua(script);
            result = await compileAqua(script, 'js');
            prevCompiledAqua = result;;
        }

        let jsScript = jsEditor.getValue();

        // Viewer will either contain compiled js or the error message
        viewer.setValue(result.data.output);
        viewer.refresh();

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
            let code = cleanedJS + ';' + jsScript;

            triggerAnimClass('playground-run-output-text', 'playground-fade-in')
            setContent('playground-run-output-text', 'The script produced no output.<br /><br />Use setOutput in JS to output to this console.<br /><br />View the compiled module JS in the Compiled panel.');
            setTimeout(() => {
                try {
                    eval(code);
                }
                catch(e) {
                    viewer.setValue(['JS Error: ', e.message, e.stack].join('\n\n'));
                }
            }, 5);
        }
        else {
            setContent('playground-run-output-text', 'There was an error while compiling the Aqua.<br /><br />View the error in the Compiled panel.');
            viewer.refresh();
        }
        hideElem('playground-compiling-overlay');
    }

    let button = document.getElementById('run-script-button');
    button.onclick = runScript; 

    document.getElementById('playground-header').style.display = 'flex';
    document.getElementById('playground-content').style.opacity = '1';
    document.getElementById('playground-content').style.position = 'relative';
    document.getElementById('playground-loading').style.display = 'none';

    let {success, examplesData} = await getExamples();
    examplesData.unshift(defaultExample); 

    window["exampleChanged"] = (e) => {
        let selValue = e.options[e.selectedIndex].value;

        for(let data of examplesData) {
            if(data.name === selValue) {
                setTab('playground-tab-aqua');
                editor.setValue(data.aqua);
                jsEditor.setValue(data.js || '');
                editor.refresh();
                jsEditor.refresh();
                resetOutput();
                viewer.setValue('');
                viewer.refresh();
                break;
            }
        }
    }

    if(success) {
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
