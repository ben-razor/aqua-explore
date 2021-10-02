export function elemById(id) {
    return document.getElementById(id);
}
export function showElem(id) {
    elemById(id).style.display = 'initial';
}
export function hideElem(id) {
    elemById(id).style.display = 'none';
}
export function setContent(id, text) {
    elemById(id).innerHTML = text;
}
export function addClass(elemID, className) {
    elemById(elemID).classList.add(className);
}
export function removeClass(elemID, className) {
    elemById(elemID).classList.remove(className);
}
export function triggerAnimClass(elemID, className) {
    removeClass(elemID, className);
    setTimeout(() => { 
        addClass(elemID, className); 
        elemById(elemID).addEventListener('animationend', () => {
            removeClass(elemID, className);
        })
    }, 1);
}
export function isLocal() {
    return window.location.href.includes('localhost');
}
