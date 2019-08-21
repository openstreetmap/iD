import { uiToolSegemented } from './segmented';
import { t } from '../../util/locale';

export function uiToolPowerSupport(context) {

    var tool = uiToolSegemented(context);

    tool.id = 'power_support';
    tool.label = t('toolbar.support.title');
    tool.key = t('toolbar.support.key');
    tool.iconName = 'temaki-power_tower';

    tool.items = [
        {
            id: 'none',
            icon: 'temaki-vertex',
            label: t('toolbar.structure.none.title'),
            tags: {}
        },
        {
            id: 'pole',
            icon: 'temaki-utility_pole',
            label: t('toolbar.support.pole.title'),
            tags: {
                power: 'pole'
            }
        },
        {
            id: 'tower',
            icon: 'temaki-power_tower',
            label: t('toolbar.support.tower.title'),
            tags: {
                power: 'tower'
            }
        }
    ];

    tool.chooseItem = function(item) {
        context.mode().defaultNodeTags = item.tags;
    };

    tool.activeItem = function() {
        var nodeTags = context.mode().defaultNodeTags;

        return tool.items.find(function(d) {
            return nodeTags === d.tags;
        });
    };

    function powerLineValue() {
        var mode = context.mode();
        var way = context.hasEntity(mode.wayID);
        var tags = (way && way.tags) || mode.defaultTags;
        var powerValue = tags && tags.power;
        if (powerValue === 'line' || powerValue === 'minor_line') {
            return powerValue;
        }
        return null;
    }

    tool.allowed = function() {
        if (context.mode().id !== 'draw-line' && context.mode().id !== 'add-line') return false;
        return !!powerLineValue();
    };

    var parentInstall = tool.install;

    tool.install = function() {
        parentInstall();
        if (!tool.activeItem()) {
            var index = powerLineValue() === 'line' ? 2 : 1;
            tool.chooseItem(tool.items[index]);
        }
    };

    return tool;
}
