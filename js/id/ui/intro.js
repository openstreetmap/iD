iD.ui.intro = function(context) {

    var step;

    function intro(selection) {

        context.enter(iD.modes.Browse(context));

        // Save current map state
        var history = context.history().toJSON(),
            hash = window.location.hash,
            background = context.background().source(),
            opacity = d3.select('.layer-layer:first-child').style('opacity'),
            loadedTiles = context.connection().loadedTiles(),
            baseEntities = context.history().graph().base().entities;

        // Load semi-real data used in intro
        context.connection().toggle(false).flush();
        context.history().save().reset();
        context.history().merge(iD.Graph().load(JSON.parse(iD.introGraph)).entities);

        context.background().source(_.find(context.backgroundSources(), function(d) {
            return d.data.sourcetag === "Bing";
        }));

        // Block saving
        var savebutton = d3.select('#bar button.save'),
            save = savebutton.on('click');
        savebutton.on('click', null);

        var beforeunload = window.onbeforeunload;
        window.onbeforeunload = null;

        d3.select('.layer-layer:first-child').style('opacity', 1);

        var curtain = d3.curtain();
        selection.call(curtain);

        function reveal(box, textid, duration) {
            if (textid) curtain.reveal(box, t(textid), textid.replace(/\./g, '-'), duration);
            else curtain.reveal(box, '', '', duration);
        }

        var steps = ['navigation', 'point', 'area', 'line', 'startEditing'].map(function(step, i) {
            var s = iD.ui.intro[step](context, reveal)
                .on('done', function() {
                    entered.filter(function(d) {
                        return d.name === s.name;
                    }).classed('finished', true);
                    enter(steps[i + 1]);
                });
            return s;
        });

        steps[steps.length - 1].on('startEditing', function() {
            curtain.remove();
            navwrap.remove();
            d3.select('.layer-layer:first-child').style('opacity', opacity);
            context.connection().toggle(true).flush().loadedTiles(loadedTiles);
            context.history().reset().merge(baseEntities);
            context.background().source(background);
            if (history) context.history().fromJSON(history);
            window.location.replace(hash);
            window.onbeforeunload = beforeunload;
            d3.select('#bar button.save').on('click', save);
        });

        var navwrap = selection.append('div').attr('class', 'intro-nav-wrap fillD');

        var buttonwrap = navwrap.append('div')
            .attr('class', 'joined')
            .selectAll('button.step');

        var entered = buttonwrap.data(steps)
            .enter().append('button')
                .attr('class', 'step')
                .on('click', enter);

        entered.append('div').attr('class','icon icon-pre-text apply');
        entered.append('label').text(function(d) { return d.name; });
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
