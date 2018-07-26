import { t } from '../util/locale';
import { svgIcon } from '../svg';
import { tooltip } from '../util/tooltip';


// these are module variables so they are preserved through a ui.restart()
var sawVersion = null;
var isNewVersion = false;
var isNewUser = false;


export function uiVersion(context) {

    var currVersion = context.version;
    var matchedVersion = currVersion.match(/\d+\.\d+\.\d+.*/);

    if (sawVersion === null && matchedVersion !== null) {
        isNewVersion = (context.storage('sawVersion') !== currVersion);
        isNewUser = !context.storage('sawSplash');
        context.storage('sawVersion', currVersion);
        sawVersion = currVersion;
    }

    return function(selection) {
        selection
            .append('a')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .attr('href', 'https://github.com/openstreetmap/iD')
            .text(currVersion);

        // only show new version indicator to users that have used iD before
        if (isNewVersion && !isNewUser) {
            selection
                .append('div')
                .attr('class', 'badge')
                .append('a')
                .attr('target', '_blank')
                .attr('tabindex', -1)
                .attr('href', 'https://github.com/openstreetmap/iD/blob/master/CHANGELOG.md#whats-new')
                .call(svgIcon('#maki-gift-11'))
                .call(tooltip()
                    .title(t('version.whats_new', { version: currVersion }))
                    .placement('top')
                );
        }
    };
}
