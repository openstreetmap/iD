import { rebind } from '../util/rebind';
import * as d3 from 'd3';
import { t, addTranslation, setLocale } from '../util/locale';
import _ from 'lodash';
import { Background } from '../renderer/background';
import { Connection } from './connection';
import { Detect } from '../util/detect';
import { Features } from '../renderer/features';
import { History } from './history';
import { Map } from '../renderer/map';
import { Select } from '../modes/select';
import { RawMercator } from '../geo/raw_mercator';
import { presets as presetsInit } from '../presets/presets';
import { init as uiInit } from '../ui/init';
import { locales, en } from '../../data/index';
import * as services from '../services/index';

export var areaKeys = {};

export function Context(root) {
    if (!root.locale) {
        root.locale = {
            current: function(_) { this._current = _; }
        };
    }
    addTranslation('en', en);
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
            context.enter(Select(context, [id]));
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
        if (inIntro || (mode && mode.id === 'save') || d3.select('.modal').size()) return;
        history.save();
        if (history.hasChanges()) return t('save.unsaved_changes');
    };

    context.flush = function() {
        context.debouncedSave.cancel();
        connection.flush();
        features.reset();
        history.reset();
        _.each(services, function(service) {
            var reset = service().reset;
            if (reset) reset(context);
        });
        return context;
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
            dispatch.call("exit", this, mode);
        }

        mode = newMode;
        mode.enter();
        dispatch.call("enter", this, mode);
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
        dispatch.call("change");
        return context;
    };
    context.getDebug = function(flag) {
        return flag && debugFlags[flag];
    };


    /* Presets */
    var presets;
    context.presets = function(_) {
        if (!arguments.length) return presets;
        presets.load(_);
        areaKeys = presets.areaKeys();
        return context;
    };


    /* Imagery */
    context.imagery = function(_) {
        background.load(_);
        return context;
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


    /* Taginfo */
    var taginfo;
    context.taginfo = function(_) {
        if (!arguments.length) return taginfo;
        taginfo = _;
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

    var locale, localePath;
    context.locale = function(loc, path) {
        if (!arguments.length) return locale;
        locale = loc;
        localePath = path;
        return context;
    };

    context.loadLocale = function(cb) {
        if (locale && locale !== 'en' && locales.indexOf(locale) !== -1) {
            localePath = localePath || context.asset('locales/' + locale + '.json');
            d3.json(localePath, function(err, result) {
                addTranslation(locale, result);
                setLocale(locale);
                cb();
            });
        } else {
            cb();
        }
    };


    /* Init */
    context.version = '2.0.0-alpha.1';

    context.projection = RawMercator();

    locale = Detect().locale;
    if (locale && locales.indexOf(locale) === -1) {
        locale = locale.split('-')[0];
    }

    history = History(context);
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

    connection = Connection();

    background = Background(context);

    features = Features(context);

    map = Map(context);
    context.mouse = map.mouse;
    context.extent = map.extent;
    context.pan = map.pan;
    context.zoomIn = map.zoomIn;
    context.zoomOut = map.zoomOut;
    context.zoomInFurther = map.zoomInFurther;
    context.zoomOutFurther = map.zoomOutFurther;
    context.redrawEnable = map.redrawEnable;

    presets = presetsInit();

    return rebind(context, dispatch, 'on');
}

