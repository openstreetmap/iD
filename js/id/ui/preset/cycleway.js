iD.ui.preset.cycleway = function(field) {
    var dispatch = d3.dispatch('change'),
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

    function change() {
        var inputs = d3.selectAll('.preset-input-cycleway')[0],
            left = d3.select(inputs[0]).value(),
            right = d3.select(inputs[1]).value(),
            tag = {};
        if (left === 'none' || left === '') { left = undefined; }
        if (right === 'none' || right === '') { right = undefined; }

        // Always set both left and right as changing one can affect the other
        tag = {
            cycleway: undefined,
            'cycleway:left': left,
            'cycleway:right': right
        };

        // If the left and right tags match, use the cycleway tag to tag both
        // sides the same way
        if (left === right) {
            tag = {
                cycleway: left,
                'cycleway:left': undefined,
                'cycleway:right': undefined
            };
        }

        dispatch.change(tag);
    }

    cycleway.options = function() {
        return d3.keys(field.strings.options).map(function(option) {
            return {
                title: field.t('options.' + option + '.description'),
                value: option
            };
        });
    };

    cycleway.tags = function(tags) {
        items.selectAll('.preset-input-cycleway')
            .value(function(d) {
                // If cycleway is set, always return that
                if (tags.cycleway) {
                    return tags.cycleway;
                }
                return tags[d] || '';
            })
            .attr('placeholder', field.placeholder());
    };

    cycleway.focus = function() {
        items.selectAll('.preset-input-cycleway')
            .node().focus();
    };

    return d3.rebind(cycleway, dispatch, 'on');
};
