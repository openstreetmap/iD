import { select as d3_select } from 'd3-selection';
import { marked } from 'marked';

import { utilHighlightEntities } from '../util';
import { t } from '../core/localizer';
import { services } from '../services';

export function uiMapRouletteDetails(context) {
    const mr = services.maproulette;
    let _qaItem;

    function generateDropdownHtml(dropdownName, options) {
        return `<select name="${dropdownName}"><option value=""></option>${options
            .map(
                (option) =>
                    `<option value="${option.trim()}">${option.trim()}</option>`,
            )
            .join('')}</select>`;
    }

    function generateDynamicContent(text) {
        if (!text) return '';
        const segments = text.split(
            /\[select\s+&quot;\s*[^\"]*?\s*&quot;\s+name=&quot;/,
        );
        let transformedText = segments[0];
        segments.slice(1).forEach((segment) => {
            const endIndex = segment.indexOf('&quot;');
            const dropdownName = segment.substring(0, endIndex);
            const valuesStart =
                segment.indexOf('values=&quot;') + 'values=&quot;'.length;
            const valuesEnd = segment.indexOf('&quot;', valuesStart);
            const options = segment
                .substring(valuesStart, valuesEnd)
                .split(',');
            const dropdownHtml = generateDropdownHtml(dropdownName, options);
            const remainder = segment
                .substring(valuesEnd + '&quot;'.length)
                .trim()
                .replace(/^\]/, '');
            transformedText += dropdownHtml + remainder;
        });
        return transformedText;
    }

    function replaceMustacheTags(text, task) {
        if (!text) return '';
        const tagRegex = /\{\{([\w:]+)\}\}/g;

        // Build a map of all properties similar to Rapid's implementation
        function buildAllProperties(obj) {
            const all = new Map();
            if (!obj) return all;
            // Preferred: task.taskFeatures (array of features with .properties)
            if (Array.isArray(obj.taskFeatures)) {
                obj.taskFeatures
                    .map((f) => (f && f.properties) || {})
                    .forEach((props) => {
                        Object.keys(props).forEach((key) =>
                            all.set(key, props[key]),
                        );
                    });
            }
            // Fallback common shapes
            if (obj.properties) {
                Object.keys(obj.properties).forEach((key) =>
                    all.set(key, obj.properties[key]),
                );
            }
            const geom = obj.geometries || obj.geojson || obj.geometry;
            if (geom) {
                if (geom.properties) {
                    Object.keys(geom.properties).forEach((key) =>
                        all.set(key, geom.properties[key]),
                    );
                }
                if (Array.isArray(geom.features) && geom.features.length) {
                    const featProps =
                        geom.features[0] && geom.features[0].properties;
                    if (featProps) {
                        Object.keys(featProps).forEach((key) =>
                            all.set(key, featProps[key]),
                        );
                    }
                }
            }
            // Flat fields
            Object.keys(obj).forEach((key) => {
                if (!all.has(key)) all.set(key, obj[key]);
            });
            return all;
        }

        const allProps = buildAllProperties(task);

        return text.replace(tagRegex, (match, propertyName) => {
            if (propertyName === 'osmIdentifier' && task && task.title) {
                const osmId = String(task.title).split('@')[0];
                return `<a href="#" class="highlight-link" data-osm-id="${osmId}">${osmId}</a>`;
            }
            if (allProps.has(propertyName)) {
                const val = allProps.get(propertyName);
                return val !== undefined && val !== null ? String(val) : '';
            }
            // Keep mustache tag visible if not replaced (Rapid behavior)
            return match;
        });
    }

    function render(selection) {
        let details = selection
            .selectAll('.error-details')
            .data(_qaItem ? [_qaItem] : [], (d) => d.key);
        details.exit().remove();

        const detailsEnter = details
            .enter()
            .append('div')
            .attr('class', 'error-details');

        // 1) qa-header (icon + label)
        const headerEnter = detailsEnter
            .append('div')
            .attr('class', 'qa-header');

        const svgEnter = headerEnter
            .append('div')
            .attr('class', 'qa-header-icon')
            .append('svg')
            .attr('width', '20px')
            .attr('height', '30px')
            .attr('viewBox', '0 0 20 30')
            .attr(
                'class',
                (d) =>
                    `preset-icon-28 qaItem ${d.service} itemId-${d.id} itemType-${d.itemType}`,
            );

        // Header icon: circular head with tail, color #47725f, border black
        svgEnter
            .append('circle')
            .attr('cx', 10)
            .attr('cy', 10)
            .attr('r', 9)
            .attr('fill', '#47725f')
            .attr('stroke', '#111')
            .attr('stroke-width', 1.25);
        svgEnter
            .append('path')
            .attr('d', 'M 7 19 L 10 28 L 13 19 Z')
            .attr('fill', '#47725f')
            .attr('stroke', '#111')
            .attr('stroke-width', 1.25)
            .attr('stroke-linejoin', 'round');

        // inner logo, white, scaled to fit circle
        const hScale = 0.28; // 40 * 0.28 = ~11.2px
        const hg = svgEnter
            .append('g')
            .attr(
                'transform',
                `translate(${10 - 20 * hScale}, ${10 - 20 * hScale}) scale(${hScale})`,
            )
            .attr('fill', '#ffffff')
            .attr('stroke', 'none');
        hg.append('path').attr(
            'd',
            'm28.121 11.879-2.828 5.657-2.829-2.829zM11.879 28.121l2.828-5.657 2.829 2.829z',
        );
        hg.append('path').attr(
            'd',
            'M20 26a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm0-1.333a4.667 4.667 0 1 0 0-9.334 4.667 4.667 0 0 0 0 9.334Z',
        );
        hg.append('path').attr(
            'd',
            'M19.875 0C8.916 0 0 8.916 0 19.875c0 10.96 8.916 19.876 19.875 19.876 10.96 0 19.876-8.916 19.876-19.876C39.75 8.916 30.835 0 19.875 0Zm0 38.426c-10.228 0-18.55-8.322-18.55-18.55 0-10.23 8.322-18.551 18.55-18.551 10.229 0 18.55 8.322 18.55 18.55 0 10.229-8.321 18.55-18.55 18.55Z',
        );
        hg.append('path').attr(
            'd',
            'M36.438 20.538a.662.662 0 1 0 0-1.325h-2.004a14.593 14.593 0 0 0-.325-2.466l1.936-.519a.662.662 0 1 0-.342-1.28l-1.936.519a14.389 14.389 0 0 0-.957-2.296l1.74-1.004a.662.662 0 1 0-.663-1.147l-1.741 1.005c-.45-.7-.954-1.36-1.513-1.972l1.422-1.422a.663.663 0 0 0-.937-.937l-1.422 1.422a14.697 14.697 0 0 0-1.972-1.512l1.005-1.741a.663.663 0 1 0-1.147-.663l-1.005 1.74a14.45 14.45 0 0 0-2.295-.958L24.8 4.05a.662.662 0 1 0-1.28-.344L23 5.642a14.58 14.58 0 0 0-2.465-.324V3.313a.662.662 0 1 0-1.324 0l-.001 2.004c-.842.038-1.666.15-2.465.325l-.52-1.936a.662.662 0 1 0-1.278.342l.518 1.936a14.45 14.45 0 0 0-2.296.957L12.166 5.2a.662.662 0 1 0-1.147.662l1.005 1.742c-.7.45-1.36.954-1.972 1.513l-1.42-1.422a.664.664 0 0 0-.938.937l1.42 1.422a14.688 14.688 0 0 0-1.51 1.972L5.862 11.02a.662.662 0 1 0-.663 1.148l1.74 1.005a14.45 14.45 0 0 0-.957 2.296l-1.935-.52a.663.663 0 0 0-.344 1.28l1.938.52c-.175.8-.286 1.622-.324 2.465l-2.005-.001a.663.663 0 0 0-.001 1.325l2.006.001c.038.843.15 1.666.325 2.466l-1.937.517a.663.663 0 0 0 .341 1.28l1.938-.517c.254.797.576 1.564.957 2.295L5.2 27.582a.663.663 0 0 0 .66 1.15l1.744-1.006c.45.7.954 1.36 1.513 1.972l-1.423 1.42a.662.662 0 1 0 .936.938l1.424-1.42a14.687 14.687 0 0 0 1.971 1.51l-1.007 1.742a.662.662 0 0 0 1.147.663l1.006-1.74a14.45 14.45 0 0 0 2.296.956l-.52 1.934a.662.662 0 1 0 1.28.345l.52-1.937c.8.176 1.623.287 2.465.325l-.001 2.003a.662.662 0 1 0 1.325.001l.001-2.004a14.53 14.53 0 0 0 2.466-.325l.517 1.936a.662.662 0 1 0 1.28-.342l-.517-1.935a14.44 14.44 0 0 0 2.295-.957l1.003 1.74a.66.66 0 0 0 .904.243.662.662 0 0 0 .243-.905l-1.003-1.743c.699-.449 1.36-.953 1.971-1.512l1.42 1.422a.66.66 0 0 0 .937 0 .664.664 0 0 0 .001-.936l-1.421-1.423a14.64 14.64 0 0 0 1.513-1.971l1.739 1.005a.665.665 0 0 0 .905-.242.662.662 0 0 0-.242-.905l-1.738-1.005c.381-.732.703-1.499.957-2.296l1.933.52a.663.663 0 0 0 .344-1.28l-1.936-.52c.176-.8.287-1.623.325-2.465h2.004ZM19.875 33.126c-7.306 0-13.25-5.944-13.25-13.25 0-7.307 5.944-13.25 13.25-13.25 7.307 0 13.25 5.943 13.25 13.25 0 7.306-5.943 13.25-13.25 13.25Z',
        );

        headerEnter.append('div').attr('class', 'qa-header-label');

        // 2) initial subsection placeholder
        detailsEnter
            .append('div')
            .attr('class', 'qa-details-subsection')
            .text(t('map_data.layers.maproulette.loading_task_details'));

        details = details.merge(detailsEnter);

        if (mr && _qaItem) {
            mr.loadTaskDetailAsync(_qaItem)
                .then((task) => {
                    if (!task) return;
                    if (_qaItem.id !== task.id) return;

                    const selection = details.selectAll(
                        '.qa-details-subsection',
                    );
                    selection.html(''); // replace contents

                    // Fill header label with challenge name if available
                    const headerLabel = details.selectAll(
                        '.qa-header .qa-header-label',
                    );
                    const headerText =
                        task.parentName ||
                        t('map_data.layers.maproulette.title');
                    headerLabel.text(headerText);

                    // 2) header with IDs (match Rapid structure)
                    if (task.id) {
                        const titleSection = selection
                            .append('header')
                            .attr('class', 'qa-details-header');
                        titleSection
                            .append('h4')
                            .text(t('map_data.layers.maproulette.id_title'));
                        titleSection
                            .append('p')
                            .text(`${task.parentId} / ${task.id}`)
                            .selectAll('a')
                            .attr('rel', 'noopener')
                            .attr('target', '_blank');
                    }

                    const description = generateDynamicContent(
                        marked.parse(
                            replaceMustacheTags(task.description, task),
                        ),
                    );
                    const instruction = generateDynamicContent(
                        marked.parse(
                            replaceMustacheTags(task.instruction, task),
                        ),
                    );

                    // Hide challenge description if explicit challengeIDs are set
                    const explicitChallengeIdGiven = Boolean(
                        mr && mr.challengeIDs && mr.challengeIDs(),
                    );
                    // 3) Details article
                    if (!explicitChallengeIdGiven && task.description) {
                        const art = selection.append('article');
                        art.append('header')
                            .attr('class', 'qa-details-header')
                            .append('h4')
                            .text(
                                t('map_data.layers.maproulette.detail_title'),
                            );
                        art.append('section')
                            .attr('class', 'qa-details-container')
                            .html(description)
                            .selectAll('a')
                            .attr('rel', 'noopener')
                            .attr('target', '_blank');
                    }

                    // 4) Instructions article
                    if (
                        task.instruction &&
                        task.instruction !== task.description
                    ) {
                        const art2 = selection.append('article');
                        art2.append('header')
                            .attr('class', 'qa-details-header')
                            .append('h4')
                            .text(
                                t(
                                    'map_data.layers.maproulette.instruction_title',
                                ),
                            );
                        art2.append('article')
                            .attr('class', 'qa-details-container')
                            .html(instruction)
                            .selectAll('a')
                            .attr('rel', 'noopener')
                            .attr('target', '_blank');
                    }

                    // Attach hover and click event listeners
                    selection
                        .selectAll('.highlight-link')
                        .on('mouseover', function () {
                            const osmId = d3_select(this).attr('data-osm-id');
                            utilHighlightEntities([osmId], true, context);
                        })
                        .on('mouseout', function () {
                            const osmId = d3_select(this).attr('data-osm-id');
                            utilHighlightEntities([osmId], false, context);
                        })
                        .on('click', function (d3_event) {
                            d3_event.preventDefault();
                            const osmId = d3_select(this).attr('data-osm-id');
                            utilHighlightEntities([osmId], false, context);
                        });
                })
                .catch(() => {
                    details
                        .selectAll('.qa-details-subsection')
                        .text(
                            t(
                                'map_data.layers.maproulette.error_loading_task_details',
                            ),
                        );
                });
        }
    }

    render.task = function (val) {
        if (!arguments.length) return _qaItem;
        _qaItem = val;
        return render;
    };

    return render;
}
