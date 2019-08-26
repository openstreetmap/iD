import { t } from '../util/locale';
import { presetCollection } from './collection';


export function presetCategory(id, category, all) {
    category = Object.assign({}, category);   // shallow copy

    category.id = id;


    category.members = presetCollection(category.members.map(function(id) {
        return all.item(id);
    }));


    category.geometry = category.members.collection.reduce(function(geometries, preset) {
        for (var index in preset.geometry) {
            var geometry = preset.geometry[index];
            if (geometries.indexOf(geometry) === -1) {
                geometries.push(geometry);
            }
        }
        return geometries;
    }, []);


    category.matchGeometry = function(geometry) {
        return category.geometry.indexOf(geometry) >= 0;
    };


    category.matchScore = function() {
        return -1;
    };


    category.name = function() {
        return t('presets.categories.' + id + '.name', {'default': id});
    };


    category.terms = function() {
        return [];
    };


    return category;
}
