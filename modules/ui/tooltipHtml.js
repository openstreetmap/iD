import { t } from '../util/locale';


export function uiTooltipHtml(text, keys, heading) {
    var s = '';

    if (heading) {
        s += '<div class="tooltip-heading"><span>' + heading + '</span></div>';
    }
    if (text) {
        s += '<div class="tooltip-text"><span>' + text + '</span></div>';
    }
    if (keys) {
        if (!Array.isArray(keys)) keys = [keys];
        s += '<div class="keyhint-wrap"><span>' + t('tooltip_keyhint') + '</span>';
        keys.forEach(function(key) {
            s += '<kbd class="shortcut">' + key + '</kbd>';
        });
        s += '</div>';
    }

    return s;
}
