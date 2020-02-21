import * as d3 from 'd3';  // remove someday, see #4379
export { d3 };

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
export * from './ui/settings/index';
export * from './ui/index';
export * from './util/index';
export * from './validations/index';

/* export some legacy symbols: */
import { services } from './services/index';
var Connection = services.osm;
export { Connection };
export { coreContext as Context } from './core/context';
export { osmSetAreaKeys as setAreaKeys, osmAreaKeys as areaKeys } from './osm/tags';
export { coreDifference as Difference } from './core/difference';
export { coreGraph as Graph } from './core/graph';
export { coreHistory as History } from './core/history';
export { coreTree as Tree } from './core/tree';
export { geoVecCross as geoCross } from './geo/vector';
export { geoVecInterp as geoInterp } from './geo/vector';
export { geoVecFloor as geoRoundCoordinates } from './geo/vector';
export { geoVecLength as geoEuclideanDistance } from './geo/vector';
export { osmEntity as Entity } from './osm/entity';
export { osmNode as Node } from './osm/node';
export { osmRelation as Relation } from './osm/relation';
export { osmWay as Way } from './osm/way';
export { rendererBackgroundSource as BackgroundSource } from './renderer/background_source';
export { rendererBackground as Background } from './renderer/background';
export { rendererFeatures as Features } from './renderer/features';
export { rendererMap as Map } from './renderer/map';
export { rendererTileLayer as TileLayer } from './renderer/tile_layer';
export { utilDetect as Detect } from './util/detect';
export { uiPresetEditor as uiPreset } from './ui/preset_editor';

export var debug = false;

