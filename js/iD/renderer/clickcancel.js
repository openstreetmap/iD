function clickCancelProvider() {
    var event = d3.dispatch('click', 'dblclick');
    function cc(selection) {
        var down,
            tolerance = 5,
            last,
            wait = null;
        // euclidean distance
        function dist(a, b) {
            return Math.sqrt(Math.pow(a[0] - b[0], 2), Math.pow(a[1] - b[1], 2));
        }
        selection.on('mousedown', function() {
            down = [d3.event.pageX, d3.event.pageY];
            last = +new Date();
        });
        selection.on('mouseup', function() {
            var up = [d3.event.pageX, d3.event.pageY];
            if (dist(down, up) > tolerance) {
                console.log(down, up);
                return;
            } else {
                if (wait) {
                    window.clearTimeout(wait);
                    wait = null;
                    event.dblclick.apply(selection, d3.event);
                } else {
                    wait = window.setTimeout((function(e) {
                        return function() {
                            event.click.apply(selection, e);
                            wait = null;
                        };
                    })(d3.event), 300);
                }
            }
        });
    }
    return d3.rebind(cc, event, 'on');
}
