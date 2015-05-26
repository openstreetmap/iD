window.iD = function () {
    window.locale.en = iD.data.en;
    window.locale.current('en');

    var context = {},
        storage;

    // https://github.com/openstreetmap/iD/issues/772
    // http://mathiasbynens.be/notes/localstorage-pattern#comment-9
    try { storage = localStorage; } catch (e) {}
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
        } catch(e) {
            // localstorage quota exceeded
            /* jshint devel:true */
            if (typeof console !== 'undefined') console.error('localStorage quota exceeded');
            /* jshint devel:false */
        }
    };

    /* Accessor for setting minimum zoom for editing features. */

    var minEditableZoom = 16;
    context.minEditableZoom = function(_) {
        if (!arguments.length) return minEditableZoom;
        minEditableZoom = _;
        connection.tileZoom(_);
        return context;
    };

    var history = iD.History(context),
        dispatch = d3.dispatch('enter', 'exit'),
        mode,
        container,
        ui = iD.ui(context),
        connection = iD.Connection(),
        locale = iD.detect().locale,
        localePath;

    if (locale && iD.data.locales.indexOf(locale) === -1) {
        locale = locale.split('-')[0];
    }

    context.preauth = function(options) {
        connection.switch(options);
        return context;
    };

    context.locale = function(_, path) {
        locale = _;
        localePath = path;
        return context;
    };

    context.loadLocale = function(cb) {
        if (locale && locale !== 'en' && iD.data.locales.indexOf(locale) !== -1) {
            localePath = localePath || context.assetPath() + 'locales/' + locale + '.json';
            d3.json(localePath, function(err, result) {
                window.locale[locale] = result;
                window.locale.current(locale);
                cb();
            });
        } else {
            cb();
        }
    };

    /* Straight accessors. Avoid using these if you can. */
    context.ui = function() { return ui; };
    context.connection = function() { return connection; };
    context.history = function() { return history; };

    /* Connection */
    function entitiesLoaded(err, result) {
        if (!err) history.merge(result.data, result.extent);
    }

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
            context.enter(iD.modes.Select(context, [id]));
        });

        context.on('enter.zoomToEntity', function() {
            if (mode.id !== 'browse') {
                map.on('drawn.zoomToEntity', null);
                context.on('enter.zoomToEntity', null);
            }
        });
    };

    /* History */
    context.graph = history.graph;
    context.changes = history.changes;
    context.intersects = history.intersects;

    var inIntro = false;

    context.inIntro = function(_) {
        if (!arguments.length) return inIntro;
        inIntro = _;
        return context;
    };

    context.save = function() {
        if (inIntro || (mode && mode.id === 'save')) return;
        history.save();
        if (history.hasChanges()) return t('save.unsaved_changes');
    };

    context.flush = function() {
        connection.flush();
        features.reset();
        history.reset();
        return context;
    };

    // Debounce save, since it's a synchronous localStorage write,
    // and history changes can happen frequently (e.g. when dragging).
    var debouncedSave = _.debounce(context.save, 350);
    function withDebouncedSave(fn) {
        return function() {
            var result = fn.apply(history, arguments);
            debouncedSave();
            return result;
        };
    }

    context.perform = withDebouncedSave(history.perform);
    context.replace = withDebouncedSave(history.replace);
    context.pop = withDebouncedSave(history.pop);
    context.overwrite = withDebouncedSave(history.overwrite);
    context.undo = withDebouncedSave(history.undo);
    context.redo = withDebouncedSave(history.redo);

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
    context.enter = function(newMode) {
        if (mode) {
            mode.exit();
            dispatch.exit(mode);
        }

        mode = newMode;
        mode.enter();
        dispatch.enter(mode);
    };

    context.mode = function() {
        return mode;
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

    /* Projection */
    context.projection = iD.geo.RawMercator();

    /* Background */
    var background = iD.Background(context);
    context.background = function() { return background; };

    /* Features */
    var features = iD.Features(context);
    context.features = function() { return features; };
    context.hasHiddenConnections = function(id) {
        var graph = history.graph(),
            entity = graph.entity(id);
        return features.hasHiddenConnections(entity, graph);
    };

    /* Map */
    var map = iD.Map(context);
    context.map = function() { return map; };
    context.layers = function() { return map.layers; };
    context.surface = function() { return map.surface; };
    context.editable = function() { return map.editable(); };
    context.mouse = map.mouse;
    context.extent = map.extent;
    context.pan = map.pan;
    context.zoomIn = map.zoomIn;
    context.zoomOut = map.zoomOut;

    context.surfaceRect = function() {
        // Work around a bug in Firefox.
        //   http://stackoverflow.com/questions/18153989/
        //   https://bugzilla.mozilla.org/show_bug.cgi?id=530985
        return context.surface().node().parentNode.getBoundingClientRect();
    };

    /* Presets */
    var presets = iD.presets();

    context.presets = function(_) {
        if (!arguments.length) return presets;
        presets.load(_);
        iD.areaKeys = presets.areaKeys();
        return context;
    };

    context.imagery = function(_) {
        background.load(_);
        return context;
    };

    context.container = function(_) {
        if (!arguments.length) return container;
        container = _;
        container.classed('id-container', true);
        return context;
    };

    /* Taginfo */
    var taginfo;
    context.taginfo = function(_) {
        if (!arguments.length) return taginfo;
        taginfo = _;
        return context;
    };

    var embed = false;
    context.embed = function(_) {
        if (!arguments.length) return embed;
        embed = _;
        return context;
    };

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

    context.imagePath = function(_) {
        var asset = 'img/' + _;
        return assetMap[asset] || assetPath + asset;
    };

    return d3.rebind(context, dispatch, 'on');
};

