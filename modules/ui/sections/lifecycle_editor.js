import { t } from '../../core/localizer';
import { uiSection } from '../section';
import { svgIcon } from '../../svg/icon';
import { utilArrayIdentical } from '../../util/array';
import { uiTagReference } from '../tag_reference';
import { utilRebind } from '../../util';
import { uiField } from '../field';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import { osmLifecyclePrefixes, osmGetLifecyclePrefix } from '../../osm/tags';
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

    const _lifecyclePresets = Object.values(osmLifecyclePrefixes);
    const ids = Object.keys(osmLifecyclePrefixes);
    const visibleByDeafult = _lifecyclePresets
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

        _currentLifecycle = _presets[0].lifecycle;

        if (ids.includes(_presets[0].id.split('/')[0])) {
            _mainKey = _presets[0].id.split('/')[1];
        } else {
            _mainKey = _presets[0].id.split('/')[0];
        }

        var lifecycleToRender = getLifecycleToRender();

        outerWrap = selection
            .append('div')
            .attr('class', 'wrap-form-field wrap-form-field-lifecycle');

        mainLifecycleWrap = outerWrap.append('div').attr('class', 'lifecycle-main');
        extraLifecycleWrap = outerWrap.append('div').attr('class', 'lifecycle-extra');
        referenceWrap = outerWrap.append('div').attr('class', 'lifecyce-reference');

        // Main Lifecycle Menu
        titleWrap = mainLifecycleWrap
            .append('label')
            .attr('class', 'field-label');

        var titleText = titleWrap
            .append('span')
            .attr('class', 'label-text');

        titleText
            .append('span')
            .attr('class', 'label-textvalue')
            .text('Select Lifecycle');

        radioOuterWrap = mainLifecycleWrap
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
            .attr('title', t('icons.remove'))
            .attr('style', _currentLifecycle === 'functional' ? 'display:none' : 'display:block')
            .call(svgIcon('#iD-operation-delete'))
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

        // Extra Lifecycle Menu
        _presetFieldsKey = _presets[0].fields().filter(a => a.key).map(a => a.key);
        _extraTags = getExtraTags();
        if (Object.entries(_extraTags).length !== 0) {
            _extraFieldsWithLifecycle = getExtraFieldsWithLifecycle();
        }

        const prefixCombobox = uiCombobox(context).data(visibleByDeafult);
        const fieldKeyCombobox = uiCombobox(context).data(_presetFieldsKey.map(data => ({ value: data })));
        const extraTagKeys = Object.keys(_extraTags);
        const extraTagValue = Object.values(_extraTags).filter(a => a.trim().length !== 0);

        addExtraTagList = extraLifecycleWrap
            .append('ul')
            .attr('class', 'member-list');

        // ==== SHOW EXTRA TAGS ====
        if (extraTagKeys.length && extraTagValue.length &&
            extraTagKeys.length > 0 && extraTagValue.length > 0) {

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
                    const icon = d.includes(':') ? osmLifecyclePrefixes[d.split(':')[0]].icon : osmLifecyclePrefixes.construction.icon;
                    d3_select(this).call(svgIcon(icon));
                });

            var alreadyExistingKeyInput = buttonWrap
                .append('input')
                .attr('type', 'text')
                .attr('class', 'lifecycle-extra-input member-role')
                .property('id', d => _tags[d] === 'construction' ? 'construction:' + d : d)
                .property('value', d => t('lifecycle.' + (d.includes(':') ? osmLifecyclePrefixes[d.split(':')[0]].id : osmLifecyclePrefixes.construction.id)))
                .on('blur', changeExtraLifecycle)
                .on('change', changeExtraLifecycle);

            prefixCombobox(alreadyExistingKeyInput);
        
            innerRowLabel
                .each(function(d) {
                    const field = _extraFieldsWithLifecycle.find(a => a.key === d.split(':')[1] || a.key === d);
                    if (field) {
                        let tagsWithoutLifecycles = {};

                        Object.entries(_tags).forEach(([key, value]) => {
                            const keyNoLifecycle = key.includes(":") ? key.split(":")[1] : key;
                            tagsWithoutLifecycles[keyNoLifecycle] = value;
                        });
                        const fieldUI = uiField(context, field, _entityIDs);
                        fieldUI.tags(tagsWithoutLifecycles);
                        d3_select(this).call(fieldUI.render);
                }
                    
            });

            innerRowLabel.selectAll('.remove-icon').remove();
            innerRowLabel.selectAll('.form-field-button').remove();
            
            innerRowLabel
                .append('button')
                .property('id', d => _tags[d] === 'construction' ? 'construction:' + d : d)
                .attr('class', 'remove')
                .attr('title', t('icons.remove'))
                .call(svgIcon('#iD-operation-delete'))
                .on('click', makeExtraFunctional);
        }

        // ==== NEW EXTRA TAG ====
        let addExtraTagRowNew = extraLifecycleWrap
            .append('li')
            .attr('class', 'lifecycle-row form-field')
            .attr('style', _showBlank ? 'display:block' : 'display:none');

        let innerRowLabelNew = addExtraTagRowNew
            .append('label')
            .attr('class', 'field-label');

        var inputPrefix = innerRowLabelNew
            .append('input')
            .attr('type', 'text')
            .attr('placeholder', t('inspector.prefix'))
            .attr('style', 'border-right : 1px solid #ccc !important')
            .attr('class', 'lifecycle-extra lifecycle-extra-new-prefix')
            .on('blur', addExtraTag)
            .on('change', addExtraTag);

        var inputKey = innerRowLabelNew
            .append('input')
            .attr('type', 'text')
            .attr('class', 'lifecycle-extra lifecycle-extra-new-key')
            .attr('placeholder', t('inspector.key'))
            .on('blur', addExtraTag)
            .on('change', addExtraTag);

        innerRowLabelNew
            .append('button')
            .attr('class', 'remove lifecycle-extra-delete')
            .attr('title', t('icons.remove'))
            .call(svgIcon('#iD-operation-delete'))
            .on('click', hideNewExtraTag);

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

        extraLifecycleWrap
            .append('div')
            .attr('style', 'height: 10px');

        let addRowEnterNew = extraLifecycleWrap
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

        addRowEnterNew
            .append('div')
            .attr('class', 'space-value');   // preserve space

        addRowEnterNew
            .append('div')
            .attr('class', 'space-buttons');  // preserve space

        prefixCombobox(inputPrefix);
        console.log(_presetFieldsKey);
        fieldKeyCombobox(inputKey);

        // Reference
        let reference = uiTagReference(
            {
                message: 'lifecycleReference',
                referenceLink : 'https://wiki.openstreetmap.org/wiki/Lifecycle_prefix'
            },
            context);

        titleWrap
            .call(reference.button);

        referenceWrap
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

        ids.forEach(id => {
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
        const extraTags = Object.keys(_extraTags).map(a => {
            if (a.includes(':')) return a.split(':')[1];
            else return a;
        });
        const extraFields = _presets[0].fields();
        return extraFields.filter(field => extraTags.includes(field.key));
    }

    function getExtraTags() {
        const tags = _tags;
        const mainKey = _mainKey;
        const presetFieldsKey = _presetFieldsKey;

        const tagsWithLifecycles = Object.fromEntries(
            ids.flatMap(id =>
                Object.entries(tags).filter(([key, value]) => {
                    let [prefix, tag] = key.split(':');
                    if (key.includes(':')) {
                        return prefix === id && presetFieldsKey.includes(tag);
                    } else if (value.includes('construction') && _currentLifecycle !== 'construction') {
                        return presetFieldsKey.includes(key);
                    }
                })
            )
        );

        if (tagsWithLifecycles.hasOwnProperty(mainKey)) {
            delete tagsWithLifecycles[mainKey];
        }

        return tagsWithLifecycles;
    }

    function addExtraTag() {
        const newKey =  d3_select('.lifecycle-extra-new-key').property('value');
        const newLifecycle = d3_select('.lifecycle-extra-new-prefix').property('value');
        const newValue = d3_select('.lifecycle-extra-new-value').property('value');

        const presetFields = _presetFieldsKey;

        if ((!newKey || newKey === '' || !newLifecycle || newLifecycle === '' || !newValue || newValue === '') || 
            (!ids.includes(newLifecycle) || !presetFields.includes(newKey)) ||
            (newLifecycle === 'construction' && _currentLifecycle === 'construction')) {
            return;
        }
        
        _pendingChange = _pendingChange ?? {};

        if (newLifecycle === 'construction') {
            _pendingChange[newKey] = 'construction';
            _pendingChange.construction = newValue;
        } else {
            _pendingChange[newLifecycle + ':' + newKey] = newValue;
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

        if (ids.includes(oldValue)) oldValue = 'yes';
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
        let [oldLifecycle, oldKey] = oldTag.split(':');
        let oldValue = tags[oldTag]; 

        _pendingChange = _pendingChange ?? {};

        if ((!ids.includes(newLifecycle) || newLifecycle === oldLifecycle) 
            || (_currentLifecycle === 'construction' && newLifecycle === 'construction')) {
            d3_select(this).property('value', t('lifecycle.' + osmLifecyclePrefixes[oldTag.split(':')[0]].id));
            return;
        }

        if(oldLifecycle === 'construction') {
            oldValue = tags.construction;
            _pendingChange.construction = undefined;
        }

        
        _pendingChange[oldKey] = undefined;
        _pendingChange[oldLifecycle + ':' + oldKey] = undefined;

        if (oldLifecycle !== 'construction') {
            if (newLifecycle === 'construction') {
                _pendingChange[oldKey] = 'construction';
                _pendingChange.construction = tags[oldLifecycle + ':' + oldKey] ?? 'yes';
            } else {
                _pendingChange[newLifecycle + ':' + oldKey] = tags[oldLifecycle + ':' + oldKey] ?? oldValue ?? 'yes';
            }
        } else {
            _pendingChange[newLifecycle + ':' + oldKey] = oldValue;
        }

        scheduleChange();
    }

    function makeFunctional() {
        const oldLifecycle = _currentLifecycle;
        const tags = _tags;
        const mainKey = _mainKey;
        let mainValue = tags[oldLifecycle + ':' + mainKey] ?? tags[mainKey];

        if (ids.includes(mainValue)) mainValue = 'yes';

        if (oldLifecycle === 'construction') mainValue = tags.construction;

        _pendingChange = _pendingChange ?? {};
        _pendingChange[mainKey] =  mainValue ?? 'yes';
        _pendingChange[oldLifecycle] = undefined;
        _pendingChange[oldLifecycle + ':' + mainKey] = undefined;

        scheduleChange();
    }

    function makeExtraFunctional(d) {
        const oldLifecycleTag = d3_select(this).attr('id');
        const tags = _tags;

        _pendingChange = _pendingChange ?? {};

        if (oldLifecycleTag) {
            const [oldPrefix, newTag] = oldLifecycleTag.split(':');
            _pendingChange[newTag] = tags[oldLifecycleTag];
            _pendingChange[oldLifecycleTag] = undefined;
            if (oldPrefix === 'construction') {
                _pendingChange.construction = undefined;
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
