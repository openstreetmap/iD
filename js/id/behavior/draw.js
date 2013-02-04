iD.behavior.Draw = function(context) {
    var event = d3.dispatch('move', 'click', 'clickWay', 'clickNode', 'clickMidpoint', 'undo', 'cancel', 'finish'),
        keybinding = d3.keybinding('draw'),
        hover = iD.behavior.Hover();

    function datum() {
        if (d3.event.altKey) {
            return {};
        } else {
            return d3.event.target.__data__ || {};
        }
    }

    function mousedown() {
        var selection = d3.select(this);
        selection.on('mousemove.draw', null);

        d3.select(window)
            .on('mouseup.draw', function() {
            selection.on('mousemove.draw', mousemove);
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

        } else if (d.type === 'midpoint') {
            event.clickMidpoint(d);

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
            .on('mousemove.draw', mousemove)
            .on('click.draw', click);

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
            .on('mousemove.draw', null)
            .on('click.draw', null);

        d3.select(window).on('mouseup.draw', null);

        d3.select(document)
            .call(keybinding.off)
            .on('keydown.draw', null)
            .on('keyup.draw', null);
    };

    return d3.rebind(draw, event, 'on');
};
