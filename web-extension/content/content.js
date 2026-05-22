function injectValue (input, value) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    input.ownerDocument.defaultView.HTMLInputElement.prototype, 'value'
  ).set;

  nativeInputValueSetter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true
  }));
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== 'fillCodCliente') return;

  let resolved = false;

  const timeout = setTimeout(() => {
    if (resolved) return;
    resolved = true;
    observer.disconnect();
    sendResponse({ success: false, error: 'Timeout esperando el input de filtro' });
  }, 15000);

  const observer = new MutationObserver(() => {
    const wrapper = document.querySelector(
      CONFIG.SEARCH_INPUT_SELECTOR
    );
    if (!wrapper) return;

    clearTimeout(timeout);
    resolved = true;
    observer.disconnect();
    injectValue(wrapper, msg.value);
    sendResponse({ success: true });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  return true;
});
