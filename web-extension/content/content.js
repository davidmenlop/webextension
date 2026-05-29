console.log('[Content] CARGADO en:', window.location.href);
console.log('[Content] Equal selector:', CONFIG.EQUAL_INPUT_SELECTOR);
console.log('[Content] Contain selector:', CONFIG.CONTAIN_INPUT_SELECTOR);

var pendingCodCliente = null;
var pendingName = null;

function injectValue (input, value) {
  console.log('[Content] Inyectando "' + value + '" en input');
  var setter = Object.getOwnPropertyDescriptor(
    input.ownerDocument.defaultView.HTMLInputElement.prototype, 'value'
  ).set;
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'Enter', keyCode: 13, which: 13, bubbles: true
  }));
  console.log('[Content] Inyeccion completa');
}

function tryInjectEqual () {
  if (!pendingCodCliente) return;
  var input = document.querySelector(CONFIG.EQUAL_INPUT_SELECTOR);
  console.log('[Content] tryInjectEqual - input:', !!input);
  if (!input) return;
  injectValue(input, pendingCodCliente);
  pendingCodCliente = null;
  pendingName = null;
}

function tryInjectContain () {
  if (!pendingName) return;
  var input = document.querySelector(CONFIG.CONTAIN_INPUT_SELECTOR);
  console.log('[Content] tryInjectContain - input:', !!input);
  if (!input) return;
  injectValue(input, pendingName);
  pendingName = null;
  pendingCodCliente = null;
}

function tryInject () {
  tryInjectEqual();
  tryInjectContain();
}

var observer = new MutationObserver(function () {
  tryInject();
});
observer.observe(document.body, { childList: true, subtree: true });
console.log('[Content] Observer iniciado');

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  console.log('[Content] Mensaje:', JSON.stringify(msg));
  if (msg.action === 'fillCodCliente') {
    pendingCodCliente = msg.codCliente;
    pendingName = msg.name;
    console.log('[Content] pendiente codCliente:', pendingCodCliente, 'nombre:', pendingName);
    tryInject();
    sendResponse({ success: true });
  }
  return true;
});
