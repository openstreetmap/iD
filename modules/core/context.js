import _cloneDeep from 'lodash-es/cloneDeep';
import _debounce from 'lodash-es/debounce';
import _each from 'lodash-es/each';
import _find from 'lodash-es/find';
import _forOwn from 'lodash-es/forOwn';
import _isObject from 'lodash-es/isObject';
import _isString from 'lodash-es/isString';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { json as d3_json } from 'd3-request';
import { select as d3_select } from 'd3-selection';

import {
    t,
    currentLocale,
    addTranslation,
    setLocale
} from '../util/locale';

import { coreHistory } from './history';

import {
    dataLocales,
    dataEn
} from '../../data';

import { geoRawMercator } from '../geo/raw_mercator';
import { modeSelect } from '../modes/select';
import { presetIndex } from '../presets';

import {
    rendererBackground,
    rendererFeatures,
    rendererMap
} from '../renderer';

import { services } from '../services';
import { uiInit } from '../ui/init';
import { utilDetect } from '../util/detect';

import {
    utilCallWhenIdle,
    utilRebind
} from '../util';


export var areaKeys = {};

export function setAreaKeys(value) {
    areaKeys = value;
}


export function coreContext() {
    var context = {};
    context.version = '2.7.0';

    // create a special translation that contains the keys in place of the strings
    var tkeys = _cloneDeep(dataEn);
    var parents = [];

    function traverser(v, k, obj) {
        parents.push(k);
        if (_isObject(v)) {
            _forOwn(v, traverser);
        } else if (_isString(v)) {
            obj[k] = parents.join('.');
        }
        parents.pop();
    }

    _forOwn(tkeys, traverser);
    addTranslation('_tkeys_', tkeys);

    addTranslation('en', dataEn);
    setLocale('en');

    var dispatch = d3_dispatch('enter', 'exit', 'change');

    // https://github.com/openstreetmap/iD/issues/772
    // http://mathiasbynens.be/notes/localstorage-pattern#comment-9
    var storage;
    try { storage = localStorage; } catch (e) {}  // eslint-disable-line no-empty
    storage = storage || (function() {
        var s = {};
        return {
            getItem: function(k) { return s[k]; },
            setItem: function(k, v) { s[k] = v; },
            removeItem: function(k) { delete s[k]; }
        };
    })();

    context.storage = function(k, v) {
        try {
            if (arguments.length === 1) return storage.getItem(k);
            else if (v === null) storage.removeItem(k);
            else storage.setItem(k, v);
        } catch (e) {
            // localstorage quota exceeded
            /* eslint-disable no-console */
            if (typeof console !== 'undefined') console.error('localStorage quota exceeded');
            /* eslint-enable no-console */
        }
    };


    /* Straight accessors. Avoid using these if you can. */
    var ui, connection, history;
    context.ui = function() { return ui; };
    context.connection = function() { return connection; };
    context.history = function() { return history; };


    /* Connection */
    context.preauth = function(options) {
        if (connection) {
            connection.switch(options);
        }
        return context;
    };

    context.loadTiles = utilCallWhenIdle(function(projection, dimensions, callback) {
        var cid;
        function done(err, result) {
            if (connection.getConnectionId() !== cid) {
                if (callback) callback({ message: 'Connection Switched', status: -1 });
                return;
            }
            if (!err) history.merge(result.data, result.extent);
            if (callback) callback(err, result);
        }
        if (connection && context.editable()) {
            cid = connection.getConnectionId();
            connection.loadTiles(projection, dimensions, done);
        }
    });

    context.loadEntity = function(entityId, callback) {
        var cid;
        function done(err, result) {
            if (connection.getConnectionId() !== cid) {
                if (callback) callback({ message: 'Connection Switched', status: -1 });
                return;
            }
            if (!err) history.merge(result.data, result.extent);
            if (callback) callback(err, result);
        }
        if (connection) {
            cid = connection.getConnectionId();
            connection.loadEntity(entityId, done);
        }
    };

    context.zoomToEntity = function(entityId, zoomTo) {
        if (zoomTo !== false) {
            this.loadEntity(entityId, function(err, result) {
                if (err) return;
                var entity = _find(result.data, function(e) { return e.id === entityId; });
                if (entity) { map.zoomTo(entity); }
            });
        }

        map.on('drawn.zoomToEntity', function() {
            if (!context.hasEntity(entityId)) return;
            map.on('drawn.zoomToEntity', null);
            context.on('enter.zoomToEntity', null);
            context.enter(modeSelect(context, [entityId]));
        });

        context.on('enter.zoomToEntity', function() {
            if (mode.id !== 'browse') {
                map.on('drawn.zoomToEntity', null);
                context.on('enter.zoomToEntity', null);
            }
        });
    };

    var minEditableZoom = 16;
    context.minEditableZoom = function(_) {
        if (!arguments.length) return minEditableZoom;
        minEditableZoom = _;
        if (connection) {
            connection.tileZoom(_);
        }
        return context;
    };


    /* History */
    var inIntro = false;
    context.inIntro = function(_) {
        if (!arguments.length) return inIntro;
        inIntro = _;
        return context;
    };

    context.save = function() {
        // no history save, no message onbeforeunload
        if (inIntro || d3_select('.modal').size()) return;

        var canSave;
        if (mode && mode.id === 'save') {
            canSave = false;
        } else {
            canSave = context.selectedIDs().every(function(id) {
                var entity = context.hasEntity(id);
                return entity && !entity.isDegenerate();
            });
        }

        if (canSave) {
            history.save();
        }
        if (history.hasChanges()) {
            return t('save.unsaved_changes');
        }
    };


    /* Graph */
    context.hasEntity = function(id) {
        return history.graph().hasEntity(id);
    };
    context.entity = function(id) {
        return history.graph().entity(id);
    };
    context.childNodes = function(way) {
        return history.graph().childNodes(way);
    };
    context.geometry = function(id) {
        return context.entity(id).geometry(history.graph());
    };


    /* Modes */
    var mode;
    context.mode = function() {
        return mode;
    };
    context.enter = function(newMode) {
        if (mode) {
            mode.exit();
            dispatch.call('exit', this, mode);
        }

        mode = newMode;
        mode.enter();
        dispatch.call('enter', this, mode);
    };

    context.selectedIDs = function() {
        if (mode && mode.selectedIDs) {
            return mode.selectedIDs();
        } else {
            return [];
        }
    };
    context.activeID = function() {
        return mode && mode.activeID && mode.activeID();
    };


    /* Behaviors */
    context.install = function(behavior) {
        context.surface().call(behavior);
    };
    context.uninstall = function(behavior) {
        context.surface().call(behavior.off);
    };


    /* Copy/Paste */
    var copyIDs = [], copyGraph;
    context.copyGraph = function() { return copyGraph; };
    context.copyIDs = function(_) {
        if (!arguments.length) return copyIDs;
        copyIDs = _;
        copyGraph = history.graph();
        return context;
    };


    /* Background */
    var background;
    context.background = function() { return background; };


    /* Features */
    var features;
    context.features = function() { return features; };
    context.hasHiddenConnections = function(id) {
        var graph = history.graph(),
            entity = graph.entity(id);
        return features.hasHiddenConnections(entity, graph);
    };


    /* Presets */
    var presets;
    context.presets = function() { return presets; };


    /* Map */
    var map;
    context.map = function() { return map; };
    context.layers = function() { return map.layers; };
    context.surface = function() { return map.surface; };
    context.editable = function() { return map.editable(); };
    context.surfaceRect = function() {
        return map.surface.node().getBoundingClientRect();
    };


    /* Debug */
    var debugFlags = {
        tile: false,        // tile boundaries
        collision: false,   // label collision bounding boxes
        imagery: false,     // imagery bounding polygons
        imperial: false,    // imperial (not metric) bounding polygons
        driveLeft: false,   // driveLeft bounding polygons
        target: false       // touch targets
    };
    context.debugFlags = function() {
        return debugFlags;
    };
    context.setDebug = function(flag, val) {
        if (arguments.length === 1) val = true;
        debugFlags[flag] = val;
        dispatch.call('change');
        return context;
    };
    context.getDebug = function(flag) {
        return flag && debugFlags[flag];
    };


    /* Container */
    var container = d3_select(document.body);
    context.container = function(_) {
        if (!arguments.length) return container;
        container = _;
        container.classed('id-container', true);
        return context;
    };
    var embed;
    context.embed = function(_) {
        if (!arguments.length) return embed;
        embed = _;
        return context;
    };


    /* Assets */
    var assetPath = '';
    context.assetPath = function(_) {
        if (!arguments.length) return assetPath;
        assetPath = _;
        return context;
    };

    var assetMap = {};
    context.assetMap = function(_) {
        if (!arguments.length) return assetMap;
        assetMap = _;
        return context;
    };

    context.asset = function(_) {
        var filename = assetPath + _;
        return assetMap[filename] || filename;
    };

    context.imagePath = function(_) {
        return context.asset('img/' + _);
    };


    /* locales */
    // `locale` variable contains a "requested locale".
    // It won't become the `currentLocale` until after loadLocale() is called.
    var locale, localePath;

    context.locale = function(loc, path) {
        if (!arguments.length) return currentLocale;
        locale = loc;
        localePath = path;
        return context;
    };

    context.loadLocale = function(callback) {
        if (locale && locale !== 'en' && dataLocales.hasOwnProperty(locale)) {
            localePath = localePath || context.asset('locales/' + locale + '.json');
            d3_json(localePath, function(err, result) {
                if (!err) {
                    addTranslation(locale, result[locale]);
                    setLocale(locale);
                    utilDetect(true);
                }
                if (callback) {
                    callback(err);
                }
            });
        } else {
            if (locale) {
                setLocale(locale);
                utilDetect(true);
            }
            if (callback) {
                callback();
            }
        }
    };


    /* reset (aka flush) */
    context.reset = context.flush = function() {
        context.debouncedSave.cancel();
        _each(services, function(service) {
            if (service && typeof service.reset === 'function') {
                service.reset(context);
            }
        });
        features.reset();
        history.reset();
        return context;
    };


    /* Init */

    context.projection = geoRawMercator();
    context.curtainProjection = geoRawMercator();

    locale = utilDetect().locale;
    if (locale && !dataLocales.hasOwnProperty(locale)) {
        locale = locale.split('-')[0];
    }

    history = coreHistory(context);
    context.graph = history.graph;
    context.changes = history.changes;
    context.intersects = history.intersects;

    // Debounce save, since it's a synchronous localStorage write,
    // and history changes can happen frequently (e.g. when dragging).
    context.debouncedSave = _debounce(context.save, 350);
    function withDebouncedSave(fn) {
        return function() {
            var result = fn.apply(history, arguments);
            context.debouncedSave();
            return result;
        };
    }

    context.perform = withDebouncedSave(history.perform);
    context.replace = withDebouncedSave(history.replace);
    context.pop = withDebouncedSave(history.pop);
    context.overwrite = withDebouncedSave(history.overwrite);
    context.undo = withDebouncedSave(history.undo);
    context.redo = withDebouncedSave(history.redo);

    ui = uiInit(context);

    connection = services.osm;
    background = rendererBackground(context);
    features = rendererFeatures(context);
    presets = presetIndex();

    map = rendererMap(context);
    context.mouse = map.mouse;
    context.extent = map.extent;
    context.pan = map.pan;
    context.zoomIn = map.zoomIn;
    context.zoomOut = map.zoomOut;
    context.zoomInFurther = map.zoomInFurther;
    context.zoomOutFurther = map.zoomOutFurther;
    context.redrawEnable = map.redrawEnable;

    _each(services, function(service) {
        if (service && typeof service.init === 'function') {
            service.init(context);
        }
    });

    background.init();
    features.init();
    presets.init();
    areaKeys = presets.areaKeys();


    return utilRebind(context, dispatch, 'on');
}
