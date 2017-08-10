import serviceMapillary from './mapillary';
import serviceNominatim from './nominatim';
import serviceOsm from './osm';
import serviceTaginfo from './taginfo';
import serviceWikidata from './wikidata';
import serviceWikipedia from './wikipedia';

export var services = {
    mapillary: serviceMapillary,
    geocoder: serviceNominatim,
    osm: serviceOsm,
    taginfo: serviceTaginfo,
    wikidata: serviceWikidata,
    wikipedia: serviceWikipedia
};

export {
    serviceMapillary,
    serviceNominatim,
    serviceOsm,
    serviceTaginfo,
    serviceWikidata,
    serviceWikipedia
};
