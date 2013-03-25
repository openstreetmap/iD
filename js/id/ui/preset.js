iD.ui.preset = function(context, entity) {
    var event = d3.dispatch('change', 'setTags', 'close'),
        tags,
        keys,
        preset,
        formwrap,
        formbuttonwrap;

    function presets(selection) {
        selection.html('');

        keys = [];
        formwrap = selection.append('div');

        var geometry = entity.geometry(context.graph()),
            fields = preset.fields.filter(function(f) {
                return f.matchGeometry(geometry);
            });

        fields.unshift(context.presets().field('name'));

        draw(formwrap, fields);

        var wrap = selection.append('div')
            .attr('class', 'col12 more-buttons inspector-inner');

        formbuttonwrap = wrap.append('div')
            .attr('class', 'col12 preset-input');

        formbuttonwrap.selectAll('button')
            .data(context.presets().universal().filter(notInForm))
            .enter()
            .append('button')
            .attr('class', 'preset-add-field')
            .on('click', addForm)
            .call(bootstrap.tooltip()
                .placement('top')
                .title(function(d) { return d.label(); }))
            .append('span')
            .attr('class', function(d) { return 'icon ' + d.icon; });

        function notInForm(p) {
            return preset.fields.indexOf(p) < 0;
        }

        function addForm(d) {
            var field = draw(formwrap, [d]);

            var input = field.selectAll('input, textarea').node();
            if (input) input.focus();

            d3.select(this)
                .style('opacity', 1)
                .transition()
                .style('opacity', 0)
                .remove();

            if (!wrap.selectAll('button').node()) {
                wrap.remove();
            }
        }
    }

    function draw(selection, fields) {
        var sections = selection.selectAll('div.preset-field')
            .data(fields, function(field) { return field.id; })
            .enter()
            .append('div')
            .style('opacity', 0)
            .attr('class', function(field) {
                return 'preset-field preset-field-' + field.id + ' fillL inspector-inner col12';
            });

        var label = sections.append('label')
            .attr('class', 'form-label')
            .attr('for', function(field) { return 'preset-input-' + field.id; })
            .text(function(field) { return field.label(); });

        label.append('button')
            .attr('class', 'fr icon undo modified-icon')
            .on('click', function(field) {
                var original = context.graph().base().entities[entity.id];
                var t = {};
                (field.keys || [field.key]).forEach(function(key) {
                    t[key] = original ? original.tags[key] : undefined;
                });
                event.change(t);
            });

        label.append('button')
            .attr('class', 'fr icon inspect')
            .on('click', function(field) {
                selection.selectAll('div.tag-help')
                    .style('display', 'none');

                d3.select(d3.select(this).node().parentNode.parentNode)
                    .select('div.tag-help')
                    .style('display', 'block')
                    .call(iD.ui.TagReference(entity, {key: field.key}));
            });

        sections.transition()
            .style('opacity', 1);

        sections.each(function(field) {
            var i = iD.ui.preset[field.type](field, context)
                .on('close', event.close)
                .on('change', event.change);

            event.on('setTags.' + field.id, function(tags) {
                i.tags(_.clone(tags));
            });

            if (field.type === 'address') i.entity(entity);

            keys = keys.concat(field.key ? [field.key] : field.keys);

            d3.select(this).call(i);
        });

        sections.append('div')
            .attr('class', 'tag-help');

        return sections;
    }

    presets.rendered = function() {
        return keys;
    };

    presets.preset = function(_) {
        if (!arguments.length) return preset;
        preset = _;
        return presets;
    };

    presets.change = function(t) {
        tags = t;

        function haveKey(k) { return k && !!tags[k]; }

        formbuttonwrap.selectAll('button').each(function(p) {
            if (haveKey(p.key) || _.any(p.keys, haveKey)) {
                draw(formwrap, [p]);
                d3.select(this).remove();
            }
        });

        formwrap.selectAll('div.preset-field')
            .classed('modified', function(d) {
                var original = context.graph().base().entities[entity.id];
                return _.any(d.keys || [d.key], function(key) {
                    return original ? tags[key] !== original.tags[key] : tags[key];
                });
            });

        event.setTags(tags);
        return presets;
    };

    return d3.rebind(presets, event, 'on');
};
