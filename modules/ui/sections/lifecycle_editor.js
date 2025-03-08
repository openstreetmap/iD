import { t } from '../../core/localizer';
import { uiSection } from '../section';
import { svgIcon } from '../../svg/icon';
import { utilArrayIdentical } from '../../util/array';
import { uiTagReference } from '../tag_reference';
import { utilRebind } from '../../util';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import { osmLifecyclePrefixes, osmGetLifecyclePrefix } from '../../osm/tags';


export function uiSectionLifecycleEditor(context) {

    var dispatch = d3_dispatch('change');
    var _entityID;
    var _tags;
    var _pendingChange = null;
    var _currentLifecycle = 'functional';
    var _mainTag = '';
    var _extraTags;
    var _showBlank = false;
    var _presets = [];

    const _lifecyclePresets = Object.values(osmLifecyclePrefixes);
    const ids = Object.keys(osmLifecyclePrefixes);

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
        _mainTag = getMainTag();

        // Extra Lifecycle Menu
        _extraTags = getExtraTags();

        const extraTagKeys = Object.keys(_extraTags);

        addExtraTagList = extraLifecycleWrap
            .append('ul')
            .attr('class', 'member-list');

        // Already Existing Extra Tags
        if (extraTagKeys.length) {

            addExtraTagList = addExtraTagList
                .selectAll('li')
                .data(extraTagKeys)
                .enter();

            let extraTagRow = addExtraTagList
                .append('li')
                .attr('class', 'lifecycle-row form-field');

            let innerRowLabel = extraTagRow
                .append('label')
                .attr('class', 'field-label');

            innerRowLabel
                .append('span')
                .attr('class', 'label-text lifecycle-extra')
                .append('a')
                .text(d => d.split(':')[1]);

            innerRowLabel
                .append('input')
                .attr('type', 'text')
                .property('id', d => d)
                .property('value', d => d.split(':')[0])
                .attr('class', 'lifecycle-extra')
                .attr('stlye', 'border-left : 1px solid #ccc !important')
                .on('blur', changeExtraLifecycle)
                .on('change', changeExtraLifecycle);

            innerRowLabel
                .append('button')
                .attr('class', 'remove')
                .attr('title', t('icons.remove'))
                .call(svgIcon('#iD-operation-delete'))
                .on('click', makeExtraFunctional);
        }

        // New Extra Tags
        let addExtraTagRowNew = extraLifecycleWrap
            .append('li')
            .attr('class', 'lifecycle-row form-field')
            .attr('style', _showBlank ? 'display:block' : 'display:none');

        let innerRowLabelNew = addExtraTagRowNew
            .append('label')
            .attr('class', 'field-label');

        innerRowLabelNew
            .append('input')
            .attr('type', 'text')
            .attr('placeholder', 'prefix')
            .attr('style', 'border-right : 1px solid #ccc !important')
            .attr('class', 'lifecycle-extra lifecycle-extra-new-prefix')
            .on('blur', addExtraTag)
            .on('change', addExtraTag);

        innerRowLabelNew
            .append('input')
            .attr('type', 'text')
            .attr('class', 'lifecycle-extra lifecycle-extra-new-key')
            .attr('placeholder', 'key')
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
            .attr('placeholder', 'value')
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
        const mainTag = (Object.keys(_presets[0].tags));
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

    function getMainTag() {
        const presetKeys = Object.keys(_presets[0].tags);

        const existingTag = presetKeys.find(key =>
            ids.some(id => key.includes(id))
        );

        if (existingTag) return existingTag;

        if (_currentLifecycle !== 'functional' && _currentLifecycle !== 'construction') {
            return presetKeys.map(tag => `${_currentLifecycle}:${tag}`).find(tag =>
                ids.some(id => tag.includes(id))
            );
        }

        return null;
    }

    function getExtraTags() {
        const tags = _tags;
        const mainTag = _mainTag;

        const tagsWithLifecycles = Object.fromEntries(
            ids.flatMap(id =>
                Object.entries(tags).filter(([key]) => key.includes(':') && key.split(':')[0] === id)
            )
        );

        if (tagsWithLifecycles.hasOwnProperty(mainTag)) {
            delete tagsWithLifecycles[mainTag];
        }

        return tagsWithLifecycles;
    }

    function addExtraTag() {
        const newTag =  d3_select('.lifecycle-extra-new-key').property('value');
        const newPrefix = d3_select('.lifecycle-extra-new-prefix').property('value');
        const newValue = d3_select('.lifecycle-extra-new-value').property('value');

        if (!newTag || newTag === '' || !newPrefix || newPrefix === '' || !newValue || newValue === '') {
            return;
        }

        if (!ids.includes(newPrefix)) {
            return;
        }

        _pendingChange = _pendingChange ?? {};

        if (newPrefix === 'construction') {
            _pendingChange[newPrefix] = newTag;
        } else {
            _pendingChange[newPrefix + ':' + newTag] = newValue;
        }

        _showBlank = false;

        scheduleChange();
    }

    function changeLifecycle() {
        if (d3_select(this).attr('readonly')) return;

        const tags = _tags;
        let presetTags = _presets[0].tags;

        const newLifecycle = d3_select(this).attr('value');
        const oldLifecycleTag = _mainTag;

        _pendingChange = _pendingChange ?? {};
        _pendingChange.construction = undefined;

        if (oldLifecycleTag?.includes(':')) {
            const [, tag] = oldLifecycleTag.split(':');
            _pendingChange[oldLifecycleTag] = undefined;
            _pendingChange[newLifecycle !== 'construction' ? `${newLifecycle}:${tag}` : newLifecycle] = tags[oldLifecycleTag];

            if (newLifecycle === 'construction') {
                _pendingChange[tag] = tags[oldLifecycleTag];
            }
        } else {
            Object.keys(presetTags).forEach(pt => {
                if (newLifecycle !== 'construction') {
                    _pendingChange[pt] = undefined;
                    _pendingChange[`${newLifecycle}:${pt}`] = tags[pt] ?? 'yes';
                } else {
                    _pendingChange.construction = tags[pt] ?? 'yes';
                }
            });
        }

        scheduleChange();
    }

    function changeExtraLifecycle() {
        if (d3_select(this).attr('readonly')) return;

        const tags = _tags;

        const newLifecycle = d3_select(this).property('value');
        const oldTag = d3_select(this).property('id');
        const [, oldKey] = oldTag.split(':');
        const oldTagValue = tags[oldTag];

        if (!ids.includes(newLifecycle)) {
            d3_select(this).property('value', oldTag.split(':')[0]);
            return;
        }

        _pendingChange = _pendingChange ?? {};
        _pendingChange[oldTag] = undefined;

        if (newLifecycle === 'construction') {
            _pendingChange.construction = oldKey;
            _pendingChange[oldKey] = oldTagValue;
        } else {
            _pendingChange[newLifecycle + ':' + oldKey] = oldTagValue;
        }

        scheduleChange();
    }

    function makeFunctional() {
        const oldLifecycleTag = _mainTag;
        const tags = _tags;

        _pendingChange = _pendingChange ?? {};

        if (oldLifecycleTag) {
            const [, newTag] = oldLifecycleTag.split(':');
            _pendingChange[newTag] = tags[oldLifecycleTag];
            _pendingChange[oldLifecycleTag] = undefined;
        } else if (tags.construction) {
            _pendingChange.construction = undefined;
        }

        scheduleChange();
    }

    function makeExtraFunctional(d) {
        const oldLifecycleTag = d.currentTarget.__data__;
        const tags = _tags;

        _pendingChange = _pendingChange ?? {};

        if (oldLifecycleTag) {
            const [, newTag] = oldLifecycleTag.split(':');
            _pendingChange[newTag] = tags[oldLifecycleTag];
            _pendingChange[oldLifecycleTag] = undefined;
        } else if (tags.construction) {
            _pendingChange.construction = undefined;
        }

        scheduleChange();
    }

    function scheduleChange() {
        var entityID = _entityID;

        window.setTimeout(function() {
            if (!_pendingChange) return;

            dispatch.call('change', this, entityID, _pendingChange);
            _pendingChange = null;
        }, 10);
    }

    section.entityIDs = function(val) {
        if (!arguments.length) return _entityID;
        _entityID = val;
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
