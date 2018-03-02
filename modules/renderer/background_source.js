import _clone from 'lodash-es/clone';
import _some from 'lodash-es/some';

import {
  geoArea as d3_geoArea,
  geoMercatorRaw as d3_geoMercatorRaw
} from 'd3-geo';

import { t } from '../util/locale';
import { geoExtent, geoPolygonIntersectsPolygon } from '../geo';
import { jsonpRequest } from '../util/jsonp_request';
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

function getEPSG3857XY(x, y, z) {
    //polyfill for IE11, PhantomJS
    var sinh = Math.sinh || function(x) {
        var y = Math.exp(x);
        return (y - 1 / y) / 2;
    };

    var zoomSize = Math.pow(2, z);
    var lon = x / zoomSize * Math.PI * 2 - Math.PI;
    var lat = Math.atan(sinh(Math.PI * (1 - 2 * y / zoomSize)));
    var mercCoords = d3_geoMercatorRaw(lon, lat);
    return {
        x: 20037508.34 / Math.PI * mercCoords[0],
        y: 20037508.34 / Math.PI * mercCoords[1]
    };
}


export function rendererBackgroundSource(data) {
    var source = _clone(data);
    var offset = [0, 0];
    var name = source.name;
    var description = source.description;
    var best = !!source.best;
    var template = source.template;

    source.scaleExtent = data.scaleExtent || [0, 22];
    source.overzoom = data.overzoom !== false;


    source.offset = function(_) {
        if (!arguments.length) return offset;
        offset = _;
        return source;
    };


    source.nudge = function(_, zoomlevel) {
        offset[0] += _[0] / Math.pow(2, zoomlevel);
        offset[1] += _[1] / Math.pow(2, zoomlevel);
        return source;
    };


    source.name = function() {
        var id_safe = source.id.replace('.', '<TX_DOT>');
        return t('imagery.' + id_safe + '.name', { default: name });
    };


    source.description = function() {
        var id_safe = source.id.replace('.', '<TX_DOT>');
        return t('imagery.' + id_safe + '.description', { default: description });
    };


    source.best = function() {
        return best;
    };


    source.area = function() {
        if (!data.polygon) return Number.MAX_VALUE;  // worldwide
        var area = d3_geoArea({ type: 'MultiPolygon', coordinates: [ data.polygon ] });
        return isNaN(area) ? 0 : area;
    };


    source.imageryUsed = function() {
        return name || source.id;
    };


    source.template = function(_) {
        if (!arguments.length) return template;
        if (source.id === 'custom') template = _;
        return source;
    };


    source.url = function(coord) {
        if (this.type === 'wms') {
            var minXmaxY = getEPSG3857XY(coord[0], coord[1], coord[2]);
            var maxXminY = getEPSG3857XY(coord[0]+1, coord[1]+1, coord[2]);
            return template
                .replace('{width}', 256)
                .replace('{height}', 256)
                .replace('{proj}', this.projection)
                .replace('{bbox}', minXmaxY.x + ',' + maxXminY.y + ',' + maxXminY.x + ',' + minXmaxY.y);
        }
        return template
            .replace('{x}', coord[0])
            .replace('{y}', coord[1])
            // TMS-flipped y coordinate
            .replace(/\{[t-]y\}/, Math.pow(2, coord[2]) - coord[1] - 1)
            .replace(/\{z(oom)?\}/, coord[2])
            .replace(/\{switch:([^}]+)\}/, function(s, r) {
                var subdomains = r.split(',');
                return subdomains[(coord[0] + coord[1]) % subdomains.length];
            })
            .replace('{u}', function() {
                var u = '';
                for (var zoom = coord[2]; zoom > 0; zoom--) {
                    var b = 0;
                    var mask = 1 << (zoom - 1);
                    if ((coord[0] & mask) !== 0) b++;
                    if ((coord[1] & mask) !== 0) b += 2;
                    u += b.toString();
                }
                return u;
            });
    };


    source.intersects = function(extent) {
        extent = extent.polygon();
        return !data.polygon || data.polygon.some(function(polygon) {
            return geoPolygonIntersectsPolygon(polygon, extent, true);
        });
    };


    source.validZoom = function(z) {
        return source.scaleExtent[0] <= z &&
            (source.overzoom || source.scaleExtent[1] > z);
    };


    source.isLocatorOverlay = function() {
        return source.id === 'mapbox_locator_overlay';
    };


    /* hides a source from the list, but leaves it available for use */
    source.isHidden = function() {
        return source.id === 'DigitalGlobe-Premium-vintage' ||
            source.id === 'DigitalGlobe-Standard-vintage';
    };


    source.copyrightNotices = function() {};


    source.getMetadata = function(center, tileCoord, callback) {
        var vintage = {
            start: localeDateString(source.startDate),
            end: localeDateString(source.endDate)
        };
        vintage.range = vintageRange(vintage);

        var metadata = { vintage: vintage };
        callback(null, metadata);
    };


    return source;
}


