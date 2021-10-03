import * as CodeMirror from 'codemirror'
import { loadWASM } from 'onigasm'
import 'codemirror/lib/codemirror.css'
import './index.css';
import { Fluence, FluencePeer } from "@fluencelabs/fluence";
import { krasnodar } from "@fluencelabs/fluence-network-environment";
import { defaultJS, defaultAqua } from './examples';

import { elemById, showElem, hideElem, setContent, addClass, removeClass, 
         triggerAnimClass, isLocal  
} from './helpersHTML';

import { PlaygroundUI } from './PlaygroundUI';
import { Sandbox } from './Sandbox';
import { AquaCompile } from './AquaCompile';

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
import aqua from './modeSamples/aqua';

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

    let editor;
    if(elemById('cm-host')) {
        editor = CodeMirror.fromTextArea(elemById('cm-host') as HTMLTextAreaElement, {
            lineNumbers: true,
            mode: 'typescript',
            lineWrapping: true
        })
        editor.setValue(defaultAqua);
    }

    let jsEditor;
    if(elemById('cm-js-editor')) {
        jsEditor = CodeMirror.fromTextArea(elemById('cm-js-editor') as HTMLTextAreaElement, {
            lineNumbers: true,
            lineWrapping: true,
            mode: 'javascript'
        })
        jsEditor.setValue(liveJS);
        elemById('cm-js-container').style.display = 'none';
    }

    let playgroundUI = new PlaygroundUI(editor, jsEditor);

    let isSandbox = elemById('playground-run-output');

    let sandbox;
    if(isSandbox) {
        let sandbox = new Sandbox();
        await sandbox.initViewer();
        sandbox.initUIHandlers();
   }

    playgroundUI.initUIHandlers();

    let examplesData = playgroundUI.initExamples();

    let aquaCompile = new AquaCompile();

    let runScriptButton = elemById('run-script-button');
    if(runScriptButton) {
        async function startScriptRun() {
            let isSandboxLoaded = false;
            let isCompiled = false;
            let success;
            let rawOutput;
            let cleanOutput;

            function handleCompiledAndSandboxLoaded() {
                if(isCompiled && isSandboxLoaded) {
                    hideElem('playground-compiling-overlay');
                            
                    elemById('playground-sandbox').contentWindow.addEventListener('message', e => {
                        let mainWindow = e.source;
                        let data = e.data;

                        if(data.type && data.type === 'aqua-compile') {
                            let success = data.success;
                            let rawOutput = data.rawOutput;
                            let cleanOutput = data.cleanOutput;
                            console.log(data);

                            // Viewer will either contain compiled js or the error message
                            viewer.setValue(rawOutput);
                            viewer.refresh();

                            if(!success) {
                                setContent('playground-run-output-text', 'There was an error while compiling the Aqua.<br /><br />View the error in the Compiled panel.');
                                viewer.refresh();
                            }
                            else {
                                let jsScript = jsEditor.getValue();
                                let code = cleanOutput + ';' + jsScript;

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
                        }
                    })
       
                    elemById('playground-sandbox').contentWindow.postMessage({
                        success: success, rawOutput: rawOutput, cleanOutput: cleanOutput, type: 'aqua-compile'
                    }, 'http://localhost:8080');
                }
            }

            let sandboxElem = elemById('playground-sandbox');
            sandboxElem.onload = () => { 
                isSandboxLoaded = true;
                handleCompiledAndSandboxLoaded();
            }
            sandboxElem.contentWindow.location.reload();

            setContent('playground-run-output-text', '');
            playgroundUI.showCompilingOverlay(); 

            ({ success, rawOutput, cleanOutput } = await aquaCompile.compileAqua(editor.getValue()));

            isCompiled = true;
            handleCompiledAndSandboxLoaded();
     }
        runScriptButton.onclick = startScriptRun; 
    }

    playgroundUI.initPlaygroundUI();

 })()
