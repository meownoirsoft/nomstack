import { writable } from 'svelte/store';

const notifications = writable([]);

function createNotification(type, message, timeout = 4000) {
  const id = crypto.randomUUID();
  return { id, type, message, timeout };
}

export function notify(type, message, timeout) {
  const notification = createNotification(type, message, timeout);
  notifications.update((current) => [...current, notification]);

  if (notification.timeout > 0) {
    setTimeout(() => {
      notifications.update((current) => current.filter((item) => item.id !== notification.id));
    }, notification.timeout);
  }
}

export function notifyError(message, timeout = 4000) {
  notify('error', message, timeout);
}

export function notifySuccess(message, timeout = 3000) {
  notify('success', message, timeout);
}

export function dismissNotification(id) {
  notifications.update((current) => current.filter((item) => item.id !== id));
}

export default notifications;
