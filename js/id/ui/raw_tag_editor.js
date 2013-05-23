iD.ui.RawTagEditor = function(context, entity) {
    var event = d3.dispatch('change'),
        taginfo = iD.taginfo(),
        disclosure,
        list;

    function rawTagEditor(selection, other) {
        function toggled(expanded) {
            iD.ui.RawTagEditor.expanded = expanded;
            if (expanded) {
                selection.node().parentNode.scrollTop += 200;
            }
        }

        disclosure = iD.ui.Disclosure()
            .title(t('inspector.all_tags'))
            .expanded(iD.ui.RawTagEditor.expanded || other)
            .on('toggled', toggled)
            .content(content);

        selection.call(disclosure);
    }

    function content(wrap) {
        list = wrap.append('ul')
            .attr('class', 'tag-list');

        var newTag = wrap.append('button')
            .attr('class', 'add-tag col6')
            .on('click', addTag);

        newTag.append('span')
            .attr('class', 'icon plus light');

        newTag.append('span')
            .attr('class', 'label')
            .text(t('inspector.new_tag'));
    }

    function drawTags(tags) {

        var count = Object.keys(tags).filter(function(d) { return d; }).length;
        disclosure.title(t('inspector.all_tags') + ' (' + count + ')');

        tags = d3.entries(tags);

        if (!tags.length) {
            tags = [{key: '', value: ''}];
        }

        tags.forEach(function(tag) {
            tag.reference = iD.ui.TagReference({key: tag.key});
        });

        var li = list.html('')
            .selectAll('li')
            .data(tags, function(d) { return d.key; });

        li.exit().remove();

        var row = li.enter().append('li')
            .attr('class', 'tag-row cf');

        row.append('div')
            .attr('class', 'key-wrap')
            .append('input')
            .property('type', 'text')
            .attr('class', 'key')
            .attr('maxlength', 255)
            .property('value', function(d) { return d.key; })
            .on('blur', keyChange)
            .on('change', keyChange);

        function keyChange(d) {
            d.key = this.value;
            event.change(rawTagEditor.tags());
        }

        row.append('div')
            .attr('class', 'input-wrap-position col6')
            .append('input')
            .property('type', 'text')
            .attr('class', 'value')
            .attr('maxlength', 255)
            .property('value', function(d) { return d.value; })
            .on('blur', valueChange)
            .on('change', valueChange)
            .on('keydown.push-more', pushMore);

        function valueChange(d) {
            d.value = this.value;
            event.change(rawTagEditor.tags());
        }

        row.each(bindTypeahead);

        row.append('button')
            .attr('tabindex', -1)
            .attr('class','remove minor')
            .on('click', removeTag)
            .append('span')
            .attr('class', 'icon delete');

        row.each(function(tag) {
            d3.select(this)
                .call(tag.reference.button)
                .call(tag.reference.body);
        });

        return li;
    }

    function pushMore() {
        if (d3.event.keyCode === 9 &&
            list.selectAll('li:last-child input.value').node() === this &&
            !d3.event.shiftKey) {
            addTag();
            d3.event.preventDefault();
        }
    }

    function bindTypeahead() {
        var geometry = entity.geometry(context.graph()),
            row = d3.select(this),
            key = row.selectAll('input.key'),
            value = row.selectAll('input.value');

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

        key.call(d3.combobox()
            .fetcher(function(value, __, callback) {
                taginfo.keys({
                    debounce: true,
                    geometry: geometry,
                    query: value
                }, function(err, data) {
                    if (!err) callback(sort(value, data));
                });
            }));

        value.call(d3.combobox()
            .fetcher(function(value, __, callback) {
                taginfo.values({
                    debounce: true,
                    key: key.property('value'),
                    geometry: geometry,
                    query: value
                }, function(err, data) {
                    if (!err) callback(sort(value, data));
                });
            }));
    }

    function addTag() {
        var tags = rawTagEditor.tags();
        tags[''] = '';
        drawTags(tags);
        list.selectAll('li:last-child input.key').node().focus();
    }

    function removeTag(d) {
        var tags = rawTagEditor.tags();
        tags[d.key] = '';
        event.change(tags);
        delete tags[d.key];
        drawTags(tags);
    }

    rawTagEditor.tags = function(tags) {
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

    return d3.rebind(rawTagEditor, event, 'on');
};
