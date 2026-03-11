/**
 * returns true if `child` is visible relative to its
 * scrolling-`parent`.
 */
export function isElementScrolledIntoView(
  child: HTMLElement,
  parent: HTMLElement,
) {
  const parentRect = parent.getBoundingClientRect();
  const childRect = child.getBoundingClientRect();

  return (
    childRect.top >= parentRect.top &&
    childRect.bottom <= parentRect.bottom &&
    childRect.left >= parentRect.left &&
    childRect.right <= parentRect.right
  );
}
