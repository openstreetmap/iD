import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import * as countryCoder from '@rapideditor/country-coder';

import { presetManager } from '../../presets';
import { fileFetcher } from '../../core/file_fetcher';
import { t, localizer } from '../../core/localizer';
import { services } from '../../services';
import { svgIcon } from '../../svg';
import { uiTooltip } from '../tooltip';
import { uiCombobox } from '../combobox';
import { utilArrayUniq, utilGetSetValue, utilNoAuto, utilRebind, utilTotalExtent, utilUniqueDomId } from '../../util';
import { uiLengthIndicator } from '../length_indicator';

const _languagesArray = [];

export const LANGUAGE_SUFFIX_REGEX = /^(.*):([a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-[A-Z]{2})?)$/;

export function uiFieldLocalized(field, context) {
    const dispatch = d3_dispatch('change', 'input');
    const wikipedia = services.wikipedia;
    let input = d3_select(null);
    let localizedInputs = d3_select(null);
    const _lengthIndicator = uiLengthIndicator(context.maxCharsForTagValue());
    let _countryCode;
    let _tags;


    // A concern here in switching to async data means that _languagesArray will not
    // be available the first time through, so things like the fetchers and
    // the language() function will not work immediately.
    fileFetcher.get('languages')
        .then(loadLanguagesArray)
        .catch(function() { /* ignore */ });

    let _territoryLanguages = {};
    fileFetcher.get('territory_languages')
        .then(function(d) { _territoryLanguages = d; })
        .catch(function() { /* ignore */ });

    // reuse these combos
    const langCombo = uiCombobox(context, 'localized-lang')
        .fetcher(fetchLanguages)
        .minItems(0);

    let _selection = d3_select(null);
    let _multilingual = [];
    const _buttonTip = uiTooltip()
        .title(() => t.append('translate.translate'))
        .placement('left');
    let _wikiTitles;
    let _entityIDs = [];


    function loadLanguagesArray(dataLanguages) {
        if (_languagesArray.length !== 0) return;

        // some conversion is needed to ensure correct OSM tags are used
        const replacements = {
            sr: 'sr-Cyrl',      // in OSM, `sr` implies Cyrillic
            'sr-Cyrl': false    // `sr-Cyrl` isn't used in OSM
        };

        for (const code in dataLanguages) {
            if (replacements[code] === false) continue;
            let metaCode = code;
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
        // Protect name field for suggestion presets that don't display a brand/operator field
        const isLocked = (field.id === 'name') &&
            _entityIDs.length &&
            _entityIDs.some(function(entityID) {
                const entity = context.graph().hasEntity(entityID);
                if (!entity) return false;

                // Features linked to Wikidata are likely important and should be protected
                if (entity.tags.wikidata) return true;

                // Assume the name has already been confirmed if its source has been researched
                if (entity.tags['name:etymology:wikidata']) return true;

                // Lock the `name` if this is a suggestion preset that assigns the name,
                // and the preset does not display a `brand` or `operator` field.
                // (For presets like hotels, car dealerships, post offices, the `name` should remain editable)
                // see also similar logic in `outdated_tags.js`
                const preset = presetManager.match(entity, context.graph());
                if (preset) {
                    const isSuggestion = preset.suggestion;
                    const fields = preset.fields(entity.extent(context.graph()).center());
                    const showsBrandField = fields.some(function(d) { return d.id === 'brand'; });
                    const showsOperatorField = fields.some(function(d) { return d.id === 'operator'; });
                    const setsName = preset.addTags.name;
                    const setsBrandWikidata = preset.addTags['brand:wikidata'];
                    const setsOperatorWikidata = preset.addTags['operator:wikidata'];

                    return (isSuggestion && setsName && (
                        (setsBrandWikidata && !showsBrandField) ||
                        (setsOperatorWikidata && !showsOperatorField)
                    ));
                }

                return false;
            });

        field.locked(isLocked);
    }


    // update _multilingual, maintaining the existing order
    function calcMultilingual(tags) {
        const existingLangsOrdered = _multilingual.map(function(item) {
            return item.lang;
        });
        const existingLangs = new Set(existingLangsOrdered.filter(Boolean));

        for (const k in tags) {
            // matches for field:<code>, where <code> is a BCP 47 locale code
            // motivation is to avoid matching on similarly formatted tags that are
            // not for languages, e.g. name:left, name:source, etc.
            const m = k.match(LANGUAGE_SUFFIX_REGEX);
            if (m && m[1] === field.key && m[2]) {
                const item = { lang: m[2], value: tags[k] };
                if (existingLangs.has(item.lang)) {
                    // update the value
                    _multilingual[existingLangsOrdered.indexOf(item.lang)].value = item.value;
                    existingLangs.delete(item.lang);
                } else {
                    _multilingual.push(item);
                }
            }
        }

        // Don't remove items based on deleted tags, since this makes the UI
        // disappear unexpectedly when clearing values - #8164
        _multilingual.forEach(function(item) {
            if (item.lang && existingLangs.has(item.lang)) {
                item.value = '';
            }
        });
    }


    function localized(selection) {
        _selection = selection;
        calcLocked();
        const isLocked = field.locked();

        let wrap = selection.selectAll('.form-field-input-wrap')
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

        input
            .classed('disabled', !!isLocked)
            .attr('readonly', isLocked || null)
            .on('input', change(true))
            .on('blur', change())
            .on('change', change());

        wrap.call(_lengthIndicator);


        let translateButton = wrap.selectAll('.localized-add')
            .data([0]);

        translateButton = translateButton.enter()
            .append('button')
            .attr('class', 'localized-add form-field-button')
            .attr('aria-label', t('icons.plus'))
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
        selection.selectAll('.combobox-caret').classed('nope', true);


        function addNew(d3_event) {
            d3_event.preventDefault();
            if (field.locked()) return;

            let defaultLang = localizer.languageCode().toLowerCase();
            let langExists = _multilingual.find(function(datum) { return datum.lang === defaultLang; });
            const isLangEn = defaultLang.indexOf('en') > -1;
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
            return function(d3_event) {
                if (field.locked()) {
                    d3_event.preventDefault();
                    return;
                }

                let val = utilGetSetValue(d3_select(this));
                if (!onInput) val = context.cleanTagValue(val);

                // don't override multiple values with blank string
                if (!val && Array.isArray(_tags[field.key])) return;

                const t = {};

                t[field.key] = val || undefined;
                dispatch.call('change', this, t, onInput);
            };
        }
    }


    function key(lang) {
        return field.key + ':' + lang;
    }


    function changeLang(d3_event, d) {
        const tags = {};

        // make sure unrecognized suffixes are lowercase - #7156
        let lang = utilGetSetValue(d3_select(this)).toLowerCase();

        const language = _languagesArray.find(function(d) {
            return d.label.toLowerCase() === lang ||
                (d.localName && d.localName.toLowerCase() === lang) ||
                (d.nativeName && d.nativeName.toLowerCase() === lang);
        });
        if (language) lang = language.code;

        if (d.lang && d.lang !== lang) {
            tags[key(d.lang)] = undefined;
        }

        const newKey = lang && context.cleanTagKey(key(lang));

        const value = utilGetSetValue(d3_select(this.parentNode).selectAll('.localized-value'));

        if (newKey && value) {
            tags[newKey] = value;
        } else if (newKey && _wikiTitles && _wikiTitles[d.lang]) {
            tags[newKey] = _wikiTitles[d.lang];
        }

        d.lang = lang;
        dispatch.call('change', this, tags);
    }


    function changeValue(d3_event, d) {
        if (!d.lang) return;
        const value = context.cleanTagValue(utilGetSetValue(d3_select(this))) || undefined;

        // don't override multiple values with blank string
        if (!value && Array.isArray(d.value)) return;

        const t = {};
        t[key(d.lang)] = value;
        d.value = value;
        dispatch.call('change', this, t);
    }


    function fetchLanguages(value, cb) {
        const v = value.toLowerCase();

        // show the user's language first
        let langCodes = [localizer.localeCode(), localizer.languageCode()];

        if (_countryCode && _territoryLanguages[_countryCode]) {
            langCodes = langCodes.concat(_territoryLanguages[_countryCode]);
        }

        let langItems = [];
        langCodes.forEach(function(code) {
            const langItem = _languagesArray.find(function(item) {
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
        let entries = selection.selectAll('div.entry')
            .data(_multilingual, function(d) { return d.lang; });

        entries.exit()
            .style('top', '0')
            .style('max-height', '240px')
            .transition()
            .duration(200)
            .style('opacity', '0')
            .style('max-height', '0px')
            .remove();

        const entriesEnter = entries.enter()
            .append('div')
            .attr('class', 'entry')
            .each(function(_, index) {
                const wrap = d3_select(this);

                const domId = utilUniqueDomId(index);

                const label = wrap
                    .append('label')
                    .attr('class', 'field-label')
                    .attr('for', domId);

                const text = label
                    .append('span')
                    .attr('class', 'label-text');

                text
                    .append('span')
                    .attr('class', 'label-textvalue')
                    .call(t.append('translate.localized_translation_label'));

                text
                    .append('span')
                    .attr('class', 'label-textannotation');

                label
                    .append('button')
                    .attr('class', 'remove-icon-multilingual')
                    .attr('title', t('icons.remove'))
                    .on('click', function(d3_event, d) {
                        if (field.locked()) return;
                        d3_event.preventDefault();

                        // remove the UI item manually
                        _multilingual.splice(_multilingual.indexOf(d), 1);

                        const langKey = d.lang && key(d.lang);
                        if (langKey && langKey in _tags) {
                            delete _tags[langKey];
                            // remove from entity tags
                            const t = {};
                            t[langKey] = undefined;
                            dispatch.call('change', this, t);
                            return;
                        }

                        renderMultilingual(selection);
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

        // allow removing the entry UIs even if there isn't a tag to remove
        entries.classed('present', true);

        utilGetSetValue(entries.select('.localized-lang'), function(d) {
            const langItem = _languagesArray.find(function(item) {
                return item.code === d.lang;
            });
            if (langItem) return langItem.label;
            return d.lang;
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
            .attr('lang', function (d) {
                return d.lang;
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
            const wm = tags.wikipedia.match(/([^:]+):(.+)/);
            if (wm && wm[0] && wm[1]) {
                wikipedia.translations(wm[1], wm[2], function(err, d) {
                    if (err || !d) return;
                    _wikiTitles = d;
                });
            }
        }

        const isMixed = Array.isArray(tags[field.key]);

        utilGetSetValue(input, typeof tags[field.key] === 'string' ? tags[field.key] : '')
            .attr('title', isMixed ? tags[field.key].filter(Boolean).join('\n') : undefined)
            .attr('placeholder', isMixed ? t('inspector.multiple_values') : field.placeholder())
            .classed('mixed', isMixed);

        calcMultilingual(tags);

        _selection
            .call(localized);

        if (!isMixed) {
            _lengthIndicator.update(tags[field.key]);
        }
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
        const extent = combinedEntityExtent();
        const countryCode = extent && countryCoder.iso1A2Code(extent.center());
        _countryCode = countryCode && countryCode.toLowerCase();
    }

    function combinedEntityExtent() {
        return _entityIDs && _entityIDs.length && utilTotalExtent(_entityIDs, context.graph());
    }

    return utilRebind(localized, dispatch, 'on');
}
