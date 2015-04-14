iD.ui.intro.line = function(context, reveal) {

    var event = d3.dispatch('done'),
        timeouts = [];

    var step = {
        title: 'intro.lines.title'
    };

    function timeout(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }

    step.enter = function() {

        var centroid = [-85.62830, 41.95699];
        var midpoint = [-85.62975395449628, 41.95787501510204];
        var start = [-85.6297754121684, 41.95805253325314];
        var intersection = [-85.62974496187628, 41.95742515554585];

        context.map().centerZoom(start, 18);
        reveal('button.add-line', t('intro.lines.add'), {tooltipClass: 'intro-lines-add'});

        context.on('enter.intro', addLine);

        function addLine(mode) {
            if (mode.id !== 'add-line') return;
            context.on('enter.intro', drawLine);

            var padding = 150 * Math.pow(2, context.map().zoom() - 18);
            var pointBox = iD.ui.intro.pad(start, padding, context);
            reveal(pointBox, t('intro.lines.start'));

            context.map().on('move.intro', function() {
                padding = 150 * Math.pow(2, context.map().zoom() - 18);
                pointBox = iD.ui.intro.pad(start, padding, context);
                reveal(pointBox, t('intro.lines.start'), {duration: 0});
            });
        }

        function drawLine(mode) {
            if (mode.id !== 'draw-line') return;
            context.history().on('change.intro', addIntersection);
            context.on('enter.intro', retry);

            var padding = 300 * Math.pow(2, context.map().zoom() - 19);
            var pointBox = iD.ui.intro.pad(midpoint, padding, context);
            reveal(pointBox, t('intro.lines.intersect'));

            context.map().on('move.intro', function() {
                padding = 300 * Math.pow(2, context.map().zoom() - 19);
                pointBox = iD.ui.intro.pad(midpoint, padding, context);
                reveal(pointBox, t('intro.lines.intersect'), {duration: 0});
            });
        }

        // ended line before creating intersection
        function retry(mode) {
            if (mode.id !== 'select') return;
            var pointBox = iD.ui.intro.pad(intersection, 30, context);
            reveal(pointBox, t('intro.lines.restart'));
            timeout(function() {
                context.replace(iD.actions.DeleteMultiple(mode.selectedIDs()));
                step.exit();
                step.enter();
            }, 3000);
        }

        function addIntersection(changes) {
            if ( _.any(changes.created(), function(d) {
                return d.type === 'node' && context.graph().parentWays(d).length > 1;
            })) {
                context.history().on('change.intro', null);
                context.on('enter.intro', enterSelect);

                var padding = 900 * Math.pow(2, context.map().zoom() - 19);
                var pointBox = iD.ui.intro.pad(centroid, padding, context);
                reveal(pointBox, t('intro.lines.finish'));

                context.map().on('move.intro', function() {
                    padding = 900 * Math.pow(2, context.map().zoom() - 19);
                    pointBox = iD.ui.intro.pad(centroid, padding, context);
                    reveal(pointBox, t('intro.lines.finish'), {duration: 0});
                });
            }
        }

        function enterSelect(mode) {
            if (mode.id !== 'select') return;
            context.map().on('move.intro', null);
            context.on('enter.intro', null);
            d3.select('#curtain').style('pointer-events', 'all');

            presetCategory();
        }

        function presetCategory() {
            timeout(function() {
                d3.select('#curtain').style('pointer-events', 'none');
                var road = d3.select('.preset-category-road .preset-list-button');
                reveal(road.node(), t('intro.lines.road'));
                road.one('click.intro', roadCategory);
            }, 500);
        }

        function roadCategory() {
            timeout(function() {
                var grid = d3.select('.subgrid');
                reveal(grid.node(), t('intro.lines.residential'));
                grid.selectAll(':not(.preset-highway-residential) .preset-list-button')
                    .one('click.intro', retryPreset);
                grid.selectAll('.preset-highway-residential .preset-list-button')
                    .one('click.intro', roadDetails);
            }, 500);
        }

        // selected wrong road type
        function retryPreset() {
            timeout(function() {
                var preset = d3.select('.entity-editor-pane .preset-list-button');
                reveal(preset.node(), t('intro.lines.wrong_preset'));
                preset.one('click.intro', presetCategory);
            }, 500);
        }

        function roadDetails() {
            reveal('.pane', t('intro.lines.describe'));
            context.on('exit.intro', event.done);
        }

    };

    step.exit = function() {
        d3.select('#curtain').style('pointer-events', 'none');
        timeouts.forEach(window.clearTimeout);
        context.on('enter.intro', null);
        context.on('exit.intro', null);
        context.map().on('move.intro', null);
        context.history().on('change.intro', null);
    };

    return d3.rebind(step, event, 'on');
};
