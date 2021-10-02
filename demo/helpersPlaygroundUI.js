import { getExamples, defaultExample } from './examples';
import { elemById, showElem, hideElem, setContent, addClass, removeClass, 
         triggerAnimClass, isLocal  
} from './helpersHTML';

export class PlaygroundUI {
    constructor(editor, jsEditor, viewer) {
        this.editor = editor;
        this.jsEditor = jsEditor;
        this.viewer = viewer;
    }

    setTab(elemID) {
        addClass(elemID, 'playground-tab-selected')
        if(elemID === 'playground-tab-aqua') {
            removeClass('playground-tab-js', 'playground-tab-selected')
            elemById('cm-aqua-container').style.display = 'initial';
            elemById('cm-js-container').style.display = 'none';
            this.editor.refresh();
        }
        else {
            removeClass('playground-tab-aqua', 'playground-tab-selected');
            elemById('cm-aqua-container').style.display = 'none';
            elemById('cm-js-container').style.display = 'initial';
            this.jsEditor.refresh();
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
            this.viewer.refresh();
        }
    }

    resetOutput() {
        setContent('playground-run-output-text', 'Use setOutput in JS to output to this console.');
    }

    initUIHandlers() {
        window['selectTab'] = elem => {
            let elemID = elem.id;
            this.setTab(elemID)
        }

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

    showCompilingOverlay() {
        showElem('playground-compiling-overlay');
        setTimeout(() => {
            // In case something goes wrong with the compile
            hideElem('playground-compiling-overlay');
        }, 10000);
    }

    initPlaygroundUI() {
        let header = elemById('playground-header');
        if(header) {
            header.style.display = 'flex';
        }

        let content = elemById('playground-content');
        if(content) {
            content.style.opacity = '1';
            content.style.position = 'relative';
        }

        let loading = elemById('playground-loading');
        if(loading) {
            loading.style.display = 'none';
        }
    }

    async initExamples() {
        let {success, examplesData} = await getExamples(); 
        examplesData.unshift(defaultExample); 

        window["exampleChanged"] = (e) => {
            let selValue = e.options[e.selectedIndex].value;

            for(let data of examplesData) {
                if(data.name === selValue) {
                    this.setTab('playground-tab-aqua');
                    this.editor.setValue(data.aqua);
                    this.jsEditor.setValue(data.js || '');
                    this.editor.refresh();
                    this.jsEditor.refresh();
                    this.resetOutput();
                    this.viewer.setValue('');
                    this.viewer.refresh();
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

        return examplesData;
    }
}
