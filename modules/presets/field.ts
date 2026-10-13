import type { Field, Geometry } from '@openstreetmap/id-tagging-schema';
import { localizer, t, type ReplacementsSimple, type LocalizedTextRenderer } from '../core/localizer';
import { utilSafeClassName } from '../util/util';
import { LANGUAGE_SUFFIX_REGEX } from '../ui/fields';

export interface presetField extends Omit<Field, 'label' | 'terms' | 'placeholder'> {
  id: string;
  safeid: string;
  matchGeometry(geom: Geometry): boolean;
  matchAllGeometry(geometries: Geometry[]): boolean;
  t: {
    (scope: string, options: ReplacementsSimple): string;
    append: typeof t.append;
  };
  t_all: typeof localizer.t_all;
  hasTextForStringId(scope: string): boolean;
  title(): string;
  label(): LocalizedTextRenderer;
  placeholder(): string;
  originalTerms: string[];
  terms(): string[];
  allKeys(tags: Tags | TagsMulti): TagKey[];
  tagsContainFieldKey(tags: Tags | TagsMulti): boolean;
  evaluatePrerequisiteTags(tags: Tags): boolean;
  overrideLabel?: string;
  locationSetID?: string;
}

//
// `presetField` decorates a given `field` Object
// with some extra methods for searching and matching geometry
//
export function presetField(fieldID: string, field: Field) {
  const _this = <presetField>(<unknown>Object.assign({}, field));   // shallow copy

  _this.id = fieldID;

  // for use in classes, element ids, css selectors
  _this.safeid = utilSafeClassName(fieldID);

  _this.matchGeometry = (geom) => !_this.geometry || _this.geometry.indexOf(geom) !== -1;

  _this.matchAllGeometry = (geometries) => {
    return !_this.geometry || geometries.every(geom => _this.geometry!.indexOf(geom) !== -1);
  };

  const _t: presetField['t'] = (scope, options) => t(`_tagging.presets.fields.${fieldID}.${scope}`, options);
  _this.t_all = (scope, options) => localizer.t_all(`_tagging.presets.fields.${fieldID}.${scope}`, options);
  _t.append = (scope, options) => t.append(`_tagging.presets.fields.${fieldID}.${scope}`, options);
  _this.t = _t;

  _this.hasTextForStringId = (scope) => localizer.hasTextForStringId(`_tagging.presets.fields.${fieldID}.${scope}`);

  _this.title = () => _this.t('label', { 'default': fieldID });
  _this.label = () => _this.t.append('label', { 'default': fieldID });

  _this.placeholder = () => _this.t('placeholder', { 'default': '' });

  _this.originalTerms = field.terms || [];

  _this.terms = () => _this.t_all('terms', { 'default': _this.originalTerms });

  _this.increment = (_this.type === 'number' || _this.type === 'integer') ? (_this.increment || 1) : undefined;

  /** all keys controlled by this field */
  _this.allKeys = (tags) => {
    const allKeys = new Set<TagKey>();
    if (_this.key) allKeys.add(_this.key);
    if (_this.keys) _this.keys.forEach(key => allKeys.add(key));
    if (field.type === 'directionalCombo' && _this.key) {
        // directionalCombo fields can have an additional key describing the for
        // cases where both directions share a "common" value.
        // The field also support *:both. The preset decides which field to write to.
        const baseKey = field.key!.replace(/:both$/, '');
        allKeys.add(baseKey);
        allKeys.add(`${baseKey}:both`);
    }
    if (field.type === 'localized' && field.key && tags) {
        const prefix = `${field.key}:`;
        Object.keys(tags)
            .filter(k => k.startsWith(prefix))
            .filter(k => LANGUAGE_SUFFIX_REGEX.test(k))
            .forEach(key => allKeys.add(key));
    }
    if (field.type === 'multiCombo' && field.key && tags) {
        const prefix = field.key + (field.key.endsWith(':') ? '' : ':');
        Object.keys(tags)
            .filter(k => k.startsWith(prefix))
            .forEach(key => allKeys.add(key));
    }
    return [...allKeys];
  };


  _this.tagsContainFieldKey = (_tags) => {
    return _this.allKeys(_tags).some((key) => {
      if (field.type === 'multiCombo') {
        for (const tagKey in _tags) {
          if (tagKey.indexOf(key) === 0) {
            return true;
          }
        }
        return false;
      }
      if (field.type === 'localized') {
        for (const tagKey in _tags) {
          // matches for field:<code>, where <code> is a BCP 47 locale code
          const match = tagKey.match(LANGUAGE_SUFFIX_REGEX);
          if (match && match[1] === field.key && match[2]) {
            return true;
          }
        }
      }
      return _tags[key] !== undefined;
    });
  };

  /** returns true if this field should be shown, given an entity's tags */
  _this.evaluatePrerequisiteTags = (tags) => {
    const prerequisiteTag = field.prerequisiteTag;
    if (!prerequisiteTag) return true;

    if ('key' in prerequisiteTag) {
      const value = tags[prerequisiteTag.key] || '';

      if ('valuesNot' in prerequisiteTag) {
        return !prerequisiteTag.valuesNot.includes(value);
      }
      if ('valueNot' in prerequisiteTag) {
        return prerequisiteTag.valueNot !== value;
      }
      if ('values' in prerequisiteTag) {
        return prerequisiteTag.values.includes(value);
      }
      if ('value' in prerequisiteTag) {
        return prerequisiteTag.value === value;
      }
      if (!value) return false;
    } else if ('keyNot' in prerequisiteTag) {
      if (tags[prerequisiteTag.keyNot]) return false;
    }
    return true;
  };

  return _this;
}
