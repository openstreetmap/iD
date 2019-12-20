import { t } from '../util/locale';
import { utilSafeClassName } from '../util/util';

export function presetField(id, field) {
    field = Object.assign({}, field);   // shallow copy

    field.id = id;

    // for use in classes, element ids, css selectors
    field.safeid = utilSafeClassName(id);

    field.matchGeometry = function(geometry) {
        return !field.geometry || field.geometry === geometry;
    };


    field.t = function(scope, options) {
        return t('presets.fields.' + id + '.' + scope, options);
    };


    field.label = function() {
        return field.overrideLabel || field.t('label', {'default': id});
    };


    var placeholder = field.placeholder;
    field.placeholder = function() {
        return field.t('placeholder', {'default': placeholder});
    };


    field.originalTerms = (field.terms || []).join();

    field.terms = function() {
        return field.t('terms', { 'default': field.originalTerms }).toLowerCase().trim().split(/\s*,+\s*/);
    };


    return field;
}
