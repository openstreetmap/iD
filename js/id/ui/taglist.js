iD.ui.Taglist = function() {
    var event = d3.dispatch('change'),
        taginfo = iD.taginfo(),
        initial = false,
        list,
        context;

    function taglist(selection, collapsed) {

        if (collapsed) {
            selection.append('h4')
                .text('Additional tags')
                .on('click', function() {
                    wrap.call(iD.ui.Toggle(wrap.classed('hide')));
                });
        }

        var wrap = selection.append('div');

        list = wrap.append('ul')
            .attr('class', 'tag-list');

        var newTag = wrap.append('button')
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

        if (collapsed) wrap.classed('hide', true);

    }

    function drawTags(tags) {
        var entity = list.datum();

        tags = d3.entries(tags);

        if (!tags.length) {
            tags = [{key: '', value: ''}];
        }

        var li = list.html('')
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
            list.selectAll('li:last-child input.value').node() === this &&
            !d3.event.shiftKey) {
            addTag();
            focusNewKey();
            d3.event.preventDefault();
        }
    }

    function bindTypeahead() {
        var entity = list.datum(),
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
        list.selectAll('li:last-child input.key').node().focus();
    }

    function addTag() {
        var tags = taglist.tags();
        tags[''] = '';
        drawTags(tags);
    }

    function removeTag(d) {
        var tags = taglist.tags();
        delete tags[d.key];
        drawTags(tags);
    }

    taglist.tags = function(tags) {
        if (!arguments.length) {
            tags = {};
            list.selectAll('li').each(function() {
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

    taglist.context = function(_) {
        context = _;
        return taglist;
    };

    return d3.rebind(taglist, event, 'on');
};
