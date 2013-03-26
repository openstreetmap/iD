iD.ui.preset = function(context, entity, preset) {
    var original = context.graph().base().entities[entity.id],
        event = d3.dispatch('change', 'close'),
        fields = [],
        tags = {},
        formwrap,
        formbuttonwrap;

    function UIField(field, show) {
        field = _.clone(field);

        field.input = iD.ui.preset[field.type](field, context)
            .on('close', event.close)
            .on('change', event.change);

        if (field.type === 'address') {
            field.input.entity(entity);
        }

        field.keys = field.keys || [field.key];

        field.show = show;

        field.shown = function() {
            return field.id === 'name' || field.show || _.any(field.keys, function(key) { return !!tags[key]; });
        };

        field.modified = function() {
            return _.any(field.keys, function(key) {
                return original ? tags[key] !== original.tags[key] : tags[key];
            });
        };

        return field;
    }

    fields.push(UIField(context.presets().field('name')));

    var geometry = entity.geometry(context.graph());
    preset.fields.forEach(function(field) {
        if (field.matchGeometry(geometry)) {
            fields.push(UIField(field, true));
        }
    });

    context.presets().universal().forEach(function(field) {
        if (fields.indexOf(field) < 0) {
            fields.push(UIField(field));
        }
    });

    function fieldKey(field) {
        return field.id;
    }

    function shown() {
        return fields.filter(function(field) { return field.shown(); });
    }

    function notShown() {
        return fields.filter(function(field) { return !field.shown(); });
    }

    function show(field) {
        field.show = true;
        render();
        field.input.focus();
    }

    function revert(field) {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        var t = {};
        field.keys.forEach(function(key) {
            t[key] = original ? original.tags[key] : undefined;
        });
        event.change(t);
    }

    function toggleReference(field) {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        _.forEach(fields, function(other) {
            if (other.id === field.id) {
                other.showingReference = !other.showingReference;
            } else {
                other.showingReference = false;
            }
        });

        render();
    }

    function render() {
        var selection = formwrap.selectAll('.form-field')
            .data(shown(), fieldKey);

        var enter = selection.enter()
            .insert('div', '.more-buttons')
            .style('opacity', 0)
            .attr('class', function(field) {
                return 'form-field form-field-' + field.id + ' fillL col12';
            });

        enter.transition()
            .style('max-height', '0px')
            .style('padding-top', '0px')
            .style('opacity', '0')
            .transition()
            .duration(200)
            .style('padding-top', '20px')
            .style('max-height', '200px')
            .style('opacity', '1');

        var label = enter.append('label')
            .attr('class', 'form-label')
            .attr('for', function(field) { return 'preset-input-' + field.id; })
            .text(function(field) { return field.label(); });

        label.append('button')
            .attr('class', 'tag-reference-button fr')
            .attr('tabindex', -1)
            .on('click', toggleReference)
            .append('span')
            .attr('class', 'icon inspect');

        label.append('button')
            .attr('class', 'fr modified-icon')
            .attr('tabindex', -1)
            .on('click', revert)
            .append('div')
            .attr('class','icon undo');

        enter.each(function(field) {
            d3.select(this).call(field.input);
        });

        enter.append('div')
            .attr('class', 'tag-help');

        selection
            .classed('modified', function(field) {
                return field.modified();
            });

        selection.selectAll('.tag-help')
            .style('display', function(field) {
                return field.showingReference ? 'block' : 'block';
            })
            .each(function(field) {
                if (field.showingReference) {
                    d3.select(this)
                    .call(iD.ui.TagReference(entity, {key: field.key}))
                    .style('max-height', '0px')
                    .style('padding-top', '0px')
                    .style('opacity', '0')
                    .transition()
                    .duration(200)
                    .style('padding-top', '20px')
                    .style('max-height', '200px')
                    .style('opacity', '1');
               } else {
                 d3.select(this)
                    .call(iD.ui.TagReference(entity, {key: field.key}))
                    .transition()
                    .duration(200)
                    .style('max-height', '0px')
                    .style('padding-top', '0px')
                    .style('opacity', '0');
               }
            });

        selection.exit()
            .remove();

        var addFields = formbuttonwrap.selectAll('.preset-add-field')
            .data(notShown(), fieldKey);

        addFields.enter()
            .append('button')
            .attr('class', 'preset-add-field')
            .on('click', show)
            .call(bootstrap.tooltip()
                .placement('top')
                .title(function(d) { return d.label(); }))
            .append('span')
            .attr('class', function(d) { return 'icon ' + d.icon; });

        addFields.exit()
            .transition()
            .style('opacity', 0)
            .remove();

        return selection;
    }

    function presets(selection) {
        selection.html('');

        formwrap = selection;

        formbuttonwrap = selection.append('div')
            .attr('class', 'col12 more-buttons inspector-inner');

        render();
    }

    presets.rendered = function() {
        return _.flatten(shown().map(function(field) { return field.keys; }));
    };

    presets.preset = function(_) {
        if (!arguments.length) return preset;
        preset = _;
        return presets;
    };

    presets.change = function(_) {
        tags = _;

        fields.forEach(function(field) {
            if (field.shown()) {
                field.input.tags(_);
            }
        });

        render();

        return presets;
    };

    return d3.rebind(presets, event, 'on');
};
