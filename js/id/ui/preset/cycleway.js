iD.ui.preset.cycleway = function(field) {
    var event = d3.dispatch('change'),
        items;

    function cycleway(selection) {
        var wrap = selection.selectAll('.preset-input-wrap')
            .data([0]);

        wrap.enter().append('div')
            .attr('class', 'cf preset-input-wrap')
            .append('ul');

        items = wrap.select('ul').selectAll('li')
            .data(field.keys);

        // Enter

        var enter = items.enter().append('li')
            .attr('class', function(d) { return 'cf preset-cycleway-' + d; });

        enter.append('span')
            .attr('class', 'col6 label preset-label-cycleway')
            .attr('for', function(d) { return 'preset-input-cycleway-' + d; })
            .text(function(d) { return field.t('types.' + d); });

        enter.append('div')
            .attr('class', 'col6 preset-input-cycleway-wrap')
            .append('input')
            .attr('type', 'text')
            .attr('class', 'preset-input-cycleway')
            .attr('id', function(d) { return 'preset-input-cycleway-' + d; })
            .each(function(d) {
                d3.select(this)
                    .call(d3.combobox()
                        .data(cycleway.options(d)));
            });

        // Update

        wrap.selectAll('.preset-input-cycleway')
            .on('change', change)
            .on('blur', change);
    }

    function change(d) {
        var tag = {};
        tag[d] = d3.select(this).value() || undefined;
        if (tag[d] === 'none') {
            tag[d] = undefined;
        }
        event.change(tag);
    }

    cycleway.options = function() {
        var options = ['none', 'lane', 'shared_lane', 'track', 'share_busway', 'opposite_lane', 'opposite'];

        return options.map(function(option) {
            return {
                title: field.t('options.' + option + '.description'),
                value: option
            };
        });
    };

    cycleway.tags = function(tags) {
        items.selectAll('.preset-input-cycleway')
            .value(function(d) { return tags[d] || ''; })
            .attr('placeholder', function() {
                return tags.cycleway ? tags.cycleway : field.placeholder();
            });
    };

    cycleway.focus = function() {
        items.selectAll('.preset-input-cycleway')
            .node().focus();
    };

    return d3.rebind(cycleway, event, 'on');
};
