/**
 * Entry point for the iD editor (Vite dev and build).
 * In dev, Vite serves this and transforms on the fly; in build, this is bundled to dist/iD.min.js.
 */
import './css/entry.css';
import './modules/id.js';

const container = document.getElementById('id-container');

function init(): void {
  if (!container) return;

  if (typeof iD === 'undefined' || !iD.utilDetect().support) {
    container.innerHTML = 'Sorry, your browser is not currently supported. Please use another <a href="https://github.com/openstreetmap/iD#basics">browser</a> or <a href="https://wiki.openstreetmap.org/wiki/Editors">editor</a> to contribute to the map.';
    container.style.padding = '20px';
    return;
  }

  const assetBase = import.meta.env.DEV ? 'dist/' : '';
  const context = iD.coreContext()
    .assetPath(assetBase)
    .containerNode(container);
  if (!context) return;

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
