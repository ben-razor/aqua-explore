import * as CodeMirror from 'codemirror'
import { loadWASM } from 'onigasm'
import 'codemirror/lib/codemirror.css'
import './index.css';
import { Fluence, FluencePeer } from "@fluencelabs/fluence";
import { krasnodar } from "@fluencelabs/fluence-network-environment";
import { defaultJS, defaultAqua } from './examples';

import { elemById, hideElem, setContent, isLocal } from './helpersHTML';

import { PlaygroundUI } from './PlaygroundUI';
import { Sandbox } from './Sandbox';
import { AquaCompile } from './AquaCompile';

import {
    CallParams,
    callFunction, 
    registerService,
} from '@fluencelabs/fluence/dist/internal/compilerSupport/v3';

// These assignments are necessary to ensure that webpack pulls in these things
// from the modules so that they are available to the code running in the sandbox
window['Fluence'] = Fluence;
window['FluencePeer'] = FluencePeer;
window['registerService'] = registerService;
window['callFunction'] = callFunction;
window['krasnodar'] = krasnodar;

import { activateLanguage, addGrammar, } from 'codemirror-textmate'

let liveJS = defaultJS;

(async () => {
    // webpack has been configured to resolve `.wasm` files to actual 'paths" as opposed to using the built-in wasm-loader
    // oniguruma is a low-level library and stock wasm-loader isn't equipped with advanced low-level API's to interact with libonig
    await loadWASM(require('onigasm/lib/onigasm.wasm'));

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
            'extraKeys': {
                'Shift-Tab': 'indentLess',
                'Tab': 'indentMore'
            },
            lineWrapping: true
        })
        editor.setValue(defaultAqua);
    }

    let jsEditor;
    if(elemById('cm-js-editor')) {
        jsEditor = CodeMirror.fromTextArea(elemById('cm-js-editor') as HTMLTextAreaElement, {
            lineNumbers: true,
            'extraKeys': {
                'Shift-Tab': 'indentLess',
                'Tab': 'indentMore'
            },
            lineWrapping: true,
            mode: 'javascript'
        })
        jsEditor.setValue(liveJS);
        elemById('cm-js-container').style.display = 'none';
    }

    let playgroundUI = new PlaygroundUI(editor, jsEditor);
    playgroundUI.initUIHandlers();

    let isSandbox = elemById('playground-run-output');

    if(isSandbox) {
        let sandbox = new Sandbox();
        await sandbox.initViewer();
        sandbox.initUIHandlers();
        window['sandbox'] = sandbox;
        sandbox.postLoadedMessage()
    }

    let aquaCompile = new AquaCompile();
    playgroundUI.initExamples(aquaCompile);

    let runScriptButton = elemById('run-script-button');
    let sandboxLoadedListenerAdded = false;

    if(runScriptButton) {
        let compileData = { success: false, rawOutput: '', cleanOutput: '' };
        let isSandboxLoaded = false;
        let isCompiled = false;

        function handleCompiledAndSandboxLoaded(compileData, isCompiled, isSandboxLoaded) {
            let origin = location.origin;
            
            if(isCompiled && isSandboxLoaded) {
                hideElem('playground-compiling-overlay');
                        
                let sandboxWindow = elemById('playground-sandbox').contentWindow;
                sandboxWindow.addEventListener('message', e => {
                    (async () => {
                        let data = e.data;

                        if(data.type && data.type === 'aqua-compile') {
                            let jsScript = jsEditor.getValue();
                            sandboxWindow.sandbox.startEval(data, jsScript);
                        }
                    })();
                })
    
                elemById('playground-sandbox').contentWindow.postMessage({
                    success: compileData.success, 
                    rawOutput: compileData.rawOutput, 
                    cleanOutput: compileData.cleanOutput,
                    type: 'aqua-compile'
                }, origin);

            }
        }
        
        let sandboxLoadedListener = e => {
            let data = e.data;
            if(data.type && data.type === 'aqua-sandbox-loaded') {
                isSandboxLoaded = true;
                handleCompiledAndSandboxLoaded(compileData, isCompiled, isSandboxLoaded);
            }
        }

        window.addEventListener('message', sandboxLoadedListener);

        async function startScriptRun() {
            isSandboxLoaded = false;
            isCompiled = false;

            let sandboxElem = elemById('playground-sandbox');
            sandboxElem.src = location.origin + '/sandbox.html';
            sandboxElem.contentWindow.location.reload();

            playgroundUI.showCompilingOverlay(); 

            Object.assign(compileData, await aquaCompile.compileAqua(editor.getValue()));

            isCompiled = true;
            handleCompiledAndSandboxLoaded(compileData, isCompiled, isSandboxLoaded);
        }
        runScriptButton.onclick = startScriptRun; 
    }

    playgroundUI.initPlaygroundUI();

 })()
