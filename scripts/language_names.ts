/* Downloads the latest translations from Transifex */
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ianaRegistry from 'language-subtag-registry/data/json/registry.json' with { type: 'json' };

const cldrMainDir = 'node_modules/cldr-localenames-full/main/';
const rematchCodes: Record<string, string> = {
  'ar-AA': 'ar',
  'pt-BR': 'pt',
  'pt': 'pt-PT',
  'zh-CN': 'zh',
  'zh-TW': 'zh-Hant',
  'zh-HK': 'zh-Hant-HK'
};

const codesToSkip = ['ase', 'mis', 'mul', 'und', 'zxx'];

let referencedScripts: string[] = [];

export interface CLDROverride {
    base?: string;
    script?: string;
    nativeName?: string;
    names?: { [code: string]: string };
}
export interface CLDROverrides {
    [code: string]: CLDROverride;
}

function getCLDROverrides(): CLDROverrides {
  // manually add languages we want that aren't in CLDR
  // see for example https://github.com/openstreetmap/iD/pull/9241/
  return {
    aer: { nativeName: 'Arrernte' },
    aoi: { nativeName: 'Anindilyakwa' },
    aus: { nativeName: 'Australian Aboriginal Languages' },
    bdy: { nativeName: 'Yugambeh–Bandjalangic' },
    'bft': {
      nativeName: 'بلتی'
    },
    'bha': {
      nativeName: 'भरीयाटी'
    },
    'brh': {
      nativeName: 'براہوئی'
    },
    'cdo': {
      nativeName: '閩東語'
    },
    'cdo-Hans': {
      base: 'cdo',
      script: 'Hans',
      nativeName: '闽东语（简化汉字）'
    },
    'cdo-Hant': {
      base: 'cdo',
      script: 'Hant',
      nativeName: '閩東語（傳統漢字）'
    },
    'cdo-Latn': {
      base: 'cdo',
      script: 'Latn',
      nativeName: 'Mìng-dĕ̤ng-ngṳ̄ (Bàng-uâ-cê)'
    },
    coa: { nativeName: 'Basa Pulu Kokos', names: { en: 'Cocos Malay' } },
    'cpx': {
      nativeName: '莆仙語'
    },
    'cpx-Hans': {
      base: 'cpx',
      script: 'Hans',
      nativeName: '莆仙语（简体）'
    },
    'cpx-Hant': {
      base: 'cpx',
      script: 'Hant',
      nativeName: '莆仙語（繁體）'
    },
    'cpx-Latn': {
      base: 'cpx',
      script: 'Latn',
      nativeName: 'Pó-sing-gṳ̂ (Báⁿ-uā-ci̍)'
    },
    'gan': {
      nativeName: '贛語'
    },
    'gan-Hans': {
      base: 'gan',
      script: 'Hans',
      nativeName: '赣语（简体）'
    },
    'gan-Hant': {
      base: 'gan',
      script: 'Hant',
      nativeName: '贛語（繁體）'
    },
    gjr: { nativeName: 'Gurindji Kriol' },
    gup: { nativeName: 'Bininj Gun-Wok' },
    'hak': {
      nativeName: '客家語'
    },
    'hak-Hans': {
      base: 'hak',
      script: 'Hans',
      nativeName: '客家语（简体）'
    },
    'hak-Hant': {
      base: 'hak',
      script: 'Hant',
      nativeName: '客家語（繁體）'
    },
    'hak-Latn': {
      base: 'hak',
      script: 'Latn',
      nativeName: 'Hak-kâ-ngî (Pha̍k-fa-sṳ)'
    },
    'hsn': {
      nativeName: '湘語'
    },
    'ja-Hira': {
      base: 'ja',
      script: 'Hira'
    },
    'ja-Latn': {
      base: 'ja',
      script: 'Latn'
    },
    jay: { nativeName: 'Yan-nhaŋu' },
    'kls': {
      nativeName: 'Kal\'as\'amondr'
    },
    'ko-Latn': {
      base: 'ko',
      script: 'Latn'
    },
    'mnc-Latn': {
      base: 'mnc',
      script: 'Latn',
      nativeName: 'manju gisun'
    },
    'mnc-Mong': {
      base: 'mnc',
      script: 'Mong',
      nativeName: 'ᠮᠠᠨᠵᡠ ᡤᡳᠰᡠᠨ'
    },
    mwf: { nativeName: 'Murrinh-Patha' },
    mwp: { nativeName: 'Kalaw Lagaw Ya' },
    'nan': {
      nativeName: '閩南語'
    },
    'nan-Hant': {
      base: 'nan',
      script: 'Hant',
      nativeName: '閩南語（傳統漢字）'
    },
    'nan-Latn-pehoeji': {
      base: 'nan',
      script: 'Latn',
      nativeName: 'Bân-lâm-gú (Pe̍h-ōe-jī)'
    },
    'nan-Latn-tailo': {
      base: 'nan',
      script: 'Latn',
      nativeName: 'Bân-lâm-gú (Tâi-lô)'
    },
    pih: { nativeName: 'Pitkern–Norfuk', names: { en: 'Pitcairn-Norfolk', ty: 'Pitcairnais' } },
    piu: { nativeName: 'Pintupi' },
    'pnb': {
      nativeName: 'پنجابی'
    },
    rop: { nativeName: 'Australian Kriol' },
    'scl': {
      nativeName: 'ݜݨیاٗ'
    },
    'shg': {
      nativeName: 'хуг̌ну̊н зив'
    },
    tcs: { nativeName: 'Yumplatok', names: { en: 'Torres Strait Creole' } },
    tiw: { nativeName: 'Tiwi' },
    ulk: { nativeName: 'Meriam Mir' },
    'wbl': {
      nativeName: 'وخی'
    },
    wlp: { nativeName: 'Warlpiri' },
    'wuu': {
      nativeName: '吳語'
    },
    'wuu-Hans': {
      base: 'wuu',
      script: 'Hans',
      nativeName: '吴语（简体）'
    },
    'wuu-Hant': {
      base: 'wuu',
      script: 'Hant',
      nativeName: '吳語（正體）'
    },
    xdk: { nativeName: 'Dharug' },
    xni: { nativeName: 'Ngarigo' },
    xph: { nativeName: 'Tyerrernotepanner', names: { en: 'North Midlands Tasmanian' } },
    'zh-Latn-pinyin': {
      base: 'zh',
      script: 'Latn',
      nativeName: 'Zhōngwén (Hànyǔ Pīnyīn)'
    },
  };
}

