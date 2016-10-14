import serviceMapillary from './mapillary';
import serviceNominatim from './nominatim';
import serviceTaginfo from './taginfo';
import serviceWikidata from './wikidata';
import serviceWikipedia from './wikipedia';

export var services = {
    mapillary: serviceMapillary,
    nominatim: serviceNominatim,
    taginfo: serviceTaginfo,
    wikidata: serviceWikidata,
    wikipedia: serviceWikipedia
};
