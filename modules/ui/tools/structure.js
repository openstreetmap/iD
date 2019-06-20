import {
    select as d3_select,
    selectAll as d3_selectAll,
} from 'd3-selection';

import { svgIcon } from '../../svg/icon';
import { t } from '../../util/locale';
import { uiTooltipHtml } from '../tooltipHtml';
import { tooltip } from '../../util/tooltip';
import { osmTagsAllowingBridges, osmTagsAllowingTunnels } from '../../osm/tags';
import { actionChangeTags } from '../../actions/change_tags';
import { actionAddEntity } from '../../actions/add_entity';
import { actionAddVertex } from '../../actions/add_vertex';
import { modeDrawLine } from '../../modes/draw_line';
import { osmWay } from '../../osm/way';

export function uiToolStructure(context) {

    var key = t('toolbar.structure.key');

    var tool = {
        id: 'structure',
        contentClass: 'joined',
        label: t('presets.fields.structure.label')
    };

    var items = [];
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

    tool.shouldShow = function() {
        items = [
            structureNone
        ];

        var tags = activeTags();

        function allowsStructure(osmTags) {
            for (var key in tags) {
                if (osmTags[key] && osmTags[key][tags[key]]) return true;
            }
            return false;
        }

        if (allowsStructure(osmTagsAllowingBridges)) items.push(structureBridge);
        if (allowsStructure(osmTagsAllowingTunnels)) items.push(structureTunnel);

        return items.length > 1;
    };

    tool.render = function(selection) {

        var active = activeStructure();

        var buttons = selection.selectAll('.bar-button')
            .data(items)
            .enter();

        buttons
            .append('button')
            .attr('class', function(d) {
                return 'bar-button ' + d.id + ' ' + (d === active ? 'active' : '');
            })
            .attr('tabindex', -1)
            .on('click', function(d) {
                if (d3_select(this).classed('active')) return;

                setActiveStructure(d);
            })
            .each(function(d) {
                var tooltipBehavior = tooltip()
                    .placement('bottom')
                    .html(true)
                    .title(uiTooltipHtml(d.label, key));
                d3_select(this)
                    .call(tooltipBehavior)
                    .call(svgIcon('#' + d.icon, 'icon-30'));
            });

        context.keybinding()
            .on(key, toggleMode, true);
    };


    function setActiveStructure(d) {

        var tags = Object.assign({}, activeTags());

        var priorStructure = activeStructure();
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
            if (!way) return;
            if (way.nodes.length <= 2) {
                context.replace(
                    actionChangeTags(wayID, tags)
                );
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

                context.enter(
                    modeDrawLine(context, newWay.id, startGraph, context.graph(), mode.button, isLast ? false : 'prefix', mode.addMode)
                );
            }
        }

        setButtonStates();
    }

    function setButtonStates() {
        d3_selectAll('.structure .bar-button.active')
            .classed('active', false);
        d3_selectAll('.structure .bar-button.' + activeStructure().id)
            .classed('active', true);
    }

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

    function activeStructure() {

        var tags = activeTags();

        function tagsMatchStructure(structure) {
            for (var key in structure.tags) {
                if (!tags[key] || tags[key] === 'no') return false;
            }
            return Object.keys(structure.tags).length !== 0;
        }

        for (var i in items) {
            if (tagsMatchStructure(items[i])) return items[i];
        }
        return structureNone;
    }

    function toggleMode() {
        if (items.length === 0) return;

        var active = activeStructure();
        var index = items.indexOf(active);
        if (index === items.length - 1) {
            index = 0;
        } else {
            index += 1;
        }

        setActiveStructure(items[index]);
    }

    tool.uninstall = function() {
        context.keybinding()
            .off(key, true);
    };

    return tool;
}
