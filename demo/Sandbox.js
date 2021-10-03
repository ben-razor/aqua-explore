import * as CodeMirror from 'codemirror'
import { Fluence, FluencePeer } from "@fluencelabs/fluence";
import { krasnodar } from "@fluencelabs/fluence-network-environment";
import { elemById, setContent, addClass, removeClass, triggerAnimClass } from './helpersHTML';
import { addTheme } from 'codemirror-textmate';

export class Sandbox {
    constructor() {
        console.log('sandbox constructing')
        this.viewer = null;
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
    }

    initConnection() {
        let attemptingConnect = true;
        let me = this;

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
                me.hideConnectionError(`Connected to ${ma}`);
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
        let success = compilationData.success;
        let rawOutput = compilationData.rawOutput;
        let cleanOutput = compilationData.cleanOutput;

        // Viewer will either contain compiled js or the error message
        this.viewer.setValue(rawOutput);
        this.viewer.refresh();

        if(!success) {
            setContent('playground-run-output-text', 'There was an error while compiling the Aqua.<br /><br />View the error in the Compiled panel.');
            this.viewer.refresh();
        }
        else {
            let code = cleanOutput + ';' + jsScript;

            triggerAnimClass('playground-run-output-text', 'playground-fade-in')
            setContent('playground-run-output-text', 'The script produced no output.<br /><br />Use setOutput in JS to output to this console.<br /><br />View the compiled module JS in the Compiled panel.');
            setTimeout(() => {
                try {
                    eval(code);
                }
                catch(e) {
                    this.viewer.setValue(['JS Error: ', e.message, e.stack].join('\n\n'));
                }
            }, 5);
        }
    }
}