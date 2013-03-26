iD.ui.intro.line = function(context, curtain) {

    var event = d3.dispatch('done'),
        timeouts = [];

    var step = {
        name: 'Lines'
    };

    function one(target, e, f) {
        d3.selection.prototype.one.call(target, e, f);
    }

    function timeout(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }

    step.enter = function() {

        var centroid = [-85.62830, 41.95699];
        var midpoint = [-85.62975395449628, 41.95787501510204];
        var start = [-85.6297754121684, 41.9583158176903];
        var intersection = [-85.62974496187628, 41.95742515554585];

        context.map().centerZoom(start, 19);
        console.log("here");
        curtain.reveal('button.add-line', t('intro.lines.add'));

        context.on('enter.intro', addLine);

        function addLine(mode) {
            if (mode.id !== 'add-line') return;
            context.on('enter.intro', drawLine);

            var padding = 150 * Math.pow(2, context.map().zoom() - 19);
            var pointBox = iD.ui.intro.pad(context.projection(start), padding);
            curtain.reveal(pointBox, t('intro.lines.start'));

            context.map().on('move.intro', function() {
                padding = 150 * Math.pow(2, context.map().zoom() - 19);
                pointBox = iD.ui.intro.pad(context.projection(start), padding);
                curtain.reveal(pointBox, t('intro.lines.start'), 0);
            });
        }
        function drawLine (mode) {
            if (mode.id !== 'draw-line') return;
            context.on('enter.intro', null);
            context.history().on('change.intro', addIntersection);

            var padding = 300 * Math.pow(2, context.map().zoom() - 19);
            var pointBox = iD.ui.intro.pad(context.projection(midpoint), padding);
            curtain.reveal(pointBox, t('intro.lines.intersect'));

            context.map().on('move.intro', function() {
                padding = 300 * Math.pow(2, context.map().zoom() - 19);
                pointBox = iD.ui.intro.pad(context.projection(midpoint), padding);
                curtain.reveal(pointBox, t('intro.lines.intersect'), 0);
            });
        }

        function addIntersection(changes) {
            if ( _.any(changes.created(), function(d) {
                return d.type === 'node' && context.graph().parentWays(d).length > 1;
            })) {
                context.history().on('change.intro', null);
                context.on('enter.intro', enterSelect);

                var padding = 900 * Math.pow(2, context.map().zoom() - 19);
                var pointBox = iD.ui.intro.pad(context.projection(centroid), padding);
                curtain.reveal(pointBox, t('intro.lines.finish'));

                context.map().on('move.intro', function() {
                    padding = 900 * Math.pow(2, context.map().zoom() - 19);
                    pointBox = iD.ui.intro.pad(context.projection(centroid), padding);
                    curtain.reveal(pointBox, t('intro.lines.finish'), 0);
                });
            }
        }

        function enterSelect(mode) {
            if (mode.id !== 'select') return;
            context.map().on('move.intro', null);
            context.on('enter.intro', null);

            timeout(function() {
                var road = d3.select('.preset-grid .grid-entry').filter(function(d) {
                    return d.id === 'Road';
                });
                curtain.reveal(road.node(), t('intro.lines.road'));
                road.one('click.intro', roadCategory);
            }, 500);
        }

        function roadCategory() {
            timeout(function() {
                var grid = d3.select('.subgrid');
                curtain.reveal(grid.node(),  t('intro.lines.residential'));
                grid.selectAll('.grid-entry').filter(function(d) {
                    return d.id === 'highway/residential';
                }).one('click.intro', roadDetails);
            }, 200);
        }

        function roadDetails() {
            curtain.reveal('.pane', t('intro.lines.describe'));
            context.on('exit.intro', event.done);
        }

    };

    step.exit = function() {
        timeouts.forEach(window.clearTimeout);
        context.on('enter.intro', null);
        context.on('exit.intro', null);
        context.map().on('move.intro', null);
        context.history().on('change.intro', null);
        curtain.hide();
    };

    return d3.rebind(step, event, 'on');
};
