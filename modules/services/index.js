import serviceKeepRight from './keepRight';
import serviceOsmose from './osmose';
import serviceMapillary from './mapillary';
import serviceMapRules from './maprules';
import serviceNominatim from './nominatim';
import serviceNsi from './nsi';
import serviceKartaview from './kartaview';
import serviceVegbilder from './vegbilder';
import serviceOsm from './osm';
import serviceOsmWikibase from './osm_wikibase';
import serviceStreetside from './streetside';
import serviceTaginfo from './taginfo';
import serviceVectorTile from './vector_tile';
import serviceWikidata from './wikidata';
import serviceWikipedia from './wikipedia';
import serviceMapilio from './mapilio';
import servicePanoramax from './panoramax';


export let services = {
  geocoder: serviceNominatim,
  keepRight: serviceKeepRight,
  osmose: serviceOsmose,
  mapillary: serviceMapillary,
  nsi: serviceNsi,
  kartaview: serviceKartaview,
  vegbilder: serviceVegbilder,
  osm: serviceOsm,
  osmWikibase: serviceOsmWikibase,
  maprules: serviceMapRules,
  streetside: serviceStreetside,
  taginfo: serviceTaginfo,
  vectorTile: serviceVectorTile,
  wikidata: serviceWikidata,
  wikipedia: serviceWikipedia,
  mapilio: serviceMapilio,
  panoramax: servicePanoramax
};

export {
  serviceKeepRight,
  serviceOsmose,
  serviceMapillary,
  serviceMapRules,
  serviceNominatim,
  serviceNsi,
  serviceKartaview,
  serviceVegbilder,
  serviceOsm,
  serviceOsmWikibase,
  serviceStreetside,
  serviceTaginfo,
  serviceVectorTile,
  serviceWikidata,
  serviceWikipedia,
  serviceMapilio,
  servicePanoramax
};
