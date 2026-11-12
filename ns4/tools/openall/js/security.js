// Security Scripts (inherited from the original page)
export function init() {
  document.addEventListener("keydown", function (e) {
    if (e.keyCode === 123 || (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) || (e.ctrlKey && e.keyCode === 85)) {
      e.preventDefault();
    }
    if (e.ctrlKey && e.shiftKey && e.key === "C") {
      e.preventDefault();
    }
  });
  document.addEventListener("contextmenu", e => e.preventDefault());
}
