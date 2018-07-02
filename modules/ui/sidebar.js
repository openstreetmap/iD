import _throttle from 'lodash-es/throttle';
import { uiFeatureList } from './feature_list';
import { uiInspector } from './inspector';
import { uiNoteEditor } from './note_editor';

import {
    osmNote
} from '../osm';

export function uiSidebar(context) {

    var inspector = uiInspector(context),
        noteEditor = uiNoteEditor(context),
        current,
        wasNote = false;

    function sidebar(selection) {
        var featureListWrap = selection
            .append('div')
            .attr('class', 'feature-list-pane')
            .call(uiFeatureList(context));


        var inspectorWrap = selection
            .append('div')
            .attr('class', 'inspector-hidden inspector-wrap fr');


        function hover(what) {
            if ((what instanceof osmNote)) {
                wasNote = true;
                context.ui().sidebar.show(noteEditor, what);
            }
            else if (!current && context.hasEntity(what)) {
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

            } else if (!current) {
                featureListWrap
                    .classed('inspector-hidden', false);
                inspectorWrap
                    .classed('inspector-hidden', true);
                inspector
                    .state('hide');
            } else if (wasNote) {
                wasNote = false;
                context.ui().sidebar.hide();
            }
        }


        sidebar.hover = _throttle(hover, 200);


        sidebar.select = function(id, newFeature) {
            if (!current && id) {
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

            } else if (!current) {
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

            if (current) current.remove();
            current = selection
                .append('div')
                .attr('class', 'sidebar-component')
                .call(component, element);
        };


        sidebar.hide = function() {
            featureListWrap
                .classed('inspector-hidden', false);
            inspectorWrap
                .classed('inspector-hidden', true);

            if (current) current.remove();
            current = null;
        };
    }


    sidebar.hover = function() {};
    sidebar.hover.cancel = function() {};
    sidebar.select = function() {};
    sidebar.show = function() {};
    sidebar.hide = function() {};

    return sidebar;
}
