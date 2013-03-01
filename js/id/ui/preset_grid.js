iD.ui.PresetGrid = function(context) {
    var event = d3.dispatch('choose'),
        entity,
        presets = context.presets(),
        taginfo = iD.taginfo();

    function presetgrid(selection, preset) {

        selection.html('');

        presets = presets.matchType(entity, context.graph());

        var messagewrap = selection.append('div')
            .attr('class', 'message inspector-inner fillL');

        var message = messagewrap.append('h3')
            .text(t('inspector.choose'));

        var searchwrap = selection.append('div')
            .attr('class', 'preset-grid-search-wrap inspector-inner');

        var grid = selection.append('div')
            .attr('class', 'preset-grid fillD inspector-body ' + entity.geometry(context.graph()))
            .call(drawGrid, context.presets().defaults(entity));

        var search = searchwrap.append('input')
            .attr('class', 'preset-grid-search')
            .attr('type', 'search')
            .on('keyup', function() {
                // enter
                if (d3.event.keyCode === 13) {
                    choose(grid.selectAll('.grid-entry:first-child').datum());
                } else {
                    var value = search.property('value');
                    if (value.length) {
                        var results = presets.search(value);
                        message.text(t('inspector.results', {n: results.length, search: value}));
                        grid.call(drawGrid, results);
                        grid.classed('filtered', value.length);
                    } else {
                        grid.call(drawGrid, context.presets().defaults(entity));
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
                drawGrid(selection, presets);

            // Preset
            } else {
                event.choose(d);
            }
        }

        function name(d) { return d.name; }

        function drawGrid(selection, presets) {

            var entries = selection
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
                        for (var i in d.match.tags) {
                            s += ' tag-' + i + ' tag-' + i + '-' + d.match.tags[i];
                        }
                    }
                    return s;
                });

            entered.append('div')
                .attr('class', function(d) { return 'preset-' + d.icon + ' icon'; });

            var presetinspect;

            entered.append('span').attr('class','label').text(name);

            entered.append('div')
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
                        .attr('class', 'preset-inspect col12')
                        .datum(d);

                    presetinspect.append('h2').text(d.title || d.name);

                    var description = presetinspect.append('p');
                    var link = presetinspect.append('a');

                    var params = {},
                        locale = iD.detect().locale.split('-')[0] || 'en';

                    params.key = Object.keys(d.match.tags)[0];
                    if (d.match.tags[params.key] !== '*') {
                        params.value = d.match.tags[params.key];
                    }

                    taginfo.docs(params, function(err, data) {
                        var doc = _.find(data, function(d) { return d.lang === locale; }) ||
                            _.find(data, function(d) { return d.lang === 'en'; });
                        description.text(doc.description);
                        link.attr('href', 'http://wiki.openstreetmap.org/wiki/' + encodeURIComponent(doc.title));
                        link.text(doc.title);
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
