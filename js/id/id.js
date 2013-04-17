window.iD = function () {
    locale
        .current('en')
        .current(iD.detect().locale);

    var context = {},
        storage;

    // https://github.com/systemed/iD/issues/772
    // http://mathiasbynens.be/notes/localstorage-pattern#comment-9
    try { storage = localStorage; } catch (e) {}
    storage = storage || {};

    context.storage = function(k, v) {
        if (arguments.length === 1) return storage[k];
        else if (v === null) delete storage[k];
        else storage[k] = v;
    };

    var history = iD.History(context),
        dispatch = d3.dispatch('enter', 'exit'),
        mode,
        container,
        ui = iD.ui(context),
        map = iD.Map(context),
        connection = iD.Connection(context, iD.data.keys[0]);

    connection.on('load.context', function loadContext(err, result) {
        history.merge(result);
    });

    context.preauth = function(options) {
        connection.switch(options);
        return context;
    };

    /* Straight accessors. Avoid using these if you can. */
    context.ui = function() { return ui; };
    context.connection = function() { return connection; };
    context.history = function() { return history; };
    context.map = function() { return map; };

    /* History */
    context.graph = history.graph;
    context.perform = history.perform;
    context.replace = history.replace;
    context.pop = history.pop;
    context.undo = history.undo;
    context.redo = history.redo;
    context.changes = history.changes;
    context.intersects = history.intersects;

    /* Graph */
    context.entity = function(id) {
        return history.graph().entity(id);
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

    context.selection = function() {
        if (mode.id === 'select') {
            return mode.selection();
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

    /* Map */
    context.layers = function() { return map.layers; };
    context.background = function() { return map.layers[0]; };
    context.surface = function() { return map.surface; };
    context.projection = map.projection;
    context.tail = map.tail;
    context.redraw = map.redraw;
    context.pan = map.pan;
    context.zoomIn = map.zoomIn;
    context.zoomOut = map.zoomOut;

    /* Background */
    var backgroundSources = iD.data.imagery.map(function(source) {
        if (source.sourcetag === 'Bing') {
            return iD.BackgroundSource.Bing(source, context.background().dispatch);
        } else {
            return iD.BackgroundSource.template(source);
        }
    });
    backgroundSources.push(iD.BackgroundSource.Custom);

    context.backgroundSources = function() {
        return backgroundSources;
    };

    /* Presets */
    var presets = iD.presets(context)
        .load(iD.data.presets);

    context.presets = function() {
        return presets;
    };

    context.container = function(_) {
        if (!arguments.length) return container;
        container = _;
        container.classed('id-container', true);
        return context;
    };

    var q = iD.util.stringQs(location.hash.substring(1)), detected = false;
    if (q.layer) {
        context.layers()[0]
           .source(_.find(backgroundSources, function(l) {
               if (l.data.sourcetag === q.layer) {
                   detected = true;
                   return true;
               }
           }));
    }

    if (!detected) {
        context.background()
            .source(_.find(backgroundSources, function(l) {
                return l.data.name === 'Bing aerial imagery';
            }));
    }

    var embed = false;
    context.embed = function(_) {
        if (!arguments.length) return embed;
        embed = _;
        return context;
    };

    var imagePath = 'img/';
    context.imagePath = function(_) {
        if (!arguments.length) return imagePath;
        if (/\.(png|gif|svg)$/.test(_)) return imagePath + _;
        imagePath = _;
        return context;
    };

    return d3.rebind(context, dispatch, 'on');
};

iD.version = '0.0.0-beta1';

iD.detect = function() {
    var browser = {};

    var ua = navigator.userAgent,
        msie = new RegExp("MSIE ([0-9]{1,}[\\.0-9]{0,})");

    if (msie.exec(ua) !== null) {
        var rv = parseFloat(RegExp.$1);
        browser.support = !(rv && rv < 9);
    } else {
        browser.support = true;
    }

    // Added due to incomplete svg style support. See #715
    browser.opera = ua.indexOf('Opera') >= 0;

    browser.locale = navigator.language || navigator.userLanguage;

    browser.filedrop = (window.FileReader && 'ondrop' in window);

    function nav(x) {
        return navigator.userAgent.indexOf(x) !== -1;
    }

    if (nav('Win')) browser.os = 'win';
    else if (nav('Mac')) browser.os = 'mac';
    else if (nav('X11')) browser.os = 'linux';
    else if (nav('Linux')) browser.os = 'linux';
    else browser.os = 'win';

    return browser;
};
