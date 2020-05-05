import { prefs } from '../../core/preferences';
import { t } from '../../core/localizer';
import { presetManager } from '../../presets';
import { uiToolQuickPresets } from './quick_presets';

export function uiToolAddRecent(context) {

    var tool = uiToolQuickPresets(context);
    tool.id = 'add_recent';
    tool.label = t('toolbar.recent');
    tool.iconName = 'fas-history';

    tool.itemsToDraw = function() {
        if (presetManager.getAddable().length) return [];

        var maxShown = 10;
        var maxRecents = 5;
        var precedingCount = prefs('tool.add_generic.toggledOn') === 'true' ? 3 : 0;

        var favorites = presetManager.getFavorites().slice(0, maxShown);
        var generics = presetManager.getGenericRibbonItems();
        precedingCount += favorites.length;

        function isAFavorite(recent) {
            return favorites.some(function(favorite) {
                return favorite.matches(recent.preset);
            });
        }

        function isGeneric(recent) {
            return generics.some(function(generic) {
                return generic.matches(recent.preset);
            });
        }

        maxRecents = Math.min(maxRecents, maxShown - precedingCount);
        var items = [];
        if (maxRecents > 0) {
            var recents = presetManager.getRecents().filter(function(recent) {
                return recent.preset.geometry.length > 1 || recent.preset.geometry[0] !== 'relation';
            });
            for (var i in recents) {
                var recent = recents[i];
                if (isAFavorite(recent)) {
                    continue;
                }
                if (isGeneric(recent) && prefs('tool.add_generic.toggledOn') === 'true') {
                    continue;
                }
                items.push(recent);
                if (items.length === maxRecents) {
                    break;
                }
            }
        }

        items.forEach(function(item, index) {
            var totalIndex = precedingCount + index;
            var keyCode;
            // use number row order: 1 2 3 4 5 6 7 8 9 0
            // use the same for RTL even though the layout is backward: #6107
            if (totalIndex === 9) {
                keyCode = 0;
            } else if (totalIndex < 10) {
                keyCode = totalIndex + 1;
            }
            if (keyCode !== undefined) {
                item.key = keyCode.toString();
            }
        });

        return items;
    };

    return tool;
}
