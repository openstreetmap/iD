import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import { debounce } from 'es-toolkit';
import type { Geometry } from '@openstreetmap/id-tagging-schema';
import type { presetCollection} from '../presets';
import { presetManager, type presetCategory, type presetPreset } from '../presets';
import { t, localizer, type LocalizedTextRenderer } from '../core/localizer';
import { actionChangePreset } from '../actions/change_preset';
import { svgIcon } from '../svg/index';
import { uiTooltip } from './tooltip';
import { geoExtent } from '../geo/extent';
import { uiPresetIcon } from './preset_icon';
import { uiTagReference } from './tag_reference';
import { utilKeybinding, utilNoAuto, utilRebind } from '../util';
import type { coreContext } from '../core';
import type { EntityId } from '../osm';
import type { Vec2 } from '../geo/vector';


export function uiPresetList(context: coreContext) {
    var dispatch = d3_dispatch('cancel', 'choose');
    var _entityIDs: EntityId[];
    var _currLoc: Vec2 | null;
    var _currentPresets: (presetPreset | presetCategory)[];
    var _autofocus = false;


    function presetList(selection: d3.Selection) {
        if (!_entityIDs) return;

        var presets = presetManager.matchAllGeometry(entityGeometries());

        selection.html('');

        var messagewrap = selection
            .append('div')
            .attr('class', 'header fillL');

        var message = messagewrap
            .append('h2')
            .call(t.addOrUpdate('inspector.choose'));

        messagewrap
            .append('button')
            .attr('class', 'preset-choose')
            .attr('title', _entityIDs.length === 1 ? t('inspector.edit') : t('inspector.edit_features'))
            .on('click', function() { dispatch.call('cancel', this); })
            .call(svgIcon('#iD-icon-close'));

        function initialKeydown(this: HTMLInputElement, d3_event: KeyboardEvent) {
            // hack to let undo work when search is autofocused
            if (search.property('value').length === 0 &&
                (d3_event.ctrlKey || d3_event.metaKey) &&
                d3_event.keyCode === utilKeybinding.keyCodes.z) {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                context.undo();
            } else if (!d3_event.ctrlKey && !d3_event.metaKey) {
                // don't check for delete/undo hack on future keydown events
                d3_select(this).on('keydown', keydown);
                keydown.call(this, d3_event);
            }
        }

        function keydown(d3_event: KeyboardEvent) {
            // down arrow
            if (d3_event.keyCode === utilKeybinding.keyCodes['↓'] &&
                // if insertion point is at the end of the string
                search.node()!.selectionStart === search.property('value').length) {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                // move focus to the first item in the preset list
                var buttons = list.selectAll<HTMLButtonElement, unknown>('.preset-list-button');
                if (!buttons.empty()) buttons.nodes()[0]!.focus();
            }
        }

        function keypress(d3_event: KeyboardEvent) {
            // enter
            if (d3_event.keyCode === 13) { // ↩ Return
                list.selectAll<HTMLButtonElement, ListItem>('.preset-list-item:first-child')
                    .each(function(d) { d.choose(this); });
            }
        }

        function inputevent() {
            var value = search.property('value');
            list.classed('filtered', value.length);

            var results, messageText;
            if (value.length) {
                results = presets.search(value, entityGeometries()[0], _currLoc);
                messageText = t.addOrUpdate('inspector.results', {
                    n: results.collection.length,
                    search: value
                });
            } else {
                var entityPresets = _entityIDs.map(entityID =>
                    presetManager.match(context.graph().entity(entityID), context.graph()));
                results = presetManager.defaults(entityGeometries()[0], 36, !context.inIntro(), _currLoc, entityPresets);
                messageText = t.addOrUpdate('inspector.choose');
            }
            list.call(drawList, results);
            message.call(messageText);
        }

        var searchWrap = selection
            .append('div')
            .attr('class', 'search-header');

        searchWrap
            .call(svgIcon('#iD-icon-search', 'pre-text'));

        var search = searchWrap
            .append('input')
            .attr('class', 'preset-search-input')
            .attr('placeholder', t('inspector.search_feature_type'))
            .attr('type', 'search')
            .call(utilNoAuto)
            .on('keydown', initialKeydown)
            .on('keypress', keypress)
            .on('input', debounce(inputevent, 0));

        if (_autofocus) {
            search.node()!.focus();

            // Safari 14 doesn't always like to focus immediately,
            // so try again on the next pass
            setTimeout(function() {
                search.node()!.focus();
            }, 0);
        }

        var listWrap = selection
            .append('div')
            .attr('class', 'inspector-body');

        var entityPresets = _entityIDs.map(entityID =>
            presetManager.match(context.graph().entity(entityID), context.graph()));
        var list = listWrap
            .append('div')
            .attr('class', 'preset-list')
            .call(drawList, presetManager.defaults(entityGeometries()[0], 36, !context.inIntro(), _currLoc, entityPresets));

        listWrap.node()!.scrollTo({ top: 0 });
        context.features().on('change.preset-list', updateForFeatureHiddenState);
    }


    type ListItem = PresetItem | CategoryItem;
    function drawList(list: d3.Selection<HTMLDivElement>, presets: presetCollection) {
        presets = presets.matchAllGeometry(entityGeometries());
        var collection = presets.collection.reduce<ListItem[]>(function(collection, preset) {
            if (!preset) return collection;

            if ('members' in preset) {
                if (preset.members.collection.filter(function(preset) {
                    return preset.addable();
                }).length > 1) {
                    collection.push(new CategoryItem(preset));
                }
            } else if (preset.addable()) {
                collection.push(new PresetItem(preset));
            }
            return collection;
        }, []);

        var items = list.selectChildren<HTMLDivElement, ListItem>('.preset-list-item')
            .data(collection, function(d) { return d.preset.id; });

        items.order();

        items.exit()
            .remove();

        items.enter()
            .append('div')
            .attr('class', function(item) { return 'preset-list-item preset-' + item.preset.id.replaceAll('/', '-'); })
            .classed('current', function(item) { return _currentPresets.indexOf(item.preset) !== -1; })
            .each(function(item) { d3_select(this).call(item.render); })
            .style('opacity', 0)
            .transition()
            .style('opacity', 1);

        updateForFeatureHiddenState();
    }

    function itemKeydown(this: HTMLButtonElement, d3_event: KeyboardEvent) {
        // the actively focused item
        var item = d3_select<HTMLElement, ListItem>(this.closest<HTMLElement>('.preset-list-item')!);
        var parentItem = d3_select((item.node()!.parentNode as HTMLElement).closest('.preset-list-item'));

        // arrow down, move focus to the next, lower item
        if (d3_event.keyCode === utilKeybinding.keyCodes['↓']) {
            d3_event.preventDefault();
            d3_event.stopPropagation();
            // the next item in the list at the same level
            var nextItem = d3_select<HTMLElement, ListItem>(item.node()!.nextElementSibling as HTMLElement);
            // if there is no next item in this list
            if (nextItem.empty()) {
                // if there is a parent item
                if (!parentItem.empty()) {
                    // the item is the last item of a sublist,
                    // select the next item at the parent level
                    nextItem = d3_select<HTMLElement, ListItem>(parentItem.node()!.nextElementSibling as HTMLElement);
                }
            // if the focused item is expanded
            } else if (d3_select(this).classed('expanded')) {
                // select the first subitem instead
                nextItem = item.select('.subgrid .preset-list-item:first-child');
            }
            if (!nextItem.empty()) {
                // focus on the next item
                nextItem.select<HTMLButtonElement>('.preset-list-button').node()!.focus();
            }

        // arrow up, move focus to the previous, higher item
        } else if (d3_event.keyCode === utilKeybinding.keyCodes['↑']) {
            d3_event.preventDefault();
            d3_event.stopPropagation();
            // the previous item in the list at the same level
            var previousItem = d3_select(item.node()!.previousElementSibling);

            // if there is no previous item in this list
            if (previousItem.empty()) {
                // if there is a parent item
                if (!parentItem.empty()) {
                    // the item is the first subitem of a sublist select the parent item
                    previousItem = parentItem;
                }
            // if the previous item is expanded
            } else if (previousItem.select('.preset-list-button').classed('expanded')) {
                // select the last subitem of the sublist of the previous item
                previousItem = previousItem.select('.subgrid .preset-list-item:last-child');
            }

            if (!previousItem.empty()) {
                // focus on the previous item
                previousItem.select<HTMLButtonElement>('.preset-list-button').node()!.focus();
            } else {
                // the focus is at the top of the list, move focus back to the search field
                var search = d3_select(this.closest('.preset-list-pane')).select<HTMLInputElement>('.preset-search-input');
                search.node()!.focus();
            }

        // arrow left, move focus to the parent item if there is one
        } else if (d3_event.keyCode === utilKeybinding.keyCodes[(localizer.textDirection() === 'rtl') ? '→' : '←']) {
            d3_event.preventDefault();
            d3_event.stopPropagation();
            // if there is a parent item, focus on the parent item
            if (!parentItem.empty()) {
                parentItem.select<HTMLButtonElement>('.preset-list-button').node()!.focus();
            }

        // arrow right, choose this item
        } else if (d3_event.keyCode === utilKeybinding.keyCodes[(localizer.textDirection() === 'rtl') ? '←' : '→']) {
            d3_event.preventDefault();
            d3_event.stopPropagation();
            item.datum().choose(d3_select(this).node()!);
        }
    }


    class CategoryItem {
        box?: d3.Selection<HTMLDivElement>;
        sublist?: d3.Selection<HTMLDivElement>;
        shown = false;
        preset: presetCategory;

        constructor(preset: presetCategory) {
            this.preset = preset;
        }

        render(selection: d3.Selection<HTMLDivElement>) {
            var wrap = selection.append('div')
                .attr('class', 'preset-list-button-wrap category');

            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const that = this;
            function click(this: HTMLElement, event?: Event) {
                var isExpanded = d3_select(this).classed('expanded');
                var iconName = isExpanded ?
                    (localizer.textDirection() === 'rtl' ? '#iD-icon-backward' : '#iD-icon-forward') : '#iD-icon-down';
                d3_select(this)
                    .classed('expanded', !isExpanded)
                    .attr('title', !isExpanded ? t('icons.collapse') : t('icons.expand'));
                d3_select(this).selectAll('div.label-inner svg.icon use')
                    .attr('href', iconName);
                that.choose();
            }

            var geometries = entityGeometries();

            var button = wrap
                .append('button')
                .attr('class', 'preset-list-button')
                .attr('title', t('icons.expand'))
                .classed('expanded', false)
                .call(uiPresetIcon()
                    .geometry(geometries.length === 1 && geometries[0])
                    .preset(this.preset))
                .on('click', click)
                .on('keydown', function(d3_event) {
                    // right arrow, expand the focused item
                    if (d3_event.keyCode === utilKeybinding.keyCodes[(localizer.textDirection() === 'rtl') ? '←' : '→']) {
                        d3_event.preventDefault();
                        d3_event.stopPropagation();
                        // if the item isn't expanded
                        if (!d3_select(this).classed('expanded')) {
                            // toggle expansion (expand the item)
                            click.call(this, d3_event);
                        }
                    // left arrow, collapse the focused item
                    } else if (d3_event.keyCode === utilKeybinding.keyCodes[(localizer.textDirection() === 'rtl') ? '→' : '←']) {
                        d3_event.preventDefault();
                        d3_event.stopPropagation();
                        // if the item is expanded
                        if (d3_select(this).classed('expanded')) {
                            // toggle expansion (collapse the item)
                            click.call(this, d3_event);
                        }
                    } else {
                        itemKeydown.call(this, d3_event);
                    }
                });

            var label = button
                .append('div')
                .attr('class', 'label')
                .append('div')
                .attr('class', 'label-inner');

            label
                .append('div')
                .attr('class', 'namepart')
                .call(svgIcon((localizer.textDirection() === 'rtl' ? '#iD-icon-backward' : '#iD-icon-forward'), 'inline'))
                .append('span')
                .call(this.preset.nameLabel())
                .append('span').text('…');

            this.box = selection.append('div')
                .attr('class', 'subgrid')
                .style('max-height', '0px')
                .style('opacity', 0);

            this.box.append('div')
                .attr('class', 'arrow');

            this.sublist = this.box.append('div')
                .attr('class', 'preset-list fillL3');
        }


        choose() {
            if (!this.box || !this.sublist) return;

            if (this.shown) {
                this.shown = false;
                this.box.transition()
                    .duration(200)
                    .style('opacity', '0')
                    .style('max-height', '0px')
                    .style('padding-bottom', '0px');
            } else {
                this.shown = true;
                var members = this.preset.members.matchAllGeometry(entityGeometries());
                this.sublist.call(drawList, members);
                this.box.transition()
                    .duration(200)
                    .style('opacity', '1')
                    .style('max-height', 200 + members.collection.length * 190 + 'px')
                    .style('padding-bottom', '10px');
            }
        }
    }


    class PresetItem {
        preset: presetPreset;
        reference: any;

        constructor(preset: presetPreset) {
            this.preset = preset;
            this.reference = uiTagReference(preset.reference());
        }

        render(selection: d3.Selection<HTMLDivElement>) {
            var wrap = selection.append('div')
                .attr('class', 'preset-list-button-wrap');

            var geometries = entityGeometries();

            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const that = this;
            var button = wrap.append('button')
                .attr('class', 'preset-list-button')
                .call(uiPresetIcon()
                    .geometry(geometries.length === 1 && geometries[0])
                    .preset(this.preset))
                .on('click', function onClick() { that.choose(this); })
                .on('keydown', itemKeydown);

            var label = button
                .append('div')
                .attr('class', 'label')
                .append('div')
                .attr('class', 'label-inner');

            var nameparts = [
                this.preset.nameLabel(),
                this.preset.subtitleLabel()
            ].filter(Boolean);

            label.selectAll<HTMLElement, LocalizedTextRenderer>('.namepart')
                .data(nameparts, d => d.stringId)
                .enter()
                .append('div')
                .attr('class', 'namepart')
                .text('')
                .each(function(d) { d(d3_select(this)); });

            wrap.call(this.reference.button);
            selection.call(this.reference.body);
        }

        choose(el: HTMLButtonElement) {
            if (d3_select(el).classed('disabled')) return;
            if (!context.inIntro()) {
                presetManager.setMostRecent(this.preset);
            }
            context.perform(
                (graph) => {
                    for (var i in _entityIDs) {
                        var entityID = _entityIDs[i];
                        var oldPreset = presetManager.match(graph.entity(entityID), graph);
                        graph = actionChangePreset(entityID, oldPreset, this.preset)(graph);
                    }
                    return graph;
                },
                t('operations.change_tags.annotation')
            );

            context.validator().validate();  // rerun validation
            dispatch.call('choose', this, this.preset);
        }

        help(d3_event: MouseEvent) {
            d3_event.stopPropagation();
            this.reference.toggle();
        };
    }


    function updateForFeatureHiddenState() {
        if (!_entityIDs.every(context.hasEntity)) return;

        var geometries = entityGeometries();
        var button = context.container().selectAll<HTMLButtonElement, { preset: presetPreset }>('.preset-list .preset-list-button');

        // remove existing tooltips
        button.call(uiTooltip<HTMLButtonElement>().destroyAny);

        button.each(function(item, index) {
            var hiddenPresetFeaturesId: string | false | undefined;
            for (var i in geometries) {
                hiddenPresetFeaturesId = context.features().isHiddenPreset(item.preset, geometries[i]);
                if (hiddenPresetFeaturesId) break;
            }
            var isHiddenPreset = !context.inIntro() &&
                !!hiddenPresetFeaturesId &&
                (_currentPresets.length !== 1 || item.preset !== _currentPresets[0]);

            d3_select(this)
                .classed('disabled', isHiddenPreset);

            if (isHiddenPreset) {
                var isAutoHidden = context.features().autoHidden(hiddenPresetFeaturesId);
                d3_select(this).call(uiTooltip<HTMLButtonElement>()
                    .title(() => t.append('inspector.hidden_preset.' + (isAutoHidden ? 'zoom' : 'manual'), {
                        features: t('feature.' + hiddenPresetFeaturesId + '.description')
                    }))
                    .placement(index < 2 ? 'bottom' : 'top')
                );
            }
        });
    }

    presetList.autofocus = function(val) {
        if (!arguments.length) return _autofocus;
        _autofocus = val;
        return presetList;
    };

    presetList.entityIDs = function(val) {
        if (!arguments.length) return _entityIDs;

        _entityIDs = val;
        _currLoc = null;

        if (_entityIDs && _entityIDs.length) {
            // calculate current location
            const extent = _entityIDs.reduce(function(extent, entityID) {
                var entity = context.graph().entity(entityID);
                return extent.extend(entity.extent(context.graph()));
            }, geoExtent());
            _currLoc = extent.center();

            // match presets
            var presets = _entityIDs.map(function(entityID) {
                return presetManager.match(context.entity(entityID), context.graph());
            });
            presetList.presets(presets);
        }

        return presetList;
    };

    presetList.presets = function(val) {
        if (!arguments.length) return _currentPresets;
        _currentPresets = val;
        return presetList;
    };

    function entityGeometries() {

        var counts = {} as Record<Geometry, number>;

        for (var i in _entityIDs) {
            var entityID = _entityIDs[i];
            var entity = context.entity(entityID);
            let geometry: Geometry = entity.geometry(context.graph());

            // Treat entities on addr:interpolation lines as points, not vertices (#3241)
            if (geometry === 'vertex' && entity.type === 'node' && entity.isOnAddressLine(context.graph())) {
                geometry = 'point';
            }

            if (!counts[geometry]) counts[geometry] = 0;
            counts[geometry] += 1;
        }

        return Object.keys(counts).sort(function(geom1, geom2) {
            return counts[geom2] - counts[geom1];
        });
    }

    return utilRebind(presetList, dispatch, 'on');
}
