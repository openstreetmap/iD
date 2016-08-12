import * as d3 from 'd3';
import { EntityEditor } from './entity_editor';
import { PresetList } from './preset_list';
import { ViewOnOSM } from './view_on_osm';

export function Inspector(context) {
    var presetList = PresetList(context),
        entityEditor = EntityEditor(context),
        state = 'select',
        entityID,
        newFeature = false;

    function inspector(selection) {
        presetList
            .entityID(entityID)
            .autofocus(newFeature)
            .on('choose', setPreset);

        entityEditor
            .state(state)
            .entityID(entityID)
            .on('choose', showList);

        var $wrap = selection.selectAll('.panewrap')
            .data([0]);

        var $enter = $wrap.enter().append('div')
            .attr('class', 'panewrap');

        $enter.append('div')
            .attr('class', 'preset-list-pane pane');

        $enter.append('div')
            .attr('class', 'entity-editor-pane pane');

        var $presetPane = $wrap.select('.preset-list-pane');
        var $editorPane = $wrap.select('.entity-editor-pane');

        var graph = context.graph(),
            entity = context.entity(entityID),
            showEditor = state === 'hover' ||
                entity.isUsed(graph) ||
                entity.isHighwayIntersection(graph);

        if (showEditor) {
            $wrap.style('right', '0%');
            $editorPane.call(entityEditor);
        } else {
            $wrap.style('right', '-100%');
            $presetPane.call(presetList);
        }

        var $footer = selection.selectAll('.footer')
            .data([0]);

        $footer.enter().append('div')
            .attr('class', 'footer');

        selection.select('.footer')
            .call(ViewOnOSM(context)
                .entityID(entityID));

        function showList(preset) {
            $wrap.transition()
                .styleTween('right', function() { return d3.interpolate('0%', '-100%'); });

            $presetPane.call(presetList
                .preset(preset)
                .autofocus(true));
        }

        function setPreset(preset) {
            $wrap.transition()
                .styleTween('right', function() { return d3.interpolate('-100%', '0%'); });

            $editorPane.call(entityEditor
                .preset(preset));
        }
    }

    inspector.state = function(_) {
        if (!arguments.length) return state;
        state = _;
        entityEditor.state(state);
        return inspector;
    };

    inspector.entityID = function(_) {
        if (!arguments.length) return entityID;
        entityID = _;
        return inspector;
    };

    inspector.newFeature = function(_) {
        if (!arguments.length) return newFeature;
        newFeature = _;
        return inspector;
    };

    return inspector;
}
