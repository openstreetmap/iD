export * from './actions/index';
export * from './behavior/index';
export * from './core/index';
export * from '../data/index.js';
export * from './geo/index';
export * from './modes/index';
export * from './operations/index';
export * from './presets/index';
export * from './renderer/index';
export * from './services/index';
export * from './svg/index';
export * from './ui/fields/index';
export * from './ui/intro/index';
export * from './ui/index';
export * from './util/index';
export * from './lib/index';
export * from './validations/index';

/* export some legacy symbols: */
export { coreConnection as Connection } from './core/connection';
export { coreContext as Context, setAreaKeys } from './core/context';
export { coreDifference as Difference } from './core/difference';
export { coreEntity as Entity } from './core/entity';
export { coreGraph as Graph } from './core/graph';
export { coreHistory as History } from './core/history';
export { coreNode as Node } from './core/node';
export { coreRelation as Relation } from './core/relation';
export { coreTree as Tree } from './core/tree';
export { coreWay as Way } from './core/way';
export { rendererBackgroundSource as BackgroundSource } from './renderer/background_source';
export { rendererBackground as Background } from './renderer/background';
export { rendererFeatures as Features } from './renderer/features';
export { rendererMap as Map } from './renderer/map';
export { rendererTileLayer as TileLayer } from './renderer/tile_layer';
export { utilDetect as Detect } from './util/detect';

export var debug = false;

import * as d3 from 'd3';
import * as lib from './lib/index';

export { d3, lib };
