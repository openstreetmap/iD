import { t } from '../util/locale';


export function uiTooltipHtml(text, key, heading) {
    var s = '';

    if (heading) {
        s += '<div class="tooltip-heading"><span>' + heading + '</span></div>';
    }
    if (text) {
        s += '<div class="tooltip-text"><span>' + text + '</span></div>';
    }
    if (key) {
        s += '<div class="keyhint-wrap"><span>' + t('tooltip_keyhint') + '</span>' +
            '<span class="keyhint">' + key + '</span></div>';
    }

    return s;
}
