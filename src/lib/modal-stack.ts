/**
 * Tracks open overlays so only the top-most reacts to Escape / traps focus,
 * and the page behind is made inert and scroll-locked exactly once.
 */
const stack: symbol[] = [];

function sync() {
  const app = document.getElementById('app');
  const locked = stack.length > 0;
  document.documentElement.style.overflow = locked ? 'hidden' : '';
  if (app) {
    if (locked) app.setAttribute('inert', '');
    else app.removeAttribute('inert');
  }
}

export function pushOverlay(): symbol {
  const id = Symbol('overlay');
  stack.push(id);
  sync();
  return id;
}

export function popOverlay(id: symbol) {
  const index = stack.indexOf(id);
  if (index !== -1) stack.splice(index, 1);
  sync();
}

export const isTopOverlay = (id: symbol) => stack[stack.length - 1] === id;
