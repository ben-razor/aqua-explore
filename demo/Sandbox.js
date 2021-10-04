import * as CodeMirror from 'codemirror'
import { Fluence, FluencePeer } from "@fluencelabs/fluence";
import { krasnodar } from "@fluencelabs/fluence-network-environment";
import { elemById, setContent, addClass, removeClass, triggerAnimClass, showElem } from './helpersHTML';
import { addTheme } from 'codemirror-textmate';

let defaultOutputText = `Use these functions in JS to output to this console:
    
    setOutput - Write to console (overwriting current text)
    getOutput - Get current output as text
    appendOutput - Append to current output text

These variables are available in JS:

    playgroundNodes[] - An array of currently connected relay nodes

`;

export class Sandbox {
    constructor() {
        console.log('sandbox constructing')
        this.viewer = null;
        this.connected = false;
        this.window = window;
    }

    async initViewer() {
        this.viewer = null;

        if(elemById('cm-viewer')) {
            this.viewer = CodeMirror.fromTextArea(elemById('cm-viewer'), {
                lineNumbers: false,
                lineWrapping: true,
                readOnly: true,
                mode: 'javascript'
            })
    
            const themeX = {
                ...(await import('./tm/themes/OneDark.tmTheme.json')),
                gutterSettings: {
                    background: '#1d1f25',
                    divider: '#1d1f25'
                }
            }
            addTheme(themeX)
            this.viewer.setOption('theme', themeX.name)
        }
    }

    setOutputTab(elemID) {
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
            this.viewer && this.viewer.refresh();
        }
    }

    resetOutput() {
        setContent('playground-run-output-text', 'Use setOutput in JS to output to this console.');
    }

    reportError(errorLang='JS') {
        let outputText = `There was an error while compiling the ${errorLang}.<br /><br />View the details in the Errors panel.`;
        setContent('playground-run-output-text', outputText);
        setContent('playground-tab-compiled', 'Errors')
    } 

    initUIHandlers() {
        window['selectOutputTab'] = elem => {
            let elemID = elem.id;
            this.setOutputTab(elemID)
        }
        window['setOutput'] = text => {
            setContent('playground-run-output-text', text);
        }
        window['getOutput'] = () => {
            return elemById('playground-run-output-text').innerHTML;
        }
        window['appendOutput'] = text => {
            let output = window['getOutput']();
            if(output) {
                output = output + '\n';
            }
            setContent('playground-run-output-text', output + text); 
        }

        this.addMessageListener();
    }

    initConnection() {
        let attemptingConnect = true;
        let me = this;

        async function connectToHost() {
            showElem('connection-error-alert', 'flex');

            me.connected = false;
            let connectedNode;
            for(let node of krasnodar) {
                try {
                    await Fluence.start({ connectTo: node });
                    me.connected = true;
                    connectedNode = node;
                    window['playgroundNodes'] = [connectedNode];
                    break;
                }
                catch(e) { 
                    await Fluence.stop();
                } 
            }

            attemptingConnect = false;
            if(me.connected) {
                let ma = connectedNode.multiaddr;
                let maParts = ma.split('/');
                if(maParts.length >= 6) {
                    ma = ma.split('/').slice(0,6).join('/');
                }
                me.hideConnectionError(`Connected to ${ma}`);
                me.evalWhenConnected();
            }
            else {
                me.showConnectionError('All krasnodar nodes are down. refresh later.');
            }
        }

        connectToHost();
    }

    handleExampleLoaded() {
        this.resetOutput();
        if(this.viewer) {
            this.viewer.setValue('');
            this.viewer.refresh();
            setContent('playground-run-output-text', defaultOutputText);
        }
    }

    hideConnectionError(message) {
        let elemID = 'connection-error-alert';
        let textElem = elemById('connection-error-alert');
        removeClass(elemID, 'connection-error');
        addClass(elemID, 'connection-ok');
        textElem.setAttribute('alt', message);
        textElem.setAttribute('title', message);
    }

    showConnectionError(message) {
        let elemID = 'connection-error-alert';
        let textElem = elemById('connection-error-alert');
        removeClass(elemID, 'connection-ok');
        addClass(elemID, 'connection-error');
        textElem.setAttribute('alt', message);
        textElem.setAttribute('title', message);
    }

    startEval(compilationData, jsScript) {
        this.initConnection();
        let success = compilationData.success;
        let rawOutput = compilationData.rawOutput;
        let cleanOutput = compilationData.cleanOutput;

        // Viewer will either contain compiled js or the error message
        this.viewer.setValue(rawOutput);
        this.viewer.refresh();

        if(!success) {
            this.reportError('Aqua');
            this.viewer.refresh();
        }
        else {
            let code = cleanOutput + ";setOutput('');" + jsScript;
            this.code = code;
            this.evalWhenConnected();
        }
    }

    addMessageListener() {
        this.window.addEventListener('message', e => {
            let data = e.data;

            if(data.type) {
                if(data.type === 'aqua-example-changed') {
                    this.handleExampleLoaded();
                }
            }
        })
    }

    evalWhenConnected() {
        let me = this;
        if(this.code && this.connected) {
            setContent('playground-tab-compiled', 'Compiled')
            this.window.addEventListener('unhandledrejection', function(e) {
                let message = e.reason.message;
                let stack = e.reason.stack;

                if(stack.indexOf('eval') !== -1) {
                    window['sandbox'].viewer.setValue(['JS Error: ', message].join('\n\n'));
                    window['sandbox'].reportError();
                    e.preventDefault();
                }
                return true;
            });

            triggerAnimClass('playground-run-output-text', 'playground-fade-in')

            setContent('playground-run-output-text', 'The script produced no output.<br /><br />Use setOutput in JS to output to this console.<br /><br />View the compiled module JS in the Compiled panel.');
            setTimeout(() => {
                try {
                    eval(this.code);
                }
                catch(e) {
                    this.viewer.setValue(['JS Error: ', e.message].join('\n\n'));
                    this.reportError();
                }
            }, 10);
        }
    }
}