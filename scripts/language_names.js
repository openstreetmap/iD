/* eslint-disable no-console */
/* Downloads the latest translations from Transifex */
const fs = require('fs');

const cldrMainDir = 'node_modules/cldr-localenames-full/main/';
const rematchCodes = { 'ar-AA': 'ar', 'zh-CN': 'zh', 'zh-HK': 'zh-Hant-HK', 'zh-TW': 'zh-Hant', 'pt-BR': 'pt', 'pt': 'pt-PT' };

let referencedScripts = [];

function getLangNamesInNativeLang() {
  // manually add languages we want that aren't in CLDR
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

  let ordered = {};
  Object.keys(unordered).sort().forEach(key => ordered[key] = unordered[key]);
  return ordered;
}

exports.langNamesInNativeLang = getLangNamesInNativeLang();

exports.languageNamesInLanguageOf = function(code) {
  if (rematchCodes[code]) code = rematchCodes[code];

  let languageFilePath = `${cldrMainDir}${code}/languages.json`;
  if (!fs.existsSync(languageFilePath)) return null;

  let translatedLangsByCode = JSON.parse(fs.readFileSync(languageFilePath, 'utf8')).main[code].localeDisplayNames.languages;

  // ignore codes for non-languages
  for (let nonLangCode in { mis: true, mul: true, und: true, zxx: true }) {
    delete translatedLangsByCode[nonLangCode];
  }

  for (let langCode in translatedLangsByCode) {
    let altLongIndex = langCode.indexOf('-alt-long');
    if (altLongIndex !== -1) {    // prefer long names (e.g. Chinese -> Mandarin Chinese)
      let base = langCode.substring(0, altLongIndex);
      translatedLangsByCode[base] = translatedLangsByCode[langCode];
    }

    if (langCode.includes('-alt-')) {    // remove alternative names
      delete translatedLangsByCode[langCode];
    } else if (langCode === translatedLangsByCode[langCode]) {   // no localized value available
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
