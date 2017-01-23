import * as d3 from 'd3';
import _ from 'lodash';
import { t, currentLocale, addTranslation, setLocale } from '../util/locale';
import { coreHistory } from './history';
import { dataLocales, dataEn } from '../../data/index';
import { geoRawMercator } from '../geo/raw_mercator';
import { modeSelect } from '../modes/select';
import { presetIndex } from '../presets/index';
import { rendererBackground } from '../renderer/background';
import { rendererFeatures } from '../renderer/features';
import { rendererMap } from '../renderer/map';
import { services } from '../services/index';
import { uiInit } from '../ui/init';
import { utilDetect } from '../util/detect';
import { utilRebind } from '../util/rebind';


export var areaKeys = {};

export function setAreaKeys(value) {
    areaKeys = value;
}


export function coreContext() {
    addTranslation('en', dataEn);
    setLocale('en');

    var dispatch = d3.dispatch('enter', 'exit', 'change'),
        context = {};

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
    function entitiesLoaded(err, result) {
        if (!err) history.merge(result.data, result.extent);
    }

    context.preauth = function(options) {
        connection.switch(options);
        return context;
    };

    context.loadTiles = function(projection, dimensions, callback) {
        function done(err, result) {
            entitiesLoaded(err, result);
            if (callback) callback(err, result);
        }
        connection.loadTiles(projection, dimensions, done);
    };

    context.loadEntity = function(id, callback) {
        function done(err, result) {
            entitiesLoaded(err, result);
            if (callback) callback(err, result);
        }
        connection.loadEntity(id, done);
    };

    context.zoomToEntity = function(id, zoomTo) {
        if (zoomTo !== false) {
            this.loadEntity(id, function(err, result) {
                if (err) return;
                var entity = _.find(result.data, function(e) { return e.id === id; });
                if (entity) { map.zoomTo(entity); }
            });
        }

        map.on('drawn.zoomToEntity', function() {
            if (!context.hasEntity(id)) return;
            map.on('drawn.zoomToEntity', null);
            context.on('enter.zoomToEntity', null);
            context.enter(modeSelect(context, [id]));
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
        connection.tileZoom(_);
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
        if (inIntro || d3.select('.modal').size()) return;

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
        // Work around a bug in Firefox.
        //   http://stackoverflow.com/questions/18153989/
        //   https://bugzilla.mozilla.org/show_bug.cgi?id=530985
        return context.surface().node().parentNode.getBoundingClientRect();
    };


    /* Debug */
    var debugFlags = {
        tile: false,
        collision: false,
        imagery: false,
        imperial: false,
        driveLeft: false
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
    var container, embed;
    context.container = function(_) {
        if (!arguments.length) return container;
        container = _;
        container.classed('id-container', true);
        return context;
    };
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
            d3.json(localePath, function(err, result) {
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
        _.each(services, function(service) {
            if (service && typeof service.reset === 'function') {
                service.reset(context);
            }
        });
        features.reset();
        history.reset();
        return context;
    };


    /* Init */
    context.version = '2.0.1';

    context.projection = geoRawMercator();

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
    context.debouncedSave = _.debounce(context.save, 350);
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

    _.each(services, function(service) {
        if (service && typeof service.init === 'function') {
            service.init(context);
        }
    });

    background.init();
    presets.init();
    areaKeys = presets.areaKeys();


    return utilRebind(context, dispatch, 'on');
}
