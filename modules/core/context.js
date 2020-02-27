import _debounce from 'lodash-es/debounce';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { json as d3_json } from 'd3-fetch';
import { select as d3_select } from 'd3-selection';

import { t, setLocale, localeStrings, localeData } from '../util/locale';

import { coreData } from './data';
import { coreHistory } from './history';
import { coreValidator } from './validator';
import { coreUploader } from './uploader';
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

  context.version = '2.17.2';
  context.privacyVersion = '20191217';


  // https://github.com/openstreetmap/iD/issues/772
  // http://mathiasbynens.be/notes/localstorage-pattern#comment-9
  let _storage;
  try { _storage = localStorage; } catch (e) {}  // eslint-disable-line no-empty
  _storage = _storage || (() => {
    let s = {};
    return {
      getItem: (k) => s[k],
      setItem: (k, v) => s[k] = v,
      removeItem: (k) => delete s[k]
    };
  })();

  context.storage = function(k, v) {
    try {
      if (arguments.length === 1) return _storage.getItem(k);
      else if (v === null) _storage.removeItem(k);
      else _storage.setItem(k, v);
    } catch (e) {
      /* eslint-disable no-console */
      if (typeof console !== 'undefined') {
        console.error('localStorage quota exceeded');
      }
      /* eslint-enable no-console */
    }
  };


  /* User interface and keybinding */
  let _ui;
  context.ui = () => _ui;

  let _keybinding = utilKeybinding('context');
  context.keybinding = () => _keybinding;
  d3_select(document).call(_keybinding);


  /* Straight accessors. Avoid using these if you can. */
  let _connection;
  let _data;
  let _history;
  let _validator;
  let _uploader;
  context.connection = () => _connection;
  context.data = () => _data;
  context.history = () => _history;
  context.validator = () => _validator;
  context.uploader = () => _uploader;

  /* Connection */
  context.preauth = (options) => {
    if (_connection) {
      _connection.switch(options);
    }
    return context;
  };


  function afterLoad(cid, callback) {
    return (err, result) => {
      if (err) {
        // 400 Bad Request, 401 Unauthorized, 403 Forbidden..
        if (err.status === 400 || err.status === 401 || err.status === 403) {
          if (_connection) {
            _connection.logout();
          }
        }
        if (typeof callback === 'function') {
          callback(err);
        }
        return;

      } else if (_connection && _connection.getConnectionId() !== cid) {
        if (typeof callback === 'function') {
          callback({ message: 'Connection Switched', status: -1 });
        }
        return;

      } else {
        _history.merge(result.data, result.extent);
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
      if (_connection && context.editableDataEnabled()) {
        const cid = _connection.getConnectionId();
        _connection.loadTiles(projection, afterLoad(cid, callback));
      }
    });
    _deferred.add(handle);
  };

  context.loadTileAtLoc = (loc, callback) => {
    const handle = window.requestIdleCallback(() => {
      _deferred.delete(handle);
      if (_connection && context.editableDataEnabled()) {
        const cid = _connection.getConnectionId();
        _connection.loadTileAtLoc(loc, afterLoad(cid, callback));
      }
    });
    _deferred.add(handle);
  };

  context.loadEntity = (entityID, callback) => {
    if (_connection) {
      const cid = _connection.getConnectionId();
      _connection.loadEntity(entityID, afterLoad(cid, callback));
    }
  };

  context.zoomToEntity = (entityID, zoomTo) => {
    if (zoomTo !== false) {
      context.loadEntity(entityID, (err, result) => {
        if (err) return;
        const entity = result.data.find(e => e.id === entityID);
        if (entity) {
          _map.zoomTo(entity);
        }
      });
    }

    _map.on('drawn.zoomToEntity', () => {
      if (!context.hasEntity(entityID)) return;
      _map.on('drawn.zoomToEntity', null);
      context.on('enter.zoomToEntity', null);
      context.enter(modeSelect(context, [entityID]));
    });

    context.on('enter.zoomToEntity', () => {
      if (_mode.id !== 'browse') {
        _map.on('drawn.zoomToEntity', null);
        context.on('enter.zoomToEntity', null);
      }
    });
  };

  let _minEditableZoom = 16;
  context.minEditableZoom = function(val) {
    if (!arguments.length) return _minEditableZoom;
    _minEditableZoom = val;
    if (_connection) {
      _connection.tileZoom(val);
    }
    return context;
  };


  context.maxCharsForTagKey = () => 255;

  context.maxCharsForTagValue = () => 255;

  context.maxCharsForRelationRole = () => 255;


  /* History */
  let _inIntro = false;
  context.inIntro = function(val) {
    if (!arguments.length) return _inIntro;
    _inIntro = val;
    return context;
  };

  // Immediately save the user's history to localstorage, if possible
  // This is called someteimes, but also on the `window.onbeforeunload` handler
  context.save = () => {
    // no history save, no message onbeforeunload
    if (_inIntro || d3_select('.modal').size()) return;

    let canSave;
    if (_mode && _mode.id === 'save') {
      canSave = false;

      // Attempt to prevent user from creating duplicate changes - see #5200
      if (services.osm && services.osm.isChangesetInflight()) {
        _history.clearSaved();
        return;
      }

    } else {
      canSave = context.selectedIDs().every(id => {
        const entity = context.hasEntity(id);
        return entity && !entity.isDegenerate();
      });
    }

    if (canSave) {
      _history.save();
    }
    if (_history.hasChanges()) {
      return t('save.unsaved_changes');
    }
  };

  // Debounce save, since it's a synchronous localStorage write,
  // and history changes can happen frequently (e.g. when dragging).
  context.debouncedSave = _debounce(context.save, 350);

  function withDebouncedSave(fn) {
    return function() {
      const result = fn.apply(_history, arguments);
      context.debouncedSave();
      return result;
    };
  }


  /* Graph */
  context.hasEntity = (id) => _history.graph().hasEntity(id);
  context.entity = (id) => _history.graph().entity(id);
  context.childNodes = (way) => _history.graph().childNodes(way);
  context.geometry = (id) => context.entity(id).geometry(_history.graph());


  /* Modes */
  let _mode;
  context.mode = () => _mode;
  context.enter = (newMode) => {
    if (_mode) {
      _mode.exit();
      dispatch.call('exit', this, _mode);
    }

    _mode = newMode;
    _mode.enter();
    dispatch.call('enter', this, _mode);
  };

  context.selectedIDs = () => (_mode && _mode.selectedIDs && _mode.selectedIDs()) || [];
  context.activeID = () => _mode && _mode.activeID && _mode.activeID();

  let _selectedNoteID;
  context.selectedNoteID = function(noteID) {
    if (!arguments.length) return _selectedNoteID;
    _selectedNoteID = noteID;
    return context;
  };

  // NOTE: Don't change the name of this until UI v3 is merged
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
  let _copyGraph;
  context.copyGraph = () => _copyGraph;

  let _copyIDs = [];
  context.copyIDs = function(val) {
    if (!arguments.length) return _copyIDs;
    _copyIDs = val;
    _copyGraph = _history.graph();
    return context;
  };


  /* Background */
  let _background;
  context.background = () => _background;


  /* Features */
  let _features;
  context.features = () => _features;
  context.hasHiddenConnections = (id) => {
    const graph = _history.graph();
    const entity = graph.entity(id);
    return _features.hasHiddenConnections(entity, graph);
  };


  /* Photos */
  let _photos;
  context.photos = () => _photos;


  /* Presets */
  let _presets;
  context.presets = () => _presets;


  /* Map */
  let _map;
  context.map = () => _map;
  context.layers = () => _map.layers;
  context.surface = () => _map.surface;
  context.editableDataEnabled = () => _map.editableDataEnabled();
  context.surfaceRect = () => _map.surface.node().getBoundingClientRect();
  context.editable = () => {
    // don't allow editing during save
    const mode = context.mode();
    if (!mode || mode.id === 'save') return false;
    return _map.editableDataEnabled();
  };


  /* Debug */
  let _debugFlags = {
    tile: false,        // tile boundaries
    collision: false,   // label collision bounding boxes
    imagery: false,     // imagery bounding polygons
    target: false,      // touch targets
    downloaded: false   // downloaded data from osm
  };
  context.debugFlags = () => _debugFlags;
  context.getDebug = (flag) => flag && _debugFlags[flag];
  context.setDebug = function(flag, val) {
    if (arguments.length === 1) val = true;
    _debugFlags[flag] = val;
    dispatch.call('change');
    return context;
  };


  /* Container */
  let _container = d3_select(document.body);
  context.container = function(val) {
    if (!arguments.length) return _container;
    _container = val;
    _container.classed('id-container', true);
    return context;
  };
  let _embed;
  context.embed = function(val) {
    if (!arguments.length) return _embed;
    _embed = val;
    return context;
  };


  /* Assets */
  let _assetPath = '';
  context.assetPath = function(val) {
    if (!arguments.length) return _assetPath;
    _assetPath = val;
    return context;
  };

  let _assetMap = {};
  context.assetMap = function(val) {
    if (!arguments.length) return _assetMap;
    _assetMap = val;
    return context;
  };

  context.asset = (val) => {
    if (/^http(s)?:\/\//i.test(val)) return val;
    const filename = _assetPath + val;
    return _assetMap[filename] || filename;
  };

  context.imagePath = (val) => context.asset(`img/${val}`);


  /* Locales */
  // Returns a Promise to load the strings for the requested locale
  context.loadLocale = (requested) => {
    let locale = requested;

    if (!_data) {
      return Promise.reject('loadLocale called before init');
    }
    if (!localeData[locale]) {        // Locale not supported, e.g. 'es-FAKE'
      locale = locale.split('-')[0];  // Fallback to the first part 'es'
    }
    if (!localeData[locale]) {
      return Promise.reject(`Unsupported locale: ${requested}`);
    }

    if (localeStrings[locale]) {    // already loaded
      return Promise.resolve(locale);
    }

    let fileMap = _data.fileMap();
    const key = `locale_${locale}`;
    fileMap[key] = `locales/${locale}.json`;

    return _data.get(key)
      .then(d => {
        localeStrings[locale] = d[locale];
        return locale;
      });
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

    _validator.reset();
    _features.reset();
    _history.reset();
    _uploader.reset();

    // don't leave stale state in the inspector
    d3_select('.inspector-wrap *').remove();

    return context;
  };


  /* Projections */
  context.projection = geoRawMercator();
  context.curtainProjection = geoRawMercator();


  /* Init */
  context.init = () => {
    const hash = utilStringQs(window.location.hash);

    _data = coreData(context);

    // Start loading data:
    // 1. the list of supported locales
    // 2. the English locale strings (used as fallbacks)
    // 3. the preferred locale strings (detected by utilDetect)
    const requested = utilDetect().locale;
    _data.get('locales')
      .then(d => Object.assign(localeData, d))
      .then(() => context.loadLocale('en'))
      .then(() => context.loadLocale(requested))
      .then(received => {      // `received` may not match `requested`.
        setLocale(received);   // (e.g. 'es-FAKE' will return 'es')
        utilDetect(true);      // Then force redetection
      })
      .catch(err => console.error(err));  // eslint-disable-line

    _history = coreHistory(context);
    _validator = coreValidator(context);
    _uploader = coreUploader(context);

    context.graph = _history.graph;
    context.changes = _history.changes;
    context.intersects = _history.intersects;
    context.pauseChangeDispatch = _history.pauseChangeDispatch;
    context.resumeChangeDispatch = _history.resumeChangeDispatch;

    context.perform = withDebouncedSave(_history.perform);
    context.replace = withDebouncedSave(_history.replace);
    context.pop = withDebouncedSave(_history.pop);
    context.overwrite = withDebouncedSave(_history.overwrite);
    context.undo = withDebouncedSave(_history.undo);
    context.redo = withDebouncedSave(_history.redo);

    _ui = uiInit(context);

    _connection = services.osm;
    _background = rendererBackground(context);
    _features = rendererFeatures(context);
    _photos = rendererPhotos(context);
    _presets = presetIndex(context);

    if (hash.presets) {
      _presets.addablePresetIDs(new Set(hash.presets.split(',')));
    }

    _map = rendererMap(context);
    context.mouse = _map.mouse;
    context.extent = _map.extent;
    context.pan = _map.pan;
    context.zoomIn = _map.zoomIn;
    context.zoomOut = _map.zoomOut;
    context.zoomInFurther = _map.zoomInFurther;
    context.zoomOutFurther = _map.zoomOutFurther;
    context.redrawEnable = _map.redrawEnable;

    Object.values(services).forEach(service => {
      if (service && typeof service.init === 'function') {
        service.init(context);
      }
    });

    _validator.init();
    _background.init();
    _features.init();
    _photos.init();
    _presets.init()
      .then(() => {
        osmSetAreaKeys(_presets.areaKeys());
        osmSetPointTags(_presets.pointTags());
        osmSetVertexTags(_presets.vertexTags());
      });

    if (services.maprules && hash.maprules) {
      d3_json(hash.maprules)
        .then(mapcss => {
          services.maprules.init();
          mapcss.forEach(mapcssSelector => services.maprules.addRule(mapcssSelector));
        })
        .catch(() => { /* ignore */ });
    }

    return context;
  };


  return context;
}
