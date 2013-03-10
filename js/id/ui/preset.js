iD.ui.preset = function(context) {
    var event = d3.dispatch('change', 'setTags', 'close'),
        entity,
        type,
        hidden,
        sections,
        tags,
        keys,
        preset;

    // generate form fields for a given field.
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

        sections = selection.selectAll('div.preset-section')
            .data(preset.form)
            .enter()
            .append('div')
            .attr('class', 'preset-section inspector-inner col12');

        sections.each(function(d) {
            var s = d3.select(this);
            var wrap = s.append('div')
                .attr('class', 'preset-section-input');

           wrap.append('div')
                .attr('class', 'col3 preset-label')
                .append('label')
                .attr('for', 'input-' + d.key)
                .text(d.title || d.key);

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
        type = entity.type === 'node' ? entity.type : entity.geometry();
        return presets;
    };

    return d3.rebind(presets, event, 'on');
};
