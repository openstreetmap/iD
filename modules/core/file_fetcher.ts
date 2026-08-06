import { presetsCdnUrl, ociCdnUrl, wmfSitematrixCdnUrl } from '../../config/id.js';
import type {
    Discarded,
    Deprecated,
    PresetCategories,
    PresetDefaults,
    Fields,
    Presets,
} from '@openstreetmap/id-tagging-schema';
import type { LocoFeatureCollection } from '@rapideditor/location-conflation';
import type {
    NsiGenericWordsJSON,
    NsiDissolved,
    NsiPresets,
    NsiReplacementsJSON,
    NsiTreesJSON,
    NsiWikidataJSON,
    NsiJSON,
} from 'name-suggestion-index';
import type { ShortcutsJSON } from '../ui/shortcuts.js';
import type { QAData } from '../services/osmose.js';
import type {
    LanguagesJSON,
    LocaleDataKey,
    LocaleIndexKey,
    LocalesJSON,
    Translations,
} from './localizer.js';
import type { AddressFormatsJSON } from '../ui/fields/address.js';
import type { WmfSite } from '../ui/fields/wikipedia.js';
import type { EntityId } from '../osm/id_manager.js';
import type { OsmEntity } from '../osm/abstract-entity.js';
import packageJSON from '../../package.json';

interface Definitions {
    address_formats: AddressFormatsJSON;
    imagery: unknown;
    intro_graph: Record<EntityId, OsmEntity>;
    languages: LanguagesJSON;
    locales: LocalesJSON;
    phone_formats: Record<string, string>;
    qa_data: QAData;
    shortcuts: ShortcutsJSON;
    territory_languages: Record<string, string[]>;
    oci_defaults: unknown;
    oci_features: unknown;
    oci_resources: unknown;

    presets_package: typeof packageJSON;
    deprecated: Deprecated;
    discarded: Discarded;
    preset_categories: PresetCategories;
    preset_defaults: PresetDefaults;
    preset_fields: Fields;
    preset_presets: Presets;
    wmf_sitematrix: WmfSite[];

    nsi_data: NsiJSON;
    nsi_dissolved: NsiDissolved;
    nsi_features: LocoFeatureCollection;
    nsi_generics: NsiGenericWordsJSON;
    nsi_presets: NsiPresets;
    nsi_replacements: NsiReplacementsJSON;
    nsi_trees: NsiTreesJSON;
    nsi_wikidata: NsiWikidataJSON;

    [scope: LocaleIndexKey]: LocalesJSON;
    [lng: LocaleDataKey]: { [locale: string]: Translations };
}

export type FileId = keyof Definitions;

export type FileMap = Partial<Record<FileId, string>>;
export type AssetMap = Record<string, string>;

export interface coreFileFetcher {
    cache(): void;
    get<T extends FileId>(which: T): Promise<Definitions[T]>;
    fileMap: GetSet<coreFileFetcher, FileMap>;
    assetPath: GetSet<coreFileFetcher, string>;
    assetMap: GetSet<coreFileFetcher, AssetMap>;
    asset(val: string): string;
}

const _mainFileFetcher = coreFileFetcher(); // singleton

export { _mainFileFetcher as fileFetcher };

//
// coreFileFetcher asynchronously fetches data from JSON files
//
export function coreFileFetcher() {
    const ociVersion = packageJSON.devDependencies['osm-community-index'];
    const presetsVersion = packageJSON.devDependencies['@openstreetmap/id-tagging-schema'];

    const _this: coreFileFetcher = function () {};
    const _inflight: Record<string, Promise<any>> = {};
    let _fileMap: FileMap = {
        address_formats: 'data/address_formats.min.json',
        imagery: 'data/imagery.min.json',
        intro_graph: 'data/intro_graph.min.json',
        languages: 'data/languages.min.json',
        locales: 'locales/index.min.json',
        phone_formats: 'data/phone_formats.min.json',
        qa_data: 'data/qa_data.min.json',
        shortcuts: 'data/shortcuts.min.json',
        territory_languages: 'data/territory_languages.min.json',
        oci_defaults: ociCdnUrl.replace('{version}', ociVersion) + 'dist/json/defaults.min.json',
        oci_features:
            ociCdnUrl.replace('{version}', ociVersion) + 'dist/json/featureCollection.min.json',
        oci_resources: ociCdnUrl.replace('{version}', ociVersion) + 'dist/json/resources.min.json',
        presets_package:
            presetsCdnUrl.replace('{presets_version}', presetsVersion) + 'package.json',
        deprecated: presetsCdnUrl + 'dist/deprecated.min.json',
        discarded: presetsCdnUrl + 'dist/discarded.min.json',
        preset_categories: presetsCdnUrl + 'dist/preset_categories.min.json',
        preset_defaults: presetsCdnUrl + 'dist/preset_defaults.min.json',
        preset_fields: presetsCdnUrl + 'dist/fields.min.json',
        preset_presets: presetsCdnUrl + 'dist/presets.min.json',
        wmf_sitematrix: wmfSitematrixCdnUrl.replace('{version}', '0.2') + 'data/wikipedia.min.json',
    };

    const _cachedData: { [T in FileId]?: Definitions[T] } = {};
    // expose the cache; useful for tests
    _this.cache = () => _cachedData;

    // Returns a Promise to fetch data
    // (resolved with the data if we have it already)
    _this.get = (which) => {
        if (_cachedData[which]) {
            return Promise.resolve(_cachedData[which]);
        }

        const file = _fileMap[which];
        const url = file && _this.asset(file);
        if (!url) {
            return Promise.reject(`Unknown data file for "${which}"`);
        }

        if (url.includes('{presets_version}')) {
            return _this.get('presets_package').then((result) => {
                const presetsVersion = result.version;
                return getUrl(url.replace('{presets_version}', presetsVersion), which);
            });
        } else {
            return getUrl(url, which);
        }
    };

    function getUrl<T extends FileId>(url: string, which: T): Promise<Definitions[T]> {
        let prom = _inflight[url];
        if (!prom) {
            prom = (window.VITEST ? import(`../${url}`) : fetch(url))
                .then((response) => {
                    if (window.VITEST) return response.default;

                    if (!response.ok || !response.json) {
                        throw new Error(response.status + ' ' + response.statusText);
                    }
                    if (response.status === 204 || response.status === 205) return; // No Content, Reset Content
                    return response.json();
                })
                .then((result) => {
                    delete _inflight[url];
                    if (!result) {
                        throw new Error(`No data loaded for "${which}"`);
                    }
                    _cachedData[which] = result;
                    return result;
                })
                .catch((err) => {
                    delete _inflight[url];
                    throw err;
                });
            _inflight[url] = prom;
        }

        return prom;
    }

    // Accessor for the file map
    _this.fileMap = function (val) {
        if (!arguments.length) return _fileMap;
        _fileMap = val!;
        return _this;
    } as GetSet<coreFileFetcher, FileMap>;

    let _assetPath = '';
    _this.assetPath = function (val) {
        if (!arguments.length) return _assetPath;
        _assetPath = val!;
        return _this;
    } as GetSet<coreFileFetcher, string>;

    let _assetMap: AssetMap = {};
    _this.assetMap = function (val) {
        if (!arguments.length) return _assetMap;
        _assetMap = val!;
        return _this;
    } as GetSet<coreFileFetcher, AssetMap>;

    _this.asset = (val) => {
        if (/^http(s)?:\/\//i.test(val)) return val;
        const filename = _assetPath + val;
        return _assetMap[filename] || filename;
    };

    return _this;
}
