import { t } from '../../util/locale';
import { uiToolQuickPresets } from './quick_presets';

export function uiToolAddAddablePresets(context) {

    var tool = uiToolQuickPresets(context);
    tool.id = 'add_addable_preset';
    tool.label = t('toolbar.add_feature');
    tool.userToggleable = false;

    tool.itemsToDraw = function() {

        var items = context.presets().getAddable().slice(0, 10);

        items.forEach(function(item, index) {
            var keyCode;
            // use number row order: 1 2 3 4 5 6 7 8 9 0
            // use the same for RTL even though the layout is backward: #6107
            if (index === 9) {
                keyCode = 0;
            } else if (index < 10) {
                keyCode = index + 1;
            }
            if (keyCode !== undefined) {
                item.key = keyCode.toString();
            }
        });

        return items;
    };

    return tool;
}
