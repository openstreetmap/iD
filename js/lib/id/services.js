(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.iD = global.iD || {}, global.iD.services = global.iD.services || {})));
}(this, function (exports) { 'use strict';

    const apibase = 'https://a.mapillary.com/v2/';
    const viewercss = 'https://npmcdn.com/mapillary-js@1.3.0/dist/mapillary-js.min.css';
    const viewerjs = 'https://npmcdn.com/mapillary-js@1.3.0/dist/mapillary-js.min.js';
    const clientId = 'NzNRM2otQkR2SHJzaXJmNmdQWVQ0dzo1ZWYyMmYwNjdmNDdlNmVi';
    const maxResults = 1000;
    const maxPages = 10;
    const tileZoom = 14;
    function mapillary() {
        var mapillary = {},
            dispatch = d3.dispatch('loadedImages', 'loadedSigns');


        function loadSignStyles(context) {
            d3.select('head').selectAll('#traffico')
                .data([0])
                .enter()
                .append('link')
                .attr('id', 'traffico')
                .attr('rel', 'stylesheet')
                .attr('href', context.asset('traffico/stylesheets/traffico.css'));
        }

        function loadSignDefs(context) {
            if (iD.services.mapillary.sign_defs) return;
            iD.services.mapillary.sign_defs = {};

            _.each(['au', 'br', 'ca', 'de', 'us'], function(region) {
                d3.json(context.asset('traffico/string-maps/' + region + '-map.json'), function(err, data) {
                    if (err) return;
                    if (region === 'de') region = 'eu';
                    iD.services.mapillary.sign_defs[region] = data;
                });
            });
        }

        function loadViewer() {
            // mapillary-wrap
            var wrap = d3.select('#content').selectAll('.mapillary-wrap')
                .data([0]);

            var enter = wrap.enter().append('div')
                .attr('class', 'mapillary-wrap')
                .classed('al', true)       // 'al'=left,  'ar'=right
                .classed('hidden', true);

            enter.append('button')
                .attr('class', 'thumb-hide')
                .on('click', function () { mapillary.hideViewer(); })
                .append('div')
                .call(iD.svg.Icon('#icon-close'));

            enter.append('div')
                .attr('id', 'mly')
                .attr('class', 'mly-wrapper')
                .classed('active', false);

            // mapillary-viewercss
            d3.select('head').selectAll('#mapillary-viewercss')
                .data([0])
                .enter()
                .append('link')
                .attr('id', 'mapillary-viewercss')
                .attr('rel', 'stylesheet')
                .attr('href', viewercss);

            // mapillary-viewerjs
            d3.select('head').selectAll('#mapillary-viewerjs')
                .data([0])
                .enter()
                .append('script')
                .attr('id', 'mapillary-viewerjs')
                .attr('src', viewerjs);
        }

        function initViewer(imageKey, context) {

            function nodeChanged(d) {
                var clicks = iD.services.mapillary.clicks;
                var index = clicks.indexOf(d.key);
                if (index > -1) {    // nodechange initiated from clicking on a marker..
                    clicks.splice(index, 1);
                } else {             // nodechange initiated from the Mapillary viewer controls..
                    var loc = d.apiNavImIm ? [d.apiNavImIm.lon, d.apiNavImIm.lat] : [d.latLon.lon, d.latLon.lat];
                    context.map().centerEase(loc);
                    mapillary.setSelectedImage(d.key, false);
                }
            }

            if (Mapillary && imageKey) {
                var opts = {
                    baseImageSize: 320,
                    cover: false,
                    cache: true,
                    debug: false,
                    imagePlane: true,
                    loading: true,
                    sequence: true
                };

                var viewer = new Mapillary.Viewer('mly', clientId, imageKey, opts);
                viewer.on('nodechanged', nodeChanged);
                viewer.on('loadingchanged', mapillary.setViewerLoading);
                iD.services.mapillary.viewer = viewer;
            }
        }

        function abortRequest(i) {
            i.abort();
        }

        function nearNullIsland(x, y, z) {
            if (z >= 7) {
                var center = Math.pow(2, z - 1),
                    width = Math.pow(2, z - 6),
                    min = center - (width / 2),
                    max = center + (width / 2) - 1;
                return x >= min && x <= max && y >= min && y <= max;
            }
            return false;
        }

        function getTiles(projection, dimensions) {
            var s = projection.scale() * 2 * Math.PI,
                z = Math.max(Math.log(s) / Math.log(2) - 8, 0),
                ts = 256 * Math.pow(2, z - tileZoom),
                origin = [
                    s / 2 - projection.translate()[0],
                    s / 2 - projection.translate()[1]];

            return d3.geo.tile()
                .scaleExtent([tileZoom, tileZoom])
                .scale(s)
                .size(dimensions)
                .translate(projection.translate())()
                .map(function(tile) {
                    var x = tile[0] * ts - origin[0],
                        y = tile[1] * ts - origin[1];

                    return {
                        id: tile.toString(),
                        extent: iD.geo.Extent(
                            projection.invert([x, y + ts]),
                            projection.invert([x + ts, y]))
                    };
                });
        }


        function loadTiles(which, url, projection, dimensions) {
            var tiles = getTiles(projection, dimensions).filter(function(t) {
                  var xyz = t.id.split(',');
                  return !nearNullIsland(xyz[0], xyz[1], xyz[2]);
                });

            _.filter(which.inflight, function(v, k) {
                var wanted = _.find(tiles, function(tile) { return k === (tile.id + ',0'); });
                if (!wanted) delete which.inflight[k];
                return !wanted;
            }).map(abortRequest);

            tiles.forEach(function(tile) {
                loadTilePage(which, url, tile, 0);
            });
        }

        function loadTilePage(which, url, tile, page) {
            var cache = iD.services.mapillary.cache[which],
                id = tile.id + ',' + String(page),
                rect = tile.extent.rectangle();

            if (cache.loaded[id] || cache.inflight[id]) return;

            cache.inflight[id] = d3.json(url +
                iD.util.qsString({
                    geojson: 'true',
                    limit: maxResults,
                    page: page,
                    client_id: clientId,
                    min_lon: rect[0],
                    min_lat: rect[1],
                    max_lon: rect[2],
                    max_lat: rect[3]
                }), function(err, data) {
                    cache.loaded[id] = true;
                    delete cache.inflight[id];
                    if (err || !data.features || !data.features.length) return;

                    var features = [],
                        nextPage = page + 1,
                        feature, loc, d;

                    for (var i = 0; i < data.features.length; i++) {
                        feature = data.features[i];
                        loc = feature.geometry.coordinates;
                        d = { key: feature.properties.key, loc: loc };
                        if (which === 'images') d.ca = feature.properties.ca;
                        if (which === 'signs') d.signs = feature.properties.rects;

                        features.push([loc[0], loc[1], loc[0], loc[1], d]);
                    }

                    cache.rtree.load(features);

                    if (which === 'images') dispatch.loadedImages();
                    if (which === 'signs') dispatch.loadedSigns();

                    if (data.features.length === maxResults && nextPage < maxPages) {
                        loadTilePage(which, url, tile, nextPage);
                    }
                }
            );
        }

        mapillary.loadImages = function(projection, dimensions) {
            var url = apibase + 'search/im/geojson?';
            loadTiles('images', url, projection, dimensions);
        };

        mapillary.loadSigns = function(context, projection, dimensions) {
            var url = apibase + 'search/im/geojson/or?';
            loadSignStyles(context);
            loadSignDefs(context);
            loadTiles('signs', url, projection, dimensions);
        };

        mapillary.loadViewer = function() {
            loadViewer();
        };


        // partition viewport into `psize` x `psize` regions
        function partitionViewport(psize, projection, dimensions) {
            psize = psize || 16;
            var cols = d3.range(0, dimensions[0], psize),
                rows = d3.range(0, dimensions[1], psize),
                partitions = [];

            rows.forEach(function(y) {
                cols.forEach(function(x) {
                    var min = [x, y + psize],
                        max = [x + psize, y];
                    partitions.push(
                        iD.geo.Extent(projection.invert(min), projection.invert(max)));
                });
            });

            return partitions;
        }

        // no more than `limit` results per partition.
        function searchLimited(psize, limit, projection, dimensions, rtree) {
            limit = limit || 3;

            var partitions = partitionViewport(psize, projection, dimensions);
            return _.flatten(_.compact(_.map(partitions, function(extent) {
                return rtree.search(extent.rectangle())
                    .slice(0, limit)
                    .map(function(d) { return d[4]; });
            })));
        }

        mapillary.images = function(projection, dimensions) {
            var psize = 16, limit = 3;
            return searchLimited(psize, limit, projection, dimensions, iD.services.mapillary.cache.images.rtree);
        };

        mapillary.signs = function(projection, dimensions) {
            var psize = 32, limit = 3;
            return searchLimited(psize, limit, projection, dimensions, iD.services.mapillary.cache.signs.rtree);
        };

        mapillary.signsSupported = function() {
            var detected = iD.detect();
            return (!(detected.ie || detected.browser.toLowerCase() === 'safari'));
        };

        mapillary.signHTML = function(d) {
            if (!iD.services.mapillary.sign_defs) return;

            var detectionPackage = d.signs[0].package,
                type = d.signs[0].type,
                country = detectionPackage.split('_')[1];

            return iD.services.mapillary.sign_defs[country][type];
        };

        mapillary.showViewer = function() {
            d3.select('#content')
                .selectAll('.mapillary-wrap')
                .classed('hidden', false)
                .selectAll('.mly-wrapper')
                .classed('active', true);

            return mapillary;
        };

        mapillary.hideViewer = function() {
            d3.select('#content')
                .selectAll('.mapillary-wrap')
                .classed('hidden', true)
                .selectAll('.mly-wrapper')
                .classed('active', false);

            d3.selectAll('.layer-mapillary-images .viewfield-group, .layer-mapillary-signs .icon-sign')
                .classed('selected', false);

            iD.services.mapillary.image = null;

            return mapillary;
        };

        mapillary.setViewerLoading = function(loading) {
            var canvas = d3.select('#content')
                .selectAll('.mly-wrapper canvas');

            if (canvas.empty()) return;   // viewer not loaded yet

            var cover = d3.select('#content')
                .selectAll('.mly-wrapper .Cover');

            cover.classed('CoverDone', !loading);

            var button = cover.selectAll('.CoverButton')
                .data(loading ? [0] : []);

            button.enter()
                .append('div')
                .attr('class', 'CoverButton')
                .append('div')
                .attr('class', 'uil-ripple-css')
                .append('div');

            button.exit()
                .remove();

            return mapillary;
        };

        mapillary.updateViewer = function(imageKey, context) {
            if (!iD.services.mapillary) return;
            if (!imageKey) return;

            if (!iD.services.mapillary.viewer) {
                initViewer(imageKey, context);
            } else {
                iD.services.mapillary.viewer.moveToKey(imageKey);
            }

            return mapillary;
        };

        mapillary.getSelectedImage = function() {
            if (!iD.services.mapillary) return null;
            return iD.services.mapillary.image;
        };

        mapillary.setSelectedImage = function(imageKey, fromClick) {
            if (!iD.services.mapillary) return null;

            iD.services.mapillary.image = imageKey;
            if (fromClick) {
                iD.services.mapillary.clicks.push(imageKey);
            }

            d3.selectAll('.layer-mapillary-images .viewfield-group, .layer-mapillary-signs .icon-sign')
                .classed('selected', function(d) { return d.key === imageKey; });

            return mapillary;
        };

        mapillary.reset = function() {
            var cache = iD.services.mapillary.cache;

            if (cache) {
                _.forEach(cache.images.inflight, abortRequest);
                _.forEach(cache.signs.inflight, abortRequest);
            }

            iD.services.mapillary.cache = {
                images: { inflight: {}, loaded: {}, rtree: rbush() },
                signs:  { inflight: {}, loaded: {}, rtree: rbush() }
            };

            iD.services.mapillary.image = null;
            iD.services.mapillary.clicks = [];

            return mapillary;
        };


        if (!iD.services.mapillary.cache) {
            mapillary.reset();
        }

        return d3.rebind(mapillary, dispatch, 'on');
    }

    const endpoint = 'https://nominatim.openstreetmap.org/reverse?';
    var cache;

    function nominatim() {
        var nominatim = {};

        nominatim.countryCode = function(location, callback) {
            var countryCodes = cache.search([location[0], location[1], location[0], location[1]]);

            if (countryCodes.length > 0)
                return callback(null, countryCodes[0][4]);

            d3.json(endpoint +
                iD.util.qsString({
                    format: 'json',
                    addressdetails: 1,
                    lat: location[1],
                    lon: location[0]
                }), function(err, result) {
                    if (err)
                        return callback(err);
                    else if (result && result.error)
                        return callback(result.error);

                    var extent = iD.geo.Extent(location).padByMeters(1000);

                    cache.insert(extent.rectangle().concat(result.address.country_code));

                    callback(null, result.address.country_code);
                });
        };

        nominatim.reset = function() {
            cache = rbush();
            return this;
        };

        if (!cache) {
            nominatim.reset();
        }

        return nominatim;
    }

    function taginfo() {
        var taginfo = {},
            endpoint = 'https://taginfo.openstreetmap.org/api/4/',
            tag_sorts = {
                point: 'count_nodes',
                vertex: 'count_nodes',
                area: 'count_ways',
                line: 'count_ways'
            },
            tag_filters = {
                point: 'nodes',
                vertex: 'nodes',
                area: 'ways',
                line: 'ways'
            };


        function sets(parameters, n, o) {
            if (parameters.geometry && o[parameters.geometry]) {
                parameters[n] = o[parameters.geometry];
            }
            return parameters;
        }

        function setFilter(parameters) {
            return sets(parameters, 'filter', tag_filters);
        }

        function setSort(parameters) {
            return sets(parameters, 'sortname', tag_sorts);
        }

        function clean(parameters) {
            return _.omit(parameters, 'geometry', 'debounce');
        }

        function filterKeys(type) {
            var count_type = type ? 'count_' + type : 'count_all';
            return function(d) {
                return parseFloat(d[count_type]) > 2500 || d.in_wiki;
            };
        }

        function filterMultikeys() {
            return function(d) {
                return (d.key.match(/:/g) || []).length === 1;  // exactly one ':'
            };
        }

        function filterValues() {
            return function(d) {
                if (d.value.match(/[A-Z*;,]/) !== null) return false;  // exclude some punctuation, uppercase letters
                return parseFloat(d.fraction) > 0.0 || d.in_wiki;
            };
        }

        function valKey(d) {
            return {
                value: d.key,
                title: d.key
            };
        }

        function valKeyDescription(d) {
            return {
                value: d.value,
                title: d.description || d.value
            };
        }

        // sort keys with ':' lower than keys without ':'
        function sortKeys(a, b) {
            return (a.key.indexOf(':') === -1 && b.key.indexOf(':') !== -1) ? -1
                : (a.key.indexOf(':') !== -1 && b.key.indexOf(':') === -1) ? 1
                : 0;
        }

        var debounced = _.debounce(d3.json, 100, true);

        function request(url, debounce, callback) {
            var cache = iD.services.taginfo.cache;

            if (cache[url]) {
                callback(null, cache[url]);
            } else if (debounce) {
                debounced(url, done);
            } else {
                d3.json(url, done);
            }

            function done(err, data) {
                if (!err) cache[url] = data;
                callback(err, data);
            }
        }

        taginfo.keys = function(parameters, callback) {
            var debounce = parameters.debounce;
            parameters = clean(setSort(parameters));
            request(endpoint + 'keys/all?' +
                iD.util.qsString(_.extend({
                    rp: 10,
                    sortname: 'count_all',
                    sortorder: 'desc',
                    page: 1
                }, parameters)), debounce, function(err, d) {
                    if (err) return callback(err);
                    var f = filterKeys(parameters.filter);
                    callback(null, d.data.filter(f).sort(sortKeys).map(valKey));
                });
        };

        taginfo.multikeys = function(parameters, callback) {
            var debounce = parameters.debounce;
            parameters = clean(setSort(parameters));
            request(endpoint + 'keys/all?' +
                iD.util.qsString(_.extend({
                    rp: 25,
                    sortname: 'count_all',
                    sortorder: 'desc',
                    page: 1
                }, parameters)), debounce, function(err, d) {
                    if (err) return callback(err);
                    var f = filterMultikeys();
                    callback(null, d.data.filter(f).map(valKey));
                });
        };

        taginfo.values = function(parameters, callback) {
            var debounce = parameters.debounce;
            parameters = clean(setSort(setFilter(parameters)));
            request(endpoint + 'key/values?' +
                iD.util.qsString(_.extend({
                    rp: 25,
                    sortname: 'count_all',
                    sortorder: 'desc',
                    page: 1
                }, parameters)), debounce, function(err, d) {
                    if (err) return callback(err);
                    var f = filterValues();
                    callback(null, d.data.filter(f).map(valKeyDescription));
                });
        };

        taginfo.docs = function(parameters, callback) {
            var debounce = parameters.debounce;
            parameters = clean(setSort(parameters));

            var path = 'key/wiki_pages?';
            if (parameters.value) path = 'tag/wiki_pages?';
            else if (parameters.rtype) path = 'relation/wiki_pages?';

            request(endpoint + path + iD.util.qsString(parameters), debounce, function(err, d) {
                if (err) return callback(err);
                callback(null, d.data);
            });
        };

        taginfo.endpoint = function(_) {
            if (!arguments.length) return endpoint;
            endpoint = _;
            return taginfo;
        };

        taginfo.reset = function() {
            iD.services.taginfo.cache = {};
            return taginfo;
        };


        if (!iD.services.taginfo.cache) {
            taginfo.reset();
        }

        return taginfo;
    }

    const endpoint$1 = 'https://www.wikidata.org/w/api.php?';

    function wikidata() {
        var wikidata = {};

        // Given a Wikipedia language and article title, return an array of
        // corresponding Wikidata entities.
        wikidata.itemsByTitle = function(lang, title, callback) {
            lang = lang || 'en';
            d3.jsonp(endpoint$1 + iD.util.qsString({
                action: 'wbgetentities',
                format: 'json',
                sites: lang.replace(/-/g, '_') + 'wiki',
                titles: title,
                languages: 'en', // shrink response by filtering to one language
                callback: '{callback}'
            }), function(data) {
                callback(title, data.entities || {});
            });
        };

        return wikidata;
    }

    const endpoint$2 = 'https://en.wikipedia.org/w/api.php?';

    function wikipedia() {
        var wikipedia = {};

        wikipedia.search = function(lang, query, callback) {
            lang = lang || 'en';
            d3.jsonp(endpoint$2.replace('en', lang) +
                iD.util.qsString({
                    action: 'query',
                    list: 'search',
                    srlimit: '10',
                    srinfo: 'suggestion',
                    format: 'json',
                    callback: '{callback}',
                    srsearch: query
                }), function(data) {
                    if (!data.query) return;
                    callback(query, data.query.search.map(function(d) {
                        return d.title;
                    }));
                });
        };

        wikipedia.suggestions = function(lang, query, callback) {
            lang = lang || 'en';
            d3.jsonp(endpoint$2.replace('en', lang) +
                iD.util.qsString({
                    action: 'opensearch',
                    namespace: 0,
                    suggest: '',
                    format: 'json',
                    callback: '{callback}',
                    search: query
                }), function(d) {
                    callback(d[0], d[1]);
                });
        };

        wikipedia.translations = function(lang, title, callback) {
            d3.jsonp(endpoint$2.replace('en', lang) +
                iD.util.qsString({
                    action: 'query',
                    prop: 'langlinks',
                    format: 'json',
                    callback: '{callback}',
                    lllimit: 500,
                    titles: title
                }), function(d) {
                    var list = d.query.pages[Object.keys(d.query.pages)[0]],
                        translations = {};
                    if (list && list.langlinks) {
                        list.langlinks.forEach(function(d) {
                            translations[d.lang] = d['*'];
                        });
                        callback(translations);
                    }
                });
        };

        return wikipedia;
    }

    exports.mapillary = mapillary;
    exports.nominatim = nominatim;
    exports.taginfo = taginfo;
    exports.wikidata = wikidata;
    exports.wikipedia = wikipedia;

    Object.defineProperty(exports, '__esModule', { value: true });

}));