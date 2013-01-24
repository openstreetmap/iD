iD.modes.AddLine = function() {
    var mode = {
        id: 'add-line',
        button: 'line',
        title: 'Line',
        description: 'Lines can be highways, streets, pedestrian paths, or even canals.'
    };

    var behavior,
        defaultTags = {highway: 'residential'};

    mode.enter = function() {
        var map = mode.map,
            history = mode.history,
            controller = mode.controller;

        function startFromNode(a) {
            var b = iD.Node({loc: a.loc}),
                graph = history.graph(),
                parent = graph.parentWays(a)[0],
                isLine = parent && parent.geometry(graph) === 'line';

            if (isLine && parent.first() === a.id) {
                history.perform(
                    iD.actions.AddNode(b),
                    iD.actions.AddWayNode(parent.id, b.id, 0),
                    'continued a line');

                controller.enter(iD.modes.DrawLine(parent.id, 'backward'));

            } else if (isLine && parent.last() === a.id) {
                history.perform(
                    iD.actions.AddNode(b),
                    iD.actions.AddWayNode(parent.id, b.id),
                    'continued a line');

                controller.enter(iD.modes.DrawLine(parent.id, 'forward'));

            } else {
                var way = iD.Way({tags: defaultTags});

                history.perform(
                    iD.actions.AddNode(b),
                    iD.actions.AddWay(way),
                    iD.actions.AddWayNode(way.id, a.id),
                    iD.actions.AddWayNode(way.id, b.id),
                    'continued a line');

                controller.enter(iD.modes.DrawLine(way.id, 'forward'));
            }
        }

        function startFromWay(other, loc, index) {
            var a = iD.Node({loc: loc}),
                b = iD.Node({loc: loc}),
                way = iD.Way({tags: defaultTags});

            history.perform(
                iD.actions.AddNode(a),
                iD.actions.AddNode(b),
                iD.actions.AddWay(way),
                iD.actions.AddWayNode(way.id, a.id),
                iD.actions.AddWayNode(way.id, b.id),
                iD.actions.AddWayNode(other.id, a.id, index),
                'started a line');

            controller.enter(iD.modes.DrawLine(way.id, 'forward'));
        }

        function start(loc) {
            var a = iD.Node({loc: loc}),
                b = iD.Node({loc: loc}),
                way = iD.Way({tags: defaultTags});

            history.perform(
                iD.actions.AddNode(a),
                iD.actions.AddNode(b),
                iD.actions.AddWay(way),
                iD.actions.AddWayNode(way.id, a.id),
                iD.actions.AddWayNode(way.id, b.id),
                'started a line');

            controller.enter(iD.modes.DrawLine(way.id, 'forward'));
        }

        behavior = iD.behavior.AddWay(mode)
            .on('startFromNode', startFromNode)
            .on('startFromWay', startFromWay)
            .on('start', start);

        mode.map.surface.call(behavior);
        mode.map.tail('Click on the map to start drawing an road, path, or route.', true);
    };

    mode.exit = function() {
        mode.map.surface.call(behavior.off);
    };

    return mode;
};
