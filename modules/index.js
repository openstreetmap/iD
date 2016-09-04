import * as actions from './actions/index';
import * as behavior from './behavior/index';
import * as geo from './geo/index';
import * as modes from './modes/index';
import * as operations from './operations/index';
import * as presets from './presets/index';
import * as services from './services/index';
import * as svg from './svg/index';
import * as ui from './ui/index';
import * as util from './util/index';
import * as validations from './validations/index';

// detect
export { Detect } from './util/detect';

// core
export { Connection } from './core/connection';
export { Context } from './core/context';
export { Difference } from './core/difference';
export { Entity } from './core/entity';
export { Graph } from './core/graph';
export { History } from './core/history';
export { Node } from './core/node';
export { Relation } from './core/relation';
export { oneWayTags, pavedTags, interestingTag } from './core/tags';
export { Tree } from './core/tree';
export { Way } from './core/way';

// renderer
export { BackgroundSource } from './renderer/background_source';
export { Background } from './renderer/background';
export { Features } from './renderer/features';
export { Map } from './renderer/map';
export { TileLayer } from './renderer/tile_layer';

import * as data from '../data/index.js';

export var debug = false;
import * as d3 from 'd3';

export {
  d3,
  data,
  actions,
  geo,
  behavior,
  modes,
  operations,
  presets,
  services,
  svg,
  util,
  ui,
  validations
};
