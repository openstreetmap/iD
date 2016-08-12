import { rebind } from '../util/rebind';
import { getSetValue } from '../util/get_set_value';
import { d3combobox } from '../../js/lib/d3.combobox.js';
import * as d3 from 'd3';
import { t } from '../util/locale';
import _ from 'lodash';
import { Browse } from '../modes/index';
import { Disclosure } from './disclosure';
import { Icon } from '../svg/index';
import { TagReference } from './tag_reference';
import { fields } from './fields/index';

export function preset(context) {
    var event = d3.dispatch('change'),
        state,
        fieldsArr,
        preset,
        tags,
        id;

    function UIField(field, entity, show) {
        field = _.clone(field);

        field.input = fields[field.type](field, context)
            .on('change', event.change);

        if (field.input.entity) field.input.entity(entity);

        field.keys = field.keys || [field.key];

        field.show = show;

        field.shown = function() {
            return field.id === 'name' || field.show || _.some(field.keys, function(key) { return !!tags[key]; });
        };

        field.modified = function() {
            var original = context.graph().base().entities[entity.id];
            return _.some(field.keys, function(key) {
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
            return _.some(field.keys, function(key) {
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
        selection.call(Disclosure()
            .title(t('inspector.all_fields'))
            .expanded(context.storage('preset_fields.expanded') !== 'false')
            .on('toggled', toggled)
            .content(content));

        function toggled(expanded) {
            context.storage('preset_fields.expanded', expanded);
        }
    }

    function content(selection) {
        if (!fieldsArr) {
            var entity = context.entity(id),
                geometry = context.geometry(id);

            fieldsArr = [UIField(context.presets().field('name'), entity)];

            preset.fields.forEach(function(field) {
                if (field.matchGeometry(geometry)) {
                    fieldsArr.push(UIField(field, entity, true));
                }
            });

            if (entity.isHighwayIntersection(context.graph())) {
                fieldsArr.push(UIField(context.presets().field('restrictions'), entity, true));
            }

            context.presets().universal().forEach(function(field) {
                if (preset.fields.indexOf(field) < 0) {
                    fieldsArr.push(UIField(field, entity));
                }
            });
        }

        var shown = fieldsArr.filter(function(field) { return field.shown(); }),
            notShown = fieldsArr.filter(function(field) { return !field.shown(); });

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
            .attr('tabindex', -1)
            .call(Icon('#operation-delete'));

        wrap.append('button')
            .attr('class', 'modified-icon')
            .attr('tabindex', -1)
            .call(Icon('#icon-undo'));

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
                var reference = TagReference(field.reference || {key: field.key}, context);

                if (state === 'hover') {
                    reference.showing(false);
                }

                d3.select(this)
                    .call(field.input)
                    .selectAll('input')
                    .on('keydown', function() {
                        // if user presses enter, and combobox is not active, accept edits..
                        if (d3.event.keyCode === 13 && d3.select('.combobox').empty()) {
                            context.enter(Browse(context));
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

        getSetValue($input, '')
            .attr('placeholder', function() {
                var placeholder = [];
                for (var field in notShown) {
                    placeholder.push(notShown[field].title);
                }
                return placeholder.slice(0,3).join(', ') + ((placeholder.length > 3) ? '…' : '');
            })
            .call(d3combobox().data(notShown)
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
            event.call("change", field.revert());
        }

        function remove(field) {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            event.call("change", field.remove());
        }
    }

    presets.preset = function(_) {
        if (!arguments.length) return preset;
        if (preset && preset.id === _.id) return presets;
        preset = _;
        fieldsArr = null;
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
        // Don't reset fieldsArr here.
        return presets;
    };

    presets.entityID = function(_) {
        if (!arguments.length) return id;
        if (id === _) return presets;
        id = _;
        fieldsArr = null;
        return presets;
    };

    return rebind(presets, event, 'on');
}
