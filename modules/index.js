import * as actions from './actions/index';
import * as behavior from './behavior/index';
import * as data from '../data/index.js';
import * as geo from './geo/index';
import * as modes from './modes/index';
import * as operations from './operations/index';
import * as presets from './presets/index';
import * as services from './services/index';
import * as svg from './svg/index';
import * as ui from './ui/index';
import * as util from './util/index';
import * as lib from './lib/index';
import * as validations from './validations/index';

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
export {
    coreOneWayTags as oneWayTags,
    corePavedTags as pavedTags,
    coreInterestingTag as interestingTag
} from './core/tags';

export { rendererBackgroundSource as BackgroundSource } from './renderer/background_source';
export { rendererBackground as Background } from './renderer/background';
export { rendererFeatures as Features } from './renderer/features';
export { rendererMap as Map } from './renderer/map';
export { rendererTileLayer as TileLayer } from './renderer/tile_layer';

export { utilDetect as Detect } from './util/detect';

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
    lib,
    ui,
    validations
};
