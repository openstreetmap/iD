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

            inspectorwrap.append('h4').text('Edit tags');

            inspectorwrap
                .data(['tag', 'value', ''])
                .enter();

            function removeTag(d) {
                draw(grabtags().filter(function(t) { return t.key !== d.key; }));
            }

            function draw(data) {

                var li = inspectorwrap.selectAll('li')
                    .data(data, function(d) { return [d.key, d.value]; });

                li.exit().remove();

                var row = li.enter().append('li').attr('class','tag-row');
                var inputs = row.append('div').attr('class','input-wrap');

                function setValue(d, i) { d.value = this.value; }

                function emptyTag(d) { return d.key === ''; }

                function pushMore(d, i) {
                    if (d3.event.keyCode === 9) {
                        var tags = grabtags();
                        if (i == tags.length - 1 && !tags.filter(emptyTag).length) {
                            draw(tags.concat([{ key: '', value: '' }]));
                        }
                    }
                }

                function bindTypeahead(d, i) {
                    var selection = d3.select(this);
                    selection.call(d3.typeahead()
                        .data(function(selection, callback) {
                            taginfo.values(selection.datum().key, function(err, data) {
                                callback(data.data);
                            });
                        }));
                }

                inputs.append('input')
                    .property('type', 'text')
                    .attr('class', 'key')
                    .property('value', function(d, i) { return d.key; })
                    .on('keyup.update', setValue);

                inputs.append('input')
                    .property('type', 'text')
                    .attr('class', 'value')
                    .property('value', function(d, i) { return d.value; })
                    .on('keyup.update', setValue)
                    .on('keydown.push-more', pushMore)
                    .each(bindTypeahead);

                row.append('button').attr('class','remove minor').on('click', removeTag);

                row.append('button').attr('class', 'tag-help minor').append('a')
                    .text('?')
                    .attr('target', '_blank')
                    .attr('tabindex', -1)
                    .attr('href', function(d) {
                        return 'http://taginfo.openstreetmap.org/keys/' + d.key;
                    });
            }

            function grabtags() {
                var grabbed = [];
                function grab(d) { grabbed.push(d); }
                inspectorwrap.selectAll('li').each(grab);
                return grabbed;
            }

            function unentries(entries) {
                return d3.nest()
                    .key(function(d) { return d.key; })
                    .rollup(function(v) { return v[0].value; })
                    .map(entries);
            }

            draw(d3.entries(_.clone(entity.tags)));

            selection.select('input').node().focus();

            selection.append('div')
                .attr('class', 'inspector-buttons').call(drawbuttons);

            function drawbuttons(selection) {
                selection.append('button')
                    .attr('class', 'apply wide action')
                    .html("<span class='icon icon-pre-text apply'></span><span class='label'>Apply</span>")
                    .on('click', function(entity) {
                        event.changeTags(entity, unentries(grabtags()));
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
