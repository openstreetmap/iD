import { t } from '../../util/locale';
import { uiToolQuickPresets } from './quick_presets';

export function uiToolAddFavorite(context) {

    var tool = uiToolQuickPresets(context);
    tool.id = 'add_favorite';
    tool.label = t('toolbar.favorites');
    tool.iconName = 'iD-icon-favorite';

    tool.itemsToDraw = function() {
        if (context.presets().getAddable().length) return [];

        var items = context.presets().getFavorites();

        //console.log(items);

        var precedingCount = context.storage('tool.add_generic.toggledOn') === 'true' ? 3 : 0;

        var indexModified = precedingCount;
        var usedKeyCodesWithoutModifier = [];
        items.forEach(function(item, index) {
            //var totalIndex = indexModified;
            //var keyCode;
            var keyModifiers = [];

            var shortcut = item.preset.shortcut;
            if (shortcut)
            {

                item.key = shortcut;
                /*keyModifiers = item.shortcut.modifiers || [];
                if (keyModifiers.length === 0)
                {
                    usedKeyCodesWithoutModifier.push(keyCode);
                }*/
            }
            else
            {
                if (indexModified <= 9) {
                    //keyCode = indexModified;// + 1;
                    item.key = indexModified.toString();
                }
                indexModified++;
            }

            
            //var keyStr = keyCode !== null ? String.fromCharCode(keyCode) : null;
            /*if (keyCode !== null)
            {
                while (keyStr === 'M' || keyStr === 'Q' || keyStr === 'R' || keyStr === 'X' || keyStr === 'D')
                {
                    indexModified++;
                    keyCode = indexModified + 55;
                    keyStr  = String.fromCharCode(keyCode);
                }
            }*/
           
            // use number row order: 1 2 3 4 5 6 7 8 9 0
            // use the same for RTL even though the layout is backward: #6107
            
            /*if (keyCode !== undefined && keyCode !== null) {
                item.key = keyCode.toString();
            }*/
        });

        return items;
    };

    tool.willUpdate = function() {
        for (var i = 0; i <= 9; i++) {
            context.keybinding().off(i.toString());
        }
    };

    return tool;
}
