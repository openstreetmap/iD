iD.behavior.Draw = function(context) {
    var event = d3.dispatch('move', 'click', 'clickWay',
        'clickNode', 'undo', 'cancel', 'finish'),
        keybinding = d3.keybinding('draw'),
        hover = iD.behavior.Hover(),
        tolerance = 8;

    function datum() {
        if (d3.event.altKey) return {};
        else return d3.event.target.__data__ || {};
    }

    function mousedown() {

        function point() {
            var p = target.node().parentNode;
            return touchId !== null ? d3.touches(p).filter(function(p) {
                return p.identifier === touchId;
            })[0] : d3.mouse(p);
        }

        var target = d3.select(this),
            touchId = d3.event.touches ? d3.event.changedTouches[0].identifier : null,
            time = +new Date(),
            pos = point();

        target.on('mousemove.draw', null);

        d3.select(window).on('mouseup.draw', function() {
            target.on('mousemove.draw', mousemove);
            if (iD.geo.dist(pos, point()) < tolerance &&
                (+new Date() - time) < 1000) {
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
            var choice = iD.geo.chooseIndex(d, d3.mouse(context.surface().node()), context);
            event.clickWay(d, choice.loc, choice.index);

        } else if (d.type === 'node') {
            event.clickNode(d);

        } else {
            event.click(context.map().mouseCoordinates());
        }
    }

    function keydown() {
        if (d3.event.keyCode === d3.keybinding.modifierCodes.alt) {
            context.uninstall(hover);
        }
    }

    function keyup() {
        if (d3.event.keyCode === d3.keybinding.modifierCodes.alt) {
            context.install(hover);
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

        keybinding
            .on('⌫', backspace)
            .on('⌦', del)
            .on('⎋', ret)
            .on('↩', ret);

        selection
            .on('mousedown.draw', mousedown)
            .on('mousemove.draw', mousemove);

        d3.select(document)
            .call(keybinding)
            .on('keydown.draw', keydown)
            .on('keyup.draw', keyup);

        return draw;
    }

    draw.off = function(selection) {
        context.uninstall(hover);

        selection
            .on('mousedown.draw', null)
            .on('mousemove.draw', null);

        d3.select(window).on('mouseup.draw', null);

        d3.select(document)
            .call(keybinding.off)
            .on('keydown.draw', null)
            .on('keyup.draw', null);
    };

    return d3.rebind(draw, event, 'on');
};
