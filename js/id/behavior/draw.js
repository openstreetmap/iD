iD.behavior.Draw = function(context) {
    var event = d3.dispatch('move', 'click', 'clickWay',
        'clickNode', 'undo', 'cancel', 'finish'),
        keybinding = d3.keybinding('draw'),
        hover = iD.behavior.Hover(context)
            .altDisables(true)
            .on('hover', context.ui().sidebar.hover),
        tail = iD.behavior.Tail(),
        edit = iD.behavior.Edit(context),
        closeTolerance = 4,
        tolerance = 12;

    function datum() {
        if (d3.event.altKey) return {};
        else return d3.event.target.__data__ || {};
    }

    function mousedown() {

        function point() {
            var p = element.node().parentNode;
            return touchId !== null ? d3.touches(p).filter(function(p) {
                return p.identifier === touchId;
            })[0] : d3.mouse(p);
        }

        var element = d3.select(this),
            touchId = d3.event.touches ? d3.event.changedTouches[0].identifier : null,
            time = +new Date(),
            pos = point();

        element.on('mousemove.draw', null);

        d3.select(window).on('mouseup.draw', function() {
            element.on('mousemove.draw', mousemove);
            if (iD.geo.euclideanDistance(pos, point()) < closeTolerance ||
                (iD.geo.euclideanDistance(pos, point()) < tolerance &&
                (+new Date() - time) < 500)) {

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

    function mousemove() {
        event.move(datum());
    }

    function click() {
        var d = datum();
        if (d.type === 'way') {
            var choice = iD.geo.chooseEdge(context.childNodes(d), context.mouse(), context.projection),
                edge = [d.nodes[choice.index - 1], d.nodes[choice.index]];
            event.clickWay(choice.loc, edge);

        } else if (d.type === 'node') {
            event.clickNode(d);

        } else {
            event.click(context.map().mouseCoordinates());
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

        return draw;
    }

    draw.off = function(selection) {
        context.uninstall(hover);
        context.uninstall(edit);

        if (!context.inIntro() && !iD.behavior.Draw.usedTails[tail.text()]) {
            context.uninstall(tail);
            iD.behavior.Draw.usedTails[tail.text()] = true;
        }

        selection
            .on('mousedown.draw', null)
            .on('mousemove.draw', null);

        d3.select(window)
            .on('mouseup.draw', null);

        d3.select(document)
            .call(keybinding.off);
    };

    draw.tail = function(_) {
        tail.text(_);
        return draw;
    };

    return d3.rebind(draw, event, 'on');
};

iD.behavior.Draw.usedTails = {};
