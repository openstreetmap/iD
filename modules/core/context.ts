import { debounce, throttle, type DebouncedFunc } from 'es-toolkit/compat';

import { dispatch as d3_dispatch, type Dispatch } from 'd3-dispatch';
import { json as d3_json } from 'd3-fetch';
import { select as d3_select } from 'd3-selection';

import packageJSON from '../../package.json';
import type { EntityId, NoteId, osmChangeset, OsmEntity } from '../osm';
import { t, localizer } from './localizer';
import { fileFetcher, type AssetMap } from './file_fetcher';
import { coreHistory } from './history';
import { coreValidator } from './validator';
import { coreUploader } from './uploader';
import { geoRawMercator, type Projection } from '../geo/raw_mercator';
import { modeSelect, modeSelectNote } from '../modes';
import { presetManager } from '../presets';
import { rendererBackground, rendererFeatures, rendererMap, rendererPhotos } from '../renderer';
import { services } from '../services';
import { uiInit } from '../ui/init';
import { utilKeybinding, utilRebind, utilStringQs, utilCleanOsmString } from '../util';
import { ApiError } from '../util/error';
import type { coreGraph } from '.';
import type { Vec2 } from '../geo/vector';

type Theme = 'light' | 'dark';

type EventMap = {
    enter: [];
    exit: [];
    change: [];
}

export interface Mode {
    id: string;
    enter(): void;
    exit(): void;
    selectedIDs?(): EntityId[];
    activeID?(): EntityId;
}

export interface Behaviour extends d3.Selector {
    off: d3.Selector;
}

interface HashParams {
    theme?: Theme;
    presets?: string;
    locale?: string;
    maprules?: string;
    comment?: string;
    source?: string;
    hashtags?: string;
}

type DebugFlags =
    /** tile boundaries */
    | 'tile'
    /** label collision bounding boxes */
    | 'collision'
    /** imagery bounding polygons */
    | 'imagery'
    /** touch targets */
    | 'target'
    /** downloaded data from osm */
    | 'downloaded';


interface LoadedData {
    data: OsmEntity[];
}

export interface coreContext extends Pick<Dispatch<object, EventMap>, 'on'> {
    version: string;
    privacyVersion: string;
    initialHashParams: HashParams;
    changeset: osmChangeset | null;
    defaultChangesetComment: GetSet<coreContext, string>;
    defaultChangesetSource: GetSet<coreContext, string>;
    defaultChangesetHashtags: GetSet<coreContext, string>;
    setsDocumentTitle: GetSet<coreContext, boolean>;
    documentTitleBase: GetSet<coreContext, string>;
    ui(): ReturnType<typeof uiInit>;
    lastPointerType(): PointerEvent['pointerType'];
    keybinding(): ReturnType<typeof utilKeybinding>;

    connection(): typeof services.osm;
    history(): coreHistory;
    validator(): ReturnType<typeof coreValidator>;
    uploader(): ReturnType<typeof coreUploader>;
    preauth(newOptions: OSMAuth.OSMAuthOptions): coreContext;
    locale: GetSet<coreContext, string | string[]>;
    loadTiles(projection: Projection, callback?: Callback<LoadedData>): void;
    loadTileAtLoc(loc: Vec2, callback?: Callback<LoadedData>): void;
    loadEntity(entityID: EntityId, callback: Callback<LoadedData>): void;
    loadNote(entityID: NoteId, callback: Callback<LoadedData>): void;
    zoomToEntity(entityID: EntityId, zoomTo?: boolean): void;
    zoomToEntities(entityIDs: EntityId[], zoomTo?: boolean): void;

    moveToNote(noteId: NoteId, moveTo?: boolean): void;
    minEditableZoom: GetSet<coreContext, number>;
    maxCharsForTagKey(): number;
    maxCharsForTagValue(): number;
    maxCharsForRelationRole(): number;

    cleanTagKey(val: TagKey): TagKey;
    cleanTagValue(val: TagValue): TagValue;
    cleanRelationRole(val: string): string;

    inIntro: GetSet<coreContext, boolean>;
    save(): void;
    debouncedSave: DebouncedFunc<coreContext['save']>;
    hasEntity: coreGraph['hasEntity'];
    entity: coreGraph['entity'];

    selectedIDs(): EntityId[];
    activeID(): EntityId | undefined;
    selectedNoteID: GetSet<coreContext, NoteId | null>;
    selectedErrorID: GetSet<coreContext, string | null>;

