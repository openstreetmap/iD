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
  const dispatch = d3_dispatch('enter', 'exit', 'change');
  let context = utilRebind({}, dispatch, 'on');
  let _deferred = new Set();

  context.version = '2.17.1';
  context.privacyVersion = '20191217';

  // create a special translation that contains the keys in place of the strings
  let tkeys = JSON.parse(JSON.stringify(dataEn));  // clone deep
  let parents = [];

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
    Object.keys(obj).forEach(k => fn(obj[k], k, obj));
  }

  forOwn(tkeys, traverser);
  addTranslation('_tkeys_', tkeys);

  addTranslation('en', dataEn);
  setLocale('en');


  // https://github.com/openstreetmap/iD/issues/772
  // http://mathiasbynens.be/notes/localstorage-pattern#comment-9
  let storage;
  try { storage = localStorage; } catch (e) {}  // eslint-disable-line no-empty
  storage = storage || (() => {
    let s = {};
    return {
        getItem: (k) => s[k],
        setItem: (k, v) => s[k] = v,
        removeItem: (k) => delete s[k]
    };
  })();

  context.storage = function(k, v) {
    try {
      if (arguments.length === 1) return storage.getItem(k);
      else if (v === null) storage.removeItem(k);
      else storage.setItem(k, v);
    } catch (e) {
      /* eslint-disable no-console */
      if (typeof console !== 'undefined') {
        console.error('localStorage quota exceeded');
      }
      /* eslint-enable no-console */
    }
  };


  /* User interface and keybinding */
  let ui;
  context.ui = () => ui;

  let keybinding = utilKeybinding('context');
  context.keybinding = () => keybinding;
  d3_select(document).call(keybinding);


  /* Straight accessors. Avoid using these if you can. */
  let connection, history, validator;
  context.connection = () => connection;
  context.history = () => history;
  context.validator = () => validator;

  /* Connection */
  context.preauth = (options) => {
    if (connection) {
      connection.switch(options);
    }
    return context;
  };


  function afterLoad(cid, callback) {
    return (err, result) => {
      if (err) {
        // 400 Bad Request, 401 Unauthorized, 403 Forbidden..
        if (err.status === 400 || err.status === 401 || err.status === 403) {
          if (connection) {
            connection.logout();
          }
        }
        if (typeof callback === 'function') {
          callback(err);
        }
        return;

      } else if (connection && connection.getConnectionId() !== cid) {
        if (typeof callback === 'function') {
          callback({ message: 'Connection Switched', status: -1 });
        }
        return;

      } else {
        history.merge(result.data, result.extent);
        if (typeof callback === 'function') {
          callback(err, result);
        }
        return;
      }
    };
  }


  context.loadTiles = (projection, callback) => {
    const handle = window.requestIdleCallback(() => {
      _deferred.delete(handle);
      if (connection && context.editableDataEnabled()) {
        const cid = connection.getConnectionId();
        connection.loadTiles(projection, afterLoad(cid, callback));
      }
    });
    _deferred.add(handle);
  };

  context.loadTileAtLoc = (loc, callback) => {
    const handle = window.requestIdleCallback(() => {
      _deferred.delete(handle);
      if (connection && context.editableDataEnabled()) {
        const cid = connection.getConnectionId();
        connection.loadTileAtLoc(loc, afterLoad(cid, callback));
      }
    });
    _deferred.add(handle);
  };

  context.loadEntity = (entityID, callback) => {
    if (connection) {
      const cid = connection.getConnectionId();
      connection.loadEntity(entityID, afterLoad(cid, callback));
    }
  };

  context.zoomToEntity = (entityID, zoomTo) => {
    if (zoomTo !== false) {
      this.loadEntity(entityID, (err, result) => {
        if (err) return;
        const entity = result.data.find(e => e.id === entityID);
        if (entity) {
          map.zoomTo(entity);
        }
      });
    }

    map.on('drawn.zoomToEntity', () => {
      if (!context.hasEntity(entityID)) return;
      map.on('drawn.zoomToEntity', null);
      context.on('enter.zoomToEntity', null);
      context.enter(modeSelect(context, [entityID]));
    });

    context.on('enter.zoomToEntity', () => {
      if (mode.id !== 'browse') {
        map.on('drawn.zoomToEntity', null);
        context.on('enter.zoomToEntity', null);
      }
    });
  };

  let minEditableZoom = 16;
  context.minEditableZoom = function(val) {
    if (!arguments.length) return minEditableZoom;
    minEditableZoom = val;
    if (connection) {
      connection.tileZoom(val);
    }
    return context;
  };


  /* History */
  let inIntro = false;
  context.inIntro = function(val) {
    if (!arguments.length) return inIntro;
    inIntro = val;
    return context;
  };

  context.save = () => {
    // no history save, no message onbeforeunload
    if (inIntro || d3_select('.modal').size()) return;

    let canSave;
    if (mode && mode.id === 'save') {
      canSave = false;

      // Attempt to prevent user from creating duplicate changes - see #5200
      if (services.osm && services.osm.isChangesetInflight()) {
        history.clearSaved();
        return;
      }

    } else {
      canSave = context.selectedIDs().every(id => {
        const entity = context.hasEntity(id);
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
  context.hasEntity = (id) => history.graph().hasEntity(id);
  context.entity = (id) => history.graph().entity(id);
  context.childNodes = (way) => history.graph().childNodes(way);
  context.geometry = (id) => context.entity(id).geometry(history.graph());


  /* Modes */
  let mode;
  context.mode = () => mode;
  context.enter = (newMode) => {
    if (mode) {
      mode.exit();
      dispatch.call('exit', this, mode);
    }

    mode = newMode;
    mode.enter();
    dispatch.call('enter', this, mode);
  };

  context.selectedIDs = () => (mode && mode.selectedIDs && mode.selectedIDs()) || [];
  context.activeID = () => mode && mode.activeID && mode.activeID();

  let _selectedNoteID;
  context.selectedNoteID = function(noteID) {
    if (!arguments.length) return _selectedNoteID;
    _selectedNoteID = noteID;
    return context;
  };

  let _selectedErrorID;
  context.selectedErrorID = function(errorID) {
    if (!arguments.length) return _selectedErrorID;
    _selectedErrorID = errorID;
    return context;
  };


  /* Behaviors */
  context.install = (behavior) => context.surface().call(behavior);
  context.uninstall = (behavior) => context.surface().call(behavior.off);


  /* Copy/Paste */
  let copyGraph;
  context.copyGraph = () => copyGraph;

  let copyIDs = [];
  context.copyIDs = function(val) {
    if (!arguments.length) return copyIDs;
    copyIDs = val;
    copyGraph = history.graph();
    return context;
  };


  /* Background */
  let background;
  context.background = () => background;


  /* Features */
  let features;
  context.features = () => features;
  context.hasHiddenConnections = (id) => {
    const graph = history.graph();
    const entity = graph.entity(id);
    return features.hasHiddenConnections(entity, graph);
  };


  /* Photos */
  let photos;
  context.photos = () => photos;


  /* Presets */
  let presets;
  context.presets = () => presets;


  /* Map */
  let map;
  context.map = () => map;
  context.layers = () => map.layers;
  context.surface = () => map.surface;
  context.editableDataEnabled = () => map.editableDataEnabled();
  context.surfaceRect = () => map.surface.node().getBoundingClientRect();
  context.editable = () => {
     // don't allow editing during save
     const mode = context.mode();
     if (!mode || mode.id === 'save') return false;
     return map.editableDataEnabled();
  };


  /* Debug */
  let debugFlags = {
    tile: false,        // tile boundaries
    collision: false,   // label collision bounding boxes
    imagery: false,     // imagery bounding polygons
    community: false,   // community bounding polygons
    imperial: false,    // imperial (not metric) bounding polygons
    driveLeft: false,   // driveLeft bounding polygons
    target: false,      // touch targets
    downloaded: false   // downloaded data from osm
  };
  context.debugFlags = () => debugFlags;
  context.getDebug = (flag) => flag && debugFlags[flag];
  context.setDebug = function(flag, val) {
    if (arguments.length === 1) val = true;
    debugFlags[flag] = val;
    dispatch.call('change');
    return context;
  };


  /* Container */
  let container = d3_select(document.body);
  context.container = function(val) {
    if (!arguments.length) return container;
    container = val;
    container.classed('id-container', true);
    return context;
  };
  let embed;
  context.embed = function(val) {
    if (!arguments.length) return embed;
    embed = val;
    return context;
  };


  /* Assets */
  let assetPath = '';
  context.assetPath = function(val) {
    if (!arguments.length) return assetPath;
    assetPath = val;
    return context;
  };

  let assetMap = {};
  context.assetMap = function(val) {
    if (!arguments.length) return assetMap;
    assetMap = val;
    return context;
  };

  context.asset = (val) => {
    const filename = assetPath + val;
    return assetMap[filename] || filename;
  };

  context.imagePath = (val) => context.asset(`img/${val}`);


  /* locales */
  // `locale` letiable contains a "requested locale".
  // It won't become the `currentLocale` until after loadLocale() is called.
  let locale, localePath;

  context.locale = function(loc, path) {
    if (!arguments.length) return currentLocale;
    locale = loc;
    localePath = path;
    return context;
  };

  context.loadLocale = (callback) => {
    if (locale && locale !== 'en' && dataLocales.hasOwnProperty(locale)) {
      localePath = localePath || context.asset(`locales/${locale}.json`);
      d3_json(localePath)
        .then(result => {
          addTranslation(locale, result[locale]);
          setLocale(locale);
          utilDetect(true);
          if (callback) callback();
        })
        .catch(err => {
          if (callback) callback(err.message);
        });
    } else {
      if (locale) {
        setLocale(locale);
        utilDetect(true);
      }
      if (callback) callback();
    }
  };


  /* reset (aka flush) */
  context.reset = context.flush = () => {
    context.debouncedSave.cancel();

    Array.from(_deferred).forEach(handle => {
      window.cancelIdleCallback(handle);
      _deferred.delete(handle);
    });

    Object.values(services).forEach(service => {
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
      const result = fn.apply(history, arguments);
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

  const hash = utilStringQs(window.location.hash);

  if (services.maprules && hash.maprules) {
    d3_json(hash.maprules)
      .then(mapcss => {
        services.maprules.init();
        mapcss.forEach(mapcssSelector => services.maprules.addRule(mapcssSelector));
      })
      .catch(() => { /* ignore */ });
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

  Object.values(services).forEach(service => {
    if (service && typeof service.init === 'function') {
      service.init(context);
    }
  });

  validator.init();
  background.init();
  features.init();
  photos.init();

  let presetsParameter = hash.presets;
  if (presetsParameter && presetsParameter.indexOf('://') !== -1) {
    // a URL of external presets file
    presets.fromExternal(external, (externalPresets) => {
      context.presets = () => externalPresets;  // default + external presets...
      osmSetAreaKeys(presets.areaKeys());
      osmSetPointTags(presets.pointTags());
      osmSetVertexTags(presets.vertexTags());
    });
  } else {
    let addablePresetIDs;
    if (presetsParameter) {
      // a list of allowed preset IDs
      addablePresetIDs = presetsParameter.split(',');
    }
    presets.init(addablePresetIDs);
    osmSetAreaKeys(presets.areaKeys());
    osmSetPointTags(presets.pointTags());
    osmSetVertexTags(presets.vertexTags());
  }

  return context;
}
