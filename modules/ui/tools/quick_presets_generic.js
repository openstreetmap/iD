import { prefs } from '../../core/preferences';
import { t } from '../../core/localizer';
import { presetManager } from '../../presets';
import { uiToolQuickPresets } from './quick_presets';

export function uiToolAddGeneric(context) {

    var tool = uiToolQuickPresets(context);
    tool.id = 'add_generic';
    tool.label = t('toolbar.generic.title');
    tool.iconName = 'iD-logo-features';
    tool.iconClass = 'icon-30';

    if (prefs('tool.add_generic.toggledOn') === null) {
        if (!context.isFirstSession) {
            // assume existing user coming from iD 2, enable this item by default
            tool.isToggledOn = true;
        } else {
            tool.isToggledOn = false;
        }
        prefs('tool.add_generic.toggledOn', tool.isToggledOn);
    }

    tool.itemsToDraw = function() {
        if (presetManager.getAddable().length) return [];
        var items = presetManager.getGenericRibbonItems();
        for (var i in items) {
            items[i].key = (parseInt(i, 10) + 1).toString();
        }
        return items;
    };

    return tool;
}
