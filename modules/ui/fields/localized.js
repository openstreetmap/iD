import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select, event as d3_event } from 'd3-selection';
import * as countryCoder from '@ideditor/country-coder';

import { presetManager } from '../../presets';
import { fileFetcher } from '../../core/file_fetcher';
import { t, localizer } from '../../core/localizer';
import { services } from '../../services';
import { svgIcon } from '../../svg';
import { uiTooltip } from '../tooltip';
import { uiCombobox } from '../combobox';
import { utilArrayUniq, utilEditDistance, utilGetSetValue, utilNoAuto, utilRebind, utilTotalExtent, utilUniqueDomId } from '../../util';

var _languagesArray = [];


export function uiFieldLocalized(field, context) {
    var dispatch = d3_dispatch('change', 'input');
    var wikipedia = services.wikipedia;
    var input = d3_select(null);
    var localizedInputs = d3_select(null);
    var _countryCode;
    var _tags;


    // A concern here in switching to async data means that _languagesArray will not
    // be available the first time through, so things like the fetchers and
    // the language() function will not work immediately.
    fileFetcher.get('languages')
        .then(loadLanguagesArray)
        .catch(function() { /* ignore */ });

    var _territoryLanguages = {};
    fileFetcher.get('territory_languages')
        .then(function(d) { _territoryLanguages = d; })
        .catch(function() { /* ignore */ });


    var allSuggestions = presetManager.collection.filter(function(p) {
        return p.suggestion === true;
    });

    // reuse these combos
    var langCombo = uiCombobox(context, 'localized-lang')
        .fetcher(fetchLanguages)
        .minItems(0);

    var brandCombo = uiCombobox(context, 'localized-brand')
        .canAutocomplete(false)
        .minItems(1);

    var _selection = d3_select(null);
    var _multilingual = [];
    var _buttonTip = uiTooltip()
        .title(t('translate.translate'))
        .placement('left');
    var _wikiTitles;
    var _entityIDs = [];


    function loadLanguagesArray(dataLanguages) {
        if (_languagesArray.length !== 0) return;

        // some conversion is needed to ensure correct OSM tags are used
        var replacements = {
            sr: 'sr-Cyrl',      // in OSM, `sr` implies Cyrillic
            'sr-Cyrl': false    // `sr-Cyrl` isn't used in OSM
        };

        for (var code in dataLanguages) {
            if (replacements[code] === false) continue;
            var metaCode = code;
            if (replacements[code]) metaCode = replacements[code];

            _languagesArray.push({
                localName: localizer.languageName(metaCode, { localOnly: true }),
                nativeName: dataLanguages[metaCode].nativeName,
                code: code,
                label: localizer.languageName(metaCode)
            });
        }
    }


    function calcLocked() {

        // only lock the Name field
        var isLocked = field.id === 'name' &&
            _entityIDs.length &&
            // lock the field if any feature needs it
            _entityIDs.some(function(entityID) {

                var entity = context.graph().hasEntity(entityID);
                if (!entity) return false;

                var original = context.graph().base().entities[_entityIDs[0]];
                var hasOriginalName = original && entity.tags.name && entity.tags.name === original.tags.name;
                // if the name was already edited manually then allow further editing
                if (!hasOriginalName) return false;

                // features linked to Wikidata are likely important and should be protected
                if (entity.tags.wikidata) return true;

                // assume the name has already been confirmed if its source has been researched
                if (entity.tags['name:etymology:wikidata']) return true;

                var preset = presetManager.match(entity, context.graph());
                var isSuggestion = preset && preset.suggestion;
                var showsBrand = preset && preset.originalFields.filter(function(d) {
                    return d.id === 'brand';
                }).length;
                // protect standardized brand names
                return isSuggestion && !showsBrand;
            });

        field.locked(isLocked);
    }


    // update _multilingual, maintaining the existing order
    function calcMultilingual(tags) {
        var existingLangsOrdered = _multilingual.map(function(item) {
            return item.lang;
        });
        var existingLangs = new Set(existingLangsOrdered.filter(Boolean));

        for (var k in tags) {
            var m = k.match(/^(.*):([a-zA-Z_-]+)$/);
            if (m && m[1] === field.key && m[2]) {
                var item = { lang: m[2], value: tags[k] };
                if (existingLangs.has(item.lang)) {
                    // update the value
                    _multilingual[existingLangsOrdered.indexOf(item.lang)].value = item.value;
                    existingLangs.delete(item.lang);
                } else {
                    _multilingual.push(item);
                }
            }
        }

        _multilingual = _multilingual.filter(function(item) {
            return !item.lang || !existingLangs.has(item.lang);
        });
    }


    function localized(selection) {
        _selection = selection;
        calcLocked();
        var isLocked = field.locked();
        var singularEntity = _entityIDs.length === 1 && context.hasEntity(_entityIDs[0]);
        var preset = singularEntity && presetManager.match(singularEntity, context.graph());

        var wrap = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        // enter/update
        wrap = wrap.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-' + field.type)
            .merge(wrap);

        input = wrap.selectAll('.localized-main')
            .data([0]);

        // enter/update
        input = input.enter()
            .append('input')
            .attr('type', 'text')
            .attr('id', field.domId)
            .attr('class', 'localized-main')
            .call(utilNoAuto)
            .merge(input);

        if (preset && field.id === 'name') {
            var pTag = preset.id.split('/', 2);
            var pKey = pTag[0];
            var pValue = pTag[1];

            if (!preset.suggestion) {
                // Not a suggestion preset - Add a suggestions dropdown if it makes sense to.
                // This code attempts to determine if the matched preset is the
                // kind of preset that even can benefit from name suggestions..
                // - true = shops, cafes, hotels, etc. (also generic and fallback presets)
                // - false = churches, parks, hospitals, etc. (things not in the index)
                var isFallback = preset.isFallback();
                var goodSuggestions = allSuggestions.filter(function(s) {
                    if (isFallback) return true;
                    var sTag = s.id.split('/', 2);
                    var sKey = sTag[0];
                    var sValue = sTag[1];
                    return pKey === sKey && (!pValue || pValue === sValue);
                });

                // Show the suggestions.. If the user picks one, change the tags..
                if (allSuggestions.length && goodSuggestions.length) {
                    input
                        .on('blur.localized', checkBrandOnBlur)
                        .call(brandCombo
                            .fetcher(fetchBrandNames(preset, allSuggestions))
                            .on('accept', acceptBrand)
                            .on('cancel', cancelBrand)
                        );
                }
            }
        }

        input
            .classed('disabled', !!isLocked)
            .attr('readonly', isLocked || null)
            .on('input', change(true))
            .on('blur', change())
            .on('change', change());


        var translateButton = wrap.selectAll('.localized-add')
            .data([0]);

        translateButton = translateButton.enter()
            .append('button')
            .attr('class', 'localized-add form-field-button')
            .attr('tabindex', -1)
            .call(svgIcon('#iD-icon-plus'))
            .merge(translateButton);

        translateButton
            .classed('disabled', !!isLocked)
            .call(isLocked ? _buttonTip.destroy : _buttonTip)
            .on('click', addNew);


        if (_tags && !_multilingual.length) {
            calcMultilingual(_tags);
        }

        localizedInputs = selection.selectAll('.localized-multilingual')
            .data([0]);

        localizedInputs = localizedInputs.enter()
            .append('div')
            .attr('class', 'localized-multilingual')
            .merge(localizedInputs);

        localizedInputs
            .call(renderMultilingual);

        localizedInputs.selectAll('button, input')
            .classed('disabled', !!isLocked)
            .attr('readonly', isLocked || null);



        // We are not guaranteed to get an `accept` or `cancel` when blurring the field.
        // (This can happen if the user actives the combo, arrows down, and then clicks off to blur)
        // So compare the current field value against the suggestions one last time.
        function checkBrandOnBlur() {
            var latest = _entityIDs.length === 1 && context.hasEntity(_entityIDs[0]);
            if (!latest) return;   // deleting the entity blurred the field?

            var preset = presetManager.match(latest, context.graph());
            if (preset && preset.suggestion) return;   // already accepted

            // note: here we are testing against "decorated" names, i.e. 'Starbucks – Cafe'
            var name = utilGetSetValue(input).trim();
            var matched = allSuggestions.filter(function(s) { return name === s.name(); });

            if (matched.length === 1) {
                acceptBrand({ suggestion: matched[0] });
            } else {
                cancelBrand();
            }
        }


        function acceptBrand(d) {

            var entity = _entityIDs.length === 1 && context.hasEntity(_entityIDs[0]);

            if (!d || !entity) {
                cancelBrand();
                return;
            }

            var tags = entity.tags;
            var geometry = entity.geometry(context.graph());
            var removed = preset.unsetTags(tags, geometry);
            for (var k in tags) {
                tags[k] = removed[k];  // set removed tags to `undefined`
            }
            tags = d.suggestion.setTags(tags, geometry);
            utilGetSetValue(input, tags.name);
            dispatch.call('change', this, tags);
        }


        // user hit escape, clean whatever preset name appears after the last ' – '
        function cancelBrand() {
            var name = utilGetSetValue(input);
            var clean = cleanName(name);
            if (clean !== name) {
                utilGetSetValue(input, clean);
                dispatch.call('change', this, { name: clean });
            }
        }

        // Remove whatever is after the last ' – '
        // NOTE: split/join on en-dash, not a hyphen (to avoid conflict with fr - nl names in Brussels etc)
        function cleanName(name) {
            var parts = name.split(' – ');
            if (parts.length > 1) {
                parts.pop();
                name = parts.join(' – ');
            }
            return name;
        }


        function fetchBrandNames(preset, suggestions) {
            var pTag = preset.id.split('/', 2);
            var pKey = pTag[0];
            var pValue = pTag[1];

            return function(value, callback) {
                var results = [];
                if (value && value.length > 2) {
                    for (var i = 0; i < suggestions.length; i++) {
                        var s = suggestions[i];

                        // don't suggest brands from incompatible countries
                        if (_countryCode && s.countryCodes &&
                            s.countryCodes.indexOf(_countryCode) === -1) continue;

                        var sTag = s.id.split('/', 2);
                        var sKey = sTag[0];
                        var sValue = sTag[1];
                        var name = s.name();
                        var dist = utilEditDistance(value, name.substring(0, value.length));
                        var matchesPreset = (pKey === sKey && (!pValue || pValue === sValue));

                        if (dist < 1 || (matchesPreset && dist < 3)) {
                            var obj = {
                                title: name,
                                value: name,
                                suggestion: s,
                                dist: dist + (matchesPreset ? 0 : 1)  // penalize if not matched preset
                            };
                            results.push(obj);
                        }
                    }
                    results.sort(function(a, b) { return a.dist - b.dist; });
                }
                results = results.slice(0, 10);
                callback(results);
            };
        }


        function addNew() {
            d3_event.preventDefault();
            if (field.locked()) return;

            var defaultLang = localizer.languageCode().toLowerCase();
            var langExists = _multilingual.find(function(datum) { return datum.lang === defaultLang; });
            var isLangEn = defaultLang.indexOf('en') > -1;
            if (isLangEn || langExists) {
                defaultLang = '';
                langExists = _multilingual.find(function(datum) { return datum.lang === defaultLang; });
            }

            if (!langExists) {
                // prepend the value so it appears at the top
                _multilingual.unshift({ lang: defaultLang, value: '' });

                localizedInputs
                    .call(renderMultilingual);
            }
        }


        function change(onInput) {
            return function() {
                if (field.locked()) {
                    d3_event.preventDefault();
                    return;
                }

                var val = utilGetSetValue(d3_select(this));
                if (!onInput) val = context.cleanTagValue(val);

                // don't override multiple values with blank string
                if (!val && Array.isArray(_tags[field.key])) return;

                var t = {};

                t[field.key] = val || undefined;
                dispatch.call('change', this, t, onInput);
            };
        }
    }


    function key(lang) {
        return field.key + ':' + lang;
    }


    function changeLang(d) {
        var tags = {};

        // make sure unrecognized suffixes are lowercase - #7156
        var lang = utilGetSetValue(d3_select(this)).toLowerCase();

        var language = _languagesArray.find(function(d) {
            return d.label.toLowerCase() === lang ||
                (d.localName && d.localName.toLowerCase() === lang) ||
                (d.nativeName && d.nativeName.toLowerCase() === lang);
        });
        if (language) lang = language.code;

        if (d.lang && d.lang !== lang) {
            tags[key(d.lang)] = undefined;
        }

        var newKey = lang && context.cleanTagKey(key(lang));

        var value = utilGetSetValue(d3_select(this.parentNode).selectAll('.localized-value'));

        if (newKey && value) {
            tags[newKey] = value;
        } else if (newKey && _wikiTitles && _wikiTitles[d.lang]) {
            tags[newKey] = _wikiTitles[d.lang];
        }

        d.lang = lang;
        dispatch.call('change', this, tags);
    }


    function changeValue(d) {
        if (!d.lang) return;
        var value = context.cleanTagValue(utilGetSetValue(d3_select(this))) || undefined;

        // don't override multiple values with blank string
        if (!value && Array.isArray(d.value)) return;

        var t = {};
        t[key(d.lang)] = value;
        d.value = value;
        dispatch.call('change', this, t);
    }


    function fetchLanguages(value, cb) {
        var v = value.toLowerCase();

        // show the user's language first
        var langCodes = [localizer.localeCode(), localizer.languageCode()];

        if (_countryCode && _territoryLanguages[_countryCode]) {
            langCodes = langCodes.concat(_territoryLanguages[_countryCode]);
        }

        var langItems = [];
        langCodes.forEach(function(code) {
            var langItem = _languagesArray.find(function(item) {
                return item.code === code;
            });
            if (langItem) langItems.push(langItem);
        });
        langItems = utilArrayUniq(langItems.concat(_languagesArray));

        cb(langItems.filter(function(d) {
            return d.label.toLowerCase().indexOf(v) >= 0 ||
                (d.localName && d.localName.toLowerCase().indexOf(v) >= 0) ||
                (d.nativeName && d.nativeName.toLowerCase().indexOf(v) >= 0) ||
                d.code.toLowerCase().indexOf(v) >= 0;
        }).map(function(d) {
            return { value: d.label };
        }));
    }


    function renderMultilingual(selection) {
        var entries = selection.selectAll('div.entry')
            .data(_multilingual, function(d) { return d.lang; });

        entries.exit()
            .style('top', '0')
            .style('max-height', '240px')
            .transition()
            .duration(200)
            .style('opacity', '0')
            .style('max-height', '0px')
            .remove();

        var entriesEnter = entries.enter()
            .append('div')
            .attr('class', 'entry')
            .each(function(_, index) {
                var wrap = d3_select(this);

                var domId = utilUniqueDomId(index);

                var label = wrap
                    .append('label')
                    .attr('class', 'field-label')
                    .attr('for', domId);

                var text = label
                    .append('span')
                    .attr('class', 'label-text');

                text
                    .append('span')
                    .attr('class', 'label-textvalue')
                    .text(t('translate.localized_translation_label'));

                text
                    .append('span')
                    .attr('class', 'label-textannotation');

                label
                    .append('button')
                    .attr('class', 'remove-icon-multilingual')
                    .on('click', function(d, index) {
                        if (field.locked()) return;
                        d3_event.preventDefault();

                        if (!d.lang || !d.value) {
                            _multilingual.splice(index, 1);
                            renderMultilingual(selection);
                        } else {
                            // remove from entity tags
                            var t = {};
                            t[key(d.lang)] = undefined;
                            dispatch.call('change', this, t);
                        }

                    })
                    .call(svgIcon('#iD-operation-delete'));

                wrap
                    .append('input')
                    .attr('class', 'localized-lang')
                    .attr('id', domId)
                    .attr('type', 'text')
                    .attr('placeholder', t('translate.localized_translation_language'))
                    .on('blur', changeLang)
                    .on('change', changeLang)
                    .call(langCombo);

                wrap
                    .append('input')
                    .attr('type', 'text')
                    .attr('class', 'localized-value')
                    .on('blur', changeValue)
                    .on('change', changeValue);
            });

        entriesEnter
            .style('margin-top', '0px')
            .style('max-height', '0px')
            .style('opacity', '0')
            .transition()
            .duration(200)
            .style('margin-top', '10px')
            .style('max-height', '240px')
            .style('opacity', '1')
            .on('end', function() {
                d3_select(this)
                    .style('max-height', '')
                    .style('overflow', 'visible');
            });

        entries = entries.merge(entriesEnter);

        entries.order();

        entries.classed('present', function(d) {
            return d.lang && d.value;
        });

        utilGetSetValue(entries.select('.localized-lang'), function(d) {
            return localizer.languageName(d.lang);
        });

        utilGetSetValue(entries.select('.localized-value'), function(d) {
                return typeof d.value === 'string' ? d.value : '';
            })
            .attr('title', function(d) {
                return Array.isArray(d.value) ? d.value.filter(Boolean).join('\n') : null;
            })
            .attr('placeholder', function(d) {
                return Array.isArray(d.value) ? t('inspector.multiple_values') : t('translate.localized_translation_name');
            })
            .classed('mixed', function(d) {
                return Array.isArray(d.value);
            });
    }


    localized.tags = function(tags) {
        _tags = tags;

        // Fetch translations from wikipedia
        if (typeof tags.wikipedia === 'string' && !_wikiTitles) {
            _wikiTitles = {};
            var wm = tags.wikipedia.match(/([^:]+):(.+)/);
            if (wm && wm[0] && wm[1]) {
                wikipedia.translations(wm[1], wm[2], function(err, d) {
                    if (err || !d) return;
                    _wikiTitles = d;
                });
            }
        }

        var isMixed = Array.isArray(tags[field.key]);

        utilGetSetValue(input, typeof tags[field.key] === 'string' ? tags[field.key] : '')
            .attr('title', isMixed ? tags[field.key].filter(Boolean).join('\n') : undefined)
            .attr('placeholder', isMixed ? t('inspector.multiple_values') : field.placeholder())
            .classed('mixed', isMixed);

        calcMultilingual(tags);

        _selection
            .call(localized);
    };


    localized.focus = function() {
        input.node().focus();
    };


    localized.entityIDs = function(val) {
        if (!arguments.length) return _entityIDs;
        _entityIDs = val;
        _multilingual = [];
        loadCountryCode();
        return localized;
    };

    function loadCountryCode() {
        var extent = combinedEntityExtent();
        var countryCode = extent && countryCoder.iso1A2Code(extent.center());
        _countryCode = countryCode && countryCode.toLowerCase();
    }

    function combinedEntityExtent() {
        return _entityIDs && _entityIDs.length && utilTotalExtent(_entityIDs, context.graph());
    }

    return utilRebind(localized, dispatch, 'on');
}
