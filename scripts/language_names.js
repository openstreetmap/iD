/* eslint-disable no-console */
/* Downloads the latest translations from Transifex */
const fs = require('fs');

const cldrMainDir = 'node_modules/cldr-localenames-full/main/';
const rematchCodes = { 'ar-AA': 'ar', 'zh-CN': 'zh', 'zh-HK': 'zh-Hant-HK', 'zh-TW': 'zh-Hant', 'pt-BR': 'pt', 'pt': 'pt-PT' };

const codesToSkip = ['ase', 'mis', 'mul', 'und', 'zxx'];

let referencedScripts = [];

function getLangNamesInNativeLang() {
  // manually add languages we want that aren't in CLDR
  // see for example https://github.com/openstreetmap/iD/pull/9241/
  let unordered = {
    'oc': {
      nativeName: 'Occitan'
    },
    'ja-Hira': {
      base: 'ja',
      script: 'Hira'
    },
    'ja-Latn': {
      base: 'ja',
      script: 'Latn'
    },
    'ko-Latn': {
      base: 'ko',
      script: 'Latn'
    },
    'zh_pinyin': {
      base: 'zh',
      script: 'Latn'
    },
    'bft': {
      nativeName: 'بلتی'
    },
    'bha': {
      nativeName: 'भरीयाटी'
    },
    'brh': {
      nativeName: 'براہوئی'
    },
    'kls': {
      nativeName: 'Kal\'as\'amondr'
    },
    'pnb': {
      nativeName: 'پنجابی'
    },
    'scl': {
      nativeName: 'ݜݨیاٗ'
    },
    'shg': {
      nativeName: 'хуг̌ну̊н зив'
    },
    'skr': {
      nativeName: 'سرائیکی'
    },
    'trw': {
      nativeName: 'توروالی'
    },
    'wbl': {
      nativeName: 'وخی'
    }
  };

  let langDirectoryPaths = fs.readdirSync(cldrMainDir);
  langDirectoryPaths.forEach(code => {
    let languagesPath = `${cldrMainDir}${code}/languages.json`;
    //if (!fs.existsSync(languagesPath)) return;
    let languageObj = JSON.parse(fs.readFileSync(languagesPath, 'utf8')).main[code];
    let identity = languageObj.identity;

    // skip locale-specific languages
    if (identity.letiant || identity.territory) return;

    let info = {};
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

  // delete codes which should not be used
  delete unordered['pa-Arab']; // https://github.com/openstreetmap/iD/pull/9241/
  delete unordered['pa-Guru']; // - " -

  let ordered = {};
  Object.keys(unordered).sort().forEach(key => ordered[key] = unordered[key]);
  return ordered;
}

const langNamesInNativeLang = getLangNamesInNativeLang();

exports.langNamesInNativeLang = langNamesInNativeLang;

exports.languageNamesInLanguageOf = function(code) {
  if (rematchCodes[code]) code = rematchCodes[code];

  let languageFilePath = `${cldrMainDir}${code}/languages.json`;
  if (!fs.existsSync(languageFilePath)) return null;

  let translatedLangsByCode = JSON.parse(fs.readFileSync(languageFilePath, 'utf8')).main[code].localeDisplayNames.languages;

  // ignore codes for non-languages
  codesToSkip.forEach(skipCode => {
    delete translatedLangsByCode[skipCode];
  });

  for (let langCode in translatedLangsByCode) {
    let altLongIndex = langCode.indexOf('-alt-long');
    if (altLongIndex !== -1) {    // prefer long names (e.g. Chinese -> Mandarin Chinese)
      let base = langCode.substring(0, altLongIndex);
      translatedLangsByCode[base] = translatedLangsByCode[langCode];
    }

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


exports.scriptNamesInLanguageOf = function(code) {
  if (rematchCodes[code]) code = rematchCodes[code];

  let languageFilePath = `${cldrMainDir}${code}/scripts.json`;
  if (!fs.existsSync(languageFilePath)) return null;

  let allTranslatedScriptsByCode = JSON.parse(fs.readFileSync(languageFilePath, 'utf8')).main[code].localeDisplayNames.scripts;

  let translatedScripts = {};
  referencedScripts.forEach(script => {
    if (!allTranslatedScriptsByCode[script] || script === allTranslatedScriptsByCode[script]) return;
    translatedScripts[script] = allTranslatedScriptsByCode[script];
  });

  return translatedScripts;
};
