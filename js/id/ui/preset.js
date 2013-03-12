iD.ui.preset = function(context) {
    var event = d3.dispatch('change', 'setTags', 'close'),
        entity,
        tags,
        keys,
        preset;

    function input(d) {
        var i = iD.ui.preset[d.type](d, context)
            .on('close', event.close)
            .on('change', event.change);

        event.on('setTags.' + d.key || d.type, function(tags) {
            i.tags(_.clone(tags));
        });

        if (d.type === 'address') i.entity(entity);

        keys = keys.concat(d.key ? [d.key] : d.keys);

        this.call(i);
    }

    function presets(selection) {

        selection.html('');
        keys = [];

        var sections = selection.selectAll('div.preset-section')
            .data(preset.form)
            .enter()
            .append('div')
            .attr('class', 'preset-section fillL inspector-inner col12');

        sections.each(function(d) {
            var s = d3.select(this);
            var wrap = s.append('div')
                .attr('class', 'preset-section-input');

           wrap.append('div')
                .attr('class', 'col3 preset-label')
                .append('h4')
                .attr('for', 'input-' + d.key)
                .text(function(d) { return d.label(); });

            input.call(wrap.append('div')
                .attr('class', 'col9 preset-input'), d);
        });
        if (tags) event.setTags(tags);
    }

    presets.rendered = function() {
        return keys;
    };

    presets.preset = function(_) {
        if (!arguments.length) return preset;
        preset = _;
        return presets;
    };

    presets.change = function(_) {
        tags = _;
        event.setTags(_);
        return presets;
    };

    presets.entity = function(_) {
        if (!arguments.length) return entity;
        entity = _;
        return presets;
    };

    return d3.rebind(presets, event, 'on');
};
