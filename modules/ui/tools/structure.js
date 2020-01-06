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
    tool.iconName = 'iD-structure-bridge';
    tool.iconClass = 'icon-30';

    var structureNone = {
        id: 'none',
        icon: 'iD-structure-none',
        label: t('toolbar.structure.none.title'),
        iconClass: 'icon-30',
        tags: {}
    };
    var structureBridge = {
        id: 'bridge',
        icon: 'temaki-bridge',
        label: t('presets.fields.structure.options.bridge'),
        iconClass: 'icon-30',
        tags: {
            bridge: 'yes'
        },
        addTags: {
            bridge: 'yes',
            layer: '1'
        }
    };
    var structureTunnel = {
        id: 'tunnel',
        icon: 'temaki-tunnel',
        label: t('presets.fields.structure.options.tunnel'),
        iconClass: 'icon-30',
        tags: {
            tunnel: 'yes'
        },
        addTags: {
            tunnel: 'yes',
            layer: '-1'
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
        var tagsToRemove = priorStructure.addTags || priorStructure.tags;
        for (var key in tagsToRemove) {
            if (tags[key]) {
                delete tags[key];
            }
        }
        // add tags for structure
        Object.assign(tags, d.addTags || d.tags);

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
                            modeDrawLine(context, {
                                wayID: prevWay.id,
                                startGraph: context.graph(),
                                baselineGraph: context.graph(),
                                button: mode.button,
                                addMode: mode.addMode
                            })
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
                    modeDrawLine(context, {
                        wayID: newWay.id,
                        startGraph: startGraph,
                        baselineGraph: context.graph(),
                        button: mode.button,
                        affix: isLast ? false : 'prefix',
                        addMode: mode.addMode
                    })
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

    var parentAvailable = tool.allowed;
    tool.allowed = function() {
        var modeID = context.mode().id;
        return parentAvailable() && (modeID === 'add-line' || modeID === 'draw-line');
    };

    return tool;
}
