iD.behavior.Draw = function () {
    var event = d3.dispatch('move', 'add', 'undo', 'cancel', 'finish'),
        keybinding = d3.keybinding('draw');

    function draw(selection) {
        function mousemove() {
            event.move();
        }

        function click() {
            event.add();
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
