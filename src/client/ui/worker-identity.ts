import type { Net } from '../net';
import { store } from '../state';
import { h, openModal } from './dom';

/** The same identity editor in desktop and phone terminals. */
export function identityButton(net: Net, workerId: string): HTMLElement | null {
  if (!store.me.admin) return null;
  return h('button.btn', {
    type: 'button', 'aria-label': 'Rename worker', title: 'Change this worker’s display name',
    onclick: () => {
      const worker = store.workers.get(workerId);
      if (!worker) return;
      const input = h('input', { type: 'text', 'aria-label': 'Worker name', maxlength: '128', required: true, autocomplete: 'off' }) as HTMLInputElement;
      input.value = worker.name;
      const error = h('p', { role: 'alert' });
      const form = h('form.modal', { role: 'dialog', 'aria-label': 'Rename worker' },
        h('header', {}, h('h2', {}, 'Rename worker')),
        h('div.body', {}, h('label', {}, 'Name and role', input), h('p', {}, 'Changes the display name. Keeps the same worker and history.'), error),
        h('footer', {}, h('button.btn.primary', { type: 'submit' }, 'Save name')),
      );
      const modal = openModal(form);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = input.value.trim().normalize('NFC');
        if (!name || Array.from(name).length > 64 || /[\p{Cc}\p{Cf}]/u.test(name)) {
          error.textContent = 'Use a plain name of 1–64 characters.';
          return;
        }
        net.send({ t: 'worker.rename', workerId, name });
        modal.close();
      });
      input.focus();
      input.select();
    },
  }, '✏️ Name');
}
