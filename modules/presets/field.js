import _ from 'lodash';
import { t } from '../util/locale';


export function presetField(id, field) {
    field = _.clone(field);

    field.id = id;


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
