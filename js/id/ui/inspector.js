iD.Inspector = function() {
    var event = d3.dispatch('changeTags', 'changeWayDirection',
        'update', 'remove', 'close', 'splitWay'),
        taginfo = iD.taginfo(),
        inspectorwrap;

    function inspector(selection) {
        var entity = selection.datum();

        selection.html("").append('button')
            .attr('class', 'narrow close')
            .html("<span class='icon close'></span>")
            .on('click', function() {
                event.close(entity);
            });

        selection.append('div')
            .attr('class', 'head inspector-inner')
            .call(drawHead);

        var inspectorbody = selection.append('div')
            .attr('class', 'inspector-body');

        inspectorwrap = inspectorbody.append('ul')
            .attr('class', 'inspector-inner tag-wrap fillL2');

        inspectorwrap.append('h4')
            .text('Edit tags');

        var formsel = drawTags(entity.tags);

        inspectorbody.append('div')
            .attr('class', 'inspector-buttons')
            .call(drawButtons);

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

        formsel.selectAll('input').node().focus();

        inspectortoggle.append('span')
            .text('Details')
            .attr('class','label');
    }

    function drawHead(selection) {
        var entity = selection.datum();

        var h2 = selection.append('h2');

        h2.append('span')
            .attr('class', function(d) {
                var icons = { way: 'line', node: 'point' };
                return 'icon big icon-pre-text big-' + icons[d.type];
            });

        h2.append('span')
            .text(entity.friendlyName());

        selection.append('a')
            .attr('href', function() {
                return 'http://www.openstreetmap.org/browse/' + entity.type + '/' + entity.osmId();
            })
            .text('View on OSM');

        if (entity.type === 'way') {
            selection.append('a')
                .attr('href', '#')
                .text('Reverse Direction')
                .on('click', function() { event.changeWayDirection(entity); });
        }

        if (entity.type === 'node' && !entity._poi) {
            selection.append('a')
                .attr('href', '#')
                .text('Split Way')
                .on('click', function() { event.splitWay(entity); });
        }
    }

    function drawButtons(selection) {
        selection.append('button')
            .attr('class', 'apply wide action')
            .html("<span class='icon icon-pre-text apply'></span><span class='label'>Apply</span>")
            .on('click', apply);

        selection.append('button')
            .attr('class', 'delete wide action')
            .html("<span class='icon icon-pre-text delete'></span><span class='label'>Delete</span>")
            .on('click', function(entity) { event.remove(entity); });
    }

    function drawTags(tags) {
        tags = d3.entries(tags);
        tags.push({ key: '', value: ''});

        var li = inspectorwrap.selectAll('li')
            .data(tags, function(d) { return d.key; });

        li.exit().remove();

        var row = li.enter().append('li').attr('class','tag-row');
        var inputs = row.append('div').attr('class','input-wrap');

        li.classed('tag-row-empty', function(d) { return d.key === ''; });

        inputs.append('input')
            .property('type', 'text')
            .attr('class', 'key')
            .property('value', function(d) { return d.key; });

        inputs.append('input')
            .property('type', 'text')
            .attr('class', 'value')
            .property('value', function(d) { return d.value; })
            .on('keydown.push-more', pushMore);

        inputs.each(bindTypeahead);

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

    function pushMore() {
        if (d3.event.keyCode === 9) {
            drawTags(inspector.tags());
        }
    }

    function bindTypeahead() {
        var row = d3.select(this),
            key = row.selectAll('.key'),
            value = row.selectAll('.value');

        key.call(d3.typeahead()
            .data(function(_, callback) {
                taginfo.keys({query: key.property('value')}, function(err, data) {
                    callback(data.data.map(function (d) {
                        return {value: d.key};
                    }));
                });
            }));

        value.call(d3.typeahead()
            .data(function(_, callback) {
                taginfo.values({key: key.property('value'), query: value.property('value')}, function(err, data) {
                    callback(data.data.map(function (d) {
                        return {value: d.value, title: d.description};
                    }));
                });
            }));
    }

    function removeTag(d) {
        var tags = inspector.tags();
        delete tags[d.key];
        drawTags(tags);
    }

    function apply(entity) {
        event.changeTags(entity, inspector.tags());
        event.close(entity);
    }

    inspector.tags = function () {
        var tags = {};
        inspectorwrap.selectAll('li').each(function() {
            var row = d3.select(this),
                key = row.selectAll('.key').property('value'),
                value = row.selectAll('.value').property('value');
            if (key !== '') tags[key] = value;
        });
        return tags;
    };

    return d3.rebind(inspector, event, 'on');
};
