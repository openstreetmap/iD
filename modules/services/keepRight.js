import RBush from 'rbush';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { json as d3_json } from 'd3-fetch';

import { geoExtent, geoVecAdd } from '../geo';
import { qaError } from '../osm';
import { t } from '../util/locale';
import { utilRebind, utilTiler, utilQsString } from '../util';

import { errorTypes, localizeStrings } from '../../data/keepRight.json';


var tiler = utilTiler();
var dispatch = d3_dispatch('loaded');

var _krCache;
var _krZoom = 14;
var _krUrlRoot = 'https://www.keepright.at/';

var _krRuleset = [
    // no 20 - multiple node on same spot - these are mostly boundaries overlapping roads
    30, 40, 50, 60, 70, 90, 100, 110, 120, 130, 150, 160, 170, 180,
    190, 191, 192, 193, 194, 195, 196, 197, 198,
    200, 201, 202, 203, 204, 205, 206, 207, 208, 210, 220,
    230, 231, 232, 270, 280, 281, 282, 283, 284, 285,
    290, 291, 292, 293, 294, 295, 296, 297, 298, 300, 310, 311, 312, 313,
    320, 350, 360, 370, 380, 390, 400, 401, 402, 410, 411, 412, 413
];


function abortRequest(controller) {
    if (controller) {
        controller.abort();
    }
}

function abortUnwantedRequests(cache, tiles) {
    Object.keys(cache.inflightTile).forEach(function(k) {
        var wanted = tiles.find(function(tile) { return k === tile.id; });
        if (!wanted) {
            abortRequest(cache.inflightTile[k]);
            delete cache.inflightTile[k];
        }
    });
}


function encodeErrorRtree(d) {
    return { minX: d.loc[0], minY: d.loc[1], maxX: d.loc[0], maxY: d.loc[1], data: d };
}


// replace or remove error from rtree
function updateRtree(item, replace) {
    _krCache.rtree.remove(item, function isEql(a, b) {
        return a.data.id === b.data.id;
    });

    if (replace) {
        _krCache.rtree.insert(item);
    }
}


function tokenReplacements(d) {
    if (!(d instanceof qaError)) return;

    var htmlRegex = new RegExp(/<\/[a-z][\s\S]*>/);
    var replacements = {};

    var errorTemplate = errorTypes[d.which_type];
    if (!errorTemplate) {
        /* eslint-disable no-console */
        console.log('No Template: ', d.which_type);
        console.log('  ', d.description);
        /* eslint-enable no-console */
        return;
    }

    // some descriptions are just fixed text
    if (!errorTemplate.regex) return;

    // regex pattern should match description with variable details captured
    var errorRegex = new RegExp(errorTemplate.regex, 'i');
    var errorMatch = errorRegex.exec(d.description);
    if (!errorMatch) {
        /* eslint-disable no-console */
        console.log('Unmatched: ', d.which_type);
        console.log('  ', d.description);
        console.log('  ', errorRegex);
        /* eslint-enable no-console */
        return;
    }

    for (var i = 1; i < errorMatch.length; i++) {   // skip first
        var capture = errorMatch[i];
        var idType;

        idType = 'IDs' in errorTemplate ? errorTemplate.IDs[i-1] : '';
        if (idType && capture) {   // link IDs if present in the capture
            capture = parseError(capture, idType);
        } else if (htmlRegex.test(capture)) {   // escape any html in non-IDs
            capture = '\\' +  capture + '\\';
        } else {
            var compare = capture.toLowerCase();
            if (localizeStrings[compare]) {   // some replacement strings can be localized
                capture = t('QA.keepRight.error_parts.' + localizeStrings[compare]);
            }
        }

        replacements['var' + i] = capture;
    }

    return replacements;
}


