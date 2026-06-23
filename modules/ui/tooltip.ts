import { utilFunctor, type Functor } from '../util/util';
import { t } from '../core/localizer';
import { uiPopover } from './popover';

export function uiTooltip(klass?: string): typeof uiPopover & {
    title: (val: string | Functor<string>) => typeof uiTooltip
    heading: (val: string | Functor<string>) => typeof uiTooltip
    keys: (val: string[] | Functor<string[]>) => typeof uiTooltip
} {

    const popover = uiPopover((klass || '') + ' tooltip');
    popover.displayType('hover');

    var _title: Functor<string> = function(this: HTMLElement): string {
        var title = this.getAttribute('data-original-title') || '';
        if (title) {
            return title;
        } else {
            title = this.getAttribute('title') || '';
            this.removeAttribute('title');
            this.setAttribute('data-original-title', title);
        }
        return title;
    };

    var _heading: Functor<string> = utilFunctor(null!);
    var _keys: Functor<string[]> = utilFunctor(null!);

    const tooltip = {
        title: function(val: string | Functor<string>) {
            if (!arguments.length) return _title;
            _title = utilFunctor(val);
            return {...popover, ...tooltip};
        },

        heading: function(val: string | Functor<string>) {
            if (!arguments.length) return _heading;
            _heading = utilFunctor(val);
            return {...popover, ...tooltip};
        },

        keys: function(val: string[] | Functor<string[]>) {
            if (!arguments.length) return _keys;
            _keys = utilFunctor(val);
            return {...popover, ...tooltip};
        }
    };

    popover.content(function(this: HTMLElement, ...args: any[]) {
        var heading = _heading.apply(this, args);
        var text = _title.apply(this, args);
        var keys = _keys.apply(this, args);

        var headingCallback: (s: d3.Selection<HTMLDivElement>) => void =
            typeof heading === 'function'
            ? heading
            : s => s.text(heading);
        var textCallback: (s: d3.Selection<HTMLDivElement>) => void =
            typeof text === 'function'
            ? text
            : s => s.text(text);

        return function(selection: d3.Selection<HTMLElement>) {

            var headingSelect = selection
                .selectAll<HTMLDivElement, any>('.tooltip-heading')
                .data(heading ? [heading] :[]);

            headingSelect.exit()
                .remove();

            headingSelect.enter()
                .append('div')
                .attr('class', 'tooltip-heading')
                .merge(headingSelect)
                .text('')
                .call(headingCallback);

            var textSelect = selection
                .selectAll<HTMLDivElement, any>('.tooltip-text')
                .data(text ? [text] :[]);

            textSelect.exit()
                .remove();

            textSelect.enter()
                .append('div')
                .attr('class', 'tooltip-text')
                .attr('dir', 'auto')
                .merge(textSelect)
                .text('')
                .call(textCallback);

            var keyhintWrap = selection
                .selectAll<HTMLDivElement, any>('.keyhint-wrap')
                .data(keys && keys.length ? [0] : []);

            keyhintWrap.exit()
                .remove();

            var keyhintWrapEnter = keyhintWrap.enter()
                .append('div')
                .attr('class', 'keyhint-wrap');

            keyhintWrapEnter
                .append('span')
                .call(t.append('tooltip_keyhint'));

            keyhintWrap = keyhintWrapEnter.merge(keyhintWrap);

            keyhintWrap.selectAll('kbd.shortcut')
                .data(keys && keys.length ? keys : [])
                .enter()
                .append('kbd')
                .attr('class', 'shortcut')
                .text(function(d) {
                    return d;
                });
        };
    });

    return {...popover, ...tooltip};
}
