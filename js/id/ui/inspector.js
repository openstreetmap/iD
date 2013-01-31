iD.ui.inspector = function() {
    var event = d3.dispatch('changeTags', 'close'),
        taginfo = iD.taginfo(),
        presetData,
        initial = false,
        graph,
        tagList;

    function inspector(selection) {
        var entity = selection.datum();

        var possiblePresets = presetData.match(entity);

        var inspector = selection.append('div')
            .attr('class','inspector content');

        inspector.append('div')
            .attr('class', 'head inspector-inner fillL')
            .call(drawHead);

        var inspectorbody = inspector.append('div')
            .attr('class', 'inspector-body');

        var inspectorwrap = inspectorbody.append('div')
            .attr('class', 'inspector-inner tag-wrap fillL2');

        if (possiblePresets.length) {
            var inspectorpreset = inspectorwrap.append('div')
                .attr('class', 'inspector-preset cf')
                .call(iD.ui.preset()
                    .preset(possiblePresets[0]));
        }


        inspectorwrap.append('h4')
            .text(t('edit_tags'));

        tagList = inspectorwrap.append('ul');

        var newTag = inspectorwrap.append('button')
                .attr('class', 'add-tag');

            newTag.on('click', function() {
                addTag();
                focusNewKey();
            });

            newTag.append('span').attr('class', 'icon icon-pre-text plus');
            newTag.append('span').attr('class','label').text('New tag');

        drawTags(entity.tags);

        inspectorbody.append('div')
            .attr('class', 'inspector-buttons pad1 fillD')
            .call(drawButtons);
    }

    function drawHead(selection) {
        var entity = selection.datum();

        var h2 = selection.append('h2');

        h2.append('span')
            .attr('class', 'icon big icon-pre-text big-' + entity.geometry(graph));

        h2.append('span')
            .text(entity.friendlyName());
    }

    function drawButtons(selection) {
        var entity = selection.datum();

        var inspectorButton = selection.append('button')
                .attr('class', 'apply action')
                .on('click', apply);

            inspectorButton.append('span').attr('class','label').text('Okay');

        var minorButtons = selection.append('div').attr('class','minor-buttons fl');

            minorButtons.append('a')
                .attr('href', 'http://www.openstreetmap.org/browse/' + entity.type + '/' + entity.osmId())
                .attr('target', '_blank')
                .text('View on OSM');
    }

    function drawTags(tags) {
        var entity = tagList.datum();

        tags = d3.entries(tags);

        if (!tags.length) {
            tags = [{key: '', value: ''}];
        }

        var li = tagList.html('')
            .selectAll('li')
            .data(tags, function(d) { return d.key; });

        li.exit().remove();

        var row = li.enter().append('li')
            .attr('class', 'tag-row');

        var inputs = row.append('div')
            .attr('class', 'input-wrap');

        inputs.append('input')
            .property('type', 'text')
            .attr('class', 'key')
            .attr('maxlength', 255)
            .property('value', function(d) { return d.key; })
            .on('change', function(d) { d.key = this.value; });

        inputs.append('input')
            .property('type', 'text')
            .attr('class', 'value')
            .attr('maxlength', 255)
            .property('value', function(d) { return d.value; })
            .on('change', function(d) { d.value = this.value; })
            .on('keydown.push-more', pushMore);

        inputs.each(bindTypeahead);

        var removeBtn = row.append('button')
            .attr('tabindex', -1)
            .attr('class','remove minor')
            .on('click', removeTag);

        removeBtn.append('span')
            .attr('class', 'icon delete');

        var helpBtn = row.append('button')
            .attr('tabindex', -1)
            .attr('class', 'tag-help minor')
            .on('click', function(d) {
                var params = _.extend({}, d, {
                    geometry: entity.geometry(graph)
                });
                if (d.key && d.value) {
                    taginfo.docs(params, function(err, docs) {
                        var en;
                        if (!err && docs) {
                            en = _.find(docs, function(d) {
                                return d.lang == 'en';
                            });
                        }
                        if (en) {
                            var types = [];
                            if (en.on_area) types.push('area');
                            if (en.on_node) types.push('point');
                            if (en.on_way) types.push('line');
                            en.types = types;
                            iD.ui.modal()
                                .select('.content')
                                .datum(en)
                                .call(iD.ui.tagReference);
                        } else {
                            iD.ui.flash()
                                .select('.content')
                                .append('h3')
                                .text(t('no_documentation_combination'));
                        }
                    });
                } else if (d.key) {
                    taginfo.values(params, function(err, values) {
                        if (!err && values.data.length) {
                            iD.ui.modal()
                                .select('.content')
                                .datum({
                                    data: values.data,
                                    title: 'Key:' + params.key,
                                    geometry: params.geometry
                                })
                                .call(iD.keyReference);
                        } else {
                            iD.ui.flash()
                                .select('.content')
                                .append('h3')
                                .text(t('no_documentation_key'));
                        }
                    });
                }
            });

        helpBtn.append('span')
            .attr('class', 'icon inspect');

        if (initial && tags.length === 1 &&
            tags[0].key === '' && tags[0].value === '') {
            focusNewKey();
        }

        return li;
    }

    function pushMore() {
        if (d3.event.keyCode === 9 &&
            tagList.selectAll('li:last-child input.value').node() === this) {
            addTag();
            focusNewKey();
            d3.event.preventDefault();
        }
    }

    function bindTypeahead() {
        var entity = tagList.datum(),
            geometry = entity.geometry(graph),
            row = d3.select(this),
            key = row.selectAll('.key'),
            value = row.selectAll('.value');

        function sort(value, data) {
            var sameletter = [],
                other = [];
            for (var i = 0; i < data.length; i++) {
                if (data[i].value.substring(0, value.length) === value) {
                    sameletter.push(data[i]);
                } else {
                    other.push(data[i]);
                }
            }
            return sameletter.concat(other);
        }

        key.call(d3.typeahead()
            .data(_.debounce(function(_, callback) {
                taginfo.keys({
                    geometry: geometry,
                    query: key.property('value')
                }, function(err, data) {
                    if (!err) callback(sort(key.property('value'), data));
                });
            }, 500)));

        value.call(d3.typeahead()
            .data(_.debounce(function(_, callback) {
                taginfo.values({
                    key: key.property('value'),
                    geometry: geometry,
                    query: value.property('value')
                }, function(err, data) {
                    if (!err) callback(sort(value.property('value'), data));
                });
            }, 500)));
    }

    function focusNewKey() {
        tagList.selectAll('li:last-child input.key').node().focus();
    }

    function addTag() {
        var tags = inspector.tags();
        tags[''] = '';
        drawTags(tags);
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

    inspector.tags = function(tags) {
        if (!arguments.length) {
            tags = {};
            tagList.selectAll('li').each(function() {
                var row = d3.select(this),
                    key = row.selectAll('.key').property('value'),
                    value = row.selectAll('.value').property('value');
                if (key !== '') tags[key] = value;
            });
            return tags;
        } else {
            drawTags(tags);
        }
    };

    inspector.initial = function(_) {
        initial = _;
        return inspector;
    };

    inspector.presetData = function(_) {
        presetData = _;
        return inspector;
    };

    inspector.graph = function(_) {
        graph = _;
        return inspector;
    };

    return d3.rebind(inspector, event, 'on');
};