export async function getLangNamesInNativeLang() {
  const unordered = getCLDROverrides();
  for (const key in unordered) {
    delete unordered[key].names; // this is added later
  }

  let langDirectoryPaths = fs.readdirSync(cldrMainDir);
  langDirectoryPaths.forEach(code => {
    let languagesPath = `${cldrMainDir}${code}/languages.json`;
    if (!fs.existsSync(languagesPath)) return;
    let languageObj = JSON.parse(fs.readFileSync(languagesPath, 'utf8')).main[code];
    let identity = languageObj.identity;

    // skip locale-specific languages
    if (identity.letiant || identity.territory) return;

    let info: CLDROverride = {};
    const script = identity.script;
    if (script) {
      referencedScripts.push(script);
      info.base = identity.language;
      info.script = script;
    }

    const nativeName = languageObj.localeDisplayNames.languages[code];
    if (nativeName) {
      info.nativeName = nativeName;
    }

    unordered[code] = info;
  });

  // CLDR locales don't cover all the languages people might want to use for iD tags,
  // so also add the language names that we have English translations for
  let englishNamesByCode = JSON.parse(fs.readFileSync(`${cldrMainDir}en/languages.json`, 'utf8')).main.en.localeDisplayNames.languages;
  Object.keys(englishNamesByCode).forEach(code => {
    if (code in unordered) return;
    if (code.indexOf('-') !== -1) return;
    if (codesToSkip.indexOf(code) !== -1) return;
    unordered[code] = {};
  });

  // for locales that aren't in CLDR and don't have hardcoded overrides in this file,
  // use the nativeName from the IANA registry. This only applies to language codes
  // that are used at least once in OSM.
  const fromTaginfo = await getNameTagsFromTaginfo();
  const ianaRegistryObject = Object.fromEntries(
    ianaRegistry
        .filter(row => row.Type === 'language' && !row.Deprecated && !row.Macrolanguage && row.Scope !== 'collection')
        .map(row => [row.Subtag, row.Description[0]])
  );

  for (const code of fromTaginfo) {
    if (unordered[code]?.nativeName) continue; // already exists
    if (!(code in ianaRegistryObject)) continue; // unknown value

    unordered[code] = {
        nativeName: ianaRegistryObject[code],
    };
  }

  // delete codes which should not be used
  delete unordered['pa-Arab']; // https://github.com/openstreetmap/iD/pull/9241/
  delete unordered['pa-Guru']; // - " -

  let ordered: CLDROverrides = {};
  Object.keys(unordered).sort().forEach(key => ordered[key] = unordered[key]);
  return ordered;
}

