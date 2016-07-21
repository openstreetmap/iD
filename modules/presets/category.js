import { t } from '../util/locale';
import _ from 'lodash';
import { Collection } from './collection';
export function Category(id, category, all) {
    category = _.clone(category);

    category.id = id;

    category.members = Collection(category.members.map(function(id) {
        return all.item(id);
    }));

    category.matchGeometry = function(geometry) {
        return category.geometry.indexOf(geometry) >= 0;
    };

    category.matchScore = function() { return -1; };

    category.name = function() {
        return t('presets.categories.' + id + '.name', {'default': id});
    };

    category.terms = function() {
        return [];
    };

    return category;
}
