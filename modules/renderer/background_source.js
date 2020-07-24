import { geoArea as d3_geoArea, geoMercatorRaw as d3_geoMercatorRaw } from 'd3-geo';
import { json as d3_json } from 'd3-fetch';

import { t, localizer } from '../core/localizer';
import { geoExtent, geoSphericalDistance } from '../geo';
import { utilQsString, utilStringQs } from '../util';
import { utilAesDecrypt } from '../util/aes';


var isRetina = window.devicePixelRatio && window.devicePixelRatio >= 2;

// listen for DPI change, e.g. when dragging a browser window from a retina to non-retina screen
window.matchMedia(`
        (-webkit-min-device-pixel-ratio: 2), /* Safari */
        (min-resolution: 2dppx),             /* standard */
        (min-resolution: 192dpi)             /* fallback */
    `).addListener(function() {

    isRetina = window.devicePixelRatio && window.devicePixelRatio >= 2;
});


function localeDateString(s) {
    if (!s) return null;
    var options = { day: 'numeric', month: 'short', year: 'numeric' };
    var d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString(localizer.localeCode(), options);
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


export function rendererBackgroundSource(data) {
    var source = Object.assign({}, data);   // shallow copy
    var _offset = [0, 0];
    var _name = source.name;
    var _description = source.description;
    var _best = !!source.best;
    var _template = source.encrypted ? utilAesDecrypt(source.template) : source.template;

    source.tileSize = data.tileSize || 256;
    source.zoomExtent = data.zoomExtent || [0, 22];
    source.overzoom = data.overzoom !== false;

    source.offset = function(val) {
        if (!arguments.length) return _offset;
        _offset = val;
        return source;
    };


    source.nudge = function(val, zoomlevel) {
        _offset[0] += val[0] / Math.pow(2, zoomlevel);
        _offset[1] += val[1] / Math.pow(2, zoomlevel);
        return source;
    };


    source.name = function() {
        var id_safe = source.id.replace(/\./g, '<TX_DOT>');
        return t('imagery.' + id_safe + '.name', { default: _name });
    };


    source.description = function() {
        var id_safe = source.id.replace(/\./g, '<TX_DOT>');
        return t('imagery.' + id_safe + '.description', { default: _description });
    };


    source.best = function() {
        return _best;
    };


    source.area = function() {
        if (!data.polygon) return Number.MAX_VALUE;  // worldwide
        var area = d3_geoArea({ type: 'MultiPolygon', coordinates: [ data.polygon ] });
        return isNaN(area) ? 0 : area;
    };


    source.imageryUsed = function() {
        return name || source.id;
    };


    source.template = function(val) {
        if (!arguments.length) return _template;
        if (source.id === 'custom') {
            _template = val;
        }
        return source;
    };


    source.url = function(coord) {
        var result = _template;
        if (result === '') return result;   // source 'none'


        // Guess a type based on the tokens present in the template
        // (This is for 'custom' source, where we don't know)
        if (!source.type) {
            if (/SERVICE=WMS|\{(proj|wkid|bbox)\}/.test(_template)) {
                source.type = 'wms';
                source.projection = 'EPSG:3857';  // guess
            } else if (/\{(x|y)\}/.test(_template)) {
                source.type = 'tms';
            } else if (/\{u\}/.test(_template)) {
                source.type = 'bing';
            }
        }


        if (source.type === 'wms') {
            var tileToProjectedCoords = (function(x, y, z) {
                //polyfill for IE11, PhantomJS
                var sinh = Math.sinh || function(x) {
                    var y = Math.exp(x);
                    return (y - 1 / y) / 2;
                };

                var zoomSize = Math.pow(2, z);
                var lon = x / zoomSize * Math.PI * 2 - Math.PI;
                var lat = Math.atan(sinh(Math.PI * (1 - 2 * y / zoomSize)));

                switch (source.projection) {
                    case 'EPSG:4326':
                        return {
                            x: lon * 180 / Math.PI,
                            y: lat * 180 / Math.PI
                        };
                    default: // EPSG:3857 and synonyms
                        var mercCoords = d3_geoMercatorRaw(lon, lat);
                        return {
                            x: 20037508.34 / Math.PI * mercCoords[0],
                            y: 20037508.34 / Math.PI * mercCoords[1]
                        };
                }
            });

            var tileSize = source.tileSize;
            var projection = source.projection;
            var minXmaxY = tileToProjectedCoords(coord[0], coord[1], coord[2]);
            var maxXminY = tileToProjectedCoords(coord[0]+1, coord[1]+1, coord[2]);

            result = result.replace(/\{(\w+)\}/g, function (token, key) {
              switch (key) {
                case 'width':
                case 'height':
                    return tileSize;
                case 'proj':
                    return projection;
                case 'wkid':
                    return projection.replace(/^EPSG:/, '');
                case 'bbox':
                    // WMS 1.3 flips x/y for some coordinate systems including EPSG:4326 - #7557
                    if (projection === 'EPSG:4326' &&
                        // The CRS parameter implies version 1.3 (prior versions use SRS)
                        /VERSION=1.3|CRS={proj}/.test(source.template())) {
                        return maxXminY.y + ',' + minXmaxY.x + ',' + minXmaxY.y + ',' + maxXminY.x;
                    } else {
                        return minXmaxY.x + ',' + maxXminY.y + ',' + maxXminY.x + ',' + minXmaxY.y;
                    }
                case 'w':
                    return minXmaxY.x;
                case 's':
                    return maxXminY.y;
                case 'n':
                    return maxXminY.x;
                case 'e':
                    return minXmaxY.y;
                default:
                    return token;
              }
            });

        } else if (source.type === 'tms') {
            result = result
                .replace('{x}', coord[0])
                .replace('{y}', coord[1])
                // TMS-flipped y coordinate
                .replace(/\{[t-]y\}/, Math.pow(2, coord[2]) - coord[1] - 1)
                .replace(/\{z(oom)?\}/, coord[2])
                // only fetch retina tiles for retina screens
                .replace(/\{@2x\}|\{r\}/, isRetina ? '@2x' : '');

        } else if (source.type === 'bing') {
            result = result
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
        }

        // these apply to any type..
        result = result.replace(/\{switch:([^}]+)\}/, function(s, r) {
            var subdomains = r.split(',');
            return subdomains[(coord[0] + coord[1]) % subdomains.length];
        });


        return result;
    };


    source.validZoom = function(z) {
        return source.zoomExtent[0] <= z &&
            (source.overzoom || source.zoomExtent[1] > z);
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

    var bing = rendererBackgroundSource(data);
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



rendererBackgroundSource.Esri = function(data) {
    // in addition to using the tilemap at zoom level 20, overzoom real tiles - #4327 (deprecated technique, but it works)
    if (data.template.match(/blankTile/) === null) {
        data.template = data.template + '?blankTile=false';
    }

    var esri = rendererBackgroundSource(data);
    var cache = {};
    var inflight = {};
    var _prevCenter;

    // use a tilemap service to set maximum zoom for esri tiles dynamically
    // https://developers.arcgis.com/documentation/tiled-elevation-service/
    esri.fetchTilemap = function(center) {
        // skip if we have already fetched a tilemap within 5km
        if (_prevCenter && geoSphericalDistance(center, _prevCenter) < 5000) return;
        _prevCenter = center;

        // tiles are available globally to zoom level 19, afterward they may or may not be present
        var z = 20;

        // first generate a random url using the template
        var dummyUrl = esri.url([1,2,3]);

        // calculate url z/y/x from the lat/long of the center of the map
        var x = (Math.floor((center[0] + 180) / 360 * Math.pow(2, z)));
        var y = (Math.floor((1 - Math.log(Math.tan(center[1] * Math.PI / 180) + 1 / Math.cos(center[1] * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z)));

        // fetch an 8x8 grid to leverage cache
        var tilemapUrl = dummyUrl.replace(/tile\/[0-9]+\/[0-9]+\/[0-9]+\?blankTile=false/, 'tilemap') + '/' + z + '/' + y + '/' + x + '/8/8';

        // make the request and introspect the response from the tilemap server
        d3_json(tilemapUrl)
            .then(function(tilemap) {
                if (!tilemap) {
                    throw new Error('Unknown Error');
                }
                var hasTiles = true;
                for (var i = 0; i < tilemap.data.length; i++) {
                    // 0 means an individual tile in the grid doesn't exist
                    if (!tilemap.data[i]) {
                        hasTiles = false;
                        break;
                    }
                }

                // if any tiles are missing at level 20 we restrict maxZoom to 19
                esri.zoomExtent[1] = (hasTiles ? 22 : 19);
            })
            .catch(function() {
                /* ignore */
            });
    };


    esri.getMetadata = function(center, tileCoord, callback) {
        var tileID = tileCoord.slice(0, 3).join('/');
        var zoom = Math.min(tileCoord[2], esri.zoomExtent[1]);
        var centerPoint = center[0] + ',' + center[1];  // long, lat (as it should be)
        var unknown = t('info_panels.background.unknown');
        var metadataLayer;
        var vintage = {};
        var metadata = {};

        if (inflight[tileID]) return;

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

        url += metadataLayer + '/query?returnGeometry=false&geometry=' + centerPoint + '&inSR=4326&geometryType=esriGeometryPoint&outFields=*&f=json';

        if (!cache[tileID]) {
            cache[tileID] = {};
        }
        if (cache[tileID] && cache[tileID].metadata) {
            return callback(null, cache[tileID].metadata);
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
            inflight[tileID] = true;
            d3_json(url)
                .then(function(result) {
                    delete inflight[tileID];
                    if (!result) {
                        throw new Error('Unknown Error');
                    } else if (result.features && result.features.length < 1) {
                        throw new Error('No Results');
                    } else if (result.error && result.error.message) {
                        throw new Error(result.error.message);
                    }

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
                        resolution: clean(+parseFloat(result.features[0].attributes.SRC_RES).toFixed(4)),
                        accuracy: clean(+parseFloat(result.features[0].attributes.SRC_ACC).toFixed(4))
                    };

                    // append units - meters
                    if (isFinite(metadata.resolution)) {
                        metadata.resolution += ' m';
                    }
                    if (isFinite(metadata.accuracy)) {
                        metadata.accuracy += ' m';
                    }

                    cache[tileID].metadata = metadata;
                    if (callback) callback(null, metadata);
                })
                .catch(function(err) {
                    delete inflight[tileID];
                    if (callback) callback(err.message);
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
        return null;
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
        // sanitize personal connection tokens - #6801
        var cleaned = source.template();

        // from query string parameters
        if (cleaned.indexOf('?') !== -1) {
            var parts = cleaned.split('?', 2);
            var qs = utilStringQs(parts[1]);

            ['access_token', 'connectId', 'token'].forEach(function(param) {
                if (qs[param]) {
                    qs[param] = '{apikey}';
                }
            });
            cleaned = parts[0] + '?' + utilQsString(qs, true);  // true = soft encode
        }

        // from wms/wmts api path parameters
        cleaned = cleaned.replace(/token\/(\w+)/, 'token/{apikey}');

        return 'Custom (' + cleaned + ' )';
    };


    source.area = function() {
        return -2;  // sources in background pane are sorted by area
    };


    return source;
};
