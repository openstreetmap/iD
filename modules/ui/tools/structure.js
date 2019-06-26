import { uiToolSegemented } from './segmented';
import { t } from '../../util/locale';
import { osmTagsAllowingBridges, osmTagsAllowingTunnels } from '../../osm/tags';
import { actionChangeTags } from '../../actions/change_tags';
import { actionAddEntity } from '../../actions/add_entity';
import { actionAddVertex } from '../../actions/add_vertex';
import { actionJoin } from '../../actions/join';
import { modeDrawLine } from '../../modes/draw_line';
import { osmWay } from '../../osm/way';

export function uiToolStructure(context) {

    var tool = uiToolSegemented(context);

    tool.id = 'structure';
    tool.label = t('presets.fields.structure.label');
    tool.key = t('toolbar.structure.key');

    var structureNone = {
        id: 'none',
        icon: 'iD-other-line',
        label: t('toolbar.structure.none.title'),
        tags: {}
    };
    var structureBridge = {
        id: 'bridge',
        icon: 'maki-bridge-15',
        label: t('presets.fields.structure.options.bridge'),
        tags: {
            bridge: 'yes'
        }
    };
    var structureTunnel = {
        id: 'tunnel',
        icon: 'tnp-2009642',
        label: t('presets.fields.structure.options.tunnel'),
        tags: {
            tunnel: 'yes'
        }
    };

    var prevWayID;

    tool.loadItems = function() {
        tool.items = [
            structureNone
        ];

        var tags = activeTags();

        function allowsStructure(osmTags) {
            for (var key in tags) {
                if (osmTags[key] && osmTags[key][tags[key]]) return true;
            }
            return false;
        }

        if (allowsStructure(osmTagsAllowingBridges)) tool.items.push(structureBridge);
        if (allowsStructure(osmTagsAllowingTunnels)) tool.items.push(structureTunnel);
    };

    tool.chooseItem = function(d) {
        var tags = Object.assign({}, activeTags());

        var priorStructure = tool.activeItem();
        var tagsToRemove = priorStructure.tags;
        for (var key in tagsToRemove) {
            if (tags[key]) {
                delete tags[key];
            }
        }
        // add tags for structure
        Object.assign(tags, d.tags);

        var mode = context.mode();
        if (mode.id === 'add-line') {
            mode.defaultTags = tags;

        } else if (mode.id === 'draw-line') {

            if (mode.addMode) mode.addMode.defaultTags = tags;

            var wayID = mode.wayID;
            var way = context.hasEntity(wayID);
            var prevWay = context.hasEntity(prevWayID);

            if (!way) return;
            if (way.nodes.length <= 2) {
                context.replace(
                    actionChangeTags(wayID, tags)
                );

                // Reload way with updated tags
                way = context.hasEntity(wayID);

                if (prevWay && JSON.stringify(prevWay.tags) === JSON.stringify(way.tags)) {

                    var action = actionJoin([prevWay.id, way.id]);

                    if (!action.disabled(context.graph())) {
                        context.perform(action);

                        context.enter(
                            modeDrawLine(context, prevWay.id, context.graph(), context.graph(), mode.button, false, mode.addMode)
                        );
                    }
                }
            } else {
                var isLast = mode.activeID() === way.last();
                var splitNodeID = isLast ? way.nodes[way.nodes.length - 2] : way.nodes[1];

                mode.finish(true);

                var startGraph = context.graph();

                var newWay = osmWay({ tags: tags });
                context.perform(
                    actionAddEntity(newWay),
                    actionAddVertex(newWay.id, splitNodeID)
                );

                prevWayID = way.id;

                context.enter(
                    modeDrawLine(context, newWay.id, startGraph, context.graph(), mode.button, isLast ? false : 'prefix', mode.addMode)
                );
            }
        }
    };

    function activeTags() {
        var mode = context.mode();
        if (mode.id === 'add-line') {
            return mode.defaultTags;
        } else if (mode.id === 'draw-line') {
            var way = context.hasEntity(mode.wayID);
            return way ? way.tags : {};
        }
        return {};
    }

    tool.activeItem = function() {

        var tags = activeTags();

        function tagsMatchStructure(structure) {
            for (var key in structure.tags) {
                if (!tags[key] || tags[key] === 'no') return false;
            }
            return Object.keys(structure.tags).length !== 0;
        }

        for (var i in tool.items) {
            if (tagsMatchStructure(tool.items[i])) return tool.items[i];
        }
        return structureNone;
    };

    return tool;
}
