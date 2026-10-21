import type { Geometry, PresetCategory } from '@openstreetmap/id-tagging-schema';
import { t } from '../core/localizer';
import { utilStripDiacritics } from '../util/util';
import { presetCollection } from './collection';
import type { presetPreset } from './preset';

export type presetCategory = Omit<PresetCategory, 'members' | 'name'> & {
  id: string;
  members: presetCollection;
  geometry: Geometry[];
  matchGeometry(geometry: Geometry): boolean;
  matchAllGeometry(geometries: Geometry[]): boolean;
  matchScore(): number;
  name(): string;
  nameLabel(): d3.Selector;
  terms(): string[];
  searchName(): string;
  searchNameStripped(): string;
  searchAliases(): string[];
  searchAliasesStripped(): string[];
  suggestion?: undefined;
  /** @deprecated - appears to be unused */
  originalName?: string;
}

//
// `presetCategory` builds a `presetCollection` of member presets,
// decorated with some extra methods for searching and matching geometry
//
export function presetCategory(
  categoryID: string,
  category: PresetCategory,
  allPresets: Record<string, presetPreset>,
) {
  let _this = <presetCategory>(<unknown>(Object.assign({}, category)));   // shallow copy
  let _searchName: string | undefined; // cache
  let _searchNameStripped: string; // cache

  _this.id = categoryID;

  _this.members = presetCollection(
    (category.members || []).map(presetID => allPresets[presetID]).filter(Boolean)
  );

  _this.geometry = _this.members.collection
    .reduce<Geometry[]>((acc, preset) => {
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

  _this.name = () => t(`_tagging.presets.categories.${categoryID}.name`, { 'default': categoryID });
  _this.nameLabel = () => t.append(`_tagging.presets.categories.${categoryID}.name`, { 'default': categoryID });

  _this.terms = () => [];

  _this.searchName = () => {
    if (!_searchName) {
      _searchName = (_this.suggestion ? _this.originalName! : _this.name()).toLowerCase();
    }
    return _searchName;
  };

  _this.searchNameStripped = () => {
    _searchNameStripped ||= utilStripDiacritics(_this.searchName());
    return _searchNameStripped;
  };

  _this.searchAliases = () => [];
  _this.searchAliasesStripped = () => [];

  return _this;
}
