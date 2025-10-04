import { writable } from 'svelte/store';

// Global modal state
export const modalStore = writable({
  isOpen: false,
  type: null,
  data: null
});

// Modal types
export const MODAL_TYPES = {
  MOBILE_MENU: 'mobile_menu'
};

// Actions
export function openModal(type, data = null) {
  modalStore.set({
    isOpen: true,
    type,
    data
  });
}

export function closeModal() {
  modalStore.set({
    isOpen: false,
    type: null,
    data: null
  });
}

export function toggleModal(type, data = null) {
  modalStore.update(current => {
    if (current.isOpen && current.type === type) {
      return {
        isOpen: false,
        type: null,
        data: null
      };
    } else {
      return {
        isOpen: true,
        type,
        data
      };
    }
  });
}
