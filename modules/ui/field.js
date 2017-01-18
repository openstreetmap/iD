import { uiFields } from './fields/index';

function UIField(field, entity, show, context) {
        field = _.clone(field);

        field.input = uiFields[field.type](field, context)
            .on('change', function(t, onInput) {
                dispatch.call('change', field, t, onInput);
            });

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