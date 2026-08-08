import { debounce, sortBy } from 'es-toolkit';
import { descending as d3_descending, ascending as d3_ascending } from 'd3-array';
import { select as d3_select } from 'd3-selection';

import { prefs } from '../../core/preferences';
import { t, localizer } from '../../core/localizer';
import { customIdNumber } from '../../renderer/custom_backgrounds';
import { uiTooltip } from '../tooltip';
import { svgIcon } from '../../svg/icon';
import { uiCmd } from '../cmd';
import { uiConfirm } from '../confirm';
import { uiSettingsCustomBackground } from '../settings/custom_background';
import { uiMapInMap } from '../map_in_map';
import { uiSection } from '../section';

export function uiSectionBackgroundList(context) {

    var _backgroundList = d3_select(null);

    var _settingsCustomBackground = uiSettingsCustomBackground(context)
        .on('change', customChanged);

    var section = uiSection('background-list', context)
        .label(() => t.append('background.backgrounds'))
        .disclosureHeaderOptions(renderHeaderOptions)
        .disclosureContent(renderDisclosureContent);

    function previousBackgroundID() {
        return prefs('background-last-used-toggle');
    }

    function renderHeaderOptions(selection) {
        selection.selectAll('button.add-custom-background')
            .data([0])
            .enter()
            .append('button')
            .attr('class', 'disclosure-header-option add-custom-background')
            .attr('aria-label', t('background.custom_add'))
            .call(uiTooltip()
                .title(() => t.append('background.custom_add'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            )
            .on('click', function(d3_event) {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                addCustom();
            })
            .call(svgIcon('#iD-icon-plus'));
    }

    function renderDisclosureContent(selection) {

        // the background list
        var container = selection.selectAll('.layer-background-list')
            .data([0]);

        _backgroundList = container.enter()
            .append('ul')
            .attr('class', 'layer-list layer-background-list')
            .merge(container);


        // add minimap toggle below list
        var bgExtrasListEnter = selection.selectAll('.bg-extras-list')
            .data([0])
            .enter()
            .append('ul')
            .attr('class', 'layer-list bg-extras-list');

        var minimapLabelEnter = bgExtrasListEnter
            .append('li')
            .attr('class', 'minimap-toggle-item')
            .append('label')
            .call(uiTooltip()
                .title(() => t.append('background.minimap.tooltip'))
                .keys([t('background.minimap.key')])
                .placement('top')
            );

        minimapLabelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function(d3_event) {
                d3_event.preventDefault();
                uiMapInMap.toggle();
            });

        minimapLabelEnter
            .append('span')
            .call(t.append('background.minimap.description'));


        var panelLabelEnter = bgExtrasListEnter
            .append('li')
            .attr('class', 'background-panel-toggle-item')
            .append('label')
            .call(uiTooltip()
                .title(() => t.append('background.panel.tooltip'))
                .keys([uiCmd('⌘⇧' + t('info_panels.background.key'))])
                .placement('top')
            );

        panelLabelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function(d3_event) {
                d3_event.preventDefault();
                context.ui().info.toggle('background');
            });

        panelLabelEnter
            .append('span')
            .call(t.append('background.panel.description'));

        var locPanelLabelEnter = bgExtrasListEnter
            .append('li')
            .attr('class', 'location-panel-toggle-item')
            .append('label')
            .call(uiTooltip()
                .title(() => t.append('background.location_panel.tooltip'))
                .keys([uiCmd('⌘⇧' + t('info_panels.location.key'))])
                .placement('top')
            );

        locPanelLabelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function(d3_event) {
                d3_event.preventDefault();
                context.ui().info.toggle('location');
            });

        locPanelLabelEnter
            .append('span')
            .call(t.append('background.location_panel.description'));


        // "Info / Report a Problem" link
        selection.selectAll('.imagery-faq')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'imagery-faq')
            .append('a')
            .attr('target', '_blank')
            .call(svgIcon('#iD-icon-out-link', 'inline'))
            .attr('href', 'https://github.com/openstreetmap/iD/blob/develop/FAQ.md#how-can-i-report-an-issue-with-background-imagery')
            .append('span')
            .call(t.append('background.imagery_problem_faq'));

        _backgroundList
            .call(drawListItems, 'radio', function(d3_event, d) {
                chooseBackground(d);
            }, function(d) {
                return !d.isHidden() && !d.overlay;
            });
    }

    function setTooltips(selection) {
        // Keep wide custom-URL tooltips inside the scrollable pane; without
        // this they are centered on the row and clipped by overflow-x: hidden.
        const paneContent = context.container().select('.background-pane .pane-content');

        selection.each(function(d, i, nodes) {
            const item = d3_select(this).select('label');
            const select = d3_select(this).select('select').node();
            if (select) {
                d = d.variants[select.selectedIndex].source;
            }
            const hasDescription = d.hasDescription();
            const span = item.select('span');
            const isOverflowing = (span.property('clientWidth') !== span.property('scrollWidth'));
            const placement = (i < nodes.length / 2) ? 'bottom' : 'top';
            const isPrevious = d.id === previousBackgroundID();
            const customTemplate = d.isCustom ? (d.template() || '').trim() : '';

            item.call(uiTooltip().destroyAny);

            // Custom rows always show the full template URL (label may be a
            // short name or a cleaned host/path). Keep the ⌘B hint when this
            // row is also the quick-switch target.
            if (customTemplate) {
                item.call(uiTooltip()
                    .placement(placement)
                    .scrollContainer(paneContent)
                    .title(() => selection => {
                        selection.append('code').text(customTemplate);
                    })
                    .keys(isPrevious ? [uiCmd('⌘' + t('background.key'))] : null)
                );
            } else if (isPrevious) {
                item.call(uiTooltip()
                    .placement(placement)
                    .title(() => t.append('background.switch'))
                    .keys([uiCmd('⌘' + t('background.key'))])
                );
            } else if (hasDescription || isOverflowing) {
                item.call(uiTooltip()
                    .placement(placement)
                    .title(() => hasDescription ? d.description() : d.label())
                );
            }
        });
    }

    function drawListItems(layerList, type, change, filter) {
        const sources = [];
        const dateLikeRegex = /(.+?\s\(?)((?:(?:\d{2,}|[-\/, ])+|DTM|DSM|DOM|DEM)+\s*)(\)?(?:\s|$).*)/;
        context.background()
            .sources(context.map().extent(), context.map().zoom(), true)
            .filter(filter)
            .sort(function(a, b) {
                // custom backgrounds always sort to the top, in stable creation
                // order (by id), so renaming one does not reorder the list
                if (a.isCustom !== b.isCustom) return a.isCustom ? -1 : 1;
                if (a.isCustom && b.isCustom) return customIdNumber(a.id) - customIdNumber(b.id);
                if (a.best() && !b.best()) return -1;
                if (b.best() && !a.best()) return 1;
                return d3_descending(a.area(), b.area()) || d3_ascending(a.name(), b.name()) || 0;
            })
            .forEach(source => {
                if (source.isCustom) {
                    sources.push({
                        ...source,
                        variants: [{ source }]
                    });
                    return;
                }
                const name = source.name();
                if (dateLikeRegex.test(name)) {
                    let [ prefix, variant, suffix ] = name.match(dateLikeRegex).slice(1);
                    variant = variant.replace(/^[-\/, ]+/, '').replace(/[-\/, ]+$/, ''); // strip away extra punctuation
                    const main = sources.find((s) =>
                        !s.isCustom && s.prefix === prefix && s.suffix === suffix);
                    if (main) {
                        main.variants.push({ variant, source });
                    } else {
                        sources.push({
                            ...source,
                            prefix,
                            suffix,
                            variants: [{ variant, source }]
                        });
                    }
                } else {
                    sources.push({
                        ...source,
                        variants: [{ source }]
                    });
                }
            });
        sources.forEach(source => {
            if (!source.isCustom && source.variants.length > 1) {
                source.variants = sortBy(source.variants, [
                    variant => variant.source.best(),
                    variant => variant.variant
                ]).reverse();
            }
        });

        var layerLinks = layerList.selectAll('li')
            // We have to be a bit inefficient about reordering the list since
            // arrow key navigation of radio values likes to work in the order
            // they were added, not the display document order.
            .data(sources, function(d, i) { return d.id + '---' + i; });

        layerLinks.exit()
            .remove();

        var enter = layerLinks.enter()
            .append('li')
            .classed('layer-custom', function(d) { return d.isCustom; })
            .classed('best', function(d) { return d.best(); });

        var label = enter
            .append('label');

        label
            .append('input')
            .attr('type', type)
            .attr('name', 'background-layer')
            .attr('value', function(d) {
                return d.id;
            })
            .on('change', function(d3_event, d) {
                if (d.variants.length > 1) {
                    const selectedVariantIndex = d3_select(this.parentElement).select('select').node().selectedIndex;
                    change(d3_event, d.variants[selectedVariantIndex].source);
                } else {
                    change(d3_event, d.variants[0].source);
                }
            });

        label
            .append('span')
            .each(function(d) {
                const self = d3_select(this);
                if (d.variants.length > 1) {
                    self.append('span').text(d.prefix + ' ');
                    self.append('select')
                        .on('change', function(d3_event, d) {
                            change(d3_event, d.variants[this.selectedIndex].source);
                        })
                        .selectAll('option')
                        .data(d => d.variants)
                        .enter()
                        .append('option')
                        .attr('value', d => d.source.id)
                        .text(d => d.variant);
                    self.append('span').text(' ' + d.suffix);
                } else {
                    d.label()(self);
                }
            });

        const customControls = enter.filter(function(d) { return d.isCustom; });

        customControls
            .append('button')
            .attr('class', 'layer-edit-custom')
            .call(uiTooltip()
                .title(() => t.append('settings.custom_background.tooltip'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            )
            .on('click', function(d3_event, d) {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                editCustom(d);
            })
            .call(svgIcon('#iD-icon-edit'));

        customControls
            .append('button')
            .attr('class', 'layer-delete-custom')
            .call(uiTooltip()
                .title(() => t.append('background.custom_delete.tooltip'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            )
            .on('click', function(d3_event, d) {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                deleteCustom(d);
            })
            .call(svgIcon('#iD-operation-delete'));

        enter.filter(function(d) { return d.best(); })
            .append('div')
            .attr('class', 'best')
            .call(uiTooltip()
                .title(() => t.append('background.best_imagery'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            )
            .append('span')
            .text('★');

        // render the label text on enter; on update re-render only custom rows,
        // whose labels can change after an edit (regular imagery labels are
        // static, and this runs on every map-move driven reRender)
        enter.merge(layerLinks.filter(function(d) { return d.isCustom; }))
            .select('label > span')
            .text(null)
            .each(function(d) { d.label()(d3_select(this)); });

        layerList
            .call(updateLayerSelections);
    }

    function updateLayerSelections(selection) {
        function active(d) {
            return d.variants.some((variant) =>
                context.background().showsLayer(variant.source));
        }

        const item = selection.selectAll('li')
            .classed('active', active)
            .classed('switch', (d) => d.variants.some((variant) =>
                variant.source.id === previousBackgroundID()))
            .call(setTooltips);
        item.selectAll('input')
            .property('checked', active);
        item.filter(active)
            .selectAll('select')
            .property('selectedIndex', (d) =>
                d.variants.findIndex((variant) =>
                    context.background().showsLayer(variant.source)));
    }


    function chooseBackground(d) {
        if (d.isCustom && !d.template()) {
            return editCustom(d);
        }

        // only record a quick-switch target when the background actually changes,
        // so e.g. renaming the selected custom does not clobber the ⌘B toggle
        var previousBackground = context.background().baseLayerSource();
        if (previousBackground && previousBackground.id !== d.id) {
            prefs('background-last-used-toggle', previousBackground.id);
        }
        prefs('background-last-used', d.id);
        context.background().baseLayerSource(d);
    }


    /**
     * Called when a custom background is added or edited via the settings modal:
     * select the affected source and refresh the list rows.
     * @param {{source: object}} d - the change payload dispatched by the modal
     */
    function customChanged(d) {
        if (d && d.source) {
            chooseBackground(d.source);
        }
        section.reRender();
    }


    /** Open the settings modal to add a new custom background. */
    function addCustom() {
        context.container()
            .call(_settingsCustomBackground.forEntry(null));
    }


    /**
     * Open the settings modal to edit an existing custom background.
     * @param {object} d - the custom background source to edit
     */
    function editCustom(d) {
        const entry = { id: d.id, name: d.customName(), template: d.template() };
        context.container()
            .call(_settingsCustomBackground.forEntry(entry));
    }


    /**
     * Confirm, then delete a custom background. removeCustomSource falls back to
     * 'None' if the deleted layer was the selected one.
     * @param {object} d - the custom background source to delete
     */
    function deleteCustom(d) {
        const modal = uiConfirm(context.container());

        modal.select('.modal-section.header')
            .append('h3')
            .call(t.append('background.custom_delete.header'));

        modal.select('.modal-section.message-text')
            .append('p')
            .call(t.append('background.custom_delete.message', { name: d.name() }));

        const buttons = modal.select('.modal-section.buttons');

        // close() (not remove()) so the modal's document keybinding is unbound
        buttons
            .append('button')
            .attr('class', 'button cancel-button secondary-action')
            .call(t.append('confirm.cancel'))
            .on('click.cancel', function() {
                modal.close();
            });

        buttons
            .append('button')
            .attr('class', 'button action')
            .call(t.append('background.custom_delete.confirm'))
            .on('click.delete', function() {
                modal.close();
                context.background().removeCustomSource(d.id);
                section.reRender();
            });
    }


    context.background()
        .on('change.background_list', function() {
            _backgroundList.call(updateLayerSelections);
        });

    context.map()
        .on('move.background_list',
            debounce(function() {
                // layers in-view may have changed due to map move
                window.requestIdleCallback(section.reRender);
            }, 1000)
        );

    return section;
}
