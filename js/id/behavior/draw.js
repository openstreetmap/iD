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

    function datum(p) {
        if (d3.event.altKey) return {};
        var target = p ? document.elementFromPoint(p[0], p[1]) : d3.event.target;
        return (target && target.__data__) || {};
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
        event.move(datum());
    }

    function needsSegment() {
        return context.mode().option === 'orthogonal' && startSegment.length < 2;
    }

    function mouseup() {
        if (needsSegment()) click();
    }

    function click() {
        var d = datum();
        if (d.type === 'way') {
            var choice = iD.geo.chooseEdge(context.childNodes(d), context.mouse(), context.projection),
                edge = [d.nodes[choice.index - 1], d.nodes[choice.index]];
            if (needsSegment()) startSegment.push(choice.loc);
            event.clickWay(choice.loc, edge);

        } else if (d.type === 'node') {
            if (needsSegment()) startSegment.push(d.loc);
            event.clickNode(d);

        } else {
            var loc = context.map().mouseCoordinates();
            if (needsSegment()) startSegment.push(loc);
            event.click(loc);
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
