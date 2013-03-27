iD.ui.intro.point = function(context, reveal) {

    var event = d3.dispatch('done'),
        timeouts = [];

    var step = {
        name: 'Points'
    };

    function setTimeout(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }

    step.enter = function() {

        context.map().centerZoom([-85.63279, 41.94394], 19);
        reveal('button.add-point', 'intro.points.add');

        var corner = [-85.632481,41.944094];

        context.on('enter.intro', addPoint);

        function addPoint(mode) {
            if (mode.id !== 'add-point') return;
            context.on('enter.intro', enterSelect);

            var pointBox = iD.ui.intro.pad(context.projection(corner), 150);
            reveal(pointBox, 'intro.points.place');

            context.map().on('move.intro', function() {
                pointBox = iD.ui.intro.pad(context.projection(corner), 150);
                reveal(pointBox, 'intro.points.place', 0);
            });

        }

        function enterSelect(mode) {
            if (mode.id !== 'select') return;
            context.map().on('move.intro', null);
            context.on('enter.intro', null);

            setTimeout(function() {
                reveal('.preset-grid-search', 'intro.points.search');
                d3.select('.preset-grid-search').on('keyup.intro', keySearch);
            }, 500);
        }

        function keySearch() {
            var first = d3.select('.grid-button-wrap:first-child');
            if (first.datum().id === 'amenity/cafe') {
                reveal(first.select('.grid-entry').node(), 'intro.points.choose');
                d3.selection.prototype.one.call(context.history(), 'change.intro', selectedPreset);

                d3.select('.preset-grid-search').on('keydown.intro', function() {
                    // Prevent search from updating and changing the grid
                    d3.event.stopPropagation();
                    d3.event.preventDefault();
                }, true).on('keyup.intro', null);
            }
        }

        function selectedPreset() {
            setTimeout(function() {
                reveal('.tag-wrap', 'intro.points.describe');
                context.history().on('change.intro', closeEditor);
                context.on('exit.intro', selectPoint);
            }, 400);
        }

        function closeEditor() {
            d3.select('.preset-grid-search').on('keydown.intro', null);
            context.history().on('change.intro', null);
            reveal('.tag-pane', 'intro.points.close');
        }

        function selectPoint() {
            context.on('exit.intro', null);
            context.history().on('change.intro', null);
            context.on('enter.intro', enterReselect);

            var pointBox = iD.ui.intro.pad(context.projection(corner), 150);
            reveal(pointBox, 'intro.points.reselect');

            context.map().on('move.intro', function() {
                pointBox = iD.ui.intro.pad(context.projection(corner), 150);
                reveal(pointBox, 'intro.points.reselect', 0);
            });
        }

        function enterReselect(mode) {
            if (mode.id !== 'select') return;
            context.map().on('move.intro', null);
            context.on('enter.intro', null);

            setTimeout(function() {
                reveal('.tag-pane', 'intro.points.fixname');
                context.on('exit.intro', deletePoint);
            }, 500);
        }

        function deletePoint() {
            context.on('exit.intro', null);
            context.on('enter.intro', enterDelete);

            var pointBox = iD.ui.intro.pad(context.projection(corner), 150);
            reveal(pointBox, 'intro.points.reselect_delete');

            context.map().on('move.intro', function() {
                pointBox = iD.ui.intro.pad(context.projection(corner), 150);
                reveal(pointBox, 'intro.points.reselect_delete', 0);
            });
        }

        function enterDelete(mode) {
            if (mode.id !== 'select') return;
            context.map().on('move.intro', null);
            context.on('enter.intro', null);
            context.on('exit.intro', deletePoint);
            context.map().on('move.intro', deletePoint);
            context.history().on('change.intro', deleted);

            setTimeout(function() {
                var node = d3.select('.radial-menu-item-delete').node();
                var pointBox = iD.ui.intro.pad(node.getBoundingClientRect(), 50);
                reveal(pointBox, 'intro.points.delete');
            }, 300);
        }

        function deleted(changed) {
            if (changed.deleted().length) event.done();
        }

    };

    step.exit = function() {
        timeouts.forEach(window.clearTimeout);
        context.on('exit.intro', null);
        context.on('enter.intro', null);
        context.map().on('move.intro', null);
        context.history().on('change.intro', null);
        d3.select('.preset-grid-search').on('keyup.intro', null).on('keydown.intro', null);
    };

    return d3.rebind(step, event, 'on');
};
