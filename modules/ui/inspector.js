import { interpolate as d3_interpolate } from 'd3-interpolate';
import { select as d3_select, selectAll as d3_selectAll } from 'd3-selection';

import { uiEntityEditor } from './entity_editor';
import { uiPresetList } from './preset_list';
import { uiViewOnOSM } from './view_on_osm';


export function uiInspector(context) {
    var presetList = uiPresetList(context);
    var entityEditor = uiEntityEditor(context);
    var wrap = d3_select(null),
        presetPane = d3_select(null),
        editorPane = d3_select(null);
    var _state = 'select';
    var _entityID;
    var _newFeature = false;


    function inspector(selection, newFeature) {
        presetList
            .entityID(_entityID)
            .autofocus(_newFeature)
            .on('choose', inspector.setPreset);

        entityEditor
            .state(_state)
            .entityID(_entityID)
            .on('choose', inspector.showList);

        wrap = selection.selectAll('.panewrap')
            .data([0]);

        var enter = wrap.enter()
            .append('div')
            .attr('class', 'panewrap');

        enter
            .append('div')
            .attr('class', 'preset-list-pane pane');

        enter
            .append('div')
            .attr('class', 'entity-editor-pane pane');

        wrap = wrap.merge(enter);
        presetPane = wrap.selectAll('.preset-list-pane');
        editorPane = wrap.selectAll('.entity-editor-pane');

        var entity = context.entity(_entityID);

        var hasNonGeometryTags = entity.hasNonGeometryTags();
        var isTaglessOrIntersectionVertex = entity.geometry(context.graph()) === 'vertex' &&
            (!hasNonGeometryTags && !entity.isHighwayIntersection(context.graph()));
        var issues = context.validator().getEntityIssues(_entityID);
        // start with the preset list if the feature is new and untagged or is an uninteresting vertex
        var showPresetList = (newFeature && !hasNonGeometryTags) || (isTaglessOrIntersectionVertex && !issues.length);

        if (showPresetList) {
            wrap.style('right', '-100%');
            presetPane.call(presetList);
        } else {
            wrap.style('right', '0%');
            editorPane.call(entityEditor);
        }

        var footer = selection.selectAll('.footer')
            .data([0]);

        footer = footer.enter()
            .append('div')
            .attr('class', 'footer')
            .merge(footer);

        footer
            .call(uiViewOnOSM(context)
                .what(context.hasEntity(_entityID))
            );
    }

    inspector.showList = function(preset) {
        wrap.transition()
            .styleTween('right', function() { return d3_interpolate('0%', '-100%'); });

        presetPane
            .call(presetList.preset(preset).autofocus(true));
    };

    inspector.setPreset = function(preset) {

        // upon setting multipolygon, go to the area preset list instead of the editor
        if (preset.id === 'type/multipolygon') {
            presetPane
                .call(presetList.preset(preset).autofocus(true));

        } else {
            wrap.transition()
                .styleTween('right', function() { return d3_interpolate('-100%', '0%'); });

            editorPane
                .call(entityEditor.preset(preset));
        }

    };

    inspector.state = function(val) {
        if (!arguments.length) return _state;
        _state = val;
        entityEditor.state(_state);

        // remove any old field help overlay that might have gotten attached to the inspector
        d3_selectAll('.field-help-body').remove();

        return inspector;
    };


    inspector.entityID = function(val) {
        if (!arguments.length) return _entityID;
        _entityID = val;
        return inspector;
    };


    inspector.newFeature = function(val) {
        if (!arguments.length) return _newFeature;
        _newFeature = val;
        return inspector;
    };


    return inspector;
}