rendererBackgroundSource.Bing = function(data, dispatch) {
    // http://msdn.microsoft.com/en-us/library/ff701716.aspx
    // http://msdn.microsoft.com/en-us/library/ff701701.aspx

    data.template = 'https://ecn.t{switch:0,1,2,3}.tiles.virtualearth.net/tiles/a{u}.jpeg?g=587&mkt=en-gb&n=z';

    var bing = rendererBackgroundSource(data),
        key = 'Arzdiw4nlOJzRwOz__qailc8NiR31Tt51dN2D7cm57NrnceZnCpgOkmJhNpGoppU', // Same as P2 and JOSM
        url = 'https://dev.virtualearth.net/REST/v1/Imagery/Metadata/Aerial?include=ImageryProviders&key=' +
            key + '&jsonp={callback}',
        cache = {},
        inflight = {},
        providers = [];

    jsonpRequest(url, function(json) {
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
    });


    bing.copyrightNotices = function(zoom, extent) {
        zoom = Math.min(zoom, 21);
        return providers.filter(function(provider) {
            return _some(provider.areas, function(area) {
                return extent.intersects(area.extent) &&
                    area.zoom[0] <= zoom &&
                    area.zoom[1] >= zoom;
            });
        }).map(function(provider) {
            return provider.attribution;
        }).join(', ');
    };


    bing.getMetadata = function(center, tileCoord, callback) {
        var tileId = tileCoord.slice(0, 3).join('/'),
            zoom = Math.min(tileCoord[2], 21),
            centerPoint = center[1] + ',' + center[0],  // lat,lng
            url = 'https://dev.virtualearth.net/REST/v1/Imagery/Metadata/Aerial/' + centerPoint +
                '?zl=' + zoom + '&key=' + key + '&jsonp={callback}';

        if (inflight[tileId]) return;

        if (!cache[tileId]) {
            cache[tileId] = {};
        }
        if (cache[tileId] && cache[tileId].metadata) {
            return callback(null, cache[tileId].metadata);
        }

        inflight[tileId] = true;
        jsonpRequest(url, function(result) {
            delete inflight[tileId];

            var err = (!result && 'Unknown Error') || result.errorDetails;
            if (err) {
                return callback(err);
            } else {
                var vintage = {
                    start: localeDateString(result.resourceSets[0].resources[0].vintageStart),
                    end: localeDateString(result.resourceSets[0].resources[0].vintageEnd)
                };
                vintage.range = vintageRange(vintage);

                var metadata = { vintage: vintage };
                cache[tileId].metadata = metadata;
                return callback(null, metadata);
            }
        });
    };


    bing.terms_url = 'https://blog.openstreetmap.org/2010/11/30/microsoft-imagery-details';


    return bing;
};



