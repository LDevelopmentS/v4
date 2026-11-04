// Safety net for the startup skeleton (css/skeleton.css). If the app's scripts fail to load,
// main.js never ends the loading state, so this plain script ends it after 10 seconds
// instead of leaving the skeleton shimmering forever. It does nothing if the app got there first.
setTimeout(() => {
  document.body.classList.remove('is-loading');
  document.body.removeAttribute('aria-busy');
}, 10000);
// ==========================================
// BASIC DEVELOPER TOOLS / SHORTCUT RESTRICTIONS
// ==========================================

document.addEventListener("keydown", function(e) {

    if (
        e.keyCode === 123 ||
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) ||
        (e.ctrlKey && e.keyCode === 85) ||
        (e.ctrlKey && (e.key === "a" || e.key === "A"))
    ) {
        e.preventDefault();
        return false;
    }

    if (e.ctrlKey && e.shiftKey && e.key === "C") {
        e.preventDefault();
    }

});


// Disable right-click context menu
document.addEventListener("contextmenu", e => e.preventDefault());


// Disable text selection
document.addEventListener("selectstart", e => e.preventDefault());


// Disable dragging
document.addEventListener("dragstart", e => e.preventDefault());
