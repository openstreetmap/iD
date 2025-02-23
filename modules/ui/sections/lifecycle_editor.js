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
    var _currentMainTag = '';
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

    var outerWrap = d3_select(null);
    var titleWrap = d3_select(null);
    var radioOuterWrap = d3_select(null);
    var radioRowWrap = d3_select(null);
    var radioButtonWrap = d3_select(null);

    function renderDisclosureContent(selection) {
        outerWrap.remove();

        _currentLifecycle = _presets[0].getLifecycle(_tags);
        var lifecycleToRender = getLifecycleToRender();

        // Outer Wrap
        outerWrap = selection
            .append('div')
            .attr('class', 'wrap-form-field wrap-form-field-lifecycle');

        // Title Card with Buttons
        titleWrap = outerWrap
            .append('label')
            .attr('class', 'field-label');

        var titleText = titleWrap
            .append('span')
            .attr('class', 'label-text');

        titleText
            .append('span')
            .attr('class', 'label-textvalue')
            .text('Select Lifecycle');

        // Lifecycle List
        radioOuterWrap = outerWrap
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-radio');

        // Append hidden placeholder radio button
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

        let reference = uiTagReference(
            {
                key: 'customStringMessage',
                value: 'lifecycleReference',
                referenceLink : 'https://wiki.openstreetmap.org/wiki/Lifecycle_prefix'
            },
            context);

        titleWrap
            .call(reference.button);

        radioRowWrap = radioOuterWrap
            .selectAll('.lifecycle-radio-row')
            .data(lifecycleToRender)
            .enter()
            .append('label');

        radioOuterWrap
            .append('div')
            .call(reference.body)
            .attr('class', 'reference-box');

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

        if (Object.keys(_presets[0].tags).length === 0) {
            outerWrap.attr('class', 'wrap-form-field-lifecycle-disabled');
        }

        _currentMainTag = getMainTag();
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

    function changeLifecycle() {
        if (d3_select(this).attr('readonly')) return;

        const tags = _tags;
        let presetTags = _presets[0].tags;

        const newLifecycle = d3_select(this).attr('value');
        const oldLifecycleTag = _currentMainTag;

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

    function makeFunctional() {
        const oldLifecycleTag = _currentMainTag;
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
        dispatch.call('change', this, entityID, _pendingChange);
        _pendingChange = null;
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
