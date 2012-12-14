iD.Inspector = function() {
    var event = d3.dispatch('changeTags', 'changeWayDirection', 'update', 'remove', 'close', 'splitWay'),
        taginfo = iD.taginfo();

    function drawhead(selection) {
        selection.html('');
        selection.append('h2')
            .text(iD.util.friendlyName(selection.datum()));
        selection.append('a')
            .attr('class', 'permalink')
            .attr('href', function(d) {
                return 'http://www.openstreetmap.org/browse/' +
                d.type + '/' + d.osmId();
            })
            .text('View on OSM');
        if (selection.datum().type === 'way') {
            selection.append('a')
                .attr('class', 'permalink')
                .attr('href', '#')
                .text('Reverse Direction')
                .on('click', function(d) {
                    event.changeWayDirection(iD.Entity(d));
                });
        }
        if (selection.datum().type === 'node' && !selection.datum()._poi) {
            selection.append('a')
                .attr('class', 'permalink')
                .attr('href', '#')
                .text('Split Way')
                .on('click', function(d) {
                    event.splitWay(iD.Entity(d));
                });
        }
    }

    function inspector(selection) {
        selection.each(function(entity) {
            selection.html("").append('button')
                .attr('class', 'narrow close')
                .html("<span class='icon close'></span>")
                .on('click', function() {
                    event.close(entity);
                });

            selection.append('div')
                .attr('class', 'head inspector-inner').call(drawhead);

            var inspectorwrap = selection
                .append('ul').attr('class', 'inspector-inner tag-wrap fillL2');

            inspectorwrap.append('h4').text('Edit tags')

            inspectorwrap
                .data(['tag', 'value', ''])
                .enter();

            function removeTag(d) {
                var tags = pad(grabtags());
                delete tags[d.key];
                draw(tags);
            }

            function draw(data) {
                var tr = inspectorwrap.selectAll('li')
                    .data(d3.entries(data), function(d) { return [d.key, d.value]; });
                tr.exit().remove();
                var row = tr.enter().append('li').attr('class','tag-row');
                var inputs = row.append('div').attr('class','input-wrap').selectAll('input')
                    .data(function(d) { return [d, d]; });
                inputs.enter().append('input')
                    .property('type', 'text')
                    .attr('class', function(d, i) {
                        return i ? 'value' : 'key';
                    })
                    .property('value', function(d, i) { return d[i ? 'value' : 'key']; })
                    .on('keyup.update', function(d, i) {
                        d[i ? 'value' : 'key'] = this.value;
                        update();
                    })
                    .each(function(d, i) {
                        if (!i) return;
                        var selection = d3.select(this);
                        selection.call(d3.typeahead()
                            .data(function(selection, callback) {
                                update();
                                taginfo.values(selection.datum().key, function(err, data) {
                                    callback(data.data);
                                });
                            }));
                    });
                row.append('button')
                    .html("<span class='icon remove'></span>")
                    .attr('class','remove minor')
                    .on('click', removeTag);
                row.append('button').attr('class', 'tag-help minor').append('a')
                    .html("<span class='icon inspect'></span>")
                    .attr('target', '_blank')
                    .attr('tabindex', -1)
                    .attr('href', function(d) {
                        return 'http://taginfo.openstreetmap.org/keys/' + d.key;
                    });
            }

            // Remove any blank key-values
            function clean(x) {
                for (var i in x) {
                    // undefined is cast to a string as an object key
                    if (!i || i === 'undefined') delete x[i];
                }
                return x;
            }

            // Add a blank row for new tags
            function pad(x) {
                if (!x['']) x[''] = '';
                return x;
            }

            function grabtags() {
                var grabbed = {};
                function grab(d) { if (d.key !== undefined) grabbed[d.key] = d.value; }
                inspectorwrap.selectAll('input').each(grab);
                return grabbed;
            }

            // fill values and add blank field if necessary
            function update() {
                draw(pad(grabtags()));
            }

            var data = _.clone(entity.tags);
            draw(data);
            update();

            selection.select('input').node().focus();

            selection.append('div')
                .attr('class', 'inspector-buttons').call(drawbuttons);

            function drawbuttons(selection) {
                selection.append('button')
                    .attr('class', 'apply wide action')
                    .html("<span class='icon icon-pre-text apply'></span><span class='label'>Apply</span>")
                    .on('click', function(entity) {
                        event.changeTags(entity, clean(grabtags()));
                        event.close(entity);
                    });
                selection.append('button')
                    .attr('class', 'delete wide action fr')
                    .html("<span class='icon icon-pre-text delete'></span><span class='label'>Delete</span>")
                    .on('click', function(entity) { event.remove(entity); });
            }
        });
    }

    return d3.rebind(inspector, event, 'on');
};
