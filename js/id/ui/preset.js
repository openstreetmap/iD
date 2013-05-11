iD.ui.preset = function(context) {
    var event = d3.dispatch('change'),
        fields,
        preset,
        tags,
        id;

    function UIField(field, entity, show) {
        field = _.clone(field);

        field.input = iD.ui.preset[field.type](field, context)
            .on('change', event.change);

        field.reference = iD.ui.TagReference({key: field.key});

        if (field.type === 'address' ||
            field.type === 'wikipedia' ||
            field.type === 'maxspeed') {
            field.input.entity(entity);
        }

        field.keys = field.keys || [field.key];

        field.show = show;

        field.shown = function() {
            return field.id === 'name' || field.show || _.any(field.keys, function(key) { return !!tags[key]; });
        };

        field.modified = function() {
            var original = context.graph().base().entities[entity.id];
            return _.any(field.keys, function(key) {
                return original ? tags[key] !== original.tags[key] : tags[key];
            });
        };

        field.revert = function() {
            var original = context.graph().base().entities[entity.id],
                t = {};
            field.keys.forEach(function(key) {
                t[key] = original ? original.tags[key] : undefined;
            });
            return t;
        };

        return field;
    }

    function fieldKey(field) {
        return field.id;
    }

    function presets(selection) {
        if (!fields) {
            var entity = context.entity(id),
                geometry = context.geometry(id);

            fields = [UIField(context.presets().field('name'), entity)];

            preset.fields.forEach(function(field) {
                if (field.matchGeometry(geometry)) {
                    fields.push(UIField(field, entity, true));
                }
            });

            context.presets().universal().forEach(function(field) {
                if (preset.fields.indexOf(field) < 0) {
                    fields.push(UIField(field, entity));
                }
            });
        }

        var shown = fields.filter(function(field) { return field.shown(); }),
            notShown = fields.filter(function(field) { return !field.shown(); });

        var $fields = selection.selectAll('.form-field')
            .data(shown, fieldKey);

        // Enter

        var $enter = $fields.enter()
            .insert('div', '.more-buttons')
            .attr('class', function(field) {
                return 'form-field form-field-' + field.id + ' col12';
            });

        var $label = $enter.append('label')
            .attr('class', 'form-label')
            .attr('for', function(field) { return 'preset-input-' + field.id; })
            .text(function(field) { return field.label(); });

        $label.append('button')
            .attr('class', 'modified-icon minor')
            .attr('tabindex', -1)
            .append('div')
            .attr('class', 'icon undo');

        // Update

        $fields.select('.modified-icon')
            .on('click', revert);

        $fields.select('.form-label')
            .each(function(field) {
                d3.select(this)
                    .call(field.reference.button);
            });

        $fields
            .classed('modified', function(field) {
                return field.modified();
            })
            .each(function(field) {
                d3.select(this)
                    .call(field.input)
                    .call(field.reference.body);

                field.input.tags(tags);
            });

        $fields.exit()
            .remove();

        var $more = selection.selectAll('.more-buttons')
            .data([0]);

        $more.enter().append('div')
            .attr('class', 'more-buttons inspector-inner col12');

        var $buttons = $more.selectAll('.preset-add-field')
            .data(notShown, fieldKey);

        $buttons.enter()
            .append('button')
            .attr('class', 'preset-add-field')
            .call(bootstrap.tooltip()
                .placement('top')
                .title(function(d) { return d.label(); }))
            .append('span')
            .attr('class', function(d) { return 'icon ' + d.icon; });

        $buttons.on('click', show);

        $buttons.exit()
            .transition()
            .style('opacity', 0)
            .remove();

        function show(field) {
            field.show = true;
            presets(selection);
            field.input.focus();
        }

        function revert(field) {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            event.change(field.revert());
        }
    }

    presets.preset = function(_) {
        if (!arguments.length) return preset;
        preset = _;
        fields = null;
        return presets;
    };

    presets.tags = function(_) {
        if (!arguments.length) return tags;
        tags = _;
        // Don't reset fields here.
        return presets;
    };

    presets.entityID = function(_) {
        if (!arguments.length) return id;
        id = _;
        fields = null;
        return presets;
    };

    return d3.rebind(presets, event, 'on');
};
