import _debounce from 'lodash-es/debounce';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { json as d3_json } from 'd3-fetch';
import { select as d3_select } from 'd3-selection';

import { t, currentLocale, addTranslation, setLocale } from '../util/locale';

import { coreHistory } from './history';
import { coreValidator } from './validator';
import { dataLocales, dataEn } from '../../data';
import { geoRawMercator } from '../geo/raw_mercator';
import { modeSelect } from '../modes/select';
import { osmSetAreaKeys, osmSetPointTags, osmSetVertexTags } from '../osm/tags';
import { presetIndex } from '../presets';
import { rendererBackground, rendererFeatures, rendererMap, rendererPhotos } from '../renderer';
import { services } from '../services';
import { uiInit } from '../ui/init';
import { utilDetect } from '../util/detect';
import { utilKeybinding, utilRebind, utilStringQs } from '../util';


export function coreContext() {
    var dispatch = d3_dispatch('enter', 'exit', 'change');
    var context = utilRebind({}, dispatch, 'on');
    var _deferred = new Set();

    context.version = '2.17.2';
    context.privacyVersion = '20191217';

    // create a special translation that contains the keys in place of the strings
    var tkeys = JSON.parse(JSON.stringify(dataEn));  // clone deep
    var parents = [];

    function traverser(v, k, obj) {
        parents.push(k);
        if (typeof v === 'object') {
            forOwn(v, traverser);
        } else if (typeof v === 'string') {
            obj[k] = parents.join('.');
        }
        parents.pop();
    }

    function forOwn(obj, fn) {
        Object.keys(obj).forEach(function(k) { fn(obj[k], k, obj); });
    }

    forOwn(tkeys, traverser);
    addTranslation('_tkeys_', tkeys);

    addTranslation('en', dataEn);
    setLocale('en');


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


    /* User interface and keybinding */
    var ui;
    context.ui = function() { return ui; };

    var keybinding = utilKeybinding('context');
    context.keybinding = function() { return keybinding; };
    d3_select(document).call(keybinding);


    /* Straight accessors. Avoid using these if you can. */
    var connection, history, validator;
    context.connection = function() { return connection; };
    context.history = function() { return history; };
    context.validator = function() { return validator; };

    /* Connection */
    context.preauth = function(options) {
        if (connection) {
            connection.switch(options);
        }
        return context;
    };


    function afterLoad(callback) {
        return function(err, result) {
            if (!err && result && result.data) {
                history.merge(result.data, result.extent);
            }
            if (callback) {
                callback(err, result);
            }
        };
    }


    context.loadTiles = function(projection, callback) {
        var handle = window.requestIdleCallback(function() {
            _deferred.delete(handle);
            if (connection && context.editableDataEnabled()) {
                connection.loadTiles(projection, afterLoad(callback));
            }
        });
        _deferred.add(handle);
    };

    context.loadTileAtLoc = function(loc, callback) {
        var handle = window.requestIdleCallback(function() {
            _deferred.delete(handle);
            if (connection && context.editableDataEnabled()) {
                connection.loadTileAtLoc(loc, afterLoad(callback));
            }
        });
        _deferred.add(handle);
    };

    context.loadEntity = function(entityID, callback) {
        if (connection) {
            connection.loadEntity(entityID, afterLoad(callback));
        }
    };

    context.loadEntities = function(entityIDs, callback) {
        var handle = window.requestIdleCallback(function() {
            _deferred.delete(handle);
            if (connection) {
                connection.loadMultiple(entityIDs, loadedMultiple);
            }
        });
        _deferred.add(handle);

        function loadedMultiple(err, result) {
            if (err || !result) {
                afterLoad(callback)(err, result);
                return;
            }

            // `loadMultiple` doesn't fetch child nodes, so we have to fetch them
            // manually before merging ways

            var unloadedNodeIDs = new Set();
            var okayResults = [];
            var waitingEntities = [];
            result.data.forEach(function(entity) {
                var hasUnloaded = false;
                if (entity.type === 'way') {
                    entity.nodes.forEach(function(nodeID) {
                        if (!context.hasEntity(nodeID)) {
                            hasUnloaded = true;
                            // mark that we still need this node
                            unloadedNodeIDs.add(nodeID);
                        }
                    });
                }
                if (hasUnloaded) {
                    // don't merge ways with unloaded nodes
                    waitingEntities.push(entity);
                } else {
                    okayResults.push(entity);
                }
            });
            if (okayResults.length) {
                // merge valid results right away
                afterLoad(callback)(err, { data: okayResults });
            }
            if (waitingEntities.length) {
                // run a followup request to fetch missing nodes
                connection.loadMultiple(Array.from(unloadedNodeIDs), function(err, result) {
                    if (err || !result) {
                        afterLoad(callback)(err, result);
                        return;
                    }

                    result.data.forEach(function(entity) {
                        // mark that we successfully received this node
                        unloadedNodeIDs.delete(entity.id);
                        // schedule this node to be merged
                        waitingEntities.push(entity);
                    });

                    // since `loadMultiple` could send multiple requests, wait until all have completed
                    if (unloadedNodeIDs.size === 0) {
                        // merge the ways and their nodes all at once
                        afterLoad(callback)(err, { data: waitingEntities });
                    }
                });
            }
        }
    };

    context.zoomToEntity = function(entityID, zoomTo) {
        if (zoomTo !== false) {
            this.loadEntity(entityID, function(err, result) {
                if (err) return;
                var entity = result.data.find(function(e) { return e.id === entityID; });
                if (entity) {
                    map.zoomTo(entity);
                }
            });
        }

        map.on('drawn.zoomToEntity', function() {
            if (!context.hasEntity(entityID)) return;
            map.on('drawn.zoomToEntity', null);
            context.on('enter.zoomToEntity', null);
            context.enter(modeSelect(context, [entityID]));
        });

        context.on('enter.zoomToEntity', function() {
            if (mode.id !== 'browse') {
                map.on('drawn.zoomToEntity', null);
                context.on('enter.zoomToEntity', null);
            }
        });
    };

    context.zoomToEntities = function(entityIDs) {
        context.loadEntities(entityIDs);

        map.on('drawn.zoomToEntities', function() {
            if (entityIDs.some(function(entityID) {
                return !context.hasEntity(entityID);
            })) return;

            map.on('drawn.zoomToEntities', null);
            context.on('enter.zoomToEntities', null);

            var mode = modeSelect(context, entityIDs);
            context.enter(mode);
            mode.zoomToSelected();
        });

        context.on('enter.zoomToEntities', function() {
            if (mode.id !== 'browse') {
                map.on('drawn.zoomToEntities', null);
                context.on('enter.zoomToEntities', null);
            }
        });
    };

    var minEditableZoom = 16;
    context.minEditableZoom = function(val) {
        if (!arguments.length) return minEditableZoom;
        minEditableZoom = val;
        if (connection) {
            connection.tileZoom(val);
        }
        return context;
    };


    /* History */
    var inIntro = false;
    context.inIntro = function(val) {
        if (!arguments.length) return inIntro;
        inIntro = val;
        return context;
    };

    context.save = function() {
        // no history save, no message onbeforeunload
        if (inIntro || d3_select('.modal').size()) return;

        var canSave;
        if (mode && mode.id === 'save') {
            canSave = false;

            // Attempt to prevent user from creating duplicate changes - see #5200
            if (services.osm && services.osm.isChangesetInflight()) {
                history.clearSaved();
                return;
            }

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
            container.classed('mode-' + mode.id, false);
            dispatch.call('exit', this, mode);
        }

        mode = newMode;
        mode.enter();
        container.classed('mode-' + newMode.id, true);
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
    context.copyIDs = function(val) {
        if (!arguments.length) return copyIDs;
        copyIDs = val;
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
        var graph = history.graph();
        var entity = graph.entity(id);
        return features.hasHiddenConnections(entity, graph);
    };


    /* Photos */
    var photos;
    context.photos = function() { return photos; };


    /* Presets */
    var presets;
    context.presets = function() { return presets; };


    /* Map */
    var map;
    context.map = function() { return map; };
    context.layers = function() { return map.layers; };
    context.surface = function() { return map.surface; };
    context.editableDataEnabled = function() { return map.editableDataEnabled(); };
    context.editable = function() {

        // don't allow editing during save
        var mode = context.mode();
        if (!mode || mode.id === 'save') return false;

        return map.editableDataEnabled();
    };
    context.surfaceRect = function() {
        return map.surface.node().getBoundingClientRect();
    };


    /* Debug */
    var debugFlags = {
        tile: false,        // tile boundaries
        collision: false,   // label collision bounding boxes
        imagery: false,     // imagery bounding polygons
        community: false,   // community bounding polygons
        imperial: false,    // imperial (not metric) bounding polygons
        driveLeft: false,   // driveLeft bounding polygons
        target: false,      // touch targets
        downloaded: false   // downloaded data from osm
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
    context.container = function(val) {
        if (!arguments.length) return container;
        container = val;
        container.classed('id-container', true);
        return context;
    };
    var embed;
    context.embed = function(val) {
        if (!arguments.length) return embed;
        embed = val;
        return context;
    };


    /* Assets */
    var assetPath = '';
    context.assetPath = function(val) {
        if (!arguments.length) return assetPath;
        assetPath = val;
        return context;
    };

    var assetMap = {};
    context.assetMap = function(val) {
        if (!arguments.length) return assetMap;
        assetMap = val;
        return context;
    };

    context.asset = function(val) {
        var filename = assetPath + val;
        return assetMap[filename] || filename;
    };

    context.imagePath = function(val) {
        return context.asset('img/' + val);
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
        // force locale: 
        locale = 'en';
        if (locale && locale !== 'en' && dataLocales.hasOwnProperty(locale)) {
            localePath = localePath || context.asset('locales/' + locale + '.json');
            d3_json(localePath)
                .then(function(result) {
                    addTranslation(locale, result[locale]);
                    setLocale(locale);
                    utilDetect(true);
                    if (callback) callback();
                })
                .catch(function(err) {
                    if (callback) callback(err.message);
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

        Array.from(_deferred).forEach(function(handle) {
            window.cancelIdleCallback(handle);
            _deferred.delete(handle);
        });

        Object.values(services).forEach(function(service) {
            if (service && typeof service.reset === 'function') {
                service.reset(context);
            }
        });

        validator.reset();
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
    validator = coreValidator(context);

    context.graph = history.graph;
    context.changes = history.changes;
    context.intersects = history.intersects;
    context.pauseChangeDispatch = history.pauseChangeDispatch;
    context.resumeChangeDispatch = history.resumeChangeDispatch;

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
    photos = rendererPhotos(context);
    presets = presetIndex(context);

    if (services.maprules && utilStringQs(window.location.hash).maprules) {
        var maprules = utilStringQs(window.location.hash).maprules;
        d3_json(maprules)
            .then(function(mapcss) {
                services.maprules.init();
                mapcss.forEach(function(mapcssSelector) {
                    return services.maprules.addRule(mapcssSelector);
                });
            })
            .catch(function() {
                /* ignore */
            });
    }

    map = rendererMap(context);
    context.mouse = map.mouse;
    context.extent = map.extent;
    context.pan = map.pan;
    context.zoomIn = map.zoomIn;
    context.zoomOut = map.zoomOut;
    context.zoomInFurther = map.zoomInFurther;
    context.zoomOutFurther = map.zoomOutFurther;
    context.redrawEnable = map.redrawEnable;

    Object.values(services).forEach(function(service) {
        if (service && typeof service.init === 'function') {
            service.init(context);
        }
    });

    validator.init();
    background.init();
    features.init();
    photos.init();

    var presetsParameter = utilStringQs(window.location.hash).presets;
    if (presetsParameter && presetsParameter.indexOf('://') !== -1) {
        // assume URL of external presets file

        presets.fromExternal(external, function(externalPresets) {
            context.presets = function() { return externalPresets; }; // default + external presets...
            osmSetAreaKeys(presets.areaKeys());
            osmSetPointTags(presets.pointTags());
            osmSetVertexTags(presets.vertexTags());
        });
    } else {
        var addablePresetIDs;
        if (presetsParameter) {
            // assume list of allowed preset IDs
            addablePresetIDs = presetsParameter.split(',');
        }
        presets.init(addablePresetIDs);
        osmSetAreaKeys(presets.areaKeys());
        osmSetPointTags(presets.pointTags());
        osmSetVertexTags(presets.vertexTags());
    }

    context.isFirstSession = !context.storage('sawSplash');

    return context;
}
