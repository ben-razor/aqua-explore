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

    let viewer;
    if(elemById('cm-viewer')) {
        viewer = CodeMirror.fromTextArea(elemById('cm-viewer') as HTMLTextAreaElement, {
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
    }
    let playgroundUI = new PlaygroundUI(editor, jsEditor, viewer);

    let isSandbox = elemById('playground-run-output');

    if(isSandbox) {
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

        function hideConnectionError(message) {
            let elemID = 'connection-error-alert';
            let textElem = elemById('connection-error-alert');
            removeClass(elemID, 'connection-error');
            addClass(elemID, 'connection-ok');
            textElem.setAttribute('alt', message);
            textElem.setAttribute('title', message);
        }
        function showConnectionError(message) {
            let elemID = 'connection-error-alert';
            let textElem = elemById('connection-error-alert');
            removeClass(elemID, 'connection-ok');
            addClass(elemID, 'connection-error');
            textElem.setAttribute('alt', message);
            textElem.setAttribute('title', message);
        }

        let attemptingConnect = true;
        async function connectToHost() {
            let connected = false;
            let connectedNode;
            for(let node of krasnodar) {
                try {
                    await Fluence.start({ connectTo: node });
                    connected = true;
                    connectedNode = node;
                    break;
                }
                catch(e) { 
                    await Fluence.stop();
                } 
            }

            attemptingConnect = false;
            if(connected) {
                let ma = connectedNode.multiaddr;
                let maParts = ma.split('/');
                if(maParts.length >= 6) {
                    ma = ma.split('/').slice(0,6).join('/');
                }
                hideConnectionError(`Connected to ${ma}`);
            }
            else {
                showConnectionError('All krasnodar nodes are down. refresh later.');
            }
        }

        connectToHost();
    }

    playgroundUI.initUIHandlers();

    let examplesData = playgroundUI.initExamples();

    let aquaCompile = new AquaCompile();

    let runScriptButton = elemById('run-script-button');
    if(runScriptButton) {
        async function startScriptRun() {
            let sandbox = elemById('playground-sandbox');
            sandbox.contentWindow.location.reload();

            setContent('playground-run-output-text', '');
            playgroundUI.showCompilingOverlay(); 

            let { success, output } = aquaCompile.compileAqua(editor.getValue());

            hideElem('playground-compiling-overlay');
 
            // Viewer will either contain compiled js or the error message
            viewer.setValue(output);
            viewer.refresh();

            if(!success) {
                setContent('playground-run-output-text', 'There was an error while compiling the Aqua.<br /><br />View the error in the Compiled panel.');
                viewer.refresh();
            }
            else {
                let jsScript = jsEditor.getValue();
                let code = output + ';' + jsScript;

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
        runScriptButton.onclick = startScriptRun; 
    }

    playgroundUI.initPlaygroundUI();

 })()
