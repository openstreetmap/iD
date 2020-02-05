import { t } from '../util/locale';
import { presetCollection } from './collection';


export function presetCategory(categoryID, category, all) {
  let _this = Object.assign({}, category);   // shallow copy

  _this.id = categoryID;

  _this.members = presetCollection(_this.members.map(presetID => all.item(presetID)));

  _this.geometry = _this.members.collection
    .reduce((acc, preset) => {
      for (let i in preset.geometry) {
        const geometry = preset.geometry[i];
        if (acc.indexOf(geometry) === -1) {
          acc.push(geometry);
        }
      }
      return acc;
    }, []);

  _this.matchGeometry = (geom) => _this.geometry.indexOf(geom) >= 0;

  _this.matchAllGeometry = (geometries) => _this.members.collection
    .some(preset => preset.matchAllGeometry(geometries));

  _this.matchScore = () => -1;

  _this.name = () => t(`presets.categories.${categoryID}.name`, { 'default': categoryID });

  _this.terms = () => [];


  return _this;
}
