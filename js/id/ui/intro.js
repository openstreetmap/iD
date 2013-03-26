iD.ui.intro = function(context) {

    var step;

    function intro(selection) {

        var originalCenter = context.map().center(),
            originalZoom = context.map().zoom();

        // Load semi-real data used in intro
        context.connection().toggle(false).flush();
        context.history().reset();
        context.history().merge(iD.Graph().load(JSON.parse(iD.introGraph)).entities);

        d3.select('.layer-layer:first-child').style('opacity', 1);

        var curtain = d3.curtain();
        selection.call(curtain);

        var steps = ['navigation', 'point', 'area', 'line'].map(function(step, i) {
            var s = iD.ui.intro[step](context, curtain)
                .on('done', function() {
                    entered.filter(function(d) {
                        return d.name === s.name;
                    }).classed('finished', true);
                    enter(steps[i + 1]);
                });
            return s;
        });

        steps.push({
            name: 'Start Editing',
            enter: function() {
                curtain.remove();
                navwrap.remove();
                d3.select('.layer-layer:first-child').style('opacity', 0.5);
                context.connection().toggle(true).flush();
                context.history().reset();
                context.map().centerZoom(originalCenter, originalZoom);
            }
        });

        var navwrap = selection.append('div').attr('class', ' col12 intro-nav-wrap');

        var buttonwrap = navwrap.append('div')
            .attr('class', 'button-wrap joined')
            .selectAll('button.step');

        var entered = buttonwrap.data(steps)
            .enter().append('button')
                .attr('class', 'step')
                .on('click', function(d) {
                    enter(d);
                });

        entered.append('h3').text(function(d) { return d.name; });
        enter(steps[0]);

        function enter (newStep) {

            if (step) {
                step.exit();
            }

            context.enter(iD.modes.Browse(context));

            step = newStep;
            step.enter();

            entered.classed('active', function(d) {
                return d.name === step.name;
            });
        }

    }
    return intro;
};

iD.ui.intro.pointBox = function(point) {
    return {
        left: point[0] - 30,
        top: point[1] - 50,
        width: 60,
        height: 70
    };
};

iD.ui.intro.pad = function(box, padding) {
    if (box instanceof Array) {
        box = {
            left: box[0],
            top: box[1]
        };
    }
    return {
        left: box.left - padding,
        top: box.top - padding,
        width: (box.width || 0) + 2 * padding,
        height: (box.width || 0) + 2 * padding
    };
};