function parseError(capture, idType) {
    var compare = capture.toLowerCase();
    if (localizeStrings[compare]) {   // some replacement strings can be localized
        capture = t('QA.keepRight.error_parts.' + localizeStrings[compare]);
    }

    switch (idType) {
        // link a string like "this node"
        case 'this':
            capture = linkErrorObject(capture);
            break;

        case 'url':
            capture = linkURL(capture);
            break;

        // link an entity ID
        case 'n':
        case 'w':
        case 'r':
            capture = linkEntity(idType + capture);
            break;

        // some errors have more complex ID lists/variance
        case '20':
            capture = parse20(capture);
            break;
        case '211':
            capture = parse211(capture);
            break;
        case '231':
            capture = parse231(capture);
            break;
        case '294':
            capture = parse294(capture);
            break;
        case '370':
            capture = parse370(capture);
            break;
    }

    return capture;


    function linkErrorObject(d) {
        return '<a class="error_object_link">' + d + '</a>';
    }

    function linkEntity(d) {
        return '<a class="error_entity_link">' + d + '</a>';
    }

    function linkURL(d) {
        return '<a class="kr_external_link" target="_blank" href="' + d + '">' + d + '</a>';
    }

    // arbitrary node list of form: #ID, #ID, #ID...
    function parse211(capture) {
        var newList = [];
        var items = capture.split(', ');

        items.forEach(function(item) {
            // ID has # at the front
            var id = linkEntity('n' + item.slice(1));
            newList.push(id);
        });

        return newList.join(', ');
    }

    // arbitrary way list of form: #ID(layer),#ID(layer),#ID(layer)...
    function parse231(capture) {
        var newList = [];
        // unfortunately 'layer' can itself contain commas, so we split on '),'
        var items = capture.split('),');

        items.forEach(function(item) {
            var match = item.match(/\#(\d+)\((.+)\)?/);
            if (match !== null && match.length > 2) {
                newList.push(linkEntity('w' + match[1]) + ' ' +
                    t('QA.keepRight.errorTypes.231.layer', { layer: match[2] })
                );
            }
        });

        return newList.join(', ');
    }

    // arbitrary node/relation list of form: from node #ID,to relation #ID,to node #ID...
    function parse294(capture) {
        var newList = [];
        var items = capture.split(',');

        items.forEach(function(item) {
            var role;
            var idType;
            var id;

            // item of form "from/to node/relation #ID"
            item = item.split(' ');

            // to/from role is more clear in quotes
            role = '"' + item[0] + '"';

            // first letter of node/relation provides the type
            idType = item[1].slice(0,1);

            // ID has # at the front
            id = item[2].slice(1);
            id = linkEntity(idType + id);

            item = [role, item[1], id].join(' ');
            newList.push(item);
        });

        return newList.join(', ');
    }

    // may or may not include the string "(including the name 'name')"
    function parse370(capture) {
        if (!capture) return '';

        var match = capture.match(/\(including the name (\'.+\')\)/);
        if (match !== null && match.length) {
            return t('QA.keepRight.errorTypes.370.including_the_name', { name: match[1] });
        }
        return '';
    }

    // arbitrary node list of form: #ID,#ID,#ID...
    function parse20(capture) {
        var newList = [];
        var items = capture.split(',');

        items.forEach(function(item) {
            // ID has # at the front
            var id = linkEntity('n' + item.slice(1));
            newList.push(id);
        });

        return newList.join(', ');
    }
}


export default {
    init: function() {
        if (!_krCache) {
            this.reset();
        }

        this.event = utilRebind(this, dispatch, 'on');
    },

    reset: function() {
        if (_krCache) {
            Object.values(_krCache.inflightTile).forEach(abortRequest);
        }

        _krCache = {
            data: {},
            loadedTile: {},
            inflightTile: {},
            inflightPost: {},
            closed: {},
            rtree: new RBush()
        };
    },


    // KeepRight API:  http://osm.mueschelsoft.de/keepright/interfacing.php
    loadErrors: function(projection) {
        var options = { format: 'geojson' };
        var rules = _krRuleset.join();

        // determine the needed tiles to cover the view
        var tiles = tiler
            .zoomExtent([_krZoom, _krZoom])
            .getTiles(projection);

        // abort inflight requests that are no longer needed
        abortUnwantedRequests(_krCache, tiles);

        // issue new requests..
        tiles.forEach(function(tile) {
            if (_krCache.loadedTile[tile.id] || _krCache.inflightTile[tile.id]) return;

            var rect = tile.extent.rectangle();
            var params = Object.assign({}, options, { left: rect[0], bottom: rect[3], right: rect[2], top: rect[1] });
            var url = _krUrlRoot + 'export.php?' + utilQsString(params) + '&ch=' + rules;

            var controller = new AbortController();
            _krCache.inflightTile[tile.id] = controller;

            d3_json(url, { signal: controller.signal })
                .then(function(data) {
                    delete _krCache.inflightTile[tile.id];
                    _krCache.loadedTile[tile.id] = true;
                    if (!data || !data.features || !data.features.length) {
                        throw new Error('No Data');
                    }

                    data.features.forEach(function(feature) {
                        var loc = feature.geometry.coordinates;
                        var props = feature.properties;

                        // if there is a parent, save its error type e.g.:
                        //  Error 191 = "highway-highway"
                        //  Error 190 = "intersections without junctions"  (parent)
                        var errorType = props.error_type;
                        var errorTemplate = errorTypes[errorType];
                        var parentErrorType = (Math.floor(errorType / 10) * 10).toString();

                        // try to handle error type directly, fallback to parent error type.
                        var whichType = errorTemplate ? errorType : parentErrorType;
                        var whichTemplate = errorTypes[whichType];

                        // Rewrite a few of the errors at this point..
                        // This is done to make them easier to linkify and translate.
                        switch (whichType) {
                            case '170':
                                props.description = 'This feature has a FIXME tag: ' + props.description;
                                break;
                            case '292':
                            case '293':
                                props.description = props.description.replace('A turn-', 'This turn-');
                                break;
                            case '294':
                            case '295':
                            case '296':
                            case '297':
                            case '298':
                                props.description = 'This turn-restriction~' + props.description;
                                break;
                            case '300':
                                props.description = 'This highway is missing a maxspeed tag';
                                break;
                            case '411':
                            case '412':
                            case '413':
                                props.description = 'This feature~' + props.description;
                                break;
                        }

                        // - move markers slightly so it doesn't obscure the geometry,
                        // - then move markers away from other coincident markers
                        var coincident = false;
                        do {
                            // first time, move marker up. after that, move marker right.
                            var delta = coincident ? [0.00001, 0] : [0, 0.00001];
                            loc = geoVecAdd(loc, delta);
                            var bbox = geoExtent(loc).bbox();
                            coincident = _krCache.rtree.search(bbox).length;
                        } while (coincident);

                        var d = new qaError({
                            // Required values
                            loc: loc,
                            service: 'keepRight',
                            error_type: errorType,
                            // Extra values for this service
                            id: props.error_id,
                            comment: props.comment || null,
                            description: props.description || '',
                            error_id: props.error_id,
                            which_type: whichType,
                            parent_error_type: parentErrorType,
                            severity: whichTemplate.severity || 'error',
                            object_id: props.object_id,
                            object_type: props.object_type,
                            schema: props.schema,
                            title: props.title
                        });

                        d.replacements = tokenReplacements(d);

                        _krCache.data[d.id] = d;
                        _krCache.rtree.insert(encodeErrorRtree(d));
                    });

                    dispatch.call('loaded');
                })
                .catch(function() {
                    delete _krCache.inflightTile[tile.id];
                    _krCache.loadedTile[tile.id] = true;
                });

        });
    },


    postKeepRightUpdate: function(d, callback) {
        if (_krCache.inflightPost[d.id]) {
            return callback({ message: 'Error update already inflight', status: -2 }, d);
        }

        var that = this;
        var params = { schema: d.schema, id: d.error_id };

        if (d.state) {
            params.st = d.state;
        }
        if (d.newComment !== undefined) {
            params.co = d.newComment;
        }

        // NOTE: This throws a CORS err, but it seems successful.
        // We don't care too much about the response, so this is fine.
        var url = _krUrlRoot + 'comment.php?' + utilQsString(params);

        var controller = new AbortController();
        _krCache.inflightPost[d.id] = controller;

        fetch(url, { method: 'POST', signal: controller.signal })
            .then(function(response) {
                delete _krCache.inflightPost[d.id];
                if (!response.ok) {
                    throw new Error(response.status + ' ' + response.statusText);
                }

                if (d.state === 'ignore') {   // ignore permanently (false positive)
                    that.removeError(d);

                } else if (d.state === 'ignore_t') {  // ignore temporarily (error fixed)
                    that.removeError(d);
                    _krCache.closed[d.schema + ':' + d.error_id] = true;

                } else {
                    d = that.replaceError(d.update({
                        comment: d.newComment,
                        newComment: undefined,
                        state: undefined
                    }));
                }

                if (callback) callback(null, d);
            })
            .catch(function(err) {
                delete _krCache.inflightPost[d.id];
                if (callback) callback(err.message);
            });
    },


    // get all cached errors covering the viewport
    getErrors: function(projection) {
        var viewport = projection.clipExtent();
        var min = [viewport[0][0], viewport[1][1]];
        var max = [viewport[1][0], viewport[0][1]];
        var bbox = geoExtent(projection.invert(min), projection.invert(max)).bbox();

        return _krCache.rtree.search(bbox).map(function(d) {
            return d.data;
        });
    },


    // get a single error from the cache
    getError: function(id) {
        return _krCache.data[id];
    },


    // replace a single error in the cache
    replaceError: function(error) {
        if (!(error instanceof qaError) || !error.id) return;

        _krCache.data[error.id] = error;
        updateRtree(encodeErrorRtree(error), true); // true = replace
        return error;
    },


    // remove a single error from the cache
    removeError: function(error) {
        if (!(error instanceof qaError) || !error.id) return;

        delete _krCache.data[error.id];
        updateRtree(encodeErrorRtree(error), false); // false = remove
    },


    errorURL: function(error) {
        return _krUrlRoot + 'report_map.php?schema=' + error.schema + '&error=' + error.id;
    },


    // Get an array of errors closed during this session.
    // Used to populate `closed:keepright` changeset tag
    getClosedIDs: function() {
        return Object.keys(_krCache.closed).sort();
    }

};
