iD.behavior.Draw = function(context) {
    var event = d3.dispatch('move', 'click', 'clickWay',
            'clickNode', 'undo', 'cancel', 'finish'),
        keybinding = d3.keybinding('draw'),
        hover = iD.behavior.Hover(context)
            .altDisables(true)
            .on('hover', context.ui().sidebar.hover),
        tail = iD.behavior.Tail(),
        edit = iD.behavior.Edit(context),
        startSegment = [],
        closeTolerance = 4,
        tolerance = 12;


    function keydown() {
        if (d3.event && d3.event.shiftKey) {
            context.surface()
                .classed('behavior-draworthogonal', true);
        }
    }

    function keyup() {
        if (!d3.event || !d3.event.shiftKey) {
            context.surface()
                .classed('behavior-draworthogonal', false);
        }
    }

    // Depending on mode option, return an array of touch targets:
    //   [{ entity: entity, loc: [lon,lat] }]
    // There will normally be a singular touch target at mouseLoc,
    //   unless we're in a special drawing mode.
    function getTargets() {
        function vecAdd(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
        function perpendicular(a, b, dist) {
            var len = iD.geo.euclideanDistance(a, b);
            return len === 0 ? [0, 0] : [
                ((b[1] - a[1]) / len) * dist,
                ((b[0] - a[0]) / len) * dist * -1
            ];
            return [
                [a[0] + pvec[0], a[1] + pvec[1]],
                [b[0] + pvec[0], b[1] + pvec[1]]
            ];
        }

        var mouseLoc = context.map().mouseCoordinates();
        if (d3.event.altKey) return [{ entity: null, loc: mouseLoc }];

        if (context.mode().option === 'orthogonal' && startSegment.length === 2) {
            var p0 = context.projection(startSegment[0]),
                p1 = context.projection(startSegment[1]),
                pMouse = context.map().mouse(),
                theta = Math.atan2(p1[1] - pMouse[1], p1[0] - pMouse[0]) -
                    Math.atan2(p1[1] - p0[1], p1[0] - p0[0]),
                height = iD.geo.euclideanDistance(p1, pMouse) * Math.sin(theta),
                perp = perpendicular(p0, p1, height),
                q0 = vecAdd(p0, perp),
                q1 = vecAdd(p1, perp);

            var points = [q1, q0];
            return _.map(points, function(p) {
                var target = document.elementFromPoint(p[0], p[1]);
                return { entity: target && target.__data__, loc: context.projection.invert(p) };
            });

        } else {
            return [{ entity: d3.event.target.__data__, loc: mouseLoc }];
        }
    }

    function mousedown() {
        function point() {
            var p = context.container().node();
            return touchId !== null ? d3.touches(p).filter(function(p) {
                return p.identifier === touchId;
            })[0] : d3.mouse(p);
        }

        var mode = context.mode();
        if (d3.event.shiftKey && (mode.id === 'add-area' || mode.id === 'add-line')) {
            mode.option = 'orthogonal';
            d3.event.preventDefault();
            d3.event.stopPropagation();
            click();

        } else {
            var element = d3.select(this),
                touchId = d3.event.touches ? d3.event.changedTouches[0].identifier : null,
                t1 = +new Date(),
                p1 = point();

            element.on('mousemove.draw', null);

            d3.select(window).on('mouseup.draw', function () {
                var t2 = +new Date(),
                    p2 = point(),
                    dist = iD.geo.euclideanDistance(p1, p2);

                d3.select(window).on('mouseup.draw', null);
                element.on('mousemove.draw', mousemove);

                if (dist < closeTolerance || (dist < tolerance && (t2 - t1) < 500)) {
                    // Prevent a quick second click
                    d3.select(window).on('click.draw-block', function() {
                        d3.event.stopPropagation();
                    }, true);

                    context.map().dblclickEnable(false);

                    window.setTimeout(function() {
                        context.map().dblclickEnable(true);
                        d3.select(window).on('click.draw-block', null);
                    }, 500);

                    click();
                }
            });
        }
    }

    function mousemove() {
        event.move(getTargets());
    }

    function needsSegment() {
        return context.mode().option === 'orthogonal' && startSegment.length < 2;
    }

    function mouseup() {
        if (needsSegment()) click();
    }

    function click() {
        var targets = [getTargets()[0]]; // only one target for now

        for (var i = 0; i < targets.length; i++) {
            var more = (i !== targets.length - 1),
                d = targets[i],
                e = d.entity;

            if (e && e.type === 'way') {
                var choice = iD.geo.chooseEdge(context.childNodes(e), context.mouse(), context.projection),
                    edge = [e.nodes[choice.index - 1], e.nodes[choice.index]];
                if (needsSegment()) startSegment.push(choice.loc);
                event.clickWay(choice.loc, edge, more);

            } else if (e && e.type === 'node') {
                if (needsSegment()) startSegment.push(e.loc);
                event.clickNode(e, more);

            } else {
                if (needsSegment()) startSegment.push(d.loc);
                event.click(d.loc, more);
            }
        }
    }

    function backspace() {
        d3.event.preventDefault();
        event.undo();
    }

    function del() {
        d3.event.preventDefault();
        event.cancel();
    }

    function ret() {
        d3.event.preventDefault();
        event.finish();
    }

    function draw(selection) {
        context.install(hover);
        context.install(edit);

        if (!context.inIntro() && !iD.behavior.Draw.usedTails[tail.text()]) {
            context.install(tail);
        }

        keybinding
            .on('⌫', backspace)
            .on('⌦', del)
            .on('⎋', ret)
            .on('↩', ret);

        selection
            .on('mousedown.draw', mousedown)
            .on('mousemove.draw', mousemove);

        d3.select(document)
            .call(keybinding);

        d3.select(window)
            .on('mouseup.draw', mouseup)
            .on('keydown.draw', keydown)
            .on('keyup.draw', keyup);

        keydown();

        return draw;
    }

    draw.off = function(selection) {
        context.ui().sidebar.hover.cancel();
        context.uninstall(hover);
        context.uninstall(edit);

        if (!context.inIntro() && !iD.behavior.Draw.usedTails[tail.text()]) {
            context.uninstall(tail);
            iD.behavior.Draw.usedTails[tail.text()] = true;
        }

        selection
            .on('mousedown.draw', null)
            .on('mousemove.draw', null);

        keyup();

        d3.select(window)
            .on('mouseup.draw', null)
            .on('keydown.draw', null)
            .on('keyup.draw', null);

        d3.select(document)
            .call(keybinding.off);
    };

    draw.tail = function(_) {
        tail.text(_);
        return draw;
    };

    draw.startSegment = function(_) {
        if (!arguments.length) return startSegment;
        startSegment = _ || [];
        return draw;
    };

    return d3.rebind(draw, event, 'on');
};

iD.behavior.Draw.usedTails = {};