    mode(): Mode;
    enter(mode: Mode): void;

    install(behavior: Behaviour): void;
    uninstall(behavior: Behaviour): void;

    copyGraph(): coreGraph;
    copyIDs: GetSet<coreContext, EntityId[]>;
    copyLonLat: GetSet<coreContext, Vec2>;

    background(): ReturnType<typeof rendererBackground>;

    features(): ReturnType<typeof rendererFeatures>;
    hasHiddenConnections(id: EntityId): boolean;

    photos(): ReturnType<typeof rendererPhotos>;


    map(): ReturnType<typeof rendererMap>;
    layers(): any;
    surface(): d3.Selection;
    editableDataEnabled(): boolean;
    surfaceRect(): DOMRect;
    editable(): boolean;


    debugFlags(): Record<DebugFlags, boolean>;
    getDebug(flag: DebugFlags): boolean;
    setDebug(flag: DebugFlags): coreContext;
    setDebug(flag: DebugFlags, val: boolean): coreContext;

    container: GetSet<coreContext, d3.Selection>;
    containerNode: GetSet<coreContext, HTMLElement>;


    theme: GetSet<coreContext, Theme>;
    embed: GetSet<coreContext, boolean>;
    assetPath: GetSet<coreContext, string>;
    assetMap: GetSet<coreContext, AssetMap>;
    asset(val: string): string;
    imagePath(val: string): string;
    reset(): void;
    flush(): void;

    projection: Projection;
    curtainProjection: Projection;

    graph(): coreGraph;
    pauseChangeDispatch(): void;
    resumeChangeDispatch(): void;
    perform: any;
    replace: coreHistory['replace'];
    pop: coreHistory['pop'];
    undo: coreHistory['undo'];
    redo: coreHistory['redo'];

    init(): coreContext;
}


