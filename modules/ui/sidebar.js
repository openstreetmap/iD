import _throttle from 'lodash-es/throttle';

import { selectAll as d3_selectAll } from 'd3-selection';

import { osmNote } from '../osm';
import { uiFeatureList } from './feature_list';
import { uiInspector } from './inspector';
import { uiNoteEditor } from './note_editor';


export function uiSidebar(context) {
    var inspector = uiInspector(context);
    var noteEditor = uiNoteEditor(context);
    var _current;
    var _wasNote = false;
    // var layer = d3_select(null);


    function sidebar(selection) {
        var featureListWrap = selection
            .append('div')
            .attr('class', 'feature-list-pane')
            .call(uiFeatureList(context));


        var inspectorWrap = selection
            .append('div')
            .attr('class', 'inspector-hidden inspector-wrap fr');


        function hover(what) {
            if ((what instanceof osmNote) && (context.mode().id !== 'drag-note')) {
                // TODO: figure out why `what` isn't an updated note. Won't hover since .loc doesn't match
                _wasNote = true;
                var notes = d3_selectAll('.note');
                notes
                    .classed('hover', function(d) { return d === what; });

                sidebar.show(noteEditor.note(what));

                selection.selectAll('.sidebar-component')
                    .classed('inspector-hover', true);

            } else if (!_current && context.hasEntity(what)) {
                featureListWrap
                    .classed('inspector-hidden', true);

                inspectorWrap
                    .classed('inspector-hidden', false)
                    .classed('inspector-hover', true);

                if (inspector.entityID() !== what || inspector.state() !== 'hover') {
                    inspector
                        .state('hover')
                        .entityID(what);

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

            } else if (_wasNote) {
                _wasNote = false;
                d3_selectAll('.note')
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
