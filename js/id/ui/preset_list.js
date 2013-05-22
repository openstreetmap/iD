iD.ui.PresetList = function(context) {
    var event = d3.dispatch('choose'),
        id,
        preset,
        autofocus = false;

    function presetList(selection) {
        var geometry = context.geometry(id),
            presets = context.presets().matchGeometry(geometry);

        selection.html('');

        var messagewrap = selection.append('div')
            .attr('class', 'header fillL cf');

        var message = messagewrap.append('h3')
            .attr('class', 'inspector-inner')
            .text(t('inspector.choose'));

        if (preset) {
            messagewrap.append('button')
                .attr('class', 'preset-choose')
                .on('click', event.choose)
                .append('span')
                .attr('class', 'icon forward');
        } else {
            messagewrap.append('button')
                .attr('class', 'close')
                .on('click', function() {
                    context.enter(iD.modes.Browse(context));
                })
                .append('span')
                .attr('class', 'icon close');
        }

        function keydown() {
            // hack to let delete shortcut work when search is autofocused
            if (search.property('value').length === 0 &&
                (d3.event.keyCode === d3.keybinding.keyCodes['⌫'] ||
                 d3.event.keyCode === d3.keybinding.keyCodes['⌦'])) {
                d3.event.preventDefault();
                d3.event.stopPropagation();
                iD.operations.Delete([id], context)();
            } else if (search.property('value').length === 0 &&
                (d3.event.ctrlKey || d3.event.metaKey) &&
                d3.event.keyCode === d3.keybinding.keyCodes.z) {
                d3.event.preventDefault();
                d3.event.stopPropagation();
                context.undo();
            } else if (!d3.event.ctrlKey && !d3.event.metaKey) {
                d3.select(this).on('keydown', null);
            }
        }

        function keyup() {
            // enter
            var value = search.property('value');
            if (d3.event.keyCode === 13 && value.length) {
                list.selectAll('.preset-list-item:first-child').datum().choose();
            } else {
                list.classed('filtered', value.length);
                if (value.length) {
                    var results = presets.search(value, geometry);
                    message.text(t('inspector.results', {
                        n: results.collection.length,
                        search: value
                    }));
                    list.call(drawList, results);
                } else {
                    list.call(drawList, context.presets().defaults(geometry, 36));
                }
            }
        }

        var searchWrap = selection.append('div')
            .attr('class', 'preset-search');

        var search = selection.append('input')
            .attr('class', 'preset-search-input major')
            .attr('placeholder', t('inspector.search'))
            .attr('type', 'search')
            .on('keydown', keydown)
            .on('keyup', keyup);

        searchWrap.append('span')
            .attr('class', 'preset-search-icon icon search');

        if (autofocus) {
            search.node().focus();
        }

        var listWrap = selection.append('div')
            .attr('class', 'fillL2 inspector-body');

        var list = listWrap.append('div')
            .attr('class', 'preset-list fillL cf')
            .call(drawList, context.presets().defaults(geometry, 36));
    }

    function drawList(list, presets) {
        var collection = presets.collection.map(function(preset) {
            return preset.members ? CategoryItem(preset) : PresetItem(preset)
        });

        var items = list.selectAll('.preset-list-item')
            .data(collection, function(d) { return d.preset.id; });

        items.enter().append('div')
            .attr('class', function(item) { return 'preset-list-item preset-' + item.preset.id.replace('/', '-'); })
            .classed('current', function(item) { return item.preset === preset; })
            .each(function(item) {
                d3.select(this).call(item);
            })
            .style('opacity', 0)
            .transition()
            .style('opacity', 1);

        items.order();

        items.exit()
            .remove();
    }

    function CategoryItem(preset) {
        var box, sublist, shown = false;

        function item(selection) {
            var wrap = selection.append('div')
                .attr('class', 'preset-list-button-wrap category col12');

            wrap.append('button')
                .attr('class', 'preset-list-button')
                .call(iD.ui.PresetIcon()
                    .geometry(context.geometry(id))
                    .preset(preset))
                .on('click', item.choose)
                .append('div')
                .attr('class', 'label')
                .text(preset.name());

            box = selection.append('div')
                .attr('class', 'subgrid col12')
                .style('max-height', '0');

            box.append('div')
                .attr('class', 'arrow');

            sublist = box.append('div')
                .attr('class', 'preset-list fillL3 cf fl');
        }

        item.choose = function() {
            if (shown) {
                shown = false;
                box.transition()
                    .duration(200)
                    .style('opacity', '0')
                    .style('max-height', '0')
                    .style('padding-bottom', '0');
            } else {
                shown = true;
                sublist.call(drawList, preset.members);
                box.transition()
                    .duration(200)
                    .style('opacity', '1')
                    .style('max-height', 200 + preset.members.collection.length * 80 + 'px')
                    .style('padding-bottom', '20px');
            }
        };

        item.preset = preset;

        return item;
    }

    function PresetItem(preset) {
        function item(selection) {
            var wrap = selection.append('div')
                .attr('class', 'preset-list-button-wrap col12');

            wrap.append('button')
                .attr('class', 'preset-list-button')
                .call(iD.ui.PresetIcon()
                    .geometry(context.geometry(id))
                    .preset(preset))
                .on('click', item.choose)
                .append('div')
                .attr('class', 'label')
                .text(preset.name());

            wrap.call(item.reference.button);
            selection.call(item.reference.body);
        }

        item.choose = function() {
            context.presets().choose(preset);
            event.choose(preset);
        };

        item.help = function() {
            d3.event.stopPropagation();
            item.reference.toggle();
        };

        item.preset = preset;
        item.reference = iD.ui.TagReference(preset.reference());

        return item;
    }

    presetList.autofocus = function(_) {
        if (!arguments.length) return autofocus;
        autofocus = _;
        return presetList;
    };

    presetList.entityID = function(_) {
        if (!arguments.length) return id;
        id = _;
        return presetList;
    };

    presetList.preset = function(_) {
        if (!arguments.length) return preset;
        preset = _;
        return presetList;
    };

    return d3.rebind(presetList, event, 'on');
};
