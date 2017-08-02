import * as d3 from 'd3';
import _ from 'lodash';
import { uiFields } from './fields';
import { utilRebind } from '../util';


export function uiField(context, dispatch, presetField, entity, show) {

    var field = _.clone(presetField),
        tags;


    field.render = uiFields[field.type](field, context)
        .on('change', function(t, onInput) {
            dispatch.call('change', field, t, onInput);
        });

    if (field.render.entity) {
        field.render.entity(entity);
    }

    field.keys = field.keys || [field.key];

    field.show = show;


    field.shown = function() {
        return field.show || _.some(field.keys, function(key) { return !!tags[key]; });
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


    field.tags = function(_) {
        if (!arguments.length) return tags;
        tags = _;
        return field;
    };


    return field;
}

