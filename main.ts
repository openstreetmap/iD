/**
 * Standalone app bootstrap.
 *
 * Loaded only by the standalone iD page, after the iD library (`iD.min.js`,
 * built from `lib.ts`) has set `window.iD`. Embedders do not load this file;
 * they create and configure their own `coreContext`.
 */
const container = document.getElementById('id-container');

function init(): void {
  if (!container) return;

  if (typeof iD === 'undefined' || !iD.utilDetect().support) {
    container.innerHTML = 'Sorry, your browser is not currently supported. Please use another <a href="https://github.com/openstreetmap/iD#basics">browser</a> or <a href="https://wiki.openstreetmap.org/wiki/Editors">editor</a> to contribute to the map.';
    container.style.padding = '20px';
    return;
  }

  const assetBase = import.meta.env.DEV ? 'dist/' : '';
  // `containerNode` is a GetSet; with an argument it returns the context, but TS widens to the getter union.
  const context = iD.coreContext()
    .assetPath(assetBase)
    .containerNode(container) as iD.Context;

  if (import.meta.env.DEV) {
    window.context = context;
    window.id = context;
  }
  context.init();

  const q = iD.utilStringQs(window.location.hash);
  if (!Object.prototype.hasOwnProperty.call(q, 'disable_features')) {
    context.features().disable('boundaries');
  }
}

init();
