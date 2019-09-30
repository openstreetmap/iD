import { uiToolSegemented } from './segmented';
import { t } from '../../util/locale';
import { modeAddPoint } from '../../modes/add_point';
import { modeAddLine } from '../../modes/add_line';
import { modeAddArea } from '../../modes/add_area';

export function uiToolAddingGeometry(context) {

    var tool = uiToolSegemented(context);

    tool.id = 'adding_geometry';
    tool.label = t('info_panels.measurement.geometry');
    tool.iconName = 'iD-logo-features';
    tool.iconClass = 'icon-30';
    tool.key = t('toolbar.geometry.key');

    var items = {
        point: {
            id: 'point',
            icon: 'iD-icon-point',
            label: t('modes.add_point.title'),
            mode: modeAddPoint
        },
        vertex: {
            id: 'vertex',
            icon: 'iD-icon-vertex',
            label: t('modes.add_point.title'),
            mode: modeAddPoint
        },
        line: {
            id: 'line',
            icon: 'iD-icon-line',
            label: t('modes.add_line.title'),
            mode: modeAddLine
        },
        area: {
            id: 'area',
            icon: 'iD-icon-area',
            label: t('modes.add_area.title'),
            mode: modeAddArea
        },
        building: {
            id: 'building',
            icon: 'maki-building-15',
            label: t('presets.presets.building.name'),
            mode: modeAddArea
        }
    };

    tool.chooseItem = function(item) {
        var oldMode = context.mode();

        oldMode.preset.setMostRecentAddGeometry(context, item.id);

        var newMode = item.mode(context, {
            button: oldMode.button,
            preset: oldMode.preset,
            geometry: item.id,
            title: oldMode.title
        });
        context.enter(newMode);
    };

    tool.activeItem = function() {
        return items[context.mode().geometry];
    };

    tool.loadItems = function() {
        var mode = context.mode();

        if (!mode.preset ||
            (mode.id !== 'add-point' && mode.id !== 'add-line' && mode.id !== 'add-area') ||
            mode.addedEntityIDs().length > 0) {
            tool.items = [];
        } else {
            var geometries = context.mode().preset.geometry.slice().sort().reverse();
            var vertexIndex = geometries.indexOf('vertex');
            if (vertexIndex !== -1 && geometries.indexOf('point') !== -1) {
                geometries.splice(vertexIndex, 1);
            }

            var areaIndex = geometries.indexOf('area');
            if (areaIndex !== -1 && mode.preset.setTags(mode.defaultTags, 'area').building) {
                geometries.splice(areaIndex, 1);
                geometries.push('building');
            }

            tool.items = geometries.map(function(geom) {
                return items[geom];
            }).filter(Boolean);
        }
    };

    return tool;
}
