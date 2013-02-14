iD.ui.Inspector = function() {
    var event = d3.dispatch('changeTags', 'close', 'change'),
        taginfo = iD.taginfo(),
        presetData = iD.presetData(),
        initial = false,
        presetUI,
        context,
        tagList;

    function inspector(selection) {
        var entity = selection.datum();

        var iwrap = selection.append('div')
                .attr('class','inspector content hide'),
            head = iwrap.append('div')
                .attr('class', 'head inspector-inner fillL'),
            h2 = head.append('h2');

        h2.append('span')
            .attr('class', 'icon big icon-pre-text big-' + entity.geometry(context.graph()));

        var name = h2.append('input')
            .attr('placeholder', 'name')
            .property('value', function() {
                return entity.tags.name || '';
            })
            .on('keyup', function() {
                var tags = inspector.tags();
                tags.name = this.value;
                inspector.tags(tags);
                event.change();
            });

        event.on('change.name', function() {
            var tags = inspector.tags();
            name.property('value', tags.name);
        });

        var inspectorbody = iwrap.append('div')
            .attr('class', 'inspector-body');

        var inspectorwrap = inspectorbody.append('div')
            .attr('class', 'inspector-inner tag-wrap fillL2');

        presetUI = iD.ui.preset()
            .on('change', function(tags) {
                inspector.tags(_.extend(inspector.tags(), tags));
                event.change();
            });

        event.on('change.preset', function() {
            var tags = inspector.tags();
            presetUI.change(tags);
        });

        var inspectorpresetsearch = inspectorwrap.append('div')
            .attr('class', 'inspector-preset cf')
            .call(iD.ui.presetsearch()
                .entity(entity)
                .presetData(presetData)
                .on('choose', function(preset) {
                    inspectorpreset.call(presetUI
                        .preset(preset)
                        .change(inspector.tags()));
                }));

        var inspectorpresetfavs = inspectorwrap.append('div')
            .attr('class', 'inspector-preset cf')
            .call(iD.ui.presetfavs()
                .presetData(presetData)
                .on('choose', function(preset) {
                    inspectorpreset.call(presetUI
                        .preset(preset)
                        .change(inspector.tags()));
                    inspectorpresetsearch
                        .select('input')
                        .property('value', preset.name);
                }));

        var inspectorpreset = inspectorwrap.append('div')
            .attr('class', 'inspector-preset cf');

        inspectorwrap.append('h4')
            .text(t('inspector.edit_tags'));

        tagList = inspectorwrap.append('ul')
            .attr('class', 'tag-list');

        var newTag = inspectorwrap.append('button')
            .attr('class', 'add-tag');

        newTag.on('click', function() {
            addTag();
            focusNewKey();
        });

        newTag.append('span')
            .attr('class', 'icon icon-pre-text plus');

        newTag.append('span')
            .attr('class', 'label')
            .text(t('inspector.new_tag'));

        drawTags(entity.tags);

        inspectorbody.append('div')
            .attr('class', 'inspector-buttons pad1 fillD')
            .call(drawButtons);

        var presetMatch = presetData.matchTags(entity);
        if (presetMatch) {
            inspectorpreset.call(presetUI
                    .preset(presetMatch)
                    .change(inspector.tags()));
        }

        iwrap.call(iD.ui.Toggle(true));
    }

    function drawHead(selection) {
        var entity = selection.datum();

        var h2 = selection.append('h2');

        h2.append('span')
            .attr('class', 'icon big icon-pre-text big-' + entity.geometry(context.graph()));

        h2.append('span')
            .text(entity.friendlyName());
    }

    function drawButtons(selection) {
        var entity = selection.datum();

        var inspectorButton = selection.append('button')
            .attr('class', 'apply action')
            .on('click', apply);

        inspectorButton.append('span')
            .attr('class','label')
            .text(t('inspector.okay'));

        var minorButtons = selection.append('div')
            .attr('class','minor-buttons fl');

        minorButtons.append('a')
            .attr('href', 'http://www.openstreetmap.org/browse/' + entity.type + '/' + entity.osmId())
            .attr('target', '_blank')
            .text(t('inspector.view_on_osm'));
    }

    function drawTags(tags) {
        var entity = tagList.datum();

        tags = _.omit(tags, _.keys(presetUI.tags() || {}));
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

        inputs.append('span')
            .attr('class', 'key-wrap')
            .append('input')
            .property('type', 'text')
            .attr('class', 'key')
            .attr('maxlength', 255)
            .property('value', function(d) { return d.key; })
            .on('change', function(d) { d.key = this.value; event.change(); });

        inputs.append('span')
            .attr('class', 'input-wrap-position')
            .append('input')
            .property('type', 'text')
            .attr('class', 'value')
            .attr('maxlength', 255)
            .property('value', function(d) { return d.value; })
            .on('change', function(d) { d.value = this.value; event.change(); })
            .on('keydown.push-more', pushMore);

        inputs.each(bindTypeahead);

        var removeBtn = row.append('button')
            .attr('tabindex', -1)
            .attr('class','remove minor')
            .on('click', removeTag);

        removeBtn.append('span')
            .attr('class', 'icon delete');

        function findLocal(docs) {
            var locale = iD.detect().locale.toLowerCase(),
                localized;

            localized = _.find(docs, function(d) {
                return d.lang.toLowerCase() === locale;
            });
            if (localized) return localized;

            // try the non-regional version of a language, like
            // 'en' if the language is 'en-US'
            if (locale.indexOf('-') !== -1) {
                var first = locale.split('-')[0];
                localized = _.find(docs, function(d) {
                    return d.lang.toLowerCase() === first;
                });
                if (localized) return localized;
            }

            // finally fall back to english
            return _.find(docs, function(d) {
                return d.lang.toLowerCase() === 'en';
            });
        }

        function keyValueReference(err, docs) {
            var local;
            if (!err && docs) {
                local = findLocal(docs);
            }
            if (local) {
                var types = [];
                if (local.on_area) types.push('area');
                if (local.on_node) types.push('point');
                if (local.on_way) types.push('line');
                local.types = types;
                iD.ui.modal(context.container())
                    .select('.content')
                    .datum(local)
                    .call(iD.ui.tagReference);
            } else {
                iD.ui.flash(context.container())
                    .select('.content')
                    .append('h3')
                    .text(t('inspector.no_documentation_combination'));
            }
        }

        function keyReference(err, values, params) {
            if (!err && values.length) {
                iD.ui.modal(context.container())
                    .select('.content')
                    .datum({
                        data: values,
                        title: 'Key:' + params.key,
                        geometry: params.geometry
                    })
                    .call(iD.ui.keyReference);
            } else {
                iD.ui.flash(context.container())
                    .select('.content')
                    .append('h3')
                    .text(t('inspector.no_documentation_key'));
            }
        }

        var helpBtn = row.append('button')
            .attr('tabindex', -1)
            .attr('class', 'tag-help minor')
            .on('click', function(d) {
                var params = _.extend({}, d, {
                    geometry: entity.geometry(context.graph())
                });
                if (d.key && d.value) {
                    taginfo.docs(params, keyValueReference);
                } else if (d.key) {
                    taginfo.values(params, keyReference);
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
            geometry = entity.geometry(context.graph()),
            row = d3.select(this),
            key = row.selectAll('.key'),
            value = row.selectAll('.input-wrap-position');

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

        var valueinput = value.select('input');
        value.call(d3.combobox()
            .fetcher(_.debounce(function(_, __, callback) {
                taginfo.values({
                    key: key.property('value'),
                    geometry: geometry,
                    query: valueinput.property('value')
                }, function(err, data) {
                    if (!err) callback(sort(valueinput.property('value'), data));
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
            tags = presetUI.tags();
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

    inspector.context = function(_) {
        context = _;
        return inspector;
    };

    return d3.rebind(inspector, event, 'on');
};
