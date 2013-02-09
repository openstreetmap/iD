iD.ui.geocoder = function() {

    var map, context;

    function geocoder(selection) {
        function keydown() {
            if (d3.event.keyCode !== 13) return;
            d3.event.preventDefault();
            var searchVal = this.value;
            d3.json('http://nominatim.openstreetmap.org/search/' +
                encodeURIComponent(searchVal) + '?limit=10&format=json', function (err, resp) {
                if (err) return hide();
                if (!resp.length) {
                    return iD.ui.flash(context.container())
                        .select('.content')
                        .append('h3')
                        .text('No location found for "' + searchVal + '"');
                }
                if(resp.length > 1) {
                    for (var i=0; i < resp.length; i++) {
                        var displayName, elementType, typeStr, span;
                        displayName = resp[i].display_name,
                        elementType = resp[i].type,
                        typeStr = elementType.charAt(0).toUpperCase() + elementType.slice(1) + ': ',
                        span = resultsList.append('span').text(typeStr);
                        if(displayName.length > 80) displayName = displayName.substr(0,80) + '...';
                        span.append('a')
                            .attr('data-min-lon',resp[i].boundingbox[3])
                            .attr('data-min-lat',resp[i].boundingbox[0])
                            .attr('data-max-lon',resp[i].boundingbox[2])
                            .attr('data-max-lat',resp[i].boundingbox[1])
                            .text(displayName)
                            .on('click', clickResult);
                    }
                    resultsList.classed('hide',false); 
                } else {
                    var bounds = resp[0].boundingbox;
                    var extent = iD.geo.Extent([parseFloat(bounds[3]), parseFloat(bounds[0])], [parseFloat(bounds[2]), parseFloat(bounds[1])]);
                    applyBounds(extent);
                }
            });
        }

        function clickResult() {
            var result = d3.select(this);
            var extent = iD.geo.Extent( 
                [parseFloat(result.attr('data-min-lon')),  parseFloat(result.attr('data-min-lat'))], 
                [parseFloat(result.attr('data-max-lon')),  parseFloat(result.attr('data-max-lat'))] 
            );
            applyBounds(extent);
        }

        function applyBounds(extent) {
            hide();
            map.extent(extent);
            if (map.zoom() > 19) map.zoom(19);
        }

        function clickoutside(selection) {
            selection
                .on('click.geocoder-inside', function() {
                    return d3.event.stopPropagation();
                });
            context.container().on('click.geocoder-outside', hide);
        }

        function show() { setVisible(true); }
        function hide() { setVisible(false); }
        function toggle() { setVisible(gcForm.classed('hide')); }

        function setVisible(show) {
            button.classed('active', show);
            gcForm.classed('hide', !show);
            if (!show) resultsList.classed('hide', !show);
            if (show) inputNode.node().focus();
            else inputNode.node().blur();
        }

        var button = selection.append('button')
            .attr('tabindex', -1)
            .attr('title', t('geocoder.find_location'))
            .html('<span class=\'geocode icon\'></span>')
            .on('click', toggle);

        var gcForm = selection.append('form');

        var inputNode = gcForm.attr('class','content fillD map-overlay hide')
            .append('input')
                .attr({ type: 'text', placeholder: t('geocoder.find_a_place') })
                .on('keydown', keydown);

        var resultsList = selection.append('div')
            .attr('class','content fillD map-overlay hide');

        selection.call(clickoutside);
    }

    geocoder.map = function(_) {
        if (!arguments.length) return map;
        map = _;
        return geocoder;
    };

    geocoder.context = function(_) {
        if (!arguments.length) return context;
        context = _;
        return geocoder;
    };

    return geocoder;
};
