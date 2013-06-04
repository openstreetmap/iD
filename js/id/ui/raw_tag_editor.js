iD.ui.RawTagEditor = function(context) {
    var event = d3.dispatch('change'),
        taginfo = iD.taginfo(),
        showBlank = false,
        state,
        preset,
        tags,
        id;

    function rawTagEditor(selection) {
        var count = Object.keys(tags).filter(function(d) { return d; }).length;

        selection.call(iD.ui.Disclosure()
            .title(t('inspector.all_tags') + ' (' + count + ')')
            .expanded(iD.ui.RawTagEditor.expanded || preset.isFallback())
            .on('toggled', toggled)
            .content(content));

        function toggled(expanded) {
            iD.ui.RawTagEditor.expanded = expanded;
            if (expanded) {
                selection.node().parentNode.scrollTop += 200;
            }
        }
    }

    function content($wrap) {
        var entries = d3.entries(tags);

        if (!entries.length || showBlank) {
            showBlank = false;
            entries.push({key: '', value: ''});
        }

        var $list = $wrap.selectAll('.tag-list')
            .data([0]);

        $list.enter().append('ul')
            .attr('class', 'tag-list');

        var $newTag = $wrap.selectAll('.add-tag')
            .data([0]);

        var $enter = $newTag.enter().append('button')
            .attr('class', 'add-tag');

        $enter.append('span')
            .attr('class', 'icon plus light');

        $newTag.on('click', addTag);

        var $items = $list.selectAll('li')
            .data(entries, function(d) { return d.key; });

        // Enter

        $enter = $items.enter().append('li')
            .attr('class', 'tag-row cf');

        $enter.append('div')
            .attr('class', 'key-wrap')
            .append('input')
            .property('type', 'text')
            .attr('class', 'key')
            .attr('maxlength', 255);

        $enter.append('div')
            .attr('class', 'input-wrap-position')
            .append('input')
            .property('type', 'text')
            .attr('class', 'value')
            .attr('maxlength', 255);

        $enter.append('button')
            .attr('tabindex', -1)
            .attr('class', 'remove minor')
            .append('span')
            .attr('class', 'icon delete');

        // Update

        $items.order();

        $items.each(function(tag) {
            var reference = iD.ui.TagReference({key: tag.key});

            if (state === 'hover') {
                reference.showing(false);
            }

            d3.select(this)
                .each(bindTypeahead)
                .call(reference.button)
                .call(reference.body);
        });

        $items.select('input.key')
            .property('value', function(d) { return d.key; })
            .on('blur', keyChange)
            .on('change', keyChange);

        $items.select('input.value')
            .property('value', function(d) { return d.value; })
            .on('blur', valueChange)
            .on('change', valueChange)
            .on('keydown.push-more', pushMore);

        $items.select('button.remove')
            .on('click', removeTag);

        $items.exit()
            .remove();

        function pushMore() {
            if (d3.event.keyCode === 9 && !d3.event.shiftKey &&
                $list.selectAll('li:last-child input.value').node() === this) {
                addTag();
            }
        }

        function bindTypeahead() {
            var geometry = context.geometry(id),
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

        function keyChange(d) {
            var tag = {};
            tag[d.key] = undefined;
            tag[this.value] = d.value;
            d.key = this.value; // Maintain DOM identity through the subsequent update.
            event.change(tag);
        }

        function valueChange(d) {
            var tag = {};
            tag[d.key] = this.value;
            event.change(tag);
        }

        function removeTag(d) {
            var tag = {};
            tag[d.key] = undefined;
            event.change(tag);
        }

        function addTag() {
            // Wrapped in a setTimeout in case it's being called from a blur
            // handler. Without the setTimeout, the call to `content` would
            // wipe out the pending value change.
            setTimeout(function() {
                showBlank = true;
                content($wrap);
                $list.selectAll('li:last-child input.key').node().focus();
            }, 0);
        }
    }

    rawTagEditor.state = function(_) {
        if (!arguments.length) return state;
        state = _;
        return rawTagEditor;
    };

    rawTagEditor.preset = function(_) {
        if (!arguments.length) return preset;
        preset = _;
        return rawTagEditor;
    };

    rawTagEditor.tags = function(_) {
        if (!arguments.length) return tags;
        tags = _;
        return rawTagEditor;
    };

    rawTagEditor.entityID = function(_) {
        if (!arguments.length) return id;
        id = _;
        return rawTagEditor;
    };

    return d3.rebind(rawTagEditor, event, 'on');
};
