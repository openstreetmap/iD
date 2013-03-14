iD.ui.PresetGrid = function(context) {
    var event = d3.dispatch('choose', 'close'),
        entity,
        presets = context.presets(),
        taginfo = iD.taginfo();

    function presetgrid(selection, preset) {

        selection.html('');

        presets = presets.matchGeometry(entity, context.graph());

        var messagewrap = selection.append('div')
            .attr('class', 'message inspector-inner fillL');

        var message = messagewrap.append('h3')
            .text(t('inspector.choose'));

        var searchwrap = selection.append('div')
            .attr('class', 'preset-grid-search-wrap inspector-inner');

        var grid = selection.append('div')
            .attr('class', 'preset-grid inspector-body fillL2 inspector-body-' + entity.geometry(context.graph()))
            .call(drawGrid, context.presets().defaults(entity, 12));

        searchwrap.append('span').attr('class', 'icon search');

        var search = searchwrap.append('input')
            .attr('class', 'preset-grid-search major')
            .attr('placeholder','Search')
            .attr('type', 'search')
            .on('keydown', function() {
                // hack to let delete shortcut work when search is autofocused
                if (search.property('value').length === 0 &&
                    (d3.event.keyCode === d3.keybinding.keyCodes['⌫'] ||
                     d3.event.keyCode === d3.keybinding.keyCodes['⌦'])) {
                    d3.event.preventDefault();
                    d3.event.stopPropagation();
                    iD.operations.Delete([entity.id], context)();
                } else if (search.property('value').length === 0 &&
                    (d3.event.ctrlKey || d3.event.metaKey) &&
                    d3.event.keyCode === d3.keybinding.keyCodes['z']) {
                    d3.event.preventDefault();
                    d3.event.stopPropagation();
                    context.undo();
                } else if (!d3.event.ctrlKey && !d3.event.metaKey) {
                    d3.select(this).on('keydown', null);
                }
            })
            .on('keyup', function() {
                // enter
                var value = search.property('value');
                if (d3.event.keyCode === 13 && value.length) {
                    choose(grid.selectAll('.grid-entry:first-child').datum());
                } else {
                    grid.classed('filtered', value.length);
                    if (value.length) {
                        var results = presets.search(value);
                        message.text(t('inspector.results', {n: results.collection.length, search: value}));
                        grid.call(drawGrid, results);
                    } else {
                        grid.call(drawGrid, context.presets().defaults(entity, 12));
                    }
                }
            });
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
                presets = d.members;
                drawGrid(grid, presets);

            // Preset
            } else {
                context.presets().choose(d);
                event.choose(d);
            }
        }

        function name(d) { return d.name; }

        function drawGrid(selection, presets) {

            var entries = selection.html('')
                .selectAll('button.grid-entry')
                .data(presets.collection.slice(0, 12), name);

            var entered = entries.enter()
                .append('button')
                .attr('class', 'grid-entry col3')
                .on('click', choose);

            entered.append('div')
                .attr('class', function(d) {
                    var s = 'preset-icon-fill ' + entity.geometry(context.graph());
                    if (d.members) {
                        s += 'category';
                    } else {
                        for (var i in d.tags) {
                            s += ' tag-' + i + ' tag-' + i + '-' + d.tags[i];
                        }
                    }
                    return s;
                });

            entered.append('div')
                .attr('class', function(d) { return 'preset-' + (d.icon || 'marker-stroked') + ' icon'; });

            var presetinspect;

            entered.append('span').attr('class','label').text(name);

            entered.append('button')
                .attr('tabindex', -1)
                .attr('class', 'preset-help')
                .on('click', function(d) {

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

                    var selector = '.grid-entry:nth-child(' + (Math.floor(index/4) * 4 + 5 ) + ')';

                    presetinspect = selection.insert('div', selector)
                        .attr('class', 'inspector-inner preset-inspect col12')
                        .datum(d);

                    presetinspect.append('h2').text(d.title || d.name);

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
                        description.text(doc.description);
                        link.attr('href', 'http://wiki.openstreetmap.org/wiki/' + encodeURIComponent(doc.title));
                        link.text(t('inspector.reference'));
                    });
                })
                .append('span')
                    .attr('class', 'icon inspect');

            entries.exit().remove();
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

    presetgrid.entity = function(_) {
        if (!arguments.length) return entity;
        entity = _;
        return presetgrid;
    };

    return d3.rebind(presetgrid, event, 'on');
};
