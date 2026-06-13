/**
 * Library entry for the iD editor.
 *
 * Bundles the iD library (which exposes `window.iD`) together with the
 * stylesheet, producing `dist/iD.min.js` + `dist/iD.css`. Embedders (e.g. the
 * openstreetmap-website) load these two files and bootstrap iD themselves.
 *
 * The standalone page additionally loads `main.ts` (see `bootstrap.js`).
 */
import './css/entry.css';
import './modules/id.js';
