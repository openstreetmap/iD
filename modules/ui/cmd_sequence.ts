import { select as d3_select, type EnterElement } from 'd3-selection';
import { t } from '../core/localizer';
import { svgIcon } from '../svg/icon';
import { uiCmd } from './cmd';
import { utilArrayUniq } from '../util';
import { utilDetect } from '../util/detect';

const detected = utilDetect();

export interface CmdSequence {
    modifiers?: string[];
    shortcuts: string[];
    separator?: string;
    suffix?: string;
    text?: string;
    gesture?: string;
}

interface Flattened {
    shortcut: string;
    separator: string | undefined;
    suffix: string | undefined;
}

/**
 * Renders a sequence of keyboard shortcuts, which might
 * consist of multiple `<kbd>` separated by `+` or `-or-`.
 * Also handles mouse-click operations.
 */
export function uiCmdSequence(shortcut: CmdSequence) {
    return (selection: d3.Selection) => {
        const shortcutKeys = selection
            .selectAll('div')
            .data([shortcut])
            .enter()
            .append('div');

        const modifierKeys = shortcutKeys.filter((d) => !!d.modifiers);

        modifierKeys
            .selectAll('kbd.modifier')
            .data((d) => {
                if (
                    detected.os === 'win' &&
                    d.text === 'shortcuts.editing.commands.redo'
                ) {
                    return ['⌘'];
                } else if (
                    detected.os !== 'mac' &&
                    d.text === 'shortcuts.browsing.display_options.fullscreen'
                ) {
                    return [];
                } else {
                    return d.modifiers!;
                }
            })
            .enter()
            .each(function () {
                const selection = d3_select<EnterElement, string>(this);

                selection
                    .append('kbd')
                    .attr('class', 'modifier')
                    .text(uiCmd.display);
                selection.append('span').text('+');
            });

        shortcutKeys
            .selectAll('kbd.shortcut')
            .data((d) => {
                let arr = d.shortcuts;
                if (
                    detected.os === 'win' &&
                    d.text === 'shortcuts.editing.commands.redo'
                ) {
                    arr = ['Y'];
                } else if (
                    detected.os !== 'mac' &&
                    d.text === 'shortcuts.browsing.display_options.fullscreen'
                ) {
                    arr = ['F11'];
                }

                // replace translations
                arr = arr.map((s) => {
                    return uiCmd.display(s.includes('.') ? t(s) : s);
                });

                return utilArrayUniq(arr).map(
                    (s): Flattened => ({
                        shortcut: s,
                        separator: d.separator,
                        suffix: d.suffix,
                    }),
                );
            })
            .enter()
            .each(function (d, i, nodes) {
                const selection = d3_select<EnterElement, Flattened>(this);
                const click = d.shortcut.toLowerCase().match(/(.*).click/);

                if (click && click[1]) {
                    // replace "left_click", "right_click" with mouse icon
                    selection.call(
                        svgIcon(
                            '#iD-walkthrough-mouse-' + click[1],
                            'operation',
                        ),
                    );
                } else if (d.shortcut.toLowerCase() === 'long-press') {
                    selection.call(
                        svgIcon(
                            '#iD-walkthrough-longpress',
                            'longpress operation',
                        ),
                    );
                } else if (d.shortcut.toLowerCase() === 'tap') {
                    selection.call(
                        svgIcon('#iD-walkthrough-tap', 'tap operation'),
                    );
                } else {
                    selection
                        .append('kbd')
                        .attr('class', 'shortcut')
                        .text((d) => d.shortcut);
                }

                if (i < nodes.length - 1) {
                    if (d.separator) {
                        selection
                            .append('span')
                            .text(d.separator);
                    } else {
                        selection.append('span').text('\u00a0');
                        selection.append('span').call(t.append('shortcuts.or'));
                        selection.append('span').text('\u00a0');
                    }
                } else if (i === nodes.length - 1 && d.suffix) {
                    selection.append('span').text(d.suffix);
                }
            });

        shortcutKeys
            .filter((d) => !!d.gesture)
            .each(function () {
                const selection = d3_select<HTMLElement, CmdSequence>(this);

                selection.append('span').text('+');

                selection
                    .append('span')
                    .attr('class', 'gesture')
                    .each(function (d) {
                        d3_select(this).call(t.addOrUpdate(d.gesture!));
                    });
            });
    };
}
