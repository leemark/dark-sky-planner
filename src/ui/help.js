let helpOpener = null; // element that triggered open, for focus restore

function getFocusable(container) {
  return Array.from(container.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  ));
}

export function initHelp() {
  const modal = document.getElementById('help-modal');
  const btnOpen = document.getElementById('btn-help');
  const btnClose = document.getElementById('btn-help-close');
  const backdrop = modal?.querySelector('.modal-backdrop');

  if (!modal) return;

  function open() {
    helpOpener = document.activeElement;
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    const first = getFocusable(modal)[0];
    first?.focus();
  }

  function close() {
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
    helpOpener?.focus();
    helpOpener = null;
  }

  // Focus trap: keep Tab/Shift-Tab inside the modal
  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = getFocusable(modal);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  btnOpen?.addEventListener('click', open);
  btnClose?.addEventListener('click', close);
  backdrop?.addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) close();
  });
}
