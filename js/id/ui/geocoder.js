iD.ui.Geocoder = function(context) {
    function resultExtent(bounds) {
        return new iD.geo.Extent(
            [parseFloat(bounds[3]), parseFloat(bounds[0])],
            [parseFloat(bounds[2]), parseFloat(bounds[1])]);
    }

    function geocoder(selection) {

        var shown = false;

        function keydown() {
            if (d3.event.keyCode !== 13) return;
            d3.event.preventDefault();
            var searchVal = this.value;
            d3.json('http://nominatim.openstreetmap.org/search/' +
                encodeURIComponent(searchVal) + '?limit=10&format=json', function(err, resp) {
                    if (err) return hide();
                    if (!resp.length) {
                        return iD.ui.flash(context.container())
                            .select('.content')
                            .append('h3')
                            .text(t('geocoder.no_results', {name: searchVal}));
                    } else if (resp.length > 1) {
                        var spans = resultsList.selectAll('span')
                            .data(resp, function(d) { return d.place_id; });

                        spans.enter()
                            .append('span')
                            .text(function(d) {
                                return d.type.charAt(0).toUpperCase() + d.type.slice(1) + ': ';
                            })
                            .append('a')
                            .attr('tabindex', 1)
                            .text(function(d) {
                                if (d.display_name.length > 80) {
                                    return d.display_name.substr(0, 80) + '…';
                                } else {
                                    return d.display_name;
                                }
                            })
                            .on('click', clickResult)
                            .on('keydown', function(d) {
                                // support tabbing to and accepting this
                                // entry
                                if (d3.event.keyCode == 13) clickResult(d);
                            });
                        spans.exit().remove();
                        resultsList.classed('hide', false);
                    } else {
                        applyBounds(resultExtent(resp[0].boundingbox));
                    }
                });
        }

        function clickResult(d) {
            applyBounds(resultExtent(d.boundingbox));
        }

        function applyBounds(extent) {
            hide();
            var map = context.map();
            map.extent(extent);
            if (map.zoom() > 19) map.zoom(19);
        }

        function hide() { setVisible(false); }
        function toggle() {
            if (d3.event) d3.event.preventDefault();
            tooltip.hide(button);
            setVisible(gcForm.classed('hide'));
        }

        function setVisible(show) {
            if (show !== shown) {
                button.classed('active', show);
                gcForm.call(iD.ui.Toggle(show));
                if (!show) resultsList.classed('hide', !show);
                if (show) inputNode.node().focus();
                else inputNode.node().blur();
                shown = show;
            }
        }
        var tooltip = bootstrap.tooltip().placement('right');

        var button = selection.append('button')
            .attr('tabindex', -1)
            .attr('title', t('geocoder.title'))
            .on('click', toggle)
            .call(tooltip);

        button.append('span')
            .attr('class', 'icon geocode');

        var gcForm = selection.append('form');

        var inputNode = gcForm.attr('class', 'content fillD map-overlay hide')
            .append('input')
            .attr({ type: 'text', placeholder: t('geocoder.placeholder') })
            .attr('tabindex', 1)
            .on('keydown', keydown);

        var resultsList = selection.append('div')
            .attr('class', 'content fillD map-overlay hide');

        selection.on('click.geocoder-inside', function() {
            return d3.event.stopPropagation();
        });

        context.container().on('mousedown.geocoder-outside', hide, true);

        var keybinding = d3.keybinding('geocoder');

        keybinding.on('f', toggle);

        d3.select(document)
            .call(keybinding);
    }

    return geocoder;
};
