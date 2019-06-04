
import { select as d3_select, selectAll as d3_selectAll } from 'd3-selection';

import { uiEntityEditor } from './entity_editor';


export function uiInspector(context) {
    var entityEditor = uiEntityEditor(context);
    var editorPane = d3_select(null);
    var _state = 'select';
    var _entityID;
    var _newFeature = false;


    function inspector(selection, newFeature) {

        entityEditor
            .state(_state)
            .entityID(_entityID);

        editorPane = selection.selectAll('.entity-editor-pane')
            .data([0]);

        var enter = editorPane.enter()
            .append('div')
            .attr('class', 'entity-editor-pane');

        editorPane = editorPane.merge(enter);
/*
        var entity = context.entity(_entityID);

        var hasNonGeometryTags = entity.hasNonGeometryTags();
        var isTaglessOrIntersectionVertex = entity.geometry(context.graph()) === 'vertex' &&
            (!hasNonGeometryTags && !entity.isHighwayIntersection(context.graph()));
        var issues = context.validator().getEntityIssues(_entityID);
        // start with the preset list if the feature is new and untagged or is an uninteresting vertex
        var showPresetList = (newFeature && !hasNonGeometryTags) || (isTaglessOrIntersectionVertex && !issues.length);
*/
        editorPane.call(entityEditor);
    }


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
