export function initHelp() {
  const modal = document.getElementById('help-modal');
  const btnOpen = document.getElementById('btn-help');
  const btnClose = document.getElementById('btn-help-close');
  const backdrop = modal?.querySelector('.modal-backdrop');

  if (!modal) return;

  function open() { modal.classList.remove('hidden'); }
  function close() { modal.classList.add('hidden'); }

  btnOpen?.addEventListener('click', open);
  btnClose?.addEventListener('click', close);
  backdrop?.addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) close();
  });
}
