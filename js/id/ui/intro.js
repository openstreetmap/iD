iD.ui.intro = function(context) {

    var step;

    function intro(selection) {

        // Load semi-real data used in intro
        context.history().reset();
        context.history().merge(iD.Graph().load(JSON.parse(iD.introGraph)).entities);


        curtain = d3.curtain();
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

        var navwrap = selection.append('div').attr('class', 'intro-nav-wrap');

        var entered = navwrap.append('div')
            .attr('class', 'col12 button-wrap joined')
            .selectAll('button.step')
            .data(steps)
            .enter().append('button')
                .attr('class', 'step col2')
                .on('click', function(d) {
                    enter(d);
                });

        entered.append('h3').text(function(d) { return d.name; });

        enter(steps[0]);

        function enter (newStep) {

            if (step) {
                step.exit();
            }

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
        console.log("array");
        box = {
            left: box[0],
            top: box[1],
            width: 0,
            height: 0
        };
    }
    box.left -= padding;
    box.top -= padding;
    box.width += 2 * padding;
    box.height += 2 * padding;
    return box;
};
