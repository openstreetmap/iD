iD.ui.PresetGrid = function(context, entity) {
    var event = d3.dispatch('choose', 'close'),
        default_limit = 9,
        currently_drawn = 9,
        presets,
        taginfo = iD.taginfo();

    function presetgrid(selection, preset) {

        selection.html('');

        presets = context.presets().matchGeometry(entity, context.graph());

        var messagewrap = selection.append('div')
            .attr('class', 'message inspector-inner fillL');

        var message = messagewrap.append('h3')
            .text(t('inspector.choose'));

        var gridwrap = selection.append('div')
            .attr('class', 'fillL inspector-body inspector-body-' + entity.geometry(context.graph()));

        var grid = gridwrap.append('div')
            .attr('class', 'preset-grid fillL cf')
            .data([context.presets().defaults(entity, 36).collection]);

        var show_more = gridwrap.append('button')
            .attr('class', 'fillL show-more')
            .text(t('inspector.show_more'))
            .on('click', function() {
                grid.call(drawGrid, (currently_drawn += default_limit));
            });

        grid.call(drawGrid, default_limit);

        var searchwrap = selection.append('div')
            .attr('class', 'preset-grid-search-wrap inspector-inner');

        function keydown() {
            // hack to let delete shortcut work when search is autofocused
            if (search.property('value').length === 0 &&
                (d3.event.keyCode === d3.keybinding.keyCodes['⌫'] ||
                 d3.event.keyCode === d3.keybinding.keyCodes['⌦'])) {
                d3.event.preventDefault();
                d3.event.stopPropagation();
                iD.operations.Delete([entity.id], context)();
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
                choose(grid.selectAll('.grid-entry:first-child').datum());
            } else {
                currently_drawn = default_limit;
                grid.classed('filtered', value.length);
                if (value.length) {
                    var results = presets.search(value);
                    message.text(t('inspector.results', {
                        n: results.collection.length,
                        search: value
                    }));
                    grid.data([results.collection])
                        .call(drawGrid, default_limit);
                } else {
                    grid.data([context.presets().defaults(entity, 36).collection])
                        .call(drawGrid, default_limit);
                }
            }
        }

        var search = searchwrap.append('input')
            .attr('class', 'preset-grid-search major')
            .attr('placeholder','Search')
            .attr('type', 'search')
            .on('keydown', keydown)
            .on('keyup', keyup);

        searchwrap.append('span')
            .attr('class', 'icon search');

        search.node().focus();

        if (preset) {
            selection.append('div')
                .attr('class', 'inspector-actions pad1 fillD col12')
                .call(drawButtons);
        }

        function choose(d) {
            // Category
            if (d.members) {
                search.property('value', '');
                presets = d.members.collection;
                currently_drawn = presets.length;
                grid.data([presets]).call(drawGrid, currently_drawn);

            // Preset
            } else {
                context.presets().choose(d);
                event.choose(d);
            }
        }

        function name(d) { return d.name(); }

        function presetClass(d) {
            var s = 'preset-icon-fill ' + entity.geometry(context.graph());
            if (d.members) {
                s += 'category';
            } else {
                for (var i in d.tags) {
                    s += ' tag-' + i + ' tag-' + i + '-' + d.tags[i];
                }
            }
            return s;
        }

        var presetinspect;

        function drawGrid(selection, limit) {

            function helpClick(d) {
                // Display description box inline
                d3.event.stopPropagation();

                var entry = this.parentNode,
                    index,
                    entries = selection.selectAll('button.grid-entry');

                if (presetinspect && presetinspect.remove().datum() === d) {
                    presetinspect = null;
                    return;
                }

                entries.each(function(d, i) {
                    if (this === entry) index = i;
                });

                var selector = '.grid-button-wrap:nth-child(' + (Math.floor(index/3) * 3 + 4 ) + ')';

                presetinspect = selection.insert('div', selector)
                    .attr('class', 'preset-inspect col12')
                    .datum(d);

                presetinspect.append('h2').text(d.name());

                var description = presetinspect.append('p');
                var link = presetinspect.append('a');

                var params = {},
                    locale = iD.detect().locale.split('-')[0] || 'en';

                params.key = Object.keys(d.tags)[0];
                if (d.tags[params.key] !== '*') {
                    params.value = d.tags[params.key];
                }

                taginfo.docs(params, function(err, data) {
                    if (err) return description.text(t('inspector.no_documentation_combination'));
                    var doc = _.find(data, function(d) { return d.lang === locale; }) ||
                        _.find(data, function(d) { return d.lang === 'en'; });
                    if (doc) {
                        description.text(doc.description);
                        link
                            .attr('href', 'http://wiki.openstreetmap.org/wiki/' +
                                  encodeURIComponent(doc.title))
                            .text(t('inspector.reference'));
                    }
                });
            }

            show_more
                .style('display', (selection.data()[0].length > limit) ? 'block' : 'none');

            var entries = selection
                .selectAll('div.grid-entry-wrap')
                .data(function(d) { return d.slice(0, limit); }, name);

            entries.exit().remove();

            var entered = entries.enter()
                .append('div')
                .attr('class','grid-button-wrap col4 grid-entry-wrap')
                    .append('button')
                    .attr('class', 'grid-entry')
                    .on('click', choose);

            entered.style('opacity', 0)
                    .transition()
                    .style('opacity', 1);

            entered.append('div')
                .attr('class', presetClass);

            entered.append('div')
                .attr('class', function(d) {
                    return 'feature-' + (d.icon || 'marker-stroked') + ' icon';
                });

            entered.append('span')
                .attr('class','label')
                .text(name);

            entered.append('button')
                .attr('tabindex', -1)
                .attr('class', 'preset-help')
                .on('click', helpClick, selection)
                .append('span')
                    .attr('class', 'icon inspect');

            entries.order();
        }
    }

    function cancel() {
        event.choose();
    }

    function drawButtons(selection) {

        var inspectorButton = selection.append('button')
            .attr('class', 'apply action')
            .on('click', cancel);

        inspectorButton.append('span')
            .attr('class','label')
            .text(t('commit.cancel'));
    }

    return d3.rebind(presetgrid, event, 'on');
};
