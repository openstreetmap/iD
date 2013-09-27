iD.ui.intro.navigation = function(context, reveal) {

    var event = d3.dispatch('done'),
        timeouts = [];

    var step = {
        title: 'intro.navigation.title'
    };

    function set(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }

    /*
     * Steps:
     * Drag map
     * Select poi
     * Show editor header
     * Show editor pane
     * Select road
     * Show header
     */

    step.enter = function() {

        var rect = context.surfaceRect(),
            map = {
                left: rect.left + 10,
                top: rect.top + 70,
                width: rect.width - 70,
                height: rect.height - 170
            };

        context.map().centerZoom([-85.63591, 41.94285], 19);

        reveal(map, t('intro.navigation.drag'));

        context.map().on('move.intro', _.debounce(function() {
            context.map().on('move.intro', null);
            townhall();
            context.on('enter.intro', inspectTownHall);
        }, 400));

        function townhall() {
            var hall = [-85.63645945147184, 41.942986488012565];

            var point = context.projection(hall);
            if (point[0] < 0 || point[0] > rect.width ||
                point[1] < 0 || point[1] > rect.height) {
                context.map().center(hall);
            }

            var box = iD.ui.intro.pointBox(hall, context);
            reveal(box, t('intro.navigation.select'));

            context.map().on('move.intro', function() {
                var box = iD.ui.intro.pointBox(hall, context);
                reveal(box, t('intro.navigation.select'), {duration: 0});
            });
        }

        function inspectTownHall(mode) {
            if (mode.id !== 'select') return;
            context.on('enter.intro', null);
            context.map().on('move.intro', null);
            set(function() {
                reveal('.entity-editor-pane', t('intro.navigation.pane'));
                context.on('exit.intro', event.done);
            }, 700);
        }

    };

    step.exit = function() {
        context.map().on('move.intro', null);
        context.on('enter.intro', null);
        context.on('exit.intro', null);
        timeouts.forEach(window.clearTimeout);
    };

    return d3.rebind(step, event, 'on');
};
