iD.ui.Taglist = function(context, entity) {
    var event = d3.dispatch('change'),
        taginfo = iD.taginfo(),
        collapsebutton,
        list;

    function taglist(selection, other) {

        collapsebutton = selection.append('a')
            .attr('href','#')
            .attr('class','hide-toggle')
            .text(t('inspector.additional'))
            .on('click', function() {
                iD.ui.Taglist.expanded = wrap.classed('hide');
                collapsebutton.classed('expanded', iD.ui.Taglist.expanded);
                wrap.call(iD.ui.Toggle(iD.ui.Taglist.expanded));
                selection.node().parentNode.scrollTop += 200;
            })
            .classed('expanded', iD.ui.Taglist.expanded || other);

        var wrap = selection.append('div')
            .classed('hide', !iD.ui.Taglist.expanded && !other);

        list = wrap.append('ul')
            .attr('class', 'tag-list');

        var newTag = wrap.append('button')
            .attr('class', 'add-tag col6')
            .on('click', addTag);

        newTag.append('span')
            .attr('class', 'icon plus');

        newTag.append('span')
            .attr('class', 'label')
            .text(t('inspector.new_tag'));
    }

    function drawTags(tags) {
        collapsebutton.text(t('inspector.additional') + ' (' + Object.keys(tags).length + ')');

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

        row.append('div')
            .attr('class', 'key-wrap col6')
            .append('input')
            .property('type', 'text')
            .attr('class', 'key')
            .attr('maxlength', 255)
            .property('value', function(d) { return d.key; })
            .on('blur', function(d) {
                d.key = this.value;
                event.change(taglist.tags());
            });

        row.append('div')
            .attr('class', 'input-wrap-position col6')
            .append('input')
            .property('type', 'text')
            .attr('class', 'value')
            .attr('maxlength', 255)
            .property('value', function(d) { return d.value; })
            .on('blur', function(d) {
                d.value = this.value;
                event.change(taglist.tags());
            })
            .on('keydown.push-more', pushMore);

        row.each(bindTypeahead);

        row.append('button')
            .attr('tabindex', -1)
            .attr('class','remove minor')
            .on('click', removeTag)
            .append('span')
            .attr('class', 'icon delete');

        row.append('button')
            .attr('tabindex', -1)
            .attr('class', 'tag-help minor')
            .on('click', function(tag) {
                row.selectAll('div.tag-help')
                    .style('display', 'none');

                d3.select(d3.select(this).node().parentNode)
                    .select('div.tag-help')
                    .style('display', 'block')
                    .call(iD.ui.TagReference(entity, {key: tag.key}));
            })
            .append('span')
            .attr('class', 'icon inspect light');

        row.append('div')
            .attr('class', 'tag-help');

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
        var tags = taglist.tags();
        tags[''] = '';
        drawTags(tags);
        list.selectAll('li:last-child input.key').node().focus();
    }

    function removeTag(d) {
        var tags = taglist.tags();
        tags[d.key] = '';
        event.change(tags);
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

    return d3.rebind(taglist, event, 'on');
};
