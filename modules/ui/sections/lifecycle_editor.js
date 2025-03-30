import { t } from '../../core/localizer';
import { uiSection } from '../section';
import { svgIcon } from '../../svg/icon';
import { utilArrayIdentical } from '../../util/array';
import { uiTagReference } from '../tag_reference';
import { utilRebind } from '../../util';
import { uiField } from '../field';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import { osmLifecyclePrefixes, osmGetLifecyclePrefix, osmGetKeyWithoutLifecycle} from '../../osm/tags';
import { uiCombobox } from '../combobox';

export function uiSectionLifecycleEditor(context) {

    var dispatch = d3_dispatch('change');
    var _entityIDs;
    var _tags;
    var _pendingChange = null;
    var _currentLifecycle = 'functional';
    var _mainKey = '';
    var _extraFieldsWithLifecycle;
    var _extraTags;
    var _showBlank = false;
    var _presets = [];
    var _presetFieldsKey = [];
    var _fieldsArr = [];

    const _lifecyclePresets = Object.values(osmLifecyclePrefixes);
    const _ids = Object.keys(osmLifecyclePrefixes);
    const _visibleByDeafult = _lifecyclePresets
        .filter(obj => obj.visibleByDeafult)
        .map(obj => ({ value: obj.id }));

    var section = uiSection('lifecycle-editor', context)
        .shouldDisplay(function() {
            return true;
        })
        .label(() => t.append('inspector.lifecycle'))
        .expandedByDefault(false)
        .disclosureContent(renderDisclosureContent);

    var mainLifecycleWrap = d3_select(null);
    var extraLifecycleWrap = d3_select(null);
    var referenceWrap = d3_select(null);
    var outerWrap = d3_select(null);
    var titleWrap = d3_select(null);
    var radioOuterWrap = d3_select(null);
    var radioRowWrap = d3_select(null);
    var radioButtonWrap = d3_select(null);
    var addExtraTagList = d3_select(null);

    function renderDisclosureContent(selection) {
        outerWrap.remove();

        _showBlank = false;
        _fieldsArr = [];

        _currentLifecycle = _presets[0].lifecycle;

        const presetSplit = _presets[0].id.split('/');

        if (_ids.includes(presetSplit[0])) {
            _mainKey = presetSplit[1];
        } else {
            _mainKey = presetSplit[0];
        }

        outerWrap = selection
            .append('div')
            .attr('class', 'wrap-form-field wrap-form-field-lifecycle');

        mainLifecycleWrap = outerWrap.append('div').attr('class', 'lifecycle-main');
        extraLifecycleWrap = outerWrap.append('div').attr('class', 'lifecycle-extra');
        referenceWrap = outerWrap.append('div').attr('class', 'lifecyce-reference');

        _presetFieldsKey = _presets[0].fields().filter(a => a.key).map(a => a.key);


        createMainLifecycleMenu(mainLifecycleWrap);

        _extraTags = getExtraTags();
        if (Object.entries(_extraTags).length !== 0) {
            _extraFieldsWithLifecycle = getExtraFieldsWithLifecycle();
        }

        createExtraLifecycleMenu(extraLifecycleWrap);
        createReference(referenceWrap);
    }

    function createMainLifecycleMenu(selection){
        const lifecycleToRender = getLifecycleToRender();

        titleWrap = selection
            .append('label')
            .attr('class', 'field-label');

        var titleText = titleWrap
            .append('span')
            .attr('class', 'label-text');

        titleText
            .append('span')
            .attr('class', 'label-textvalue')
            .text(t('inspector.lifecycle_title'));

        radioOuterWrap = selection
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-radio');

        radioOuterWrap
            .append('input')
            .attr('type', 'radio')
            .attr('name', 'lifecycle-radio')
            .attr('value', 'functional')
            .attr('style', 'display:none')
            .attr('checked', checkRadio);

        titleWrap
            .append('button')
            .attr('class', 'remove-icon')
            .attr('id', 'make-functional')
            .attr('title', t('icons.make_functional'))
            .attr('style', _currentLifecycle === 'functional' ? 'display:none' : 'display:block')
            .call(svgIcon('#iD-icon-minus'))
            .on('click', makeFunctional);

        radioRowWrap = radioOuterWrap
            .selectAll('.lifecycle-radio-row')
            .data(lifecycleToRender)
            .enter()
            .append('label');

        radioButtonWrap = radioRowWrap
            .append('div')
            .attr('class', 'lifecycle-radio-row');

        radioButtonWrap
            .append('input')
            .attr('type', 'radio')
            .attr('name', 'lifecycle-radio')
            .attr('value', function(d) { return d.id; })
            .attr('checked', checkRadio)
            .on('change', changeLifecycle);

        radioButtonWrap
            .append('label')
            .attr('class', 'lifecycle-icon')
            .each(function(d) {
                svgIcon(d.icon)(d3_select(this));
            });

        radioButtonWrap
            .append('span')
            .each(function(d) {
                t.append('lifecycle.' + d.id)(d3_select(this));
            });

        if (Object.keys(_presets[0].tags).length === 0 || _presets[0].id === 'area') {
            outerWrap.attr('class', 'wrap-form-field-lifecycle-disabled');
        }

        if (_presets.length > 1) {
            outerWrap.attr('class', 'wrap-form-field-lifecycle-disabled');
        }

    }

    function createExtraLifecycleMenu(selection){
        const extraTags = _extraTags;
        const presetFieldsKey = _presetFieldsKey;

        const extraTagKeys = Object.keys(extraTags);

        const prefixCombobox = uiCombobox(context).data(_visibleByDeafult);
        const fieldKeyCombobox = uiCombobox(context).data(presetFieldsKey.map(data => ({ value: data })));

        addExtraTagList = selection
            .append('ul')
            .attr('class', 'member-list');

        // ==== SHOW EXTRA TAGS ====
        if (extraTagKeys.length && extraTagKeys.length > 0) {

            addExtraTagList = addExtraTagList
                .selectAll('li')
                .data(extraTagKeys)
                .enter();

            let extraTagRow = addExtraTagList
                .append('li')
                .attr('class', 'member-row form-field');

            let innerRowLabel = extraTagRow
                .append('label')
                .attr('class', 'field-label');

            let buttonWrap = innerRowLabel
                .append('div')
                .attr('class', 'lifecycle-extra-icon');

            buttonWrap
                .append('label')
                .each(function(d) {
                    let comp = osmLifecyclePrefixes[osmGetLifecyclePrefix(d)] ?? osmLifecyclePrefixes.construction;
                    const icon = comp.icon;
                    d3_select(this).call(svgIcon(icon));
                });

            var alreadyExistingKeyInput = buttonWrap
                .append('input')
                .attr('type', 'text')
                .attr('class', 'lifecycle-extra-input member-role')
                .property('id', d => _tags[d] === 'construction' ? 'construction:' + d : d)
                .property('value', d => {
                    let s = osmLifecyclePrefixes[osmGetLifecyclePrefix(d)] ?? osmLifecyclePrefixes.construction;
                    return t('lifecycle.' + s.id);
                })
                .on('blur', changeExtraLifecycle)
                .on('change', changeExtraLifecycle);

            prefixCombobox(alreadyExistingKeyInput);


            innerRowLabel
                .each(function(d) {
                    const field = _extraFieldsWithLifecycle.find(a =>
                        d.includes(':') ? a.key === osmGetKeyWithoutLifecycle(d) : a.key === d
                    );
                    if (field) {
                        let tagsWithoutLifecycles = {};
                        const fieldUI = uiField(context, field, _entityIDs);

                        Object.entries(_tags).forEach(([key, value]) => {
                            let keyNoLifecycle = key.includes(':') ? osmGetKeyWithoutLifecycle(key) : key;
                            tagsWithoutLifecycles[keyNoLifecycle] = value;
                        });

                        fieldUI.lifecycle = d.includes(':') ? osmGetLifecyclePrefix(d) : 'construction';
                        fieldUI.tags(tagsWithoutLifecycles);
                        _fieldsArr.push(fieldUI);
                        d3_select(this).call(fieldUI.render);
                }
            });

            _fieldsArr.forEach(function(field) {
                field
                    .on('change', function(t, onInput) {
                        if (field.lifecycle !== 'construction') {
                            t = Object.fromEntries(
                                Object.entries(t).map(([key, value]) => [`${field.lifecycle}:${key}`, value ?? ''])
                            );
                        } else {
                            t = Object.fromEntries(
                                Object.entries(t).map(([, value]) => ['construction', value ?? ''])
                            );
                        }
                        dispatch.call('change', field, _entityIDs, t, onInput);
                });
            });

            innerRowLabel.selectAll('.remove-icon').remove();
            // innerRowLabel.selectAll('.form-field-button').remove();

            innerRowLabel
                .append('button')
                .property('id', d => _tags[d] === 'construction' ? 'construction:' + d : d)
                .attr('class', 'make-functional')
                .attr('title', t('icons.make_functional'))
                .call(svgIcon('#iD-icon-minus'))
                .on('click', makeExtraFunctional);

            innerRowLabel
                .append('button')
                .property('id', d => _tags[d] === 'construction' ? 'construction:' + d : d)
                .attr('class', 'remove')
                .attr('title', t('icons.remove'))
                .call(svgIcon('#iD-operation-delete'))
                .on('click', deleteExtraTag);
        }

        // ==== NEW EXTRA TAG ====
        let addExtraTagRowNew = selection
            .append('li')
            .attr('class', 'lifecycle-new-row form-field')
            .attr('style', _showBlank ? 'display:block' : 'display:none');

        let innerRowLabelNew = addExtraTagRowNew
            .append('label')
            .attr('class', 'field-label');

        var newPrefixWrap = innerRowLabelNew
            .append('div')
            .attr('class', 'lifecycle-new-wrap');

        var inputPrefix = newPrefixWrap
            .append('input')
            .attr('type', 'text')
            .attr('placeholder', t('inspector.prefix'))
            .attr('style', 'border-right : 1px solid #ccc !important')
            .attr('class', 'lifecycle-extra lifecycle-extra-new-prefix')
            .on('blur', addExtraLifecycle)
            .on('change', addExtraLifecycle);

        var newKeyWrap = innerRowLabelNew
            .append('div')
            .attr('class', 'lifecycle-new-wrap');

        var inputKey = newKeyWrap
            .append('input')
            .attr('type', 'text')
            .attr('class', 'lifecycle-extra lifecycle-extra-new-key')
            .attr('placeholder', t('inspector.key'))
            .on('blur', addExtraLifecycle)
            .on('change', addExtraLifecycle);

        innerRowLabelNew
            .append('button')
            .attr('class', 'remove lifecycle-extra-delete')
            .attr('title', t('icons.remove'))
            .call(svgIcon('#iD-operation-delete'))
            .on('click', hideNewExtraTag);

        /*
        let innerRowWrapNew = addExtraTagRowNew
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-member');

        innerRowWrapNew
            .append('input')
            .attr('type', 'text')
            .attr('placeholder', t('inspector.value'))
            .attr('class', 'combobox-input lifecycle-extra-new-value')
            .on('blur', addExtraTag)
            .on('change', addExtraTag);
        */

        let addRowEnterNew = selection
            .append('div')
            .attr('class', 'add-row');

        let addLifecycleButton = addRowEnterNew
            .append('button')
            .attr('class', 'add-lifecycle');

        addLifecycleButton
            .call(svgIcon('#iD-icon-plus', 'light'));

        addLifecycleButton.on('click', function() {

            if (!_showBlank) {
                _showBlank = true;
                addExtraTagRowNew.attr('style', 'display:block');
            }
        });

        // preserve space
        addRowEnterNew
            .append('div')
            .attr('class', 'space-value');

        addRowEnterNew
            .append('div')
            .attr('class', 'space-buttons');

        prefixCombobox(inputPrefix);
        fieldKeyCombobox(inputKey);
    }

    function createReference(selection){
        let reference = uiTagReference(
            {
                message: 'lifecycleReference',
                referenceLink : 'https://wiki.openstreetmap.org/wiki/Lifecycle_prefix'
            },
            context);

        titleWrap
            .call(reference.button);

        selection
            .append('div')
            .call(reference.body)
            .attr('class', 'reference-box');
    }

    function hideNewExtraTag() {
        d3_select('.lifecycle-extra-new-key').property('value', '');
        d3_select('.lifecycle-extra-new-prefix').property('value', '');
        d3_select('.lifecycle-extra-new-value').property('value', '');

        d3_select(this.parentNode.parentNode).attr('style', 'display:none');

        _showBlank = false;
    }

    function getLifecycleToRender(){
        const render = _lifecyclePresets.filter(tag => tag.visibleByDeafult);
        const renderIds = new Set(render.map(tag => tag.id));
        const entityTag = _tags;
        const preset = _presets[0];
        const mainTag = (Object.keys(preset.tags));
        var newTags = [];

        for (let et in entityTag) {
            if (et.includes(mainTag)) {
                newTags.push(osmGetLifecyclePrefix(et));
            }
        }

        _ids.forEach(id => {
            if (newTags.includes(id) && !renderIds.has(id)) {
                render.push(_lifecyclePresets.find(tag => (tag.id === id)));
            }
        });

        return render;
    }

    function checkRadio() {

        var id = d3_select(this).attr('value');

        if (id === 'functional') {
            return 'true';
        }

        if (id === _currentLifecycle) {
            return 'true';
        }

        return null;
    }

    function getExtraFieldsWithLifecycle() {
        const extraTagsWithoutLifecycle = Object.keys(_extraTags).map(a => osmGetKeyWithoutLifecycle(a));
        const extraFields = _presets[0].fields();
        return extraFields.filter(field => extraTagsWithoutLifecycle.includes(field.key));
    }

    function getExtraTags() {
        const tags = _tags;
        const mainKey = _mainKey;
        const presetFieldsKey = _presetFieldsKey;

        const tagsWithLifecycles = Object.fromEntries(
            _ids.flatMap(id =>
                Object.entries(tags).filter(([key, value]) => {
                    if (key.includes(':') && value !== 'construction') {
                        let parts = key.split(':');
                        let [prefix, tag] = [parts.shift(), parts.join(':')];
                        return prefix === id && presetFieldsKey.includes(tag);
                    } else if (value === 'construction' && _currentLifecycle !== 'construction') {
                        return presetFieldsKey.includes(key);
                    }
                    return false;
                })
            )
        );

        Object.keys(tagsWithLifecycles).forEach((key) => {
            const keyNoLifecycle = osmGetKeyWithoutLifecycle(key);
            if ((keyNoLifecycle === mainKey) || (keyNoLifecycle.includes('addr:'))) {
                delete tagsWithLifecycles[key];
            }
        });

        return tagsWithLifecycles;
    }

    function addExtraLifecycle() {
        const newKey =  d3_select('.lifecycle-extra-new-key').property('value');
        const newLifecycle = d3_select('.lifecycle-extra-new-prefix').property('value');
        // const newValue = d3_select('.lifecycle-extra-new-value').property('value') ?? 'yes';

        const tags = _tags;
        const ids = _ids;

        const newValue = tags[newKey];

        const presetFields = _presetFieldsKey;

        // Check if the new values are all valid
        if ((!newKey || newKey === '' || !newLifecycle || newLifecycle === '') ||
            (!_ids.includes(newLifecycle) || !presetFields.includes(newKey)) ||
            (newLifecycle === 'construction' && _currentLifecycle === 'construction')) {
            return;
        }

        // Check if the new key already exists
        for (let id of ids) {
            if (tags[id + ':' + newKey]) return;
        }

        _pendingChange = _pendingChange ?? {};

        if (newLifecycle === 'construction') {
            _pendingChange[newKey] = 'construction';
            _pendingChange.construction = newValue ?? '';
        } else {
            _pendingChange[newKey] = undefined;
            _pendingChange[newLifecycle + ':' + newKey] = newValue ?? '';
        }

        _showBlank = false;

        scheduleChange();
    }

    function changeLifecycle() {
        if (d3_select(this).attr('readonly')) return;

        const tags = _tags;
        const mainKey = _mainKey;
        let oldValue = tags[mainKey];
        const newLifecycle = d3_select(this).attr('value');
        const oldLifecycle = _currentLifecycle;

        if (_ids.includes(oldValue)) oldValue = 'yes';
        if (oldLifecycle === 'construction' && tags[mainKey]) oldValue = tags.construction ?? 'yes';

        _pendingChange = _pendingChange ?? {};
        _pendingChange[mainKey] = undefined;
        _pendingChange[oldLifecycle] = undefined;
        _pendingChange[oldLifecycle + ':' + mainKey] = undefined;

        if (oldLifecycle === 'functional') {
            if (newLifecycle !== 'construction') {
                _pendingChange[newLifecycle + ':' + mainKey] = oldValue ?? 'yes';
            } else {
                _pendingChange[mainKey] = 'construction';
                _pendingChange.construction = oldValue ?? 'yes';
            }
        } else {
            if (oldLifecycle !== 'construction') {
                if (newLifecycle === 'construction') {
                    _pendingChange[mainKey] = 'construction';
                    _pendingChange.construction = tags[oldLifecycle + ':' + mainKey] ?? 'yes';
                } else {
                    _pendingChange[newLifecycle + ':' + mainKey] = tags[oldLifecycle + ':' + mainKey] ?? oldValue ?? 'yes';
                }
            } else {
                _pendingChange[newLifecycle + ':' + mainKey] = oldValue;
            }
        }

        scheduleChange();
    }

    function changeExtraLifecycle() {
        if (d3_select(this).attr('readonly')) return;

        const tags = _tags;
        const newLifecycle = d3_select(this).property('value');
        const oldTag = d3_select(this).property('id');
        const parts = oldTag.split(':');
        const [oldLifecycle, oldKey] = [parts.shift(), parts.join(':')];
        let oldValue = tags[oldTag];

        _pendingChange = _pendingChange ?? {};

        if ((!_ids.includes(newLifecycle) || newLifecycle === oldLifecycle)
            || (_currentLifecycle === 'construction' && newLifecycle === 'construction')) {
            d3_select(this).property('value', t('lifecycle.' + osmLifecyclePrefixes[osmGetLifecyclePrefix(oldTag)].id));
            return;
        }

        if (oldKey.includes('addr')) {
            Object.keys(tags).forEach((key) => {
                if (key.includes('addr')) {
                    if (newLifecycle !== 'construction') {
                        _pendingChange[newLifecycle + ':' + osmGetKeyWithoutLifecycle(key)] = tags[key];
                    } else {
                        _pendingChange[osmGetKeyWithoutLifecycle(key)] = tags[key] ?? 'addr';
                    }
                    _pendingChange[key] = undefined;
                }
            });
        }

        _pendingChange[oldKey] = undefined;
        _pendingChange[oldLifecycle + ':' + oldKey] = undefined;

        if (oldLifecycle !== 'construction') {
            if (newLifecycle === 'construction') {
                _pendingChange[oldKey] = 'construction';
                _pendingChange.construction = tags[oldLifecycle + ':' + oldKey] ?? '';
            } else {
                _pendingChange[newLifecycle + ':' + oldKey] = tags[oldLifecycle + ':' + oldKey] ?? oldValue ?? '';
            }
        } else {
            oldValue = tags.construction;
            _pendingChange.construction = undefined;
            _pendingChange[newLifecycle + ':' + oldKey] = oldValue;
        }

        scheduleChange();
    }

    function makeFunctional() {
        const oldLifecycle = _currentLifecycle;
        const tags = _tags;
        const mainKey = _mainKey;
        let mainValue = tags[oldLifecycle + ':' + mainKey] ?? tags[mainKey];

        if (_ids.includes(mainValue)) mainValue = 'yes';

        if (oldLifecycle === 'construction') mainValue = tags.construction;

        _pendingChange = _pendingChange ?? {};
        _pendingChange[mainKey] =  mainValue ?? 'yes';
        _pendingChange[oldLifecycle] = undefined;
        _pendingChange[oldLifecycle + ':' + mainKey] = undefined;

        scheduleChange();
    }

    function makeExtraFunctional() {
        const oldLifecycleTag = d3_select(this).attr('id');
        const tags = _tags;

        _pendingChange = _pendingChange ?? {};

        if (oldLifecycleTag.includes('addr')) {
            Object.keys(tags).forEach((key) => {
                if (key.includes('addr')) {
                    _pendingChange[osmGetKeyWithoutLifecycle(key)] = tags[key];
                    _pendingChange[key] = undefined;
                }
            });
        } else {
            if (oldLifecycleTag) {
                const oldTag = osmGetKeyWithoutLifecycle(oldLifecycleTag);
                const oldPrefix = osmGetLifecyclePrefix(oldLifecycleTag);
                _pendingChange[oldTag] = tags[oldLifecycleTag];
                _pendingChange[oldLifecycleTag] = undefined;
                if (oldPrefix === 'construction') {
                    _pendingChange.construction = undefined;
                }
            }
        }

        scheduleChange();
    }

    function deleteExtraTag() {
        const oldLifecycleTag = d3_select(this).attr('id');
        const tags = _tags;

        _pendingChange = _pendingChange ?? {};

        if (oldLifecycleTag.includes('addr')) {
            Object.keys(tags).forEach((key) => {
                if (key.includes('addr')) _pendingChange[key] = undefined;
            });
        } else {
            if (oldLifecycleTag) {
                const oldKey = osmGetKeyWithoutLifecycle(oldLifecycleTag);
                const oldPrefix = osmGetLifecyclePrefix(oldLifecycleTag);
                _pendingChange[oldKey] = undefined;
                _pendingChange[oldLifecycleTag] = undefined;
                if (oldPrefix === 'construction') {
                    _pendingChange.construction = undefined;
                }
            }
        }

        scheduleChange();
    }

    function scheduleChange() {
        var entityIDs = _entityIDs;

        window.setTimeout(function() {
            if (!_pendingChange) return;

            dispatch.call('change', this, entityIDs, _pendingChange);
            _pendingChange = null;
        }, 10);
    }

    section.entityIDs = function(val) {
        if (!arguments.length) return _entityIDs;
        if (!_entityIDs || !val || !utilArrayIdentical(_entityIDs, val)) {
            _entityIDs = val;
        }
        return section;
    };

    section.tags = function(val) {
        if (!arguments.length) return _tags;
        _tags = val;
        return section;
    };

    section.presets = function(val) {
        if (!arguments.length) return _presets;
        // don't reload the same preset
        if (!utilArrayIdentical(val, _presets)) {
            _presets = val;
        }

        return section;
    };


    return utilRebind(section, dispatch, 'on');
};
