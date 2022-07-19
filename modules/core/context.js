import _debounce from 'lodash-es/debounce';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { json as d3_json } from 'd3-fetch';
import { select as d3_select } from 'd3-selection';

import { t } from '../core/localizer';

import { fileFetcher } from './file_fetcher';
import { localizer } from './localizer';
import { coreHistory } from './history';
import { coreValidator } from './validator';
import { coreUploader } from './uploader';
import { geoRawMercator } from '../geo/raw_mercator';
import { modeSelect } from '../modes/select';
import { presetManager } from '../presets';
import { rendererBackground, rendererFeatures, rendererMap, rendererPhotos } from '../renderer';
import { services } from '../services';
import { uiInit } from '../ui/init';
import { utilKeybinding, utilRebind, utilStringQs, utilUnicodeCharsTruncated } from '../util';


export function coreContext() {
  const dispatch = d3_dispatch('enter', 'exit', 'change');
  let context = utilRebind({}, dispatch, 'on');
  let _deferred = new Set();

  context.version = '2.22.0-dev';
  context.privacyVersion = '20201202';

  // iD will alter the hash so cache the parameters intended to setup the session
  context.initialHashParams = window.location.hash ? utilStringQs(window.location.hash) : {};

  /* Changeset */
  // An osmChangeset object. Not loaded until needed.
  context.changeset = null;

  let _defaultChangesetComment = context.initialHashParams.comment;
  let _defaultChangesetSource = context.initialHashParams.source;
  let _defaultChangesetHashtags = context.initialHashParams.hashtags;
  context.defaultChangesetComment = function(val) {
    if (!arguments.length) return _defaultChangesetComment;
    _defaultChangesetComment = val;
    return context;
  };
  context.defaultChangesetSource = function(val) {
    if (!arguments.length) return _defaultChangesetSource;
    _defaultChangesetSource = val;
    return context;
  };
  context.defaultChangesetHashtags = function(val) {
    if (!arguments.length) return _defaultChangesetHashtags;
    _defaultChangesetHashtags = val;
    return context;
  };

  /* Document title */
  /* (typically shown as the label for the browser window/tab) */

  // If true, iD will update the title based on what the user is doing
  let _setsDocumentTitle = true;
  context.setsDocumentTitle = function(val) {
    if (!arguments.length) return _setsDocumentTitle;
    _setsDocumentTitle = val;
    return context;
  };
  // The part of the title that is always the same
  let _documentTitleBase = document.title;
  context.documentTitleBase = function(val) {
    if (!arguments.length) return _documentTitleBase;
    _documentTitleBase = val;
    return context;
  };


  /* User interface and keybinding */
  let _ui;
  context.ui = () => _ui;
  context.lastPointerType = () => _ui.lastPointerType();

  let _keybinding = utilKeybinding('context');
  context.keybinding = () => _keybinding;
  d3_select(document).call(_keybinding);


  /* Straight accessors. Avoid using these if you can. */
  // Instantiate the connection here because it doesn't require passing in
  // `context` and it's needed for pre-init calls like `preauth`
  let _connection = services.osm;
  let _history;
  let _validator;
  let _uploader;
  context.connection = () => _connection;
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

  /* connection options for source switcher (optional) */
  let _apiConnections;
  context.apiConnections = function(val) {
    if (!arguments.length) return _apiConnections;
    _apiConnections = val;
    return context;
  };


  // A string or array or locale codes to prefer over the browser's settings
  context.locale = function(locale) {
    if (!arguments.length) return localizer.localeCode();
    localizer.preferredLocaleCodes(locale);
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

  // Download the full entity and its parent relations. The callback may be called multiple times.
  context.loadEntity = (entityID, callback) => {
    if (_connection) {
      const cid = _connection.getConnectionId();
      _connection.loadEntity(entityID, afterLoad(cid, callback));
      // We need to fetch the parent relations separately.
      _connection.loadEntityRelations(entityID, afterLoad(cid, callback));
    }
  };

  context.zoomToEntity = (entityID, zoomTo) => {

    // be sure to load the entity even if we're not going to zoom to it
    context.loadEntity(entityID, (err, result) => {
      if (err) return;
      if (zoomTo !== false) {
          const entity = result.data.find(e => e.id === entityID);
          if (entity) {
            _map.zoomTo(entity);
          }
      }
    });

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

  // String length limits in Unicode characters, not JavaScript UTF-16 code units
  context.maxCharsForTagKey = () => 255;
  context.maxCharsForTagValue = () => 255;
  context.maxCharsForRelationRole = () => 255;

  function cleanOsmString(val, maxChars) {
    // be lenient with input
    if (val === undefined || val === null) {
      val = '';
    } else {
      val = val.toString();
    }

    // remove whitespace
    val = val.trim();

    // use the canonical form of the string
    if (val.normalize) val = val.normalize('NFC');

    // trim to the number of allowed characters
    return utilUnicodeCharsTruncated(val, maxChars);
  }
  context.cleanTagKey = (val) => cleanOsmString(val, context.maxCharsForTagKey());
  context.cleanTagValue = (val) => cleanOsmString(val, context.maxCharsForTagValue());
  context.cleanRelationRole = (val) => cleanOsmString(val, context.maxCharsForRelationRole());


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
    if (_inIntro || context.container().select('.modal').size()) return;

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

  let _copyLonLat;
  context.copyLonLat = function(val) {
    if (!arguments.length) return _copyLonLat;
    _copyLonLat = val;
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


  /* Map */
  let _map;
  context.map = () => _map;
  context.layers = () => _map.layers();
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
  let _container = d3_select(null);
  context.container = function(val) {
    if (!arguments.length) return _container;
    _container = val;
    _container.classed('ideditor', true);
    return context;
  };
  context.containerNode = function(val) {
    if (!arguments.length) return context.container().node();
    context.container(d3_select(val));
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
    fileFetcher.assetPath(val);
    return context;
  };

  let _assetMap = {};
  context.assetMap = function(val) {
    if (!arguments.length) return _assetMap;
    _assetMap = val;
    fileFetcher.assetMap(val);
    return context;
  };

  context.asset = (val) => {
    if (/^http(s)?:\/\//i.test(val)) return val;
    const filename = _assetPath + val;
    return _assetMap[filename] || filename;
  };

  context.imagePath = (val) => context.asset(`img/${val}`);


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

    context.changeset = null;

    _validator.reset();
    _features.reset();
    _history.reset();
    _uploader.reset();

    // don't leave stale state in the inspector
    context.container().select('.inspector-wrap *').remove();

    return context;
  };


  /* Projections */
  context.projection = geoRawMercator();
  context.curtainProjection = geoRawMercator();


  /* Init */
  context.init = () => {

    instantiateInternal();

    initializeDependents();

    return context;

    // Load variables and properties. No property of `context` should be accessed
    // until this is complete since load statuses are indeterminate. The order
    // of instantiation shouldn't matter.
    function instantiateInternal() {

      _history = coreHistory(context);
      context.graph = _history.graph;
      context.pauseChangeDispatch = _history.pauseChangeDispatch;
      context.resumeChangeDispatch = _history.resumeChangeDispatch;
      context.perform = withDebouncedSave(_history.perform);
      context.replace = withDebouncedSave(_history.replace);
      context.pop = withDebouncedSave(_history.pop);
      context.overwrite = withDebouncedSave(_history.overwrite);
      context.undo = withDebouncedSave(_history.undo);
      context.redo = withDebouncedSave(_history.redo);

      _validator = coreValidator(context);
      _uploader = coreUploader(context);

      _background = rendererBackground(context);
      _features = rendererFeatures(context);
      _map = rendererMap(context);
      _photos = rendererPhotos(context);

      _ui = uiInit(context);
    }

    // Set up objects that might need to access properties of `context`. The order
    // might matter if dependents make calls to each other. Be wary of async calls.
    function initializeDependents() {

      if (context.initialHashParams.presets) {
        presetManager.addablePresetIDs(new Set(context.initialHashParams.presets.split(',')));
      }

      if (context.initialHashParams.locale) {
        localizer.preferredLocaleCodes(context.initialHashParams.locale);
      }

      // kick off some async work
      localizer.ensureLoaded();
      presetManager.ensureLoaded();
      _background.ensureLoaded();

      Object.values(services).forEach(service => {
        if (service && typeof service.init === 'function') {
          service.init();
        }
      });

      _map.init();
      _validator.init();
      _features.init();

      if (services.maprules && context.initialHashParams.maprules) {
        d3_json(context.initialHashParams.maprules)
          .then(mapcss => {
            services.maprules.init();
            mapcss.forEach(mapcssSelector => services.maprules.addRule(mapcssSelector));
          })
          .catch(() => { /* ignore */ });
      }

      // if the container isn't available, e.g. when testing, don't load the UI
      if (!context.container().empty()) {
        _ui.ensureLoaded()
          .then(() => {
            _background.init();
            _photos.init();
          });
      }
    }
  };

  return context;
}
