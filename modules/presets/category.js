// @flow

import _clone from 'lodash-es/clone';
import { t } from '../util/locale';
import { presetCollection } from './collection';

type categoryObject = { 
  geometry: string, 
  icon: string, 
  name: string, 
  members: [string]
};

export function presetCategory(id: string, category: categoryObject, all: () => mixed): categoryObject {
    category = _clone(category);

    category.id = id;


    category.members = presetCollection(category.members.map(function(id) {
        return all.item(id);
    }));


    category.matchGeometry = function(geometry: string): boolean {
        return category.geometry.indexOf(geometry) >= 0;
    };


    category.matchScore = function(): number {
        return -1;
    };


    category.name = function(): string {
        return t('presets.categories.' + id + '.name', {'default': id});
    };


    category.terms = function(): [] {
        return [];
    };


    return category;
}