rendererBackgroundSource.Esri = function(data) {

    // don't request blank tiles, instead overzoom real tiles - #4327
    // deprecated technique, but it works (for now)
    if (data.template.match(/blankTile/) === null) {
        data.template = data.template + '?blankTile=false';
    }

    var esri = rendererBackgroundSource(data),
        cache = {},
        inflight = {};

    esri.getMetadata = function(center, tileCoord, callback) {
        var tileId = tileCoord.slice(0, 3).join('/'),
            zoom = Math.min(tileCoord[2], esri.scaleExtent[1]),
            centerPoint = center[0] + ',' + center[1],  // long, lat (as it should be)
            unknown = t('info_panels.background.unknown'),
            metadataLayer,
            vintage = {},
            metadata = {};

        if (inflight[tileId]) return;

        switch (true) {
            case (zoom >= 20 && esri.id === 'EsriWorldImageryClarity'):
                metadataLayer = 4;
                break;
            case zoom >= 19:
                metadataLayer = 3;
                break;
            case zoom >= 17:
                metadataLayer = 2;
                break;
            case zoom >= 13:
                metadataLayer = 0;
                break;
            default:
                metadataLayer = 99;
        }

        var url;
        // build up query using the layer appropriate to the current zoom
        if (esri.id === 'EsriWorldImagery') {
            url = 'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/';
        } else if (esri.id === 'EsriWorldImageryClarity') {
            url = 'https://serviceslab.arcgisonline.com/arcgis/rest/services/Clarity_World_Imagery/MapServer/';
        }

        url += metadataLayer + '/query?returnGeometry=false&geometry=' + centerPoint + '&inSR=4326&geometryType=esriGeometryPoint&outFields=*&f=json&callback={callback}';

        if (!cache[tileId]) {
            cache[tileId] = {};
        }
        if (cache[tileId] && cache[tileId].metadata) {
            return callback(null, cache[tileId].metadata);
        }

        // accurate metadata is only available >= 13
        if (metadataLayer === 99) {
            vintage = {
                start: null,
                end: null,
                range: null
            };
            metadata = {
                vintage: null,
                source: unknown,
                description: unknown,
                resolution: unknown,
                accuracy: unknown
            };

            callback(null, metadata);

        } else {
            inflight[tileId] = true;
            jsonpRequest(url, function(result) {
                delete inflight[tileId];

                var err;
                if (!result) {
                    err = 'Unknown Error';
                } else if (result.features && result.features.length < 1) {
                    err = 'No Results';
                } else if (result.error && result.error.message) {
                    err = result.error.message;
                }

                if (err) {
                    return callback(err);
                } else {
                    // pass through the discrete capture date from metadata
                    var captureDate = localeDateString(result.features[0].attributes.SRC_DATE2);
                    vintage = {
                        start: captureDate,
                        end: captureDate,
                        range: captureDate
                    };
                    metadata = {
                        vintage: vintage,
                        source: clean(result.features[0].attributes.NICE_NAME),
                        description: clean(result.features[0].attributes.NICE_DESC),
                        resolution: clean(result.features[0].attributes.SRC_RES),
                        accuracy: clean(result.features[0].attributes.SRC_ACC)
                    };

                    // append units - meters
                    if (isFinite(metadata.resolution)) {
                        metadata.resolution += ' m';
                    }
                    if (isFinite(metadata.accuracy)) {
                        metadata.accuracy += ' m';
                    }

                    cache[tileId].metadata = metadata;
                    return callback(null, metadata);
                }
            });
        }


        function clean(val) {
            return String(val).trim() || unknown;
        }
    };

    return esri;
};


rendererBackgroundSource.None = function() {
    var source = rendererBackgroundSource({ id: 'none', template: '' });


    source.name = function() {
        return t('background.none');
    };


    source.imageryUsed = function() {
        return 'None';
    };


    source.area = function() {
        return -1;  // sources in background pane are sorted by area
    };


    return source;
};


rendererBackgroundSource.Custom = function(template) {
    var source = rendererBackgroundSource({ id: 'custom', template: template });


    source.name = function() {
        return t('background.custom');
    };


    source.imageryUsed = function() {
        return 'Custom (' + source.template() + ')';
    };


    source.area = function() {
        return -2;  // sources in background pane are sorted by area
    };


    return source;
};
