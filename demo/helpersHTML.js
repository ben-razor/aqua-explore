export function elemById(id) {
    return document.getElementById(id);
}
export function showElem(id) {
    let elem = elemById(id);
    if(elem) {
        elem.style.display = 'initial';
    }
    else {
        console.log(`Error: showElem called on missing elem ${id}`);
    }
}
export function hideElem(id) {
    let elem = elemById(id);
    if(elem) {
        elem.style.display = 'none';
    }
    else {
        console.log(`Error: hideElem called on missing elem ${id}`);
    }
}
export function setContent(id, text) {
    let elem = elemById(id);
    if(elem) {
        elem.innerHTML = text;
    }
    else {
        console.log(`Error: setContent called on missing elem ${id}`);
    }
}
export function addClass(id, className) {
    let elem = elemById(id);
    if(elem) {
        elem.classList.add(className);
    }
    else {
        console.log(`Error: addClass called on missing elem ${id}`);
    }
}
export function removeClass(id, className) {
    let elem = elemById(id);
    if(elem) {
        elem.classList.remove(className);
    }
    else {
        console.log(`Error: removeClass called on missing elem ${id}`);
    }
}
export function triggerAnimClass(id, className) {
    let elem = elemById(id);
    removeClass(id, className);
    setTimeout(() => { 
        addClass(id, className); 
        if(elem) {
            elem.addEventListener('animationend', () => {
                removeClass(id, className);
            })
        }
        else {
            console.log(`Error: triggerAnimClass called on missing elem ${id}`);
        }
    }, 1);
}
export function isLocal() {
    return window.location.href.includes('localhost');
}
