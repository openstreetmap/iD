import { t } from '../../core/localizer';
import { uiSection } from '../section';
import { svgIcon } from '../../svg/icon';
import { uiTagReference } from '../tag_reference';
import { utilRebind } from '../../util';
import { presetManager } from '../../presets';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import { osmLifecyclePrefixes, osmGetLifecyclePrefix } from '../../osm/tags';


export function uiSectionLifecycleEditor(context) {

    var dispatch = d3_dispatch('change');
    var _entityID;
    var _pendingChange = null;

    var lifecycleTag;

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

        var lifecycleToRender = checkLifecyclePreset();

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
            .attr('style', 'display:block')
            .call(svgIcon('#iD-operation-delete'))
            .on('click', makeFunctional);

        let reference = uiTagReference({ key: 'Lifecycle_prefix' }, context);

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
    }

    function checkLifecyclePreset(){
        const render = _lifecyclePresets.filter(tag => tag.visibleByDeafult);
        const renderId = render.map(tag => tag.id);
        const entityTag = getEntityTags();
        var newTags = [];

        for (let et in entityTag) {
            newTags.push(osmGetLifecyclePrefix(et));
        }

        ids.forEach(id => {
            if (newTags.includes(id) && !renderId.includes(id) ) {
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

        var presetTags = getPresetTag();
        var tags = getEntityTags();

        lifecycleTag = d3_select(this).attr('value');
        _pendingChange = _pendingChange || {};

        for (let pt in presetTags) {
            ids.forEach(id => {
                _pendingChange[id] = undefined;
                _pendingChange[id + ':' + pt] = undefined;
                if (lifecycleTag !== 'construction') {
                    _pendingChange[pt] = undefined;
                }
                if (id === lifecycleTag) {
                    if (lifecycleTag === 'construction') {
                        _pendingChange[id] = tags[pt];
                        _pendingChange[pt] = tags[pt];
                    } else {
                        _pendingChange[id + ':' + pt] = tags[pt];
                    }
                }
            });
        }
        scheduleChange();
    }

    function scheduleChange() {
        var entityID = _entityID;
        dispatch.call('change', this, entityID, _pendingChange);
        _pendingChange = null;
    }

    function getEntityTags(){
        var entityID = _entityID;
        return context.graph().entity(entityID).tags;
    }

    function getPresetTag(){
        var entityID = _entityID;
        var preset = presetManager.match(context.graph().entity(entityID), context.graph());
        // console.log(preset);
        return preset.tags;
    }

    function makeFunctional(){
        var tags = getEntityTags();
        var baseTag;
        _pendingChange = _pendingChange || {};

        for (let tag in tags){
            baseTag = tag.split(':')[1];
            ids.forEach(id => {
                if (tag.includes(id)) {
                    _pendingChange[baseTag] = tags[id + ':' + baseTag];
                    _pendingChange[tag] = undefined;
                }
            });
        }

        scheduleChange();
    }

    section.entityIDs = function(val) {
        if (!arguments.length) return _entityID;
        _entityID = val;
        return section;
    };


    return utilRebind(section, dispatch, 'on');
};
