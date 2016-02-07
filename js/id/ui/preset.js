iD.ui.preset = function(context) {
    var event = d3.dispatch('change'),
        state,
        fields,
        preset,
        tags,
        id;

    function UIField(field, entity, show) {
        field = _.clone(field);

        field.input = iD.ui.preset[field.type](field, context)
            .on('change', event.change);

        if (field.input.entity) field.input.entity(entity);

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

        field.present = function() {
            return _.any(field.keys, function(key) {
                return tags[key];
            });
        };

        field.remove = function() {
            var t = {};
            field.keys.forEach(function(key) {
                t[key] = undefined;
            });
            return t;
        };

        return field;
    }

    function fieldKey(field) {
        return field.id;
    }

    function presets(selection) {
        selection.call(iD.ui.Disclosure()
            .title(t('inspector.all_fields'))
            .expanded(context.storage('preset_fields.expanded') !== 'false')
            .on('toggled', toggled)
            .content(content));

        function toggled(expanded) {
            context.storage('preset_fields.expanded', expanded);
        }
    }

    function content(selection) {
        if (!fields) {
            var entity = context.entity(id),
                geometry = context.geometry(id);

            fields = [UIField(context.presets().field('name'), entity)];

            preset.fields.forEach(function(field) {
                if (field.matchGeometry(geometry)) {
                    fields.push(UIField(field, entity, true));
                }
            });

            if (entity.isHighwayIntersection(context.graph())) {
                fields.push(UIField(context.presets().field('restrictions'), entity, true));
            }

            context.presets().universal().forEach(function(field) {
                if (preset.fields.indexOf(field) < 0) {
                    fields.push(UIField(field, entity));
                }
            });
        }

        var shown = fields.filter(function(field) { return field.shown(); }),
            notShown = fields.filter(function(field) { return !field.shown(); });

        var $form = selection.selectAll('.preset-form')
            .data([0]);

        $form.enter().append('div')
            .attr('class', 'preset-form inspector-inner fillL3');

        var $fields = $form.selectAll('.form-field')
            .data(shown, fieldKey);

        // Enter

        var $enter = $fields.enter()
            .append('div')
            .attr('class', function(field) {
                return 'form-field form-field-' + field.id;
            });

        var $label = $enter.append('label')
            .attr('class', 'form-label')
            .attr('for', function(field) { return 'preset-input-' + field.id; })
            .text(function(field) { return field.label(); });

        var wrap = $label.append('div')
            .attr('class', 'form-label-button-wrap');

        wrap.append('button')
            .attr('class', 'remove-icon')
            .call(iD.svg.Icon('#operation-delete'));

        wrap.append('button')
            .attr('class', 'modified-icon')
            .attr('tabindex', -1)
            .call(iD.svg.Icon('#icon-undo'));

        // Update

        $fields.select('.form-label-button-wrap .remove-icon')
            .on('click', remove);

        $fields.select('.modified-icon')
            .on('click', revert);

        $fields
            .order()
            .classed('modified', function(field) {
                return field.modified();
            })
            .classed('present', function(field) {
                return field.present();
            })
            .each(function(field) {
                var reference = iD.ui.TagReference(field.reference || {key: field.key}, context);

                if (state === 'hover') {
                    reference.showing(false);
                }

                d3.select(this)
                    .call(field.input)
                    .selectAll('input')
                    .on('keydown', function() {
                        if (d3.event.keyCode === 13) {  // enter
                            context.enter(iD.modes.Browse(context));
                        }
                    })
                    .call(reference.body)
                    .select('.form-label-button-wrap')
                    .call(reference.button);

                field.input.tags(tags);
            });

        $fields.exit()
            .remove();

        notShown = notShown.map(function(field) {
            return {
                title: field.label(),
                value: field.label(),
                field: field
            };
        });

        var $more = selection.selectAll('.more-fields')
            .data((notShown.length > 0) ? [0] : []);

        $more.enter().append('div')
            .attr('class', 'more-fields')
            .append('label')
                .text(t('inspector.add_fields'));

        var $input = $more.selectAll('.value')
            .data([0]);

        $input.enter().append('input')
            .attr('class', 'value')
            .attr('type', 'text');

        $input.value('')
            .attr('placeholder', function() {
                var placeholder = [];
                for (var field in notShown) {
                    placeholder.push(notShown[field].title);
                }
                return placeholder.slice(0,3).join(', ') + ((placeholder.length > 3) ? '…' : '');
            })
            .call(d3.combobox().data(notShown)
                .minItems(1)
                .on('accept', show));

        $more.exit()
            .remove();

        $input.exit()
            .remove();

        function show(field) {
            field = field.field;
            field.show = true;
            content(selection);
            field.input.focus();
        }

        function revert(field) {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            event.change(field.revert());
        }

        function remove(field) {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            event.change(field.remove());
        }
    }

    presets.preset = function(_) {
        if (!arguments.length) return preset;
        if (preset && preset.id === _.id) return presets;
        preset = _;
        fields = null;
        return presets;
    };

    presets.state = function(_) {
        if (!arguments.length) return state;
        state = _;
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
        if (id === _) return presets;
        id = _;
        fields = null;
        return presets;
    };

    return d3.rebind(presets, event, 'on');
};
