window.iD = function () {
    var context = {},
        history = iD.History(),
        storage = localStorage || {},
        dispatch = d3.dispatch('enter', 'exit'),
        mode,
        container,
        ui = iD.ui(context),
        map = iD.Map(context);

    context.storage = function(k, v) {
        if (arguments.length === 1) return storage[k];
        else storage[k] = v;
    };

    // the connection requires .storage() to be available on calling.
    var connection = iD.Connection(context);

    connection.on('load.context', function (err, result) {
        history.merge(result);
    });

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
    context.redo = history.undo;
    context.changes = history.changes;

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
    context.background = function() { return map.background; };
    context.surface = function() { return map.surface; };
    context.projection = map.projection;
    context.tail = map.tail;
    context.redraw = map.redraw;

    context.container = function(_) {
        if (!arguments.length) return container;
        container = _;
        return context;
    };

    context.background()
        .source(_.find(iD.layers, function(l) {
            console.log(_.keys(l));
            return l.name === 'Bing aerial imagery';
        }));

    return d3.rebind(context, dispatch, 'on');
};

iD.version = '0.0.0-alpha1';

iD.supported = function() {
    if (navigator.appName !== 'Microsoft Internet Explorer') {
        return true;
    } else {
        var ua = navigator.userAgent;
        var re = new RegExp("MSIE ([0-9]{1,}[\\.0-9]{0,})");
        if (re.exec(ua) !== null) {
            rv = parseFloat( RegExp.$1 );
        }
        if (rv && rv < 9) return false;
        else return true;
    }
};
