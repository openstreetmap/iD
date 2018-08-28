import _throttle from 'lodash-es/throttle';

import { selectAll as d3_selectAll } from 'd3-selection';

import {
    osmEntity,
    osmNote,
    krError
} from '../osm';

import {
    uiDataEditor,
    uiFeatureList,
    uiInspector,
    uiKeepRightEditor,
    uiNoteEditor
} from './index';


export function uiSidebar(context) {
    var inspector = uiInspector(context);
    var dataEditor = uiDataEditor(context);
    var noteEditor = uiNoteEditor(context);
    var keepRightEditor = uiKeepRightEditor(context);
    var _current;
    var _wasData = false;
    var _wasNote = false;
    var _was_krError = false;
    // var layer = d3_select(null);


    function sidebar(selection) {
        var featureListWrap = selection
            .append('div')
            .attr('class', 'feature-list-pane')
            .call(uiFeatureList(context));

        var inspectorWrap = selection
            .append('div')
            .attr('class', 'inspector-hidden inspector-wrap fr');


        function hover(datum) {
            if (datum && datum.__featurehash__) {   // hovering on data
                _wasData = true;
                sidebar
                    .show(dataEditor.datum(datum));

                selection.selectAll('.sidebar-component')
                    .classed('inspector-hover', true);

            } else if (datum instanceof krError) {
                _was_krError = true;

                var kr_errors = d3_selectAll('.kr_error');
                kr_errors
                    .classed('hover', function(d) { return d === datum; });

                sidebar
                    .show(keepRightEditor.error(datum));

                selection.selectAll('.sidebar-component')
                    .classed('inspector-hover', true);

            } else if (datum instanceof osmNote) {
                if (context.mode().id === 'drag-note') return;
                _wasNote = true;

                sidebar
                    .show(noteEditor.note(datum));

                selection.selectAll('.sidebar-component')
                    .classed('inspector-hover', true);

            } else if (!_current && (datum instanceof osmEntity)) {
                featureListWrap
                    .classed('inspector-hidden', true);

                inspectorWrap
                    .classed('inspector-hidden', false)
                    .classed('inspector-hover', true);

                if (inspector.entityID() !== datum.id || inspector.state() !== 'hover') {
                    inspector
                        .state('hover')
                        .entityID(datum.id);

                    inspectorWrap
                        .call(inspector);
                }

            } else if (!_current) {
                featureListWrap
                    .classed('inspector-hidden', false);
                inspectorWrap
                    .classed('inspector-hidden', true);
                inspector
                    .state('hide');

            } else if (_wasData || _wasNote) {
                _wasNote = false;
                _wasData = false;
                d3_selectAll('.note').classed('hover', false);
                sidebar.hide();
            } else if (_was_krError) {
                d3_selectAll('.kr_error')
                    .classed('hover', false);
                sidebar.hide();
            }
        }


        sidebar.hover = _throttle(hover, 200);


        sidebar.select = function(id, newFeature) {
            if (!_current && id) {
                featureListWrap
                    .classed('inspector-hidden', true);

                inspectorWrap
                    .classed('inspector-hidden', false)
                    .classed('inspector-hover', false);

                if (inspector.entityID() !== id || inspector.state() !== 'select') {
                    inspector
                        .state('select')
                        .entityID(id)
                        .newFeature(newFeature);

                    inspectorWrap
                        .call(inspector);
                }

            } else if (!_current) {
                featureListWrap
                    .classed('inspector-hidden', false);
                inspectorWrap
                    .classed('inspector-hidden', true);
                inspector
                    .state('hide');
            }
        };


        sidebar.show = function(component, element) {
            featureListWrap
                .classed('inspector-hidden', true);
            inspectorWrap
                .classed('inspector-hidden', true);

            if (_current) _current.remove();
            _current = selection
                .append('div')
                .attr('class', 'sidebar-component')
                .call(component, element);
        };


        sidebar.hide = function() {
            featureListWrap
                .classed('inspector-hidden', false);
            inspectorWrap
                .classed('inspector-hidden', true);

            if (_current) _current.remove();
            _current = null;
        };
    }


    sidebar.hover = function() {};
    sidebar.hover.cancel = function() {};
    sidebar.select = function() {};
    sidebar.show = function() {};
    sidebar.hide = function() {};

    return sidebar;
}
