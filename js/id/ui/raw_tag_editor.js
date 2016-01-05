iD.ui.RawTagEditor = function(context) {
    var event = d3.dispatch('change'),
        showBlank = false,
        state,
        preset,
        tags,
        id;

    function rawTagEditor(selection) {
        var count = Object.keys(tags).filter(function(d) { return d; }).length;

        selection.call(iD.ui.Disclosure()
            .title(t('inspector.all_tags') + ' (' + count + ')')
            .expanded(context.storage('raw_tag_editor.expanded') === 'true' || preset.isFallback())
            .on('toggled', toggled)
            .content(content));

        function toggled(expanded) {
            context.storage('raw_tag_editor.expanded', expanded);
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

        $newTag.enter()
            .append('button')
            .attr('class', 'add-tag')
            .call(iD.svg.Icon('#icon-plus', 'light'));

        $newTag.on('click', addTag);

        var $items = $list.selectAll('li')
            .data(entries, function(d) { return d.key; });

        // Enter

        var $enter = $items.enter().append('li')
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
            .call(iD.svg.Icon('#operation-delete'));

        if (context.taginfo()) {
            $enter.each(bindTypeahead);
        }

        // Update

        $items.order();

        $items.each(function(tag) {
            var isRelation = (context.entity(id).type === 'relation'),
                reference;
            if (isRelation && tag.key === 'type')
                reference = iD.ui.TagReference({rtype: tag.value}, context);
            else
                reference = iD.ui.TagReference({key: tag.key, value: tag.value}, context);

            if (state === 'hover') {
                reference.showing(false);
            }

            d3.select(this)
                .call(reference.button)
                .call(reference.body);
        });

        $items.select('input.key')
            .value(function(d) { return d.key; })
            .on('blur', keyChange)
            .on('change', keyChange);

        $items.select('input.value')
            .value(function(d) { return d.value; })
            .on('blur', valueChange)
            .on('change', valueChange)
            .on('keydown.push-more', pushMore);

        $items.select('button.remove')
            .on('click', removeTag);

        $items.exit()
            .each(unbind)
            .remove();

        function pushMore() {
            if (d3.event.keyCode === 9 && !d3.event.shiftKey &&
                $list.selectAll('li:last-child input.value').node() === this) {
                addTag();
            }
        }

        function bindTypeahead() {
            var row = d3.select(this),
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
                .fetcher(function(value, callback) {
                    context.taginfo().keys({
                        debounce: true,
                        geometry: context.geometry(id),
                        query: value
                    }, function(err, data) {
                        if (!err) callback(sort(value, data));
                    });
                }));

            value.call(d3.combobox()
                .fetcher(function(value, callback) {
                    context.taginfo().values({
                        debounce: true,
                        key: key.value(),
                        geometry: context.geometry(id),
                        query: value
                    }, function(err, data) {
                        if (!err) callback(sort(value, data));
                    });
                }));
        }

        function unbind() {
            var row = d3.select(this);

            row.selectAll('input.key')
                .call(d3.combobox.off);

            row.selectAll('input.value')
                .call(d3.combobox.off);
        }

        function keyChange(d) {
            var kOld = d.key,
                kNew = this.value.trim(),
                tag = {};

            if (kNew && kNew !== kOld) {
                var match = kNew.match(/^(.*?)(?:_(\d+))?$/),
                    base = match[1],
                    suffix = +(match[2] || 1);
                while (tags[kNew]) {  // rename key if already in use
                    kNew = base + '_' + suffix++;
                }
            }
            tag[kOld] = undefined;
            tag[kNew] = d.value;
            d.key = kNew; // Maintain DOM identity through the subsequent update.
            this.value = kNew;
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
            d3.select(this.parentNode).remove();
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
