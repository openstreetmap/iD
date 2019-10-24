import { t } from '../../util/locale';
import { uiToolQuickPresets } from './quick_presets';

export function uiToolAddFavorite(context) {

    var tool = uiToolQuickPresets(context);
    tool.id = 'add_favorite';
    tool.label = t('toolbar.favorites');
    tool.iconName = 'iD-icon-favorite';

    tool.itemsToDraw = function() {
        if (context.presets().getAddable().length) return [];

        var items = context.presets().getFavorites().slice(0, 20);

        var precedingCount = context.storage('tool.add_generic.toggledOn') === 'true' ? 3 : 0;

        items.forEach(function(item, index) {
            var totalIndex = precedingCount + index;
            var keyCode;
            // use number row order: 1 2 3 4 5 6 7 8 9 0
            // use the same for RTL even though the layout is backward: #6107
            if (totalIndex > 10) {
                keyCode = null;
            } else if (totalIndex < 10) {
                keyCode = totalIndex + 1;
            }
            if (keyCode !== undefined && keyCode !== null) {
                item.key = keyCode.toString();
            }
        });

        return items;
    };

    tool.willUpdate = function() {
        for (var i = 0; i <= 19; i++) {
            context.keybinding().off(i.toString());
        }
    };

    return tool;
}
