import { interpolate as d3_interpolate } from 'd3-interpolate';
import { select as d3_select } from 'd3-selection';

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
    var _entityIDs;
    var _newFeature = false;


    function inspector(selection) {
        presetList
            .entityIDs(_entityIDs)
            .autofocus(_newFeature)
            .on('choose', inspector.setPreset)
            .on('cancel', function() {
                wrap.transition()
                    .styleTween('right', function() { return d3_interpolate('-100%', '0%'); });
                editorPane.call(entityEditor);
            });

        entityEditor
            .state(_state)
            .entityIDs(_entityIDs)
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

        function shouldDefaultToPresetList() {
            // always show the inspector on hover
            if (_state !== 'select') return false;

            // can only change preset on single selection
            if (_entityIDs.length !== 1) return false;

            var entityID = _entityIDs[0];
            var entity = context.hasEntity(entityID);
            if (!entity) return false;

            // default to inspector if there are already tags
            if (entity.hasNonGeometryTags()) return false;

            // prompt to select preset if feature is new and untagged
            if (_newFeature) return true;

            // all existing features except vertices should default to inspector
            if (entity.geometry(context.graph()) !== 'vertex') return false;

            // show vertex relations if any
            if (context.graph().parentRelations(entity).length) return false;

            // show vertex issues if there are any
            if (context.validator().getEntityIssues(entityID).length) return false;

            // show turn retriction editor for junction vertices
            if (entity.isHighwayIntersection(context.graph())) return false;

            // otherwise show preset list for uninteresting vertices
            return true;
        }

        if (shouldDefaultToPresetList()) {
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
                .what(context.hasEntity(_entityIDs.length === 1 && _entityIDs[0]))
            );
    }

    inspector.showList = function(presets) {

        wrap.transition()
            .styleTween('right', function() { return d3_interpolate('0%', '-100%'); });

        if (presets) {
            presetList.presets(presets);
        }

        presetPane
            .call(presetList.autofocus(true));
    };

    inspector.setPreset = function(preset) {

        // upon setting multipolygon, go to the area preset list instead of the editor
        if (preset.id === 'type/multipolygon') {
            presetPane
                .call(presetList.autofocus(true));

        } else {
            wrap.transition()
                .styleTween('right', function() { return d3_interpolate('-100%', '0%'); });

            editorPane
                .call(entityEditor.presets([preset]));
        }

    };

    inspector.state = function(val) {
        if (!arguments.length) return _state;
        _state = val;
        entityEditor.state(_state);

        // remove any old field help overlay that might have gotten attached to the inspector
        context.container().selectAll('.field-help-body').remove();

        return inspector;
    };


    inspector.entityIDs = function(val) {
        if (!arguments.length) return _entityIDs;
        _entityIDs = val;
        return inspector;
    };


    inspector.newFeature = function(val) {
        if (!arguments.length) return _newFeature;
        _newFeature = val;
        return inspector;
    };


    return inspector;
}
