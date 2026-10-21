// Kleine Event-Drehscheibe: Elemente mit data-action / data-change rufen registrierte Handler auf.

const actions = {};
let renderFn = () => {};

export const register = (handlers) => Object.assign(actions, handlers);
export const setRender = (fn) => { renderFn = fn; };
export const rerender = () => renderFn();

export function installDelegation() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || !actions[el.dataset.action]) return;
    e.preventDefault();
    actions[el.dataset.action](el, e);
  });
  const onChange = (e) => {
    const el = e.target.closest('[data-change]');
    if (el && actions[el.dataset.change]) actions[el.dataset.change](el, e);
  };
  document.addEventListener('change', onChange);
  document.addEventListener('input', (e) => {
    if (e.target.matches('[data-live]')) onChange(e);
  });
}

// Bottom-Sheet
export function openSheet(html, { onClose } = {}) {
  const root = document.getElementById('sheet-root');
  root.innerHTML = `<div class="overlay" data-action="close-sheet"></div>
    <div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  root._onClose = onClose;
  document.body.style.overflow = 'hidden';
}

export function updateSheet(html) {
  const sheet = document.querySelector('#sheet-root .sheet');
  if (!sheet) return;
  const scroll = sheet.scrollTop;
  sheet.innerHTML = `<div class="grab"></div>${html}`;
  sheet.scrollTop = scroll;
}

export function closeSheet() {
  const root = document.getElementById('sheet-root');
  const cb = root._onClose;
  root.innerHTML = '';
  root._onClose = null;
  document.body.style.overflow = '';
  cb?.();
}

register({ 'close-sheet': closeSheet });
