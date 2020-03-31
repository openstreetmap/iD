import { t, localizer } from '../../core/localizer';
import { svgIcon } from '../../svg';
import { uiTooltip } from '../tooltip';

export function uiToolSidebarToggle(context) {

    var tool = {
        id: 'sidebar_toggle',
        label: t('toolbar.inspect')
    };

    tool.render = function(selection) {
        selection
            .append('button')
            .attr('class', 'bar-button')
            .on('click', function() {
                context.ui().sidebar.toggle();
            })
            .call(uiTooltip()
                .placement('bottom')
                .title(t('sidebar.tooltip'))
                .keys([t('sidebar.key')])
                .scrollContainer(context.container().select('.top-toolbar'))
            )
            .call(svgIcon('#iD-icon-sidebar-' + (localizer.textDirection() === 'rtl' ? 'right' : 'left')));
    };

    return tool;
}
