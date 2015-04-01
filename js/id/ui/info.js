iD.ui.Info = function(context) {
    var key = 'I';

    function info(selection) {

        function redraw() {
            if (hidden()) return;
        }


        function hidden() {
            return selection.style('display') === 'none';
        }


        function toggle() {
            if (d3.event) d3.event.preventDefault();

            if (hidden()) {
                selection
                    .style('display', 'block')
                    .style('opacity', 0)
                    .transition()
                    .duration(200)
                    .style('opacity', 1);

                redraw();

            } else {
                selection
                    .style('display', 'block')
                    .style('opacity', 1)
                    .transition()
                    .duration(200)
                    .style('opacity', 0)
                    .each('end', function() {
                        d3.select(this).style('display', 'none');
                    });
            }
        }

        context.map()
            .on('drawn.info', redraw);

        redraw();

        var keybinding = d3.keybinding('info')
            .on(key, toggle);

        d3.select(document)
            .call(keybinding);
    }

    return info;
};
