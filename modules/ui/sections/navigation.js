import { prefs } from '../../core/preferences';
import { t } from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { uiSection } from '../section';

export function uiSectionNavigation(context) {
    let section = uiSection('preferences-navigation', context)
        .label(() => t.append('preferences.navigation.title'))
        .disclosureContent(renderDisclosureContent);

    function renderDisclosureContent(selection) {
        selection.selectAll('.navigation-options-list')
            .data([0])
            .enter()
            .append('ul')
            .attr('class', 'layer-list navigation-options-list');

        let scrollToPanEnter = selection.select('.navigation-options-list')
            .selectAll('.navigation-scroll-to-pan-item')
            .data([prefs('preferences.navigation.scroll_to_pan') || 'false'])
            .enter()
            .append('li')
            .attr('class', 'navigation-scroll-to-pan-item')
            .append('label')
            .call(uiTooltip()
                .title(() => t.append('preferences.navigation.scroll_to_pan.tooltip'))
                .placement('bottom')
            );

        scrollToPanEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', (d3_event, d) => {
                d3_event.preventDefault();
                prefs('preferences.navigation.scroll_to_pan', d === 'true' ? 'false' : 'true');
            });

        scrollToPanEnter
            .append('span')
            .call(t.append('preferences.navigation.scroll_to_pan.description'));

        selection.selectAll('.navigation-scroll-to-pan-item')
            .classed('active', d => d === 'true')
            .select('input')
            .property('checked', d => d === 'true');
    }

    prefs.onChange('preferences.navigation.scroll_to_pan', section.reRender);

    return section;
}
