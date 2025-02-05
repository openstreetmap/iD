import { t } from '../../core/localizer';
import { uiSection } from '../section';
import { svgIcon } from '../../svg/icon';
import { uiTagReference } from '../tag_reference';
import { utilRebind } from '../../util';
import { uiField } from '../field';
import { uiTooltip } from '..';
import { presetManager } from '../../presets';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import { icon } from '../intro/helper';


export function uiSectionLifecycleEditor(context) {

    var dispatch = d3_dispatch('change');
    var _entityID;
    var _pendingChange;

    var lifecycleTag;
    var _lifecyclePresets = [
        {
            id : 'proposed',
            referenceKey : 'proposed:*',
            priority : 0,
            icon : '#iD-icon-bug'
        }, 
        {
            id : 'planned',
            referenceKey : 'planned:*',
            priority : 1,
            icon : '#iD-icon-bug'
        }, 
        {
            id : 'disused',
            referenceKey : 'disused:*',
            priority : 2,
            icon : '#iD-icon-bug'
        }, 
        {
            id : 'abandoned',
            referenceKey : 'abandoned:*',
            priority : 3,
            icon : '#iD-icon-bug'
        }, 
        {
            id : 'demolished',
            referenceKey : 'demolished:*',
            priority : 4,
            icon : '#iD-icon-bug'
        },
        {
            id : 'construction',
            referenceKey : 'construction',
            priority : 5,
            icon : '#fas-tools'
        }
    ]

    var ids = _lifecyclePresets.map(function(preset) {
        return preset.id;
    });

    var section = uiSection('lifecycle-editor', context)
        .shouldDisplay(function() {
            return true
        })
        .label(() => t.append('inspector.lifecycle'))
        .expandedByDefault(false)
        .disclosureContent(renderDisclosureContent);

    var outerWrap = d3_select(null);
    var titleWrap = d3_select(null);
    var radioOuterWrap = d3_select(null);
    var radioRowWrap = d3_select(null);
    var radioButtonWrap = d3_select(null);
    var removeButton = d3_select(null);
    var referenceWrap = d3_select(null);
    var functionalRadioButton = d3_select(null);

    function renderDisclosureContent(selection) {
        outerWrap.remove();

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

        removeButton = titleWrap
            .append('button')
            .attr('class', 'remove-icon')
            .attr('id', 'make-functional')
            .attr('title', t('icons.remove'))
            .attr('style', 'display:block')
            .call(svgIcon('#iD-operation-delete'))
            .on('click', makeFunctional);

        // Lifecycle List
        radioOuterWrap = outerWrap
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-radio');

        // Append hidden placeholder radio button
        functionalRadioButton = radioOuterWrap
            .append('input')
            .attr('type', 'radio')
            .attr('name', 'lifecycle-radio')
            .attr('value', 'functional')
            .attr('style', 'display:none')
            .attr('checked', checkRadio);

        // Row Wrap
        radioRowWrap = radioOuterWrap
            .selectAll('.lifecycle-radio-row')
            .data(_lifecyclePresets)
            .enter()
            .append('label');

        referenceWrap = radioOuterWrap
            .selectAll('.reference-box')
            .data(_lifecyclePresets)
            .enter()
            .append('div')
            .attr('class', function(d) {return 'reference-box-' + d.id});

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

        radioRowWrap
            .append('div')
            .attr('class', 'lifecycle-reference-button')
            .each(function(d) { 
                let reference = uiTagReference({ key: d.referenceKey }, context);
                (reference.button)(d3_select(this));
                (reference.body)(d3_select('.reference-box-' + d.id));
            });
    }

    function checkRadio() {

        var id = d3_select(this).attr('value');
        
        if(id == "functional")
            return 'true';

        var tags = getEntityTags();

        for(let t in tags){
            if(t.includes(id))
                return 'true';
        }

        return null;
    }

    function changeLifecycle() {
        if (d3_select(this).attr('readonly')) return;

        var presetTags = getPresetTag();
        var tags = getEntityTags();

        lifecycleTag = d3_select(this).attr('value');
        _pendingChange = _pendingChange || {};

        for(let pt in presetTags){
            for(let id in ids){
                _pendingChange[ids[id]] = undefined;
                _pendingChange[ids[id] + ':' + pt] = undefined;
                if(lifecycleTag != 'construction'){
                    _pendingChange[pt] = undefined;
                }
                if(ids[id] === lifecycleTag){
                    if(lifecycleTag == 'construction'){
                        _pendingChange[ids[id]] = tags[pt];
                        _pendingChange[pt] = tags[pt];
                    }
                    else{
                        _pendingChange[ids[id] + ':' + pt] = tags[pt];
                    }
                }
            }
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
        console.log(preset);
        return preset.tags;
    }

    function makeFunctional(){
        var tags = getEntityTags();
        var baseTag;
        _pendingChange = _pendingChange || {};
        

        for(let tag in tags){
            baseTag = tag.split(':')[1];
            for(let id in ids){
                if(tag.includes(ids[id])){
                    _pendingChange[baseTag] = tags[ids[id] + ':' + baseTag];
                    _pendingChange[tag] = undefined;
                }
            }
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
