async function getExamples() {
    let success = true;
    let j;

    try {
        let r = await fetch('https://storage.googleapis.com/birdfeed-01000101.appspot.com/examples_2.json');
        j = await r.json();
    }
    catch(e) {
        success = false;
    }

    return { success: success, examplesData: j};
}

export { getExamples };