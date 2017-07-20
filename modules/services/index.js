import serviceMapillary from "./mapillary";
import serviceNominatim from "./nominatim";
import serviceOsm from "./osm";
import serviceTaginfo from "./taginfo";
import serviceWikidata from "./wikidata";
import serviceWikipedia from "./wikipedia";
import serviceImageryOffset from "./imagery_offset";

window.offset = serviceImageryOffset;
export var services = {
  mapillary: serviceMapillary,
  geocoder: serviceNominatim,
  osm: serviceOsm,
  taginfo: serviceTaginfo,
  wikidata: serviceWikidata,
  wikipedia: serviceWikipedia,
  imageryOffset: serviceImageryOffset
};
