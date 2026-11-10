// Tiny DOM helper shared by the S&I modules. Text always goes in as textContent (never innerHTML).
export function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