/** fetches every `name:*` tag from taginfo */
async function getNameTagsFromTaginfo(): Promise<string[]> {
    // this data rarely changes, so cache it for a month locally. Otherwise
    // it would slow down builds for frequent contributors.
    const cacheFile = join(tmpdir(), `iD-taginfo-name-tags-${new Date().toISOString().slice(0, 7)}.json`);
    if (fs.existsSync(cacheFile)) {
        return JSON.parse(await fs.promises.readFile(cacheFile, 'utf8'));
    }

    interface TaginfoResponse {
        page: number;
        rp: number;
        total: number;
        data: { key: string; }[];
    }

    const codes: string[] = [];

    // eslint-disable-next-line no-constant-condition
    for (let page = 1; true; page++) {
        const qs = new URLSearchParams({
            query: 'name:',
            sortname: 'count_all',
            sortorder: 'desc',
            rp: '999',
            page: `${page}`
        });
        // eslint-disable-next-line no-console
        console.log(`fetching name:* tags from taginfo (page ${page})`);
        const response: TaginfoResponse = await fetch(
            `https://taginfo.openstreetmap.org/api/4/keys/all?${qs}`
        ).then(r => r.json());

        if (!response.data.length) break; // reached the final page

        const filtered = response.data
            .map(row => row.key.replace(/^name:/, ''))
            .filter(value => {
                try {
                    // only keep valid locale codes to exclude tags like
                    // `name:etymology` and `name:2008-2011`
                    return new Intl.Locale(value);
                } catch {
                    return false;
                }
            });

        codes.push(...filtered);
    }

    await fs.promises.writeFile(cacheFile, JSON.stringify(codes));

    return codes;
}

let langNamesInNativeLang;

export async function languageNamesInLanguageOf(code: string) {
  if (rematchCodes[code]) code = rematchCodes[code];

  // eslint-disable-next-line require-atomic-updates
  langNamesInNativeLang ||= await getLangNamesInNativeLang();

  const { language } = new Intl.Locale(code);

  let languageFilePath = `${cldrMainDir}${code}/languages.json`;
  if (!fs.existsSync(languageFilePath)) return null;

  let translatedLangsByCode = JSON.parse(fs.readFileSync(languageFilePath, 'utf8')).main[code].localeDisplayNames.languages;

  // add any overrides that have translated names
  for (const [key, value] of Object.entries(getCLDROverrides())) {
    if (value.names?.[language]) {
      translatedLangsByCode[key] ||= value.names?.[language];
    }
  }

  // ignore codes for non-languages
  codesToSkip.forEach(skipCode => {
    delete translatedLangsByCode[skipCode];
  });

  for (let langCode in translatedLangsByCode) {

    if (langCode.includes('-alt-')) {
      // remove alternative names
      delete translatedLangsByCode[langCode];
    } else if (langCode === translatedLangsByCode[langCode]) {
      // no localized value available
      delete translatedLangsByCode[langCode];
    } else if (!langNamesInNativeLang[langCode]){
      // we don't need to include language names that we probably won't be showing in the UI
      delete translatedLangsByCode[langCode];
    }
  }

  return translatedLangsByCode;
};

export function scriptNamesInLanguageOf(code: string) {
  if (rematchCodes[code]) code = rematchCodes[code];

  let languageFilePath = `${cldrMainDir}${code}/scripts.json`;
  if (!fs.existsSync(languageFilePath)) return null;

  let allTranslatedScriptsByCode = JSON.parse(fs.readFileSync(languageFilePath, 'utf8')).main[code].localeDisplayNames.scripts;

  let translatedScripts: Record<string, string> = {};
  referencedScripts.forEach(script => {
    if (!allTranslatedScriptsByCode[script] || script === allTranslatedScriptsByCode[script]) return;
    translatedScripts[script] = allTranslatedScriptsByCode[script];
  });

  return translatedScripts;
};
