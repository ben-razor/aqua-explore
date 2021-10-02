import { elemById, showElem, hideElem, setContent, addClass, removeClass, 
         triggerAnimClass, isLocal  
} from './helpersHTML';

export function setTab(elemID) {
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

export function setOutputTab(elemID) {
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

export function resetOutput() {
    setContent('playground-run-output-text', 'Use setOutput in JS to output to this console.');
}

export function initUIHandlers() {
    window['selectTab'] = elem => {
        let elemID = elem.id;
        setTab(elemID)
    }

    window['selectOutputTab'] = elem => {
        let elemID = elem.id;
        setOutputTab(elemID)
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

export function showCompilingOverlay() {
    showElem('playground-compiling-overlay');
    setTimeout(() => {
        // In case something goes wrong with the compile
        hideElem('playground-compiling-overlay');
    }, 10000);
}
