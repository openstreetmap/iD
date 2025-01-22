import { t } from '../../core/localizer';
import { uiSection } from '../section';
import { svgIcon } from '../../svg/icon';
import { uiTagReference } from '../tag_reference';
import { utilRebind } from '../../util';
import { uiTooltip } from '..';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';


export function uiSectionLifecycleEditor(context) {

    var dispatch = d3_dispatch('change');
    var _entityID;
    var _pendingChange;
    var _lifecyclePresets = ["functional", "proposed", "planned", "construction", "disused", "abandoned", "demolished"]

    var lifecycleLabel;
    var lifecycleButton;
    var lifecycleItemWrap;
    var lifecycleRowWrap;
    var reference;
    var referenceOptions;
    var lifecycleTag;

    var section = uiSection('lifecycle-editor', context)
        .shouldDisplay(function() {
            return true
        })
        .label(() => t.append('inspector.lifecycle'))
        .expandedByDefault(false)
        .disclosureContent(renderDisclosureContent);

    function renderDisclosureContent(selection) {
   
        selection.classed('lifecycle-wrap', true);
        selection.classed('grouped-items-area', true);

        selection
            .selectAll('.lifecycle-title')
            .data([0])
            .enter()
            .append('div')
            .text('Set Feature as: ')
            .attr('class', 'lifecycle-title');

        var lifecycleWrap = selection
            .selectAll('.lifecycle-wrap')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'lifecycle-wrap');

        for(var i = 0; i < _lifecyclePresets.length; i++){
            lifecycleTag = _lifecyclePresets.at(i);
            referenceOptions = { key: lifecycleTag + ":*" };
            reference = uiTagReference(referenceOptions, context);
            lifecycleLabel = t('lifecycle.' + lifecycleTag);

            lifecycleItemWrap = lifecycleWrap
                .append('div')
                .attr('class', 'lifecycle-item-wrap');

            lifecycleRowWrap = lifecycleItemWrap
                .append('div')
                .attr('class', 'lifecycle-row-wrap');

            lifecycleButton = lifecycleRowWrap
                .append('button')
                .attr('class', 'lifecycle-button-wrap')
                .attr('id', lifecycleTag)
                .on('click', lifecycleChange);

            lifecycleButton
                .append('div')
                .attr('class', 'lifecycle-button-icon')
                .call(svgIcon('#iD-icon-bug'));

            lifecycleButton
                .append('div')
                .attr('class', 'lifecycle-button-label')
                .text(lifecycleLabel);

            lifecycleRowWrap.call(reference.button);
            lifecycleItemWrap.call(reference.body);
        }
        changeButtonsState()
    }

    function lifecycleChange(){
        if (d3_select(this).attr('readonly')) return;

        var tags = getEntityTags();

        lifecycleTag = d3_select(this).attr('id');
        _pendingChange = _pendingChange || {};

        for(let t in tags)
            if(_lifecyclePresets.includes(t))
                _pendingChange[t] = undefined; 
        
        if(lifecycleTag != 'functional')
            _pendingChange[lifecycleTag] = "yes";

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

    function changeButtonsState(){
        var tags = getEntityTags();
        let button;
        let lt;
        let found = false;

        for(var i = 0; i < _lifecyclePresets.length; i++){
            lt = _lifecyclePresets.at(i);
            button = section.selection().select('#' + lt)
            button.attr('disabled', null)
            button.attr('class', 'lifecycle-button-wrap')
        }

        for(let t in tags){
            for(var i = 0; i < _lifecyclePresets.length; i++){
                lt = _lifecyclePresets.at(i);
                if(t.includes(lt)){
                    found = true;
                    button = section.selection().select('#' + lt)
                    button.attr('disabled', true)
                    button.attr('class', 'lifecycle-button-wrap disabled')
                }
            }
        }

        button = section.selection().select('#functional')
        if(!found){
            button.attr('disabled', true)
            button.attr('class', 'lifecycle-button-wrap disabled')
        }
        else{
            button.attr('disabled', null)
            button.attr('class', 'lifecycle-button-wrap')
        }

    }

    section.entityIDs = function(val) {
        if (!arguments.length) return _entityID;
        _entityID = val;
        return section;
    };


    return utilRebind(section, dispatch, 'on');;
};
