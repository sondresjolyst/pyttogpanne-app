import '@testing-library/jest-dom/vitest';

// The API clients refuse to start without it, as they do in a real build.
process.env.NEXT_PUBLIC_API_URL = 'http://api.test/api';

// jsdom has no modal dialog support, which the app-kit ConfirmDialog needs.
HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
};
