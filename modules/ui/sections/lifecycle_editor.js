import { t } from '../../core/localizer';
import { uiSection } from '../section';
import { svgIcon } from '../../svg/icon';
import { utilArrayIdentical } from '../../util/array';
import { utilArrayUnion, utilRebind } from '../../util';
import { uiTagReference } from '../tag_reference';
import { geoExtent } from '../../geo/extent';
import { uiField } from '../field';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import { osmLifecyclePrefixes, osmGetLifecyclePrefix, osmGetKeyWithoutLifecycle} from '../../osm/tags';
import { uiCombobox } from '../combobox';
import { presetManager } from '../../presets';

export function uiSectionLifecycleEditor(context) {

    var dispatch = d3_dispatch('change');
    var _entityIDs, _tags, _pendingChange = null;
    var _currentLifecycle = 'functional';
    var _mainKey = '', _extraTags;
    var _allFields = [], _allFieldsKeys = [];
    var _showBlank = false, _presets = [], _reference, _fieldsArr = [];
    var presetsManager = presetManager;

    const _lifecyclePresets = Object.values(osmLifecyclePrefixes);
    const _ids = Object.keys(osmLifecyclePrefixes);

    // Only some lifecycles are visible by default.
    // This choise was made to narrow down the number of prefixes to the most used ones
    // You can still use many hidden lifecycles and they will be rendered nonetheless (like razed or dismantled)
    const _visibleByDefault = _lifecyclePresets
        .filter(obj => obj.visibleByDefault);

    var section = uiSection('lifecycle-editor', context)
        .shouldDisplay(() => true)
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
    var extraLifecycleError = d3_select(null);
    var addLifecycleButton = d3_select(null);
    var addRowEnterNew = d3_select(null);
    var addExtraTagRowNew = d3_select(null);

    function renderDisclosureContent(selection) {
        var enabledWrap = selection.select('.wrap-form-field-lifecycle');
        var disabledWrap = selection.select('.wrap-form-field-lifecycle-disabled');

        const shouldDisable = (_presets.length > 1 || Object.keys(_presets[0].tags).length === 0 || _presets[0].id === 'area');
        const className = shouldDisable ? 'wrap-form-field-lifecycle-disabled' : 'wrap-form-field-lifecycle';

        // Check if lifecycle menu already exists and match current state
        if (!disabledWrap.empty()) {
            outerWrap = shouldDisable ? disabledWrap : disabledWrap.attr('class', className);
        } else if (!enabledWrap.empty()) {
            outerWrap = shouldDisable ? enabledWrap.attr('class', className) : enabledWrap;
        } else {
            // if not create a new one
            outerWrap = selection.append('div').attr('class', className);
        }

        const preset = _presets[0];

        // Resets current Lifecycle if preset changed
        if (_mainKey && _currentLifecycle && _currentLifecycle !== preset.lifecycle) {
            _pendingChange = _pendingChange || {};
            _pendingChange[_currentLifecycle + ':' + _mainKey] = undefined;
            scheduleChange();
        }

        _currentLifecycle = preset.lifecycle;
        _mainKey = _ids.includes(preset.id.split('/')[0]) ? preset.id.split('/')[1] : preset.id.split('/')[0];

        const loc = _entityIDs.reduce(function(extent, entityID) {
                        var entity = context.graph().entity(entityID);
                        return extent.extend(entity.extent(context.graph()));
                    }, geoExtent()).center();

        var fields = preset.fields(loc);
        var moreFields = preset.moreFields(loc);
        var universalFields = presetsManager.universal();

        _allFields = utilArrayUnion(fields, moreFields);
        _allFields = utilArrayUnion(_allFields, universalFields);

        _allFields.forEach(field => {
            if (!field.key) field.key = field.id;
        });

        // If you want to add more complicated fields, remove '!field.keys'
        // if you want to add check fields, remove field.type !== 'check' && field.type !== 'onewayCheck'
        //_allFields = _allFields.filter(field => !field.keys && field.type !== 'check' && field.type !== 'onewayCheck' && field.key !== _mainKey);
        _allFields = _allFields.filter(field => !field.keys && field.key !== _mainKey);

        _allFieldsKeys = _allFields.map(field => field.key ?? field.id);

        _extraTags = getExtraTags();

        mainLifecycleWrap = outerWrap.select('.lifecycle-main');
        if (mainLifecycleWrap.empty()) {
            mainLifecycleWrap = outerWrap.append('div').attr('class', 'lifecycle-main');
        }

        extraLifecycleWrap = outerWrap.select('.lifecycle-extra');
        if (extraLifecycleWrap.empty()) {
            extraLifecycleWrap = outerWrap.append('div').attr('class', 'lifecycle-extra');
        }

        referenceWrap = outerWrap.select('.lifecycle-reference');
        if (referenceWrap.empty()) {
            referenceWrap = outerWrap.append('div').attr('class', 'lifecycle-reference');
        }

        mainLifecycleMenu(mainLifecycleWrap);
        extraLifecycleMenu(extraLifecycleWrap);
        referenceMenu(referenceWrap);
    }

    // Creates the radio button list
    function mainLifecycleMenu(mainLifecycleWrap){
        mainLifecycleWrap.selectAll('*').remove();
        const lifecycleToRender = getLifecycleToRender();

        titleWrap = mainLifecycleWrap
            .append('label')
            .attr('class', 'field-label');

        var titleText = titleWrap
            .append('span')
            .attr('class', 'label-text');

        titleText
            .append('span')
            .attr('class', 'label-textvalue')
            .text(t('inspector.lifecycle_title'));

        radioOuterWrap = mainLifecycleWrap
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-radio');

        radioOuterWrap
            .append('input')
            .attr('type', 'radio')
            .attr('class', 'lifecycle-radio-functional')
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

    }

    // Creates the extra lifecycle fields
    function extraLifecycleMenu(selection) {
        const extraTags = _extraTags;
        const allFields = _allFields;

        const extraTagKeys = Object.keys(extraTags);

        const prefixCombobox = uiCombobox(context).data(_visibleByDefault.map(field => ({
            display: function(sel) {
                sel.text(t('lifecycle.' + field.id));
            },
            value: field.id
        })));

        const fieldKeyCombobox = uiCombobox(context).data(allFields.map(field => ({
            display: function(sel) {
                sel.text(field.title());
            },
            value: field.key ?? field.id
        })));

        addExtraTagList = selection.select('.member-list');

        if (addExtraTagList.empty()) {
            addExtraTagList = selection
                .append('ul')
                .attr('class', 'member-list');
        }

        let extraTagRows = addExtraTagList
            .selectAll('li')
            .data(extraTagKeys, d => d);

        extraTagRows.exit().remove();

        let extraTagRowEnter = extraTagRows
            .enter()
            .append('li')
            .attr('id', d => d)
            .attr('class', 'member-row form-field');

        let innerRowLabel = extraTagRowEnter
            .append('label')
            .attr('class', 'field-label');

        let buttonWrap = innerRowLabel
            .append('div')
            .attr('class', 'lifecycle-extra-icon');

        buttonWrap
            .append('label')
            .each(function(d) {
                let comp = osmLifecyclePrefixes[osmGetLifecyclePrefix(d)];
                const icon = comp.icon;
                d3_select(this).call(svgIcon(icon));
            });

        var alreadyExistingKeyInput = buttonWrap
            .append('input')
            .attr('type', 'text')
            .attr('class', 'lifecycle-extra-input member-role')
            .property('id', d => d)
            .property('value', d => {
                let s = osmLifecyclePrefixes[osmGetLifecyclePrefix(d)];
                return t('lifecycle.' + s.id);
            })
            .on('blur', changeExtraLifecycle)
            .on('change', changeExtraLifecycle);

        prefixCombobox(alreadyExistingKeyInput);

        let extraTagRowUpdate = extraTagRowEnter.merge(extraTagRows);

        extraTagRowUpdate.each(function(d) {
            const field = allFields.find(obj => obj.key === osmGetKeyWithoutLifecycle(d) ||
                (obj.keys && obj.keys.includes(osmGetKeyWithoutLifecycle(d))));
            if (field) {
                let tagsWithoutLifecycles = {};
                const fieldUI = uiField(context, field, _entityIDs);

                Object.entries(_tags).forEach(([key, value]) =>
                    tagsWithoutLifecycles[osmGetKeyWithoutLifecycle(key)] = value
                );

                fieldUI.lifecycle = osmGetLifecyclePrefix(d);
                fieldUI.tags(tagsWithoutLifecycles);
                _fieldsArr.push(fieldUI);

                d3_select(this).select('.field-label').call(fieldUI.render);
            }
        });

        // The problem is that the check field has states, one state is undefined, but if the value is undefined it gets deleted from the tags!
        // I forced undefined to be smth like '' then the next cycle hoping this doesn't break stuff.
        _fieldsArr.forEach(function(field) {
            field.on('change', function(t) {
                t = Object.fromEntries(
                    Object.entries(t)
                        .map(([key, value]) => [`${field.lifecycle}:${key}`, value ?? ''])
                );
                dispatch.call('change', field, _entityIDs, t);
            });
        });

        innerRowLabel.selectAll('.modified-icon').remove();
        innerRowLabel.selectAll('.remove-icon').remove();

        var buttonDiv = innerRowLabel
            .append('div')
            .attr('class', 'lifecycle-extra-buttons');

        buttonDiv
            .append('button')
            .property('id', d => d)
            .attr('class', 'make-functional')
            .attr('title', t('icons.make_functional'))
            .call(svgIcon('#iD-icon-minus'))
            .on('click', makeExtraFunctional);

        buttonDiv
            .append('button')
            .property('id', d => d)
            .attr('class', 'remove')
            .attr('title', t('icons.remove'))
            .call(svgIcon('#iD-operation-delete'))
            .on('click', deleteExtraTag);

        // ==== NEW EXTRA TAG ====

        addExtraTagRowNew = selection.select('.lifecycle-new-row').remove();

        addExtraTagRowNew = selection
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

        addRowEnterNew = selection
            .select('.add-row')
            .remove();

        addRowEnterNew = selection
            .append('div')
            .attr('class', 'add-row');

        addLifecycleButton = addRowEnterNew
            .append('button')
            .attr('class', 'add-lifecycle');

        extraLifecycleError = addExtraTagRowNew
            .append('div')
            .attr('class', 'lifecycle-error');

        addLifecycleButton
            .call(svgIcon('#iD-icon-plus', 'light'));

        // preserve space
        addRowEnterNew
            .append('div')
            .attr('class', 'space-value');

        addRowEnterNew
            .append('div')
            .attr('class', 'space-buttons');

        addLifecycleButton.on('click', function() {
            if (!_showBlank) {
                _showBlank = true;
                extraLifecycleError.text('');
                addExtraTagRowNew.attr('style', 'display:block');
            }
        });

        prefixCombobox(inputPrefix);
        fieldKeyCombobox(inputKey);
    }

    // Shows referenceMenu when reference button is clicked
    function referenceMenu(selection){
        _reference = _reference ?? uiTagReference(
            {
                message: 'lifecycleReference',
                referenceLink : 'https://wiki.openstreetmap.org/wiki/Lifecycle_prefix'
            },
            context);

        let referenceBox = selection.select('.reference-box');

        if (referenceBox.empty()) {
            selection
                .append('div')
                .call(_reference.body)
                .attr('class', 'reference-box');
        }

        titleWrap
            .call(_reference.button);
    }

    // The input menu for extra lifecycle is hidden until + button is clicked
    function hideNewExtraTag() {
        d3_select('.lifecycle-extra-new-key').property('value', '');
        d3_select('.lifecycle-extra-new-prefix').property('value', '');

        d3_select(this.parentNode.parentNode).attr('style', 'display:none');

        _showBlank = false;
    }

    // Sometimes some lifecycle like "razed" are used and we don't want to hide them in the radio list
    function getLifecycleToRender(){
        const render = _lifecyclePresets.filter(tag => tag.visibleByDefault);
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

    // Checks whether a button should be or shouldn't be rendered as selected
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

    // Checks all the tags in the entity and seeks for lifecycle prefixes in non-main keys
    function getExtraTags() {
        const tags = _tags;
        const mainKey = _mainKey;
        const presetFieldsKey = _allFieldsKeys;

        const tagsWithLifecycles = Object.fromEntries(
            _ids.flatMap(id =>
                Object.entries(tags).filter(([key, ]) => {
                    if (key.includes(':')) {
                        let parts = key.split(':');
                        let [prefix, tag] = [parts.shift(), parts.join(':')];
                        return prefix === id && presetFieldsKey.includes(tag);
                    }
                    return false;
                })
            )
        );

        Object.keys(tagsWithLifecycles).forEach((key) => {
            const keyNoLifecycle = osmGetKeyWithoutLifecycle(key);
            if (keyNoLifecycle === mainKey) {
                delete tagsWithLifecycles[key];
            }
        });

        return tagsWithLifecycles;
    }

    // Adds a new tag with a lifecycle that is not the main key
    function addExtraLifecycle() {
        let newKey =  d3_select('.lifecycle-extra-new-key').property('value').toLowerCase();
        const newLifecycle = d3_select('.lifecycle-extra-new-prefix').property('value').toLowerCase();

        const tags = _tags;
        const ids = _ids;

        const oldValue = tags[newKey];

        const presetFields = _allFieldsKeys;

        // Check if the new values are all valid
        if ((!newKey || newKey === '' || !newLifecycle || newLifecycle === '') ||
            (!_ids.includes(newLifecycle) || !presetFields.includes(newKey))) {
            return;
        }

        // Check if the new key already exists
        for (let id of ids) {
            if (tags[id + ':' + newKey] !== undefined){
                extraLifecycleError.text(t('lifecycle.error.error') + ': ' + t('lifecycle.error.duplicate'));
                return;
            }
        }

        _pendingChange = _pendingChange ?? {};
        _pendingChange[newKey] = undefined;
        _pendingChange[newLifecycle + ':' + newKey] = oldValue || '';

        _showBlank = false;

        scheduleChange();
    }

    // Changes the main key lifecycle
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

    // Removes the lifecycle prefix from the main key
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

    // Changes the lifecycle of the specified extra field
    function changeExtraLifecycle() {
        if (d3_select(this).attr('readonly')) return;

        const tags = _tags;
        const newLifecycle = d3_select(this).property('value').toLowerCase();
        const oldTag = d3_select(this).property('id');
        const parts = oldTag.split(':');
        const [oldLifecycle, oldKey] = [parts.shift(), parts.join(':')];
        let oldValue = tags[oldTag];
        const allKeys = getKeysByMainKey(oldKey);

        _pendingChange = _pendingChange ?? {};

        if ((!_ids.includes(newLifecycle) || newLifecycle === oldLifecycle)) {
            d3_select(this).property('value', t('lifecycle.' + osmLifecyclePrefixes[osmGetLifecyclePrefix(oldTag)].id));
            return;
        }

        _pendingChange[oldKey] = undefined;
        _pendingChange[oldLifecycle + ':' + oldKey] = undefined;
        _pendingChange[newLifecycle + ':' + oldKey] = tags[oldLifecycle + ':' + oldKey] ?? oldValue ?? '';
        if (allKeys && allKeys.length !== 0) {
            allKeys.forEach(key => {
                _pendingChange[newLifecycle + ':' + key] = tags[oldLifecycle + ':' + key];
                _pendingChange[oldLifecycle + ':' + key] = undefined;
            });
        }

        scheduleChange();
    }

    // Removes the lifecycle prefix from the specified extra field
    function makeExtraFunctional() {
        const oldLifecycleTag = d3_select(this).attr('id');
        const key = osmGetKeyWithoutLifecycle(oldLifecycleTag);
        const lifecycle = osmGetLifecyclePrefix(oldLifecycleTag);
        const allKeys = getKeysByMainKey(key);
        const tags = _tags;

        _pendingChange = _pendingChange ?? {};

        if (oldLifecycleTag) {
            _pendingChange[key] = tags[oldLifecycleTag];
            _pendingChange[oldLifecycleTag] = undefined;
            if (allKeys && allKeys.length !== 0) {
                allKeys.forEach(key => {
                    _pendingChange[key] = tags[lifecycle + ':' + key];
                });
            }
        }

        scheduleChange();
    }

    // Removes the specified extra field alltogether
    function deleteExtraTag() {
        const oldLifecycleTag = d3_select(this).attr('id');
        const key = osmGetKeyWithoutLifecycle(oldLifecycleTag);
        const lifecycle = osmGetLifecyclePrefix(oldLifecycleTag);
        const allKeys = getKeysByMainKey(key);

        _pendingChange = _pendingChange ?? {};

        if (oldLifecycleTag) {
            _pendingChange[key] = undefined;
            _pendingChange[oldLifecycleTag] = undefined;
            if (allKeys && allKeys.length !== 0) {
                allKeys.forEach(key => {
                    _pendingChange[lifecycle + ':' + key] = undefined;
                });
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

    // Some fields comes with extra subkeys, given the mainKey we want to get all the subkeys (like addr: -> addr:housenumber, addr:city, etc ... )
    function getKeysByMainKey(mainKey) {
        const allFields = _allFields;
        const field = allFields.find(field => field.key === mainKey);

        return field && field.keys ? field.keys : [];
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
