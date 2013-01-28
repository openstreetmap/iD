iD.behavior.Draw = function () {
    var event = d3.dispatch('move', 'add', 'undo', 'cancel', 'finish'),
        keybinding = d3.keybinding('draw'),
        down;

    function draw(selection) {
        function mousemove() {
            if (!down) event.move();
        }

        function click() {
            event.add();
        }

        function mousedown() {
            down = true;
        }

        function mouseup() {
            down = false;
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

        selection
            .on('mousedown.draw', mousedown)
            .on('mouseup.draw', mouseup)
            .on('mousemove.draw', mousemove)
            .on('click.draw', click);

        keybinding
            .on('⌫', backspace)
            .on('⌦', del)
            .on('⎋', ret)
            .on('↩', ret);

        d3.select(document)
            .call(keybinding);

        return draw;
    }

    draw.off = function(selection) {
        selection
            .on('mousemove.draw', null)
            .on('click.draw', null);

        keybinding.off();
    };

    return d3.rebind(draw, event, 'on');
};
