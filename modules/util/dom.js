// @ts-check

/**
 * @param {Partial<HTMLInputElement>} [options]
 * @returns {Promise<File[]>}
 */
export function uploadFile(options) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    Object.assign(input, { type: 'file', ...options });

    input.onchange = () =>
      resolve(Array.from(input.files || []).filter(Boolean));
    input.oncancel = () => resolve([]);
    input.click();
    input.remove();
  });
}
