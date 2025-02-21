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

        _currentLifecycle = getCurrentLifecyle();
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
    }

    function getLifecycleToRender(){
        const render = _lifecyclePresets.filter(tag => tag.visibleByDeafult);
        const renderId = render.map(tag => tag.id);
        const entityTag = getEntityTags();
        const mainTag = (Object.keys(getPresetTags()));
        var newTags = [];

        for (let et in entityTag) {
            if (et.includes(mainTag)) {
                newTags.push(osmGetLifecyclePrefix(et));
            }
        }

        ids.forEach(id => {
            if (newTags.includes(id) && !renderId.includes(id) ) {
                render.push(_lifecyclePresets.find(tag => (tag.id === id)));
            }
        });

        return render;
    }

    function getCurrentLifecyle() {
        var preset = _presets[0];
        return preset.lifecycleTag;
    }

    function getPresetTags(){
        var preset = _presets[0];
        return preset.tags;
    }

    function checkRadio() {

        var id = d3_select(this).attr('value');

        if (id === 'functional') {
            return 'true';
        }

        if (id === getCurrentLifecyle()) {
            return 'true';
        }

        return null;
    }

    function getOldTag() {
        let currentLifecycle = getCurrentLifecyle();

        const presetTags = getPresetTags();
        let presetKeys = (Object.keys(presetTags));

        if (!ids.some(id => presetKeys.some(pk => pk.includes(id)))) {
            if (currentLifecycle !== 'functional' && currentLifecycle !== 'construction') {
                presetKeys = presetKeys.map(tag => currentLifecycle + ':' + tag);
            }
        }

        const oldTag = presetKeys.find(value =>
            ids.some(keyword => value.includes(keyword))
        );

        return oldTag;
    }

    function changeLifecycle() {
        if (d3_select(this).attr('readonly')) return;

        const tags = getEntityTags();
        const presetTags = getPresetTags();
        const newLifecycle = d3_select(this).attr('value');
        const oldTag = getOldTag();

        _pendingChange = _pendingChange || {};

        _pendingChange.construction = undefined;

        if (oldTag && oldTag.includes(':')) {
            let tag = oldTag.split(':')[1];
            _pendingChange[oldTag] = undefined;
            if (newLifecycle !== 'construction') {
                _pendingChange[newLifecycle + ':' + tag] = tags[oldTag];
            } else {
                _pendingChange[newLifecycle] = tags[oldTag];
                _pendingChange[tag] = tags[oldTag];
            }
        } else {
            for (let pt in presetTags){
                if (newLifecycle !== 'construction') {
                    _pendingChange[pt] = undefined;
                    _pendingChange[newLifecycle + ':' + pt] = tags[pt];
                } else {
                    _pendingChange[newLifecycle] = tags[pt];
                }

            }
        }

        scheduleChange();
    }

    function makeFunctional() {
        const oldTag = getOldTag();
        const tags = getEntityTags();

        _pendingChange = _pendingChange || {};

        if (!oldTag) {
            if (tags.construction) {
                _pendingChange.construction = undefined;
            }
        } else {
            let newTag = oldTag.split(':')[1];
            _pendingChange[newTag] = tags[oldTag];
            _pendingChange[oldTag] = undefined;
        }

        scheduleChange();
    }

    function scheduleChange() {
        var entityID = _entityID;
        dispatch.call('change', this, entityID, _pendingChange);
        _pendingChange = null;
    }

    function getEntityTags(){
        var tags = _tags;
        return tags;
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
