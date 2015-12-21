iD.ui.intro.navigation = function(context, reveal) {
    var event = d3.dispatch('done'),
        timeouts = [];

    var step = {
        title: 'intro.navigation.title'
    };

    function set(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }

    function eventCancel() {
        d3.event.stopPropagation();
        d3.event.preventDefault();
    }

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
                reveal('.entity-editor-pane',
                    t('intro.navigation.pane', { button: iD.ui.intro.icon('#icon-close', 'pre-text') }));
                context.on('exit.intro', streetSearch);
            }, 700);
        }

        function streetSearch() {
            context.on('exit.intro', null);
            reveal('.search-header input',
                t('intro.navigation.search', { name: t('intro.graph.spring_st') }));
            d3.select('.search-header input').on('keyup.intro', searchResult);
        }

        function searchResult() {
            var first = d3.select('.feature-list-item:nth-child(0n+2)'),  // skip No Results item
                firstName = first.select('.entity-name'),
                name = t('intro.graph.spring_st');

            if (!firstName.empty() && firstName.text() === name) {
                reveal(first.node(), t('intro.navigation.choose', { name: name }));
                context.on('exit.intro', selectedStreet);
                d3.select('.search-header input')
                    .on('keydown.intro', eventCancel, true)
                    .on('keyup.intro', null);
            }
        }

        function selectedStreet() {
            var springSt = [-85.63585099140167, 41.942506848938926];
            context.map().center(springSt);
            context.on('exit.intro', event.done);
            set(function() {
                reveal('.entity-editor-pane',
                    t('intro.navigation.chosen', {
                        name: t('intro.graph.spring_st'),
                        button: iD.ui.intro.icon('#icon-close', 'pre-text')
                    }));
            }, 400);
        }
    };

    step.exit = function() {
        timeouts.forEach(window.clearTimeout);
        context.map().on('move.intro', null);
        context.on('enter.intro', null);
        context.on('exit.intro', null);
        d3.select('.search-header input')
            .on('keydown.intro', null)
            .on('keyup.intro', null);
    };

    return d3.rebind(step, event, 'on');
};
