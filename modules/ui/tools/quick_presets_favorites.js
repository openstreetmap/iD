import { t } from '../../util/locale';
import { uiToolQuickPresets } from './quick_presets';

export function uiToolAddFavorite(context) {

    var tool = uiToolQuickPresets(context);
    tool.id = 'add_favorite';
    tool.label = t('toolbar.favorites');
    tool.iconName = 'iD-icon-favorite';

    tool.itemsToDraw = function() {
        if (context.presets().getAddable().length) return [];

        var items = context.presets().getFavorites().slice(0, 33);

        //var precedingCount = context.storage('tool.add_generic.toggledOn') === 'true' ? 3 : 0;
        var precedingCount = 0;

        var indexModified = precedingCount;
        items.forEach(function(item, index) {
            //var totalIndex = indexModified;
            var keyCode;
            if (indexModified <= 9) {
                keyCode = indexModified;// + 1;
            } else if (indexModified > 9) {
                keyCode = indexModified + 55;
            }
            var keyStr = String.fromCharCode(keyCode);
            while (keyStr === 'M' || keyStr === 'Q' || keyStr === 'R')
            {
                indexModified++;
                keyCode = indexModified + 55;
                keyStr  = String.fromCharCode(keyCode);
            }
            // use number row order: 1 2 3 4 5 6 7 8 9 0
            // use the same for RTL even though the layout is backward: #6107
            
            if (keyCode !== undefined && keyCode !== null) {
                if (keyCode >= 65)
                {
                    item.key = keyStr;
                }
                else
                {
                    item.key = keyCode.toString();
                }
            }
            indexModified++;
        });

        return items;
    };

    tool.willUpdate = function() {
        for (var i = 0; i <= 32; i++) {
            context.keybinding().off(i.toString());
        }
    };

    return tool;
}
