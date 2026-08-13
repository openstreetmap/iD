import { utilFunctor } from '../util/util';
import { t } from '../core/localizer';
import { uiPopover } from './popover';

type Title = d3.Selector | string;

type TitleFunc<This extends HTMLElement, T> = d3.ValueFn<This, T, Title>;
type KeysFunc<This extends HTMLElement, T> = d3.ValueFn<This, T, string[]>;

export interface uiTooltip<This extends HTMLElement = HTMLElement, T = unknown> extends uiPopover<This, T> {
    title: GetSetFunctor<this, string, TitleFunc<This, T>>;
    heading: GetSetFunctor<this, string, TitleFunc<This, T>>;
    keys: GetSetFunctor<this, string[], KeysFunc<This, T>>;
}

export function uiTooltip<This extends HTMLElement, T = unknown>(klass?: string) {

    const tooltip = uiPopover<This, T>((klass || '') + ' tooltip') as uiTooltip<This, T>;
    tooltip.displayType('hover');

    var _title: TitleFunc<This, T> = function(this: This) {
        var title = this.getAttribute('data-original-title')!;
        if (title) {
            return title;
        } else {
            title = this.getAttribute('title')!;
            this.removeAttribute('title');
            this.setAttribute('data-original-title', title);
        }
        return title;
    };

    var _heading: TitleFunc<This, T> = utilFunctor<Title, [d: T]>(null!);
    var _keys: KeysFunc<This, T> = utilFunctor<string[], [d: T]>(null!);

    tooltip.title = function(val) {
        if (!arguments.length) return _title;
        _title = utilFunctor<Title, Parameters<TitleFunc<This, T>>>(val);
        return tooltip;
    } as uiTooltip<This, T>['title'];

    tooltip.heading = function(val) {
        if (!arguments.length) return _heading;
        _heading = utilFunctor<Title, Parameters<TitleFunc<This, T>>>(val);
        return tooltip;
    } as uiTooltip<This, T>['heading'];

    tooltip.keys = function(val) {
        if (!arguments.length) return _keys;
        _keys = utilFunctor<string[], Parameters<KeysFunc<This, T>>>(val);
        return tooltip;
    } as uiTooltip<This, T>['keys'];

    tooltip.content(function(...args) {
        // these must be `const`, otherwise the narrowing below is not
        // preserved inside the closures which reference them.
        const heading = _heading.apply(this, args);
        const text = _title.apply(this, args);
        const keys = _keys.apply(this, args);

        var headingCallback = typeof heading === 'function' ? heading : (s: d3.Selection<HTMLDivElement>) => s.text(heading);
        var textCallback = typeof text === 'function' ? text : (s: d3.Selection<HTMLDivElement>) => s.text(text);

        return function(selection) {

            var headingSelect = selection
                .selectAll<HTMLDivElement, Title>('.tooltip-heading')
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
                .selectAll<HTMLDivElement, Title>('.tooltip-text')
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
                .selectAll<HTMLDivElement, 0>('.keyhint-wrap')
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

    return tooltip;
}
