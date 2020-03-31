import { t } from '../core/localizer';
import { utilSafeClassName } from '../util/util';


//
// `presetField` decorates a given `field` Object
// with some extra methods for searching and matching geometry
//
export function presetField(fieldID, field) {
  let _this = Object.assign({}, field);   // shallow copy

  _this.id = fieldID;

  // for use in classes, element ids, css selectors
  _this.safeid = utilSafeClassName(fieldID);

  _this.matchGeometry = (geom) => !_this.geometry || _this.geometry.indexOf(geom) !== -1;

  _this.matchAllGeometry = (geometries) => {
    return !_this.geometry || geometries.every(geom => _this.geometry.indexOf(geom) !== -1);
  };

  _this.t = (scope, options) => t(`presets.fields.${fieldID}.${scope}`, options);

  _this.label = () => _this.overrideLabel || _this.t('label', { 'default': fieldID });

  const _placeholder = _this.placeholder;
  _this.placeholder = () => _this.t('placeholder', { 'default': _placeholder });

  _this.originalTerms = (_this.terms || []).join();

  _this.terms = () => _this.t('terms', { 'default': _this.originalTerms })
    .toLowerCase().trim().split(/\s*,+\s*/);


  return _this;
}
