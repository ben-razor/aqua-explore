import { getExamples, defaultExample } from './examples';
import { elemById, showElem, hideElem, setContent, addClass, removeClass, 
         triggerAnimClass, isLocal  
} from './helpersHTML';

export class PlaygroundUI {
    constructor(editor, jsEditor) {
        this.editor = editor;
        this.jsEditor = jsEditor;
    }

    setTab(elemID) {
        addClass(elemID, 'playground-tab-selected')
        if(elemID === 'playground-tab-aqua') {
            removeClass('playground-tab-js', 'playground-tab-selected')
            elemById('cm-aqua-container').style.display = 'initial';
            elemById('cm-js-container').style.display = 'none';
            this.editor && this.editor.refresh();
        }
        else {
            removeClass('playground-tab-aqua', 'playground-tab-selected');
            elemById('cm-aqua-container').style.display = 'none';
            elemById('cm-js-container').style.display = 'initial';
            this.jsEditor && this.jsEditor.refresh();
        }
    }

    initUIHandlers() {
        window['selectTab'] = elem => {
            let elemID = elem.id;
            this.setTab(elemID)
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

    async initExamples(examplesLoadedHandler) {
        let {success, examplesData} = await getExamples(); 
        examplesData.unshift(defaultExample); 

        if(examplesLoadedHandler) {
            examplesLoadedHandler.onExamplesLoaded(examplesData);
        }

        window["exampleChanged"] = (e) => {
            let selValue = e.options[e.selectedIndex].value;

            for(let data of examplesData) {
                if(data.name === selValue) {
                    this.setTab('playground-tab-aqua');
                    if(this.editor && this.jsEditor) {
                        this.editor.setValue(data.aqua);
                        this.jsEditor.setValue(data.js || '');
                        this.editor.refresh();
                        this.jsEditor.refresh();
                    }

                    elemById('playground-sandbox').contentWindow.postMessage({
                        type: 'aqua-example-changed'
                    }, 'http://localhost:8080');
                    
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

            if(elemById('example-select-holder')) {
                elemById('example-select-holder').innerHTML = select;
            }
        }
        else {
            console.log('failed to get examples data'); 
        }

        return examplesData;
    }
}
