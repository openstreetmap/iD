import { geoArea as d3_geoArea, geoMercatorRaw as d3_geoMercatorRaw } from 'd3-geo';
import { json as d3_json } from 'd3-fetch';

import { t } from '../util/locale';
import { geoExtent } from '../geo';
import { utilDetect } from '../util/detect';


function localeDateString(s) {
    if (!s) return null;
    var detected = utilDetect();
    var options = { day: 'numeric', month: 'short', year: 'numeric' };
    var d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString(detected.locale, options);
}

function vintageRange(vintage) {
    var s;
    if (vintage.start || vintage.end) {
        s = (vintage.start || '?');
        if (vintage.start !== vintage.end) {
            s += ' - ' + (vintage.end || '?');
        }
    }
    return s;
}


export function rendererTaskingManager(data) {
    var source = Object.assign({}, data);   // shallow copy

    var name = source.name;
    var description = source.description;

    source.tileSize = data.tileSize || 256;
    source.zoomExtent = data.zoomExtent || [0, 22];
    source.overzoom = data.overzoom !== false;


    source.name = function() {
        var id_safe = source.id.replace(/\./g, '<TX_DOT>');
        return t('manager.' + id_safe + '.name', { default: name });
    };


    source.description = function() {
        var id_safe = source.id.replace(/\./g, '<TX_DOT>');
        return t('manager.' + id_safe + '.description', { default: description });
    };


    // source.best = function() {
    //     return best;
    // };


    // source.template = function(_) {
    //     if (!arguments.length) return template;
    //     if (source.id === 'custom') template = _;
    //     return source;
    // };


    // source.url = function() {
    // };


    // source.validZoom = function(z) {
    //     return source.zoomExtent[0] <= z &&
    //         (source.overzoom || source.zoomExtent[1] > z);
    // };


    // source.isLocatorOverlay = function() {
    //     return source.id === 'mapbox_locator_overlay';
    // };


    // /* hides a source from the list, but leaves it available for use */
    // source.isHidden = function() {
    //     return source.id === 'DigitalGlobe-Premium-vintage' ||
    //         source.id === 'DigitalGlobe-Standard-vintage';
    // };


    // source.copyrightNotices = function() {};


    // source.getMetadata = function(center, tileCoord, callback) {
    //     var vintage = {
    //         start: localeDateString(source.startDate),
    //         end: localeDateString(source.endDate)
    //     };
    //     vintage.range = vintageRange(vintage);

    //     var metadata = { vintage: vintage };
    //     callback(null, metadata);
    // };


    return source;
}


rendererTaskingManager.Bing = function(data, dispatch) {
    // http://msdn.microsoft.com/en-us/library/ff701716.aspx
    // http://msdn.microsoft.com/en-us/library/ff701701.aspx

    data.template = 'https://ecn.t{switch:0,1,2,3}.tiles.virtualearth.net/tiles/a{u}.jpeg?g=587&mkt=en-gb&n=z';

    var bing = rendererTaskingManager(data);
    // var key = 'Arzdiw4nlOJzRwOz__qailc8NiR31Tt51dN2D7cm57NrnceZnCpgOkmJhNpGoppU'; // P2, JOSM, etc
    var key = 'Ak5oTE46TUbjRp08OFVcGpkARErDobfpuyNKa-W2mQ8wbt1K1KL8p1bIRwWwcF-Q';    // iD


    var url = 'https://dev.virtualearth.net/REST/v1/Imagery/Metadata/Aerial?include=ImageryProviders&key=' + key;
    var cache = {};
    var inflight = {};
    var providers = [];

    d3_json(url)
        .then(function(json) {
            providers = json.resourceSets[0].resources[0].imageryProviders.map(function(provider) {
                return {
                    attribution: provider.attribution,
                    areas: provider.coverageAreas.map(function(area) {
                        return {
                            zoom: [area.zoomMin, area.zoomMax],
                            extent: geoExtent([area.bbox[1], area.bbox[0]], [area.bbox[3], area.bbox[2]])
                        };
                    })
                };
            });
            dispatch.call('change');
        })
        .catch(function() {
            /* ignore */
        });


    bing.copyrightNotices = function(zoom, extent) {
        zoom = Math.min(zoom, 21);
        return providers.filter(function(provider) {
            return provider.areas.some(function(area) {
                return extent.intersects(area.extent) &&
                    area.zoom[0] <= zoom &&
                    area.zoom[1] >= zoom;
            });
        }).map(function(provider) {
            return provider.attribution;
        }).join(', ');
    };


    bing.getMetadata = function(center, tileCoord, callback) {
        var tileID = tileCoord.slice(0, 3).join('/');
        var zoom = Math.min(tileCoord[2], 21);
        var centerPoint = center[1] + ',' + center[0];  // lat,lng
        var url = 'https://dev.virtualearth.net/REST/v1/Imagery/Metadata/Aerial/' + centerPoint +
                '?zl=' + zoom + '&key=' + key;

        if (inflight[tileID]) return;

        if (!cache[tileID]) {
            cache[tileID] = {};
        }
        if (cache[tileID] && cache[tileID].metadata) {
            return callback(null, cache[tileID].metadata);
        }

        inflight[tileID] = true;
        d3_json(url)
            .then(function(result) {
                delete inflight[tileID];
                if (!result) {
                    throw new Error('Unknown Error');
                }
                var vintage = {
                    start: localeDateString(result.resourceSets[0].resources[0].vintageStart),
                    end: localeDateString(result.resourceSets[0].resources[0].vintageEnd)
                };
                vintage.range = vintageRange(vintage);

                var metadata = { vintage: vintage };
                cache[tileID].metadata = metadata;
                if (callback) callback(null, metadata);
            })
            .catch(function(err) {
                delete inflight[tileID];
                if (callback) callback(err.message);
            });
    };


    bing.terms_url = 'https://blog.openstreetmap.org/2010/11/30/microsoft-imagery-details';


    return bing;
};


rendererTaskingManager.None = function() {
    var source = rendererTaskingManager({ id: 'none' });


    source.name = function() {
        return t('tasking.none.name');
    };


    return source;
};


rendererTaskingManager.Custom = function() {
    var source = rendererTaskingManager({ id: 'custom' });


    source.name = function() {
        return t('tasking.custom.name');
    };


    return source;
};
