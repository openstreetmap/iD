import _clone from 'lodash-es/clone';
import { t } from '../util/locale';


export function presetField(id, field) {
    field = _clone(field);

    field.id = id;

    // for use in classes, element ids, css selectors
    field.safeid = id.replace(/[^_a-zA-Z0-9\-]/g, '_');

    field.matchGeometry = function(geometry) {
        return !field.geometry || field.geometry === geometry;
    };


    field.t = function(scope, options) {
        return t('presets.fields.' + id + '.' + scope, options);
    };


    field.label = function() {
        return field.t('label', {'default': id});
    };


    var placeholder = field.placeholder;
    field.placeholder = function() {
        return field.t('placeholder', {'default': placeholder});
    };


    return field;
}
