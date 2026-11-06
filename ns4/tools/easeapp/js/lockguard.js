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

// ==========================================
// ALLOW PASTING (CTRL + V)
// ==========================================

// Allow Ctrl + V and Ctrl + Shift + V
document.addEventListener("keydown", function(e) {
    if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "v"
    ) {
        e.stopImmediatePropagation();
    }
}, true);

// Allow paste events
document.addEventListener("paste", function(e) {
    e.stopImmediatePropagation();
}, true);

// Allow paste through context menu
document.addEventListener("contextmenu", function(e) {
    e.stopImmediatePropagation();
}, true);
