iD.Context = function() {
    var history = iD.History(),
        connection = iD.Connection(),
        controller = iD.Controller(),
        container,
        map = iD.Map().connection(connection).history(history);

    var context = {};

    context.container = function (_) {
        if (!arguments.length) return container;
        container = _;
        return context;
    };

    context.connection = function () { return connection; };

    context.history = function () { return history; };
    context.graph   = history.graph;
    context.perform = history.perform;
    context.replace = history.replace;
    context.pop     = history.pop;
    context.undo    = history.undo;
    context.redo    = history.undo;
    context.changes = history.changes;

    context.entity   = function (id) { return history.graph().entity(id); };
    context.geometry = function (id) { return context.entity(id).geometry(history.graph()); };

    context.controller = function () { return controller; };
    context.enter = controller.enter;
    context.mode = function () { return controller.mode; };

    context.install   = function (behavior) { context.surface().call(behavior); };
    context.uninstall = function (behavior) { context.surface().call(behavior.off); };

    context.map        = function () { return map; };
    context.background = function () { return map.background; };
    context.surface    = function () { return map.surface; };
    context.projection = map.projection;
    context.tail       = map.tail;

    return context;
};