iD.version = '1.7.2';

(function() {
    var detected = {};

    var ua = navigator.userAgent,
        m = null;

    m = ua.match(/Trident\/.*rv:([0-9]{1,}[\.0-9]{0,})/i);   // IE11+
    if (m !== null) {
        detected.browser = 'msie';
        detected.version = m[1];
    }
    if (!detected.browser) {
        m = ua.match(/(opr)\/?\s*(\.?\d+(\.\d+)*)/i);   // Opera 15+
        if (m !== null) {
            detected.browser = 'Opera';
            detected.version = m[2];
        }
    }
    if (!detected.browser) {
        m = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
        if (m !== null) {
            detected.browser = m[1];
            detected.version = m[2];
            m = ua.match(/version\/([\.\d]+)/i);
            if (m !== null) detected.version = m[1];
        }
    }
    if (!detected.browser) {
        detected.browser = navigator.appName;
        detected.version = navigator.appVersion;
    }

    // keep major.minor version only..
    detected.version = detected.version.split(/\W/).slice(0,2).join('.');

    if (detected.browser.toLowerCase() === 'msie') {
        detected.browser = 'Internet Explorer';
        detected.support = parseFloat(detected.version) > 9;
    } else {
        detected.support = true;
    }

    // Added due to incomplete svg style support. See #715
    detected.opera = (detected.browser.toLowerCase() === 'opera' && parseFloat(detected.version) < 15 );

    detected.locale = navigator.language || navigator.userLanguage || 'en-US';

    detected.filedrop = (window.FileReader && 'ondrop' in window);

    function nav(x) {
        return navigator.userAgent.indexOf(x) !== -1;
    }

    if (nav('Win')) {
        detected.os = 'win';
        detected.platform = 'Windows';
    }
    else if (nav('Mac')) {
        detected.os = 'mac';
        detected.platform = 'Macintosh';
    }
    else if (nav('X11') || nav('Linux')) {
        detected.os = 'linux';
        detected.platform = 'Linux';
    }
    else {
        detected.os = 'win';
        detected.platform = 'Unknown';
    }

    iD.detect = function() { return detected; };
})();
