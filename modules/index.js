export * from './actions/index';
export * from './behavior/index';
export * from './core/index';
export * from './geo/index';
export * from './modes/index';
export * from './operations/index';
export * from './osm/index';
export * from './presets/index';
export * from './renderer/index';
export * from './services/index';
export * from './svg/index';
export * from './ui/fields/index';
export * from './ui/intro/index';
export * from './ui/panels/index';
export * from './ui/panes/index';
export * from './ui/sections/index';
export * from './ui/settings/index';
export * from './ui/index';
export * from './util/index';
export * from './validations/index';

// When `debug = true`, we use `Object.freeze` on immutables in iD.
// This is only done in testing because of the performance penalty.
export let debug = false;

/** @param {boolean} newValue */
export const setDebug = (newValue) => { debug = newValue; };
