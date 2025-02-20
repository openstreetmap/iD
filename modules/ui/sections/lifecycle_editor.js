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

        var lifecycleToRender = getLifecycleToRender();
        _currentLifecycle = getCurrentLifecycleTag();

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

        // Row Wrap
        radioRowWrap = radioOuterWrap
            .selectAll('.lifecycle-radio-row')
            .data(lifecycleToRender)
            .enter()
            .append('label');

        radioOuterWrap
            .append('div')
            .call(reference.body)
            .attr('class', 'reference-box');

        /*
        referenceWrap = radioOuterWrap
            .selectAll('.reference-box')
            .data(lifecycleToRender)
            .enter()
            .append('div')
            .attr('class', function(d) {return 'reference-box-' + d.id});
        */

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

        /*
        radioRowWrap
            .append('div')
            .attr('class', 'lifecycle-reference-button')
            .each(function(d) {
                let reference = uiTagReference({ key: d.referenceKey }, context);
                (reference.button)(d3_select(this));
                (reference.body)(d3_select('.reference-box-' + d.id));
            });
        */
       console.log(_currentLifecycle);
    }

    function getMainTag(){
        const presetTags = getPresetTag();
        const presetKeys = Object.keys(presetTags);

        const entityTags = getEntityTags();
        const entityKeys = Object.keys(entityTags);

        const entityTagsWithoutPrefixes = getEntityTagsWithoutPrefixes();
        const entityTagsWithoutPrefixesKeys = Object.keys(entityTagsWithoutPrefixes);
        
        let intersection = presetKeys.filter(x => entityKeys.includes(x));

        if (intersection[0]) {
            return intersection[0];
        }

        intersection = presetKeys.filter(x => entityTagsWithoutPrefixesKeys.includes(x));

        if (intersection[0]) {
            return intersection[0];
        }

        return null;
    }

    function getLifecycleToRender(){
        const render = _lifecyclePresets.filter(tag => tag.visibleByDeafult);
        const renderId = render.map(tag => tag.id);
        const entityTag = getEntityTags();
        const mainTag = getMainTag();
        var newTags = [];

        for (let et in entityTag) {
            if (et.includes(mainTag)) {
                newTags.push(osmGetLifecyclePrefix(et));
            }
        }

        /* Multiple Tags
        
        for (let et in entityTag) {
            newTags.push(osmGetLifecyclePrefix(et));
        }
        */

        ids.forEach(id => {
            if (newTags.includes(id) && !renderId.includes(id) ) {
                render.push(_lifecyclePresets.find(tag => (tag.id === id)));
            }
        });

        return render;
    }

    function getCurrentLifecycleTag(){

        const tags = getEntityTags();
        const mainTag = getMainTag();
        const tagKeys = (Object.keys(tags));
        const entityTagsWithoutPrefixes = getEntityTagsWithoutPrefixes();

        if(mainTag in entityTagsWithoutPrefixes || mainTag in tags){
            let fullTag = tagKeys.find(value =>
                ids.some(keyword => value.includes(keyword))
            );

            if (fullTag && fullTag.includes(mainTag)) {
                return fullTag.split(':')[0];
            }
        }

        /* Multiple Tags
        for(let tag in mainTag){
            if(tag in entityTagsWithoutPrefixes || tag in tags){
                let fullTag = tagKeys.find(value =>
                    ids.some(keyword => value.includes(keyword))
                );

                if (fullTag) {
                    return fullTag.split(':')[0];
                }
            }
        }
        */

        return 'functional';

    }

    function checkRadio() {

        var id = d3_select(this).attr('value');

        if (id === 'functional') {
            return 'true';
        }

        var tags = getEntityTags();

        for (let t in tags) {
            if (t.includes(id)) {
                return 'true';
            }
        }

        return null;
    }

    function changeLifecycle() {
        if (d3_select(this).attr('readonly')) return;

        const tags = getEntityTags();
        const tagKeys = (Object.keys(tags));
        const presetTags = getPresetTag();
        const newLifecycle = d3_select(this).attr('value');
        const oldTag = tagKeys.find(value =>
            ids.some(keyword => value.includes(keyword))
        );

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

    function makeFunctional(){
        const tags = getEntityTags();
        const tagKeys = (Object.keys(tags));
        const oldTag = tagKeys.find(value =>
            ids.some(keyword => value.includes(keyword))
        );

        _pendingChange = _pendingChange || {};

        if (!oldTag.includes('construction')) {
            let newTag = oldTag.split(':')[1];
            _pendingChange[newTag] = tags[oldTag];
        }
        _pendingChange[oldTag] = undefined;

        scheduleChange();
    }

    function scheduleChange() {
        var entityID = _entityID;
        dispatch.call('change', this, entityID, _pendingChange);
        _pendingChange = null;
    }

    function getEntityTagsWithoutPrefixes(){
        var tags = _tags;

        let entityTagsWithoutPrefixes = Object.fromEntries(
            Object.entries(tags).map(([key, value]) => {
                const newKey = key.includes(':') ? key.split(':')[1] : key;
                return [newKey, value];
            })
        );

        return entityTagsWithoutPrefixes;
    }

    function getEntityTags(){
        var tags = _tags;
        return tags;
    }

    function getPresetTag(){
        var preset = _presets[0];
        return preset.tags;
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