export function coreContext(this: object): coreContext {
  const dispatch = d3_dispatch('enter', 'exit', 'change');
  const context: coreContext = function () {};
  let _deferred = new Set<number>();

  context.version = packageJSON.version;
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
  } as coreContext['defaultChangesetComment'];

  context.defaultChangesetSource = function(val) {
    if (!arguments.length) return _defaultChangesetSource;
    _defaultChangesetSource = val;
    return context;
  } as coreContext['defaultChangesetSource'];

  context.defaultChangesetHashtags = function(val) {
    if (!arguments.length) return _defaultChangesetHashtags;
    _defaultChangesetHashtags = val;
    return context;
  } as coreContext['defaultChangesetHashtags'];

  /* Document title */
  /* (typically shown as the label for the browser window/tab) */

  // If true, iD will update the title based on what the user is doing
  let _setsDocumentTitle = true;
  context.setsDocumentTitle = function(val) {
    if (!arguments.length) return _setsDocumentTitle;
    _setsDocumentTitle = val;
    return context;
  } as coreContext['setsDocumentTitle'];
  // The part of the title that is always the same
  let _documentTitleBase = document.title;
  context.documentTitleBase = function(val) {
    if (!arguments.length) return _documentTitleBase;
    _documentTitleBase = val;
    return context;
  } as coreContext['documentTitleBase'];


  /** User interface and keybinding */
  let _ui: ReturnType<typeof uiInit>;
  context.ui = () => _ui;
  context.lastPointerType = () => _ui.lastPointerType();

  let _keybinding = utilKeybinding('context');
  context.keybinding = () => _keybinding;
  d3_select(document).call(_keybinding);


  /* Straight accessors. Avoid using these if you can. */
  // Instantiate the connection here because it doesn't require passing in
  // `context` and it's needed for pre-init calls like `preauth`
  let _connection = services.osm;
  let _history: coreHistory;
  let _validator: ReturnType<typeof coreValidator>;
  let _uploader: ReturnType<typeof coreUploader>;
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


  // A string or array or locale codes to prefer over the browser's settings
  context.locale = function(locale) {
    if (!arguments.length) return localizer.localeCode();
    localizer.preferredLocaleCodes(locale);
    return context;
  } as coreContext['locale'];


  function afterLoad(cid: number, callback?: Callback<LoadedData>): Callback<LoadedData> {
    return (err, result) => {
      if (err) {
        if (typeof callback === 'function') {
          callback(err);
        }
        return;

      } else if (_connection && _connection.getConnectionId() !== cid) {
        if (typeof callback === 'function') {
          callback(new ApiError('Connection Switched', -1));
        }
        return;

      } else if (result) {
        _history.merge(result.data);
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

  // Download single note
  context.loadNote = (entityID, callback) => {
    if (_connection) {
      const cid = _connection.getConnectionId();
      _connection.loadEntityNote(entityID, afterLoad(cid, callback));
    }
  };

  context.zoomToEntity = (entityID, zoomTo) => {
    context.zoomToEntities([entityID], zoomTo);
  };

  context.zoomToEntities = (entityIDs, zoomTo) => {
    // be sure to load the entity even if we're not going to zoom to it
    let loadedEntities: OsmEntity[] = [];
    const throttledZoomTo = throttle(() => _map.zoomTo(loadedEntities), 500);
    entityIDs.forEach(entityID => context.loadEntity(entityID, (err, result) => {
      if (err) return;
      const entity = result!.data.find(e => e.id === entityID);
      if (!entity) return;
      loadedEntities.push(entity);
      if (zoomTo !== false) {
        throttledZoomTo();
      }
    }));

    _map.on('drawn.zoomToEntity', () => {
      if (!entityIDs.every(entityID => context.hasEntity(entityID))) return;
      _map.on('drawn.zoomToEntity', null);
      context.on('enter.zoomToEntity', null);
      context.enter(modeSelect(context, entityIDs));
    });

    context.on('enter.zoomToEntity', () => {
      if (_mode.id !== 'browse') {
        _map.on('drawn.zoomToEntity', null);
        context.on('enter.zoomToEntity', null);
      }
    });
  };

  context.moveToNote = (noteId, moveTo) => {
    context.loadNote(noteId, (err) => {
      if (err) return;
      // zoom to, used note loc
      const note = services.osm.getNote(noteId);
      if (!note) return;
      if (moveTo !== false) {
        context.map().center(note.loc);
      }
      // open note layer
      const noteLayer = context.layers().layer('notes');
      noteLayer.enabled(true);
      // select the note
      context.enter(modeSelectNote(context, noteId));
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
  } as coreContext['minEditableZoom'];

  // String length limits in Unicode characters, not JavaScript UTF-16 code units
  context.maxCharsForTagKey = () => 255;
  context.maxCharsForTagValue = () => 255;
  context.maxCharsForRelationRole = () => 255;

  context.cleanTagKey = (val) => utilCleanOsmString(val, context.maxCharsForTagKey());
  context.cleanTagValue = (val) => utilCleanOsmString(val, context.maxCharsForTagValue());
  context.cleanRelationRole = (val) => utilCleanOsmString(val, context.maxCharsForRelationRole());


  /* History */
  let _inIntro = false;
  context.inIntro = function(val) {
    if (!arguments.length) return _inIntro;
    _inIntro = val;
    return context;
  } as coreContext['inIntro'];

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
  context.debouncedSave = debounce(context.save, 100);

  function withDebouncedSave<T extends (...args: any) => any>(fn: T): T {
    return function(...args) {
      const result = fn.apply(_history, args);
      context.debouncedSave();
      return result;
    } as T;
  }


  /* Graph */
  context.hasEntity = ((id: EntityId) => _history.graph().hasEntity(id)) as coreGraph['hasEntity'];
  context.entity = ((id: EntityId) => _history.graph().entity(id)) as coreGraph['entity'];


  /* Modes */
  let _mode: Mode;
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

  let _selectedNoteID: NoteId | null;
  context.selectedNoteID = function(noteID) {
    if (!arguments.length) return _selectedNoteID;
    _selectedNoteID = noteID;
    return context;
  } as coreContext['selectedNoteID'];

  // NOTE: Don't change the name of this until UI v3 is merged
  let _selectedErrorID: string | null;
  context.selectedErrorID = function(errorID) {
    if (!arguments.length) return _selectedErrorID;
    _selectedErrorID = errorID;
    return context;
  } as coreContext['selectedErrorID'];


  /* Behaviors */
  context.install = (behavior) => context.surface().call(behavior);
  context.uninstall = (behavior) => context.surface().call(behavior.off);


  /* Copy/Paste */
  let _copyGraph: coreGraph;
  context.copyGraph = () => _copyGraph;

  let _copyIDs: EntityId[] = [];
  context.copyIDs = function(val) {
    if (!arguments.length) return _copyIDs;
    _copyIDs = val;
    _copyGraph = _history.graph();
    return context;
  } as coreContext['copyIDs'];

  let _copyLonLat: Vec2;
  context.copyLonLat = function(val) {
    if (!arguments.length) return _copyLonLat;
    _copyLonLat = val;
    return context;
  } as coreContext['copyLonLat'];


  /* Background */
  let _background: ReturnType<typeof rendererBackground>;
  context.background = () => _background;


  /* Features */
  let _features: ReturnType<typeof rendererFeatures>;
  context.features = () => _features;
  context.hasHiddenConnections = (id) => {
    const graph = _history.graph();
    const entity = graph.entity(id);
    return _features.hasHiddenConnections(entity, graph);
  };


  /* Photos */
  let _photos: ReturnType<typeof rendererPhotos>;
  context.photos = () => _photos;


  /* Map */
  let _map: ReturnType<typeof rendererMap>;
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
  let _debugFlags: Record<DebugFlags, boolean> = {
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
  } as coreContext['setDebug'];


  /* Container */
  let _container = d3_select<HTMLElement, void>(null!);
  let _theme: Theme;

  context.container = function(val) {
    if (!arguments.length) return _container;
    _container = val;
    _container.classed('ideditor', true);
    _container.classed('theme-dark', _theme === 'dark');
    _container.classed('theme-light', _theme === 'light');
    return context;
  } as coreContext['container'];

  context.containerNode = function(val) {
    if (!arguments.length) return context.container().node();
    context.container(d3_select(val));
    return context;
  } as coreContext['containerNode'];

  context.theme = function(val) {
    if (!arguments.length) return _theme;
    _theme = val;
    context.container(_container); // refresh theme
    return context;
  } as coreContext['theme'];

  let _embed: boolean;
  context.embed = function(val) {
    if (!arguments.length) return _embed;
    _embed = val;
    return context;
  } as coreContext['embed'];


  /* Assets */
  let _assetPath = '';
  context.assetPath = function(val) {
    if (!arguments.length) return _assetPath;
    _assetPath = val;
    fileFetcher.assetPath(val);
    return context;
  } as coreContext['assetPath'];

  let _assetMap: AssetMap = {};
  context.assetMap = function(val) {
    if (!arguments.length) return _assetMap;
    _assetMap = val;
    fileFetcher.assetMap(val);
    return context;
  } as coreContext['assetMap'];

  context.asset = (val) => {
    if (/^http(s)?:\/\//i.test(val)) return val;
    const filename = _assetPath + val;
    return _assetMap[filename] || filename;
  };

  context.imagePath = (val) => context.asset(`img/${val}`);


  /* reset (aka flush) */
  context.reset = () => {
    context.debouncedSave.cancel();

    Array.from(_deferred).forEach(handle => {
      window.cancelIdleCallback(handle);
      _deferred.delete(handle);
    });

    Object.values(services).forEach(service => {
      if (service && 'reset' in service && typeof service.reset === 'function') {
        service.reset();
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
  context.flush = context.reset;


  /* Projections */
  context.projection = geoRawMercator();
  context.curtainProjection = geoRawMercator();

  // these lines are required to define the type-definitions.
  // the actual value is assigned below, in the `init` function.
  context.graph = undefined!;
  context.pauseChangeDispatch = undefined!;
  context.resumeChangeDispatch = undefined!;
  context.perform = undefined!;
  context.replace = undefined!;
  context.pop = undefined!;
  context.undo = undefined!;
  context.redo = undefined!;
  context.on = undefined!;

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
        // @ts-expect-error -- will be fixed in a different PR
        presetManager.addablePresetIDs(new Set(context.initialHashParams.presets.split(',')));
      }

      if (context.initialHashParams.locale) {
        localizer.preferredLocaleCodes(context.initialHashParams.locale);
      }

      if (context.initialHashParams.theme) {
        context.theme(context.initialHashParams.theme);
      }

      // kick off some async work
      localizer.ensureLoaded();
      // @ts-expect-error -- will be fixed in a different PR
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

      // Migrate history data from localStorage to IndexedDB
      _history.migrateHistoryData();

      if (services.maprules && context.initialHashParams.maprules) {
        d3_json<unknown[]>(context.initialHashParams.maprules)
          .then(mapcss => {
            services.maprules.init();
            mapcss!.forEach(mapcssSelector => services.maprules.addRule(mapcssSelector));
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

  return utilRebind(context, dispatch, 'on');
}
