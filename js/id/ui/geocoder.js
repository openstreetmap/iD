iD.ui.geocoder = function() {

    var map;

    function geocoder(selection) {
        function keydown() {
            if (d3.event.keyCode !== 13) return;
            d3.event.preventDefault();
	    var searchVal = this.value;
            d3.json('http://nominatim.openstreetmap.org/search/' +
                encodeURIComponent(searchVal) + '?limit=10&format=json', function(err, resp) {
                if (err) return hide();
                hide();
                if (!resp.length) {
                    return iD.ui.flash()
                        .select('.content')
                        .append('h3')
                        .text('No location found for "' + searchVal + '"');
                }
                var bounds = resp[0].boundingbox;
                map.extent(iD.geo.Extent([parseFloat(bounds[3]), parseFloat(bounds[0])], [parseFloat(bounds[2]), parseFloat(bounds[1])]));
            });
        }

        function clickoutside(selection) {
            selection
                .on('click.geocoder-inside', function() {
                    return d3.event.stopPropagation();
                });
            d3.select('body').on('click.geocoder-outside', hide);
        }

        function show() { setVisible(true); }
        function hide() { setVisible(false); }
        function toggle() { setVisible(gcForm.classed('hide')); }

        function setVisible(show) {
            button.classed('active', show);
            gcForm.classed('hide', !show);
            var input_node = d3.select('.map-overlay input').node();
            if (show) input_node.focus();
            else input_node.blur();
        }

        var button = selection.append('button')
            .attr('tabindex', -1)
            .attr('title', 'Find A Location')
            .html('<span class=\'geocode icon\'></span>')
            .on('click', toggle);

        var gcForm = selection.append('form');

        gcForm.attr('class','content fillD map-overlay hide')
            .append('input')
                .attr({ type: 'text', placeholder: 'find a place' })
                .on('keydown', keydown);

        selection.call(clickoutside);
    }

    geocoder.map = function(_) {
        if (!arguments.length) return map;
        map = _;
        return geocoder;
    };

    return geocoder;
};
