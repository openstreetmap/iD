import { interpolate as d3_interpolate } from 'd3-interpolate';
import { selectAll as d3_selectAll } from 'd3-selection';

import { uiEntityEditor } from './entity_editor';
import { uiPresetList } from './preset_list';
import { uiViewOnOSM } from './view_on_osm';


export function uiInspector(context) {
    var presetList = uiPresetList(context);
    var entityEditor = uiEntityEditor(context);
    var _state = 'select';
    var _entityID;
    var _newFeature = false;


    function inspector(selection) {
        presetList
            .entityID(_entityID)
            .autofocus(_newFeature)
            .on('choose', setPreset);

        entityEditor
            .state(_state)
            .entityID(_entityID)
            .on('choose', showList);

        var wrap = selection.selectAll('.panewrap')
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
        var presetPane = wrap.selectAll('.preset-list-pane');
        var editorPane = wrap.selectAll('.entity-editor-pane');

        var graph = context.graph(),
            entity = context.entity(_entityID),
            showEditor = _state === 'hover' ||
                entity.isUsed(graph) ||
                entity.isHighwayIntersection(graph);

        if (showEditor) {
            wrap.style('right', '0%');
            editorPane.call(entityEditor);
        } else {
            wrap.style('right', '-100%');
            presetPane.call(presetList);
        }

        var footer = selection.selectAll('.footer')
            .data([0]);

        footer = footer.enter()
            .append('div')
            .attr('class', 'footer')
            .merge(footer);

        footer
            .call(uiViewOnOSM(context).entityID(_entityID));


        function showList(preset) {
            wrap.transition()
                .styleTween('right', function() { return d3_interpolate('0%', '-100%'); });

            presetPane
                .call(presetList.preset(preset).autofocus(true));
        }


        function setPreset(preset) {
            wrap.transition()
                .styleTween('right', function() { return d3_interpolate('-100%', '0%'); });

            editorPane
                .call(entityEditor.preset(preset));
        }
    }


    inspector.state = function(_) {
        if (!arguments.length) return _state;
        _state = _;
        entityEditor.state(_state);

        // remove any old field help overlay that might have gotten attached to the inspector
        d3_selectAll('.field-help-body').remove();

        return inspector;
    };


    inspector.entityID = function(_) {
        if (!arguments.length) return _entityID;
        _entityID = _;
        return inspector;
    };


    inspector.newFeature = function(_) {
        if (!arguments.length) return _newFeature;
        _newFeature = _;
        return inspector;
    };


    return inspector;
}
