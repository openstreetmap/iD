iD.Inspector = function() {
    var event = d3.dispatch('changeTags', 'changeWayDirection',
        'update', 'remove', 'close', 'splitWay'),
        taginfo = iD.taginfo(),
        inspectorwrap;

    function drawhead(selection) {
        function osmLink(d) {
            return 'http://www.openstreetmap.org/browse/' + d.type + '/' + d.osmId();
        }
        function emitChangeDirection(d) { event.changeWayDirection(iD.Entity(d)); }
        function emitSplitWay(d) { event.splitWay(iD.Entity(d)); }
        selection.html('');
        var h2 = selection.append('h2');
        h2.append('span').attr('class', function(d) {
            var icons = { way: 'line', node: 'point' };
            return 'icon big icon-pre-text big-' + icons[d.type];
        });
        h2.append('span').text(iD.util.friendlyName(selection.datum()));
        selection.append('a')
            .attr('class', 'permalink')
            .attr('href', osmLink)
            .text('View on OSM');
        if (selection.datum().type === 'way') {
            selection.append('a')
                .attr('class', 'permalink')
                .attr('href', '#')
                .text('Reverse Direction')
                .on('click', emitChangeDirection);
        }
        if (selection.datum().type === 'node' && !selection.datum()._poi) {
            selection.append('a')
                .attr('class', 'permalink')
                .attr('href', '#')
                .text('Split Way')
                .on('click', emitSplitWay);
        }
    }

    function inspector(selection) {
        selection.each(function(entity) {

            function draw(tags) {

                function setValue(d) {
                    d.value = this.value;
                }

                function setKey(d) {
                    d.key = this.value;
                }

                function emptyTag(d) {
                    return d.key === '';
                }

                function pushMore() {
                    if (d3.event.keyCode === 9) {
                        draw(inspector.tags());
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

                tags = d3.entries(tags);
                tags.push({ key: '', value: ''});

                var li = inspectorwrap.selectAll('li')
                    .data(tags, function(d) { return d.key; });

                li.exit().remove();

                var row = li.enter().append('li').attr('class','tag-row');
                var inputs = row.append('div').attr('class','input-wrap');

                li.classed('tag-row-empty', emptyTag);

                inputs.append('input')
                    .property('type', 'text')
                    .attr('class', 'key')
                    .property('value', function(d) { return d.key; })
                    .on('keyup.update', setKey);

                inputs.append('input')
                    .property('type', 'text')
                    .attr('class', 'value')
                    .property('value', function(d) { return d.value; })
                    .on('keyup.update', setValue)
                    .on('keydown.push-more', pushMore)
                    .each(bindTypeahead);

                var removeBtn = row.append('button')
                    .attr('tabindex', -1)
                    .attr('class','remove minor')
                    .on('click', removeTag);

                removeBtn.append('span').attr('class', 'icon remove');

                var helpBtn = row.append('button')
                    .attr('tabindex', -1)
                    .attr('class', 'tag-help minor')
                    .append('a')
                        .attr('tabindex', -1)
                        .attr('target', '_blank')
                        .on('click', function(d) {
                            taginfo.docs(d, function(err, docs) {
                                var en = _.find(docs, function(d) {
                                    return d.lang == 'en';
                                });
                                if (en) {
                                    var types = [];
                                    if (en.on_area) types.push('area');
                                    if (en.on_node) types.push('point');
                                    if (en.on_way) types.push('line');
                                    en.types = types;
                                    var mod = iD.modal();
                                    mod.select('.content')
                                        .datum(en)
                                        .call(iD.tagReference);
                                }
                            });
                            d3.event.preventDefault();
                        })
                        .attr('href', function(d) {
                            return 'http://taginfo.openstreetmap.org/keys/' + d.key;
                        });

                helpBtn.append('span').attr('class', 'icon inspect');

                return li;
            }

            function removeTag(d) {
                var tags = inspector.tags();
                delete tags[d.key];
                draw(tags);
            }

            function apply(entity) {
                event.changeTags(entity, inspector.tags());
                event.close(entity);
            }

            function drawbuttons(selection) {
                selection.append('button')
                    .attr('class', 'apply wide action')
                    .html("<span class='icon icon-pre-text apply'></span><span class='label'>Apply</span>")
                    .on('click', apply);
                selection.append('button')
                    .attr('class', 'delete wide action')
                    .html("<span class='icon icon-pre-text delete'></span><span class='label'>Delete</span>")
                    .on('click', function(entity) { event.remove(entity); });
            }

            selection.append('div')
                .attr('class', 'head inspector-inner')
                .call(drawhead);

            var inspectorbody = selection.append('div')
                .attr('class', 'inspector-body');

            inspectorwrap = inspectorbody
                .append('ul').attr('class', 'inspector-inner tag-wrap fillL2');

            inspectorwrap.append('h4').text('Edit tags');

            var formsel = draw(entity.tags);

            inspectorbody.append('div')
                .attr('class', 'inspector-buttons').call(drawbuttons);

            var inHeight = inspectorbody.node().offsetHeight;

            inspectorbody.style('display', 'none')
                .style('margin-top', (-inHeight) + 'px');

            var inspectortoggle = selection.append('button')
                .attr('class', 'inspector-toggle action')
                .on('click', function() {
                    inspectortoggle.style('display', 'none');
                    inspectorbody
                        .style('display', 'block')
                        .transition()
                        .style('margin-top', '0px');
                });

            formsel.select('input').node().focus();

            inspectortoggle.append('span')
                .text('Details')
                .attr('class','label');
        });
    }

    function unentries(entries) {
        return d3.nest()
            .key(function(d) { return d.key; })
            .rollup(function(v) { return v[0].value; })
            .map(entries);
    }

    inspector.tags = function () {
        var grabbed = [];
        function grab(d) { if (d.key !== '') grabbed.push(d); }
        inspectorwrap.selectAll('li').each(grab);
        return unentries(grabbed);
    };

    return d3.rebind(inspector, event, 'on');
};
