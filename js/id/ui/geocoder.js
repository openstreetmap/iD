iD.ui.Geocoder = function(context) {

    var key = 'f';

    function resultExtent(bounds) {
        return new iD.geo.Extent(
            [parseFloat(bounds[3]), parseFloat(bounds[0])],
            [parseFloat(bounds[2]), parseFloat(bounds[1])]);
    }

    function truncate(d) {
        if (d.display_name.length > 80) {
            return d.display_name.substr(0, 80) + '…';
        } else {
            return d.display_name;
        }
    }

    function geocoder(selection) {

        var shown = false;

        function keydown() {
            if (d3.event.keyCode !== 13) return;
            d3.event.preventDefault();
            var searchVal = this.value;
            inputNode.classed('loading', true);
            d3.json('http://nominatim.openstreetmap.org/search/' +
                encodeURIComponent(searchVal) + '?limit=10&format=json', function(err, resp) {
                    inputNode.classed('loading', false);
                    if (err) return hide();
                    if (!resp.length) {
                        resultsList.html('')
                            .call(iD.ui.Toggle(true))
                            .append('span')
                                .attr('class', 'not-found')
                                .text(t('geocoder.no_results', { name: searchVal }));
                    } else if (resp.length > 1) {
                        var spans = resultsList.html('').selectAll('span')
                            .data(resp, function(d) { return d.place_id; });

                        spans.enter()
                            .append('span')
                            .text(function(d) {
                                return d.type.charAt(0).toUpperCase() + d.type.slice(1) + ': ';
                            })
                            .append('a')
                            .attr('tabindex', 1)
                            .text(truncate)
                            .on('click', clickResult)
                            .on('keydown', function(d) {
                                // support tabbing to and accepting this
                                // entry
                                if (d3.event.keyCode == 13) clickResult(d);
                            });
                        spans.exit().remove();
                        resultsList.call(iD.ui.Toggle(true));
                    } else {
                        hide();
                        applyBounds(resultExtent(resp[0].boundingbox));
                        selectId(resp[0].osm_type, resp[0].osm_id);
                    }
                });
        }

        function clickResult(d) {
            selectId(d.osm_type, d.osm_id);
            applyBounds(resultExtent(d.boundingbox));
        }

        function applyBounds(extent) {
            var map = context.map();
            map.extent(extent);
            if (map.zoom() > 19) map.zoom(19);
        }

        function selectId(type, id) {
            id = type[0] + id;

            if (context.entity(id)) {
                context.enter(iD.modes.Select(context, [id]));
            } else {
                context.map().on('drawn.geocoder', function() {
                    if (!context.entity(id)) return;
                    context.enter(iD.modes.Select(context, [id]));
                });

                context.on('enter.geocoder', function() {
                    if (context.mode().id !== 'browse') {
                        context.on('enter.geocoder', null)
                            .map().on('drawn.geocoder', null);
                    }
                });
            }
        }

        var tooltip = bootstrap.tooltip()
            .placement('right')
            .html(true)
            .title(iD.ui.tooltipHtml(t('geocoder.title'), key));

        var gcForm = selection.append('form');

        var inputNode = gcForm.attr('class', 'fillL map-overlay content hide')
            .append('input')
            .attr({ type: 'text', placeholder: t('geocoder.placeholder') })
            .attr('tabindex', 1)
            .on('keydown', keydown);

        var resultsList = selection.append('div')
            .attr('class', 'fillL map-overlay hide');

        var keybinding = d3.keybinding('geocoder');

        function hide() { setVisible(false); }
        function toggle() {
            if (d3.event) d3.event.preventDefault();
            tooltip.hide(button);
            setVisible(!button.classed('active'));
        }

        function setVisible(show) {
            if (show !== shown) {
                button.classed('active', show);
                shown = show;

                if (!show && !resultsList.classed('hide')) {
                    resultsList.call(iD.ui.Toggle(show));
                    // remove results so that they lose focus. if the user has
                    // tabbed into the list, then they will have focus still,
                    // even if they're hidden.
                    resultsList.selectAll('span').remove();
                }

                if (show) {
                    selection.on('mousedown.geocoder-inside', function() {
                        return d3.event.stopPropagation();
                    });
                    gcForm.style('display', 'block')
                        .style('left', '-500px')
                        .transition()
                        .duration(200)
                        .style('left', '30px');
                        inputNode.node().focus();
                } else {
                    selection.on('mousedown.geocoder-inside', null);
                    gcForm.style('display', 'block')
                        .style('left', '30px')
                        .transition()
                        .duration(200)
                        .style('left', '-500px')
                        .each('end', function() {
                            d3.select(this).style('display', 'none');
                        });
                    inputNode.node().blur();
                }
            }
        }
        var button = selection.append('button')
            .attr('tabindex', -1)
            .on('click', toggle)
            .call(tooltip);

        button.append('span')
            .attr('class', 'icon geocode light');

        keybinding.on(key, toggle);

        d3.select(document)
            .call(keybinding);

        context.surface().on('mousedown.geocoder-outside', hide);
        context.container().on('mousedown.b.geocoder-outside', hide);

    }
    return geocoder;
};
