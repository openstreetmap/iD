(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.iD = global.iD || {}, global.iD.ui = global.iD.ui || {})));
}(this, function (exports) { 'use strict';

	function Account(context) {
	    var connection = context.connection();

	    function update(selection) {
	        if (!connection.authenticated()) {
	            selection.selectAll('#userLink, #logoutLink')
	                .classed('hide', true);
	            return;
	        }

	        connection.userDetails(function(err, details) {
	            var userLink = selection.select('#userLink'),
	                logoutLink = selection.select('#logoutLink');

	            userLink.html('');
	            logoutLink.html('');

	            if (err) return;

	            selection.selectAll('#userLink, #logoutLink')
	                .classed('hide', false);

	            // Link
	            userLink.append('a')
	                .attr('href', connection.userURL(details.display_name))
	                .attr('target', '_blank');

	            // Add thumbnail or dont
	            if (details.image_url) {
	                userLink.append('img')
	                    .attr('class', 'icon pre-text user-icon')
	                    .attr('src', details.image_url);
	            } else {
	                userLink
	                    .call(iD.svg.Icon('#icon-avatar', 'pre-text light'));
	            }

	            // Add user name
	            userLink.append('span')
	                .attr('class', 'label')
	                .text(details.display_name);

	            logoutLink.append('a')
	                .attr('class', 'logout')
	                .attr('href', '#')
	                .text(t('logout'))
	                .on('click.logout', function() {
	                    d3.event.preventDefault();
	                    connection.logout();
	                });
	        });
	    }

	    return function(selection) {
	        selection.append('li')
	            .attr('id', 'logoutLink')
	            .classed('hide', true);

	        selection.append('li')
	            .attr('id', 'userLink')
	            .classed('hide', true);

	        connection.on('auth.account', function() { update(selection); });
	        update(selection);
	    };
	}

	function Attribution(context) {
	    var selection;

	    function attribution(data, klass) {
	        var div = selection.selectAll('.' + klass)
	            .data([0]);

	        div.enter()
	            .append('div')
	            .attr('class', klass);

	        var background = div.selectAll('.attribution')
	            .data(data, function(d) { return d.name(); });

	        background.enter()
	            .append('span')
	            .attr('class', 'attribution')
	            .each(function(d) {
	                if (d.terms_html) {
	                    d3.select(this)
	                        .html(d.terms_html);
	                    return;
	                }

	                var source = d.terms_text || d.id || d.name();

	                if (d.logo) {
	                    source = '<img class="source-image" src="' + context.imagePath(d.logo) + '">';
	                }

	                if (d.terms_url) {
	                    d3.select(this)
	                        .append('a')
	                        .attr('href', d.terms_url)
	                        .attr('target', '_blank')
	                        .html(source);
	                } else {
	                    d3.select(this)
	                        .text(source);
	                }
	            });

	        background.exit()
	            .remove();

	        var copyright = background.selectAll('.copyright-notice')
	            .data(function(d) {
	                var notice = d.copyrightNotices(context.map().zoom(), context.map().extent());
	                return notice ? [notice] : [];
	            });

	        copyright.enter()
	            .append('span')
	            .attr('class', 'copyright-notice');

	        copyright.text(String);

	        copyright.exit()
	            .remove();
	    }

	    function update() {
	        attribution([context.background().baseLayerSource()], 'base-layer-attribution');
	        attribution(context.background().overlayLayerSources().filter(function (s) {
	            return s.validZoom(context.map().zoom());
	        }), 'overlay-layer-attribution');
	    }

	    return function(select) {
	        selection = select;

	        context.background()
	            .on('change.attribution', update);

	        context.map()
	            .on('move.attribution', _.throttle(update, 400, {leading: false}));

	        update();
	    };
	}

	// Translate a MacOS key command into the appropriate Windows/Linux equivalent.
	// For example, ⌘Z -> Ctrl+Z
	function cmd(code) {
	    if (iD.detect().os === 'mac') {
	        return code;
	    }

	    if (iD.detect().os === 'win') {
	        if (code === '⌘⇧Z') return 'Ctrl+Y';
	    }

	    var result = '',
	        replacements = {
	            '⌘': 'Ctrl',
	            '⇧': 'Shift',
	            '⌥': 'Alt',
	            '⌫': 'Backspace',
	            '⌦': 'Delete'
	        };

	    for (var i = 0; i < code.length; i++) {
	        if (code[i] in replacements) {
	            result += replacements[code[i]] + '+';
	        } else {
	            result += code[i];
	        }
	    }

	    return result;
	}

	function MapInMap(context) {
	    var key = '/';

	    function map_in_map(selection) {
	        var backgroundLayer = iD.TileLayer(context),
	            overlayLayers = {},
	            projection = iD.geo.RawMercator(),
	            gpxLayer = iD.svg.Gpx(projection, context).showLabels(false),
	            debugLayer = iD.svg.Debug(projection, context),
	            zoom = d3.behavior.zoom()
	                .scaleExtent([ztok(0.5), ztok(24)])
	                .on('zoom', zoomPan),
	            transformed = false,
	            panning = false,
	            hidden = true,
	            zDiff = 6,    // by default, minimap renders at (main zoom - 6)
	            tStart, tLast, tCurr, kLast, kCurr, tiles, viewport, timeoutId;

	        function ztok(z) { return 256 * Math.pow(2, z); }
	        function ktoz(k) { return Math.log(k) / Math.LN2 - 8; }


	        function startMouse() {
	            context.surface().on('mouseup.map-in-map-outside', endMouse);
	            context.container().on('mouseup.map-in-map-outside', endMouse);

	            tStart = tLast = tCurr = projection.translate();
	            panning = true;
	        }


	        function zoomPan() {
	            var e = d3.event.sourceEvent,
	                t = d3.event.translate,
	                k = d3.event.scale,
	                zMain = ktoz(context.projection.scale() * 2 * Math.PI),
	                zMini = ktoz(k);

	            // restrict minimap zoom to < (main zoom - 3)
	            if (zMini > zMain - 3) {
	                zMini = zMain - 3;
	                zoom.scale(kCurr).translate(tCurr);  // restore last good values
	                return;
	            }

	            tCurr = t;
	            kCurr = k;
	            zDiff = zMain - zMini;

	            var scale = kCurr / kLast,
	                tX = (tCurr[0] / scale - tLast[0]) * scale,
	                tY = (tCurr[1] / scale - tLast[1]) * scale;

	            iD.util.setTransform(tiles, tX, tY, scale);
	            iD.util.setTransform(viewport, 0, 0, scale);
	            transformed = true;

	            queueRedraw();

	            e.preventDefault();
	            e.stopPropagation();
	        }


	        function endMouse() {
	            context.surface().on('mouseup.map-in-map-outside', null);
	            context.container().on('mouseup.map-in-map-outside', null);

	            updateProjection();
	            panning = false;

	            if (tCurr[0] !== tStart[0] && tCurr[1] !== tStart[1]) {
	                var dMini = wrap.dimensions(),
	                    cMini = [ dMini[0] / 2, dMini[1] / 2 ];

	                context.map().center(projection.invert(cMini));
	            }
	        }


	        function updateProjection() {
	            var loc = context.map().center(),
	                dMini = wrap.dimensions(),
	                cMini = [ dMini[0] / 2, dMini[1] / 2 ],
	                tMain = context.projection.translate(),
	                kMain = context.projection.scale(),
	                zMain = ktoz(kMain * 2 * Math.PI),
	                zMini = Math.max(zMain - zDiff, 0.5),
	                kMini = ztok(zMini);

	            projection
	                .translate(tMain)
	                .scale(kMini / (2 * Math.PI));

	            var s = projection(loc),
	                mouse = panning ? [ tCurr[0] - tStart[0], tCurr[1] - tStart[1] ] : [0, 0],
	                tMini = [
	                    cMini[0] - s[0] + tMain[0] + mouse[0],
	                    cMini[1] - s[1] + tMain[1] + mouse[1]
	                ];

	            projection
	                .translate(tMini)
	                .clipExtent([[0, 0], dMini]);

	            zoom
	                .center(cMini)
	                .translate(tMini)
	                .scale(kMini);

	            tLast = tCurr = tMini;
	            kLast = kCurr = kMini;

	            if (transformed) {
	                iD.util.setTransform(tiles, 0, 0);
	                iD.util.setTransform(viewport, 0, 0);
	                transformed = false;
	            }
	        }


	        function redraw() {
	            if (hidden) return;

	            updateProjection();

	            var dMini = wrap.dimensions(),
	                zMini = ktoz(projection.scale() * 2 * Math.PI);

	            // setup tile container
	            tiles = wrap
	                .selectAll('.map-in-map-tiles')
	                .data([0]);

	            tiles
	                .enter()
	                .append('div')
	                .attr('class', 'map-in-map-tiles');

	            // redraw background
	            backgroundLayer
	                .source(context.background().baseLayerSource())
	                .projection(projection)
	                .dimensions(dMini);

	            var background = tiles
	                .selectAll('.map-in-map-background')
	                .data([0]);

	            background.enter()
	                .append('div')
	                .attr('class', 'map-in-map-background');

	            background
	                .call(backgroundLayer);


	            // redraw overlay
	            var overlaySources = context.background().overlayLayerSources();
	            var activeOverlayLayers = [];
	            for (var i = 0; i < overlaySources.length; i++) {
	                if (overlaySources[i].validZoom(zMini)) {
	                    if (!overlayLayers[i]) overlayLayers[i] = iD.TileLayer(context);
	                    activeOverlayLayers.push(overlayLayers[i]
	                        .source(overlaySources[i])
	                        .projection(projection)
	                        .dimensions(dMini));
	                }
	            }

	            var overlay = tiles
	                .selectAll('.map-in-map-overlay')
	                .data([0]);

	            overlay.enter()
	                .append('div')
	                .attr('class', 'map-in-map-overlay');

	            var overlays = overlay
	                .selectAll('div')
	                .data(activeOverlayLayers, function(d) { return d.source().name(); });

	            overlays.enter().append('div');
	            overlays.each(function(layer) {
	                d3.select(this).call(layer);
	            });

	            overlays.exit()
	                .remove();


	            var dataLayers = tiles
	                .selectAll('.map-in-map-data')
	                .data([0]);

	            dataLayers.enter()
	                .append('svg')
	                .attr('class', 'map-in-map-data');

	            dataLayers.exit()
	                .remove();

	            dataLayers
	                .call(gpxLayer)
	                .call(debugLayer);


	            // redraw viewport bounding box
	            if (!panning) {
	                var getPath = d3.geo.path().projection(projection),
	                    bbox = { type: 'Polygon', coordinates: [context.map().extent().polygon()] };

	                viewport = wrap.selectAll('.map-in-map-viewport')
	                    .data([0]);

	                viewport.enter()
	                    .append('svg')
	                    .attr('class', 'map-in-map-viewport');

	                var path = viewport.selectAll('.map-in-map-bbox')
	                    .data([bbox]);

	                path.enter()
	                    .append('path')
	                    .attr('class', 'map-in-map-bbox');

	                path
	                    .attr('d', getPath)
	                    .classed('thick', function(d) { return getPath.area(d) < 30; });
	            }
	        }


	        function queueRedraw() {
	            clearTimeout(timeoutId);
	            timeoutId = setTimeout(function() { redraw(); }, 300);
	        }


	        function toggle() {
	            if (d3.event) d3.event.preventDefault();

	            hidden = !hidden;

	            var label = d3.select('.minimap-toggle');
	            label.classed('active', !hidden)
	                .select('input').property('checked', !hidden);

	            if (hidden) {
	                wrap
	                    .style('display', 'block')
	                    .style('opacity', 1)
	                    .transition()
	                    .duration(200)
	                    .style('opacity', 0)
	                    .each('end', function() {
	                        d3.select(this).style('display', 'none');
	                    });
	            } else {
	                wrap
	                    .style('display', 'block')
	                    .style('opacity', 0)
	                    .transition()
	                    .duration(200)
	                    .style('opacity', 1);

	                redraw();
	            }
	        }

	        MapInMap.toggle = toggle;

	        var wrap = selection.selectAll('.map-in-map')
	            .data([0]);

	        wrap.enter()
	            .append('div')
	            .attr('class', 'map-in-map')
	            .style('display', (hidden ? 'none' : 'block'))
	            .on('mousedown.map-in-map', startMouse)
	            .on('mouseup.map-in-map', endMouse)
	            .call(zoom)
	            .on('dblclick.zoom', null);

	        context.map()
	            .on('drawn.map-in-map', function(drawn) {
	                if (drawn.full === true) redraw();
	            });

	        redraw();

	        var keybinding = d3.keybinding('map-in-map')
	            .on(key, toggle);

	        d3.select(document)
	            .call(keybinding);
	    }

	    return map_in_map;
	}

	function Background(context) {
	    var key = 'B',
	        opacities = [1, 0.75, 0.5, 0.25],
	        directions = [
	            ['right', [0.5, 0]],
	            ['top', [0, -0.5]],
	            ['left', [-0.5, 0]],
	            ['bottom', [0, 0.5]]],
	        opacityDefault = (context.storage('background-opacity') !== null) ?
	            (+context.storage('background-opacity')) : 1.0,
	        customTemplate = context.storage('background-custom-template') || '',
	        previous;

	    // Can be 0 from <1.3.0 use or due to issue #1923.
	    if (opacityDefault === 0) opacityDefault = 1.0;


	    function background(selection) {

	        function sortSources(a, b) {
	            return a.best() && !b.best() ? -1
	                : b.best() && !a.best() ? 1
	                : d3.descending(a.area(), b.area()) || d3.ascending(a.name(), b.name()) || 0;
	        }

	        function setOpacity(d) {
	            var bg = context.container().selectAll('.layer-background')
	                .transition()
	                .style('opacity', d)
	                .attr('data-opacity', d);

	            if (!iD.detect().opera) {
	                iD.util.setTransform(bg, 0, 0);
	            }

	            opacityList.selectAll('li')
	                .classed('active', function(_) { return _ === d; });

	            context.storage('background-opacity', d);
	        }

	        function setTooltips(selection) {
	            selection.each(function(d) {
	                var item = d3.select(this);
	                if (d === previous) {
	                    item.call(bootstrap.tooltip()
	                        .html(true)
	                        .title(function() {
	                            var tip = '<div>' + t('background.switch') + '</div>';
	                            return iD.ui.tooltipHtml(tip, iD.ui.cmd('⌘B'));
	                        })
	                        .placement('top')
	                    );
	                } else if (d.description) {
	                    item.call(bootstrap.tooltip()
	                        .title(d.description)
	                        .placement('top')
	                    );
	                } else {
	                    item.call(bootstrap.tooltip().destroy);
	                }
	            });
	        }

	        function selectLayer() {
	            function active(d) {
	                return context.background().showsLayer(d);
	            }

	            content.selectAll('.layer, .custom_layer')
	                .classed('active', active)
	                .classed('switch', function(d) { return d === previous; })
	                .call(setTooltips)
	                .selectAll('input')
	                .property('checked', active);
	        }

	        function clickSetSource(d) {
	            previous = context.background().baseLayerSource();
	            d3.event.preventDefault();
	            context.background().baseLayerSource(d);
	            selectLayer();
	            document.activeElement.blur();
	        }

	        function editCustom() {
	            d3.event.preventDefault();
	            var template = window.prompt(t('background.custom_prompt'), customTemplate);
	            if (!template ||
	                template.indexOf('google.com') !== -1 ||
	                template.indexOf('googleapis.com') !== -1 ||
	                template.indexOf('google.ru') !== -1) {
	                selectLayer();
	                return;
	            }
	            setCustom(template);
	        }

	        function setCustom(template) {
	            context.background().baseLayerSource(iD.BackgroundSource.Custom(template));
	            selectLayer();
	            context.storage('background-custom-template', template);
	        }

	        function clickSetOverlay(d) {
	            d3.event.preventDefault();
	            context.background().toggleOverlayLayer(d);
	            selectLayer();
	            document.activeElement.blur();
	        }

	        function drawList(layerList, type, change, filter) {
	            var sources = context.background()
	                .sources(context.map().extent())
	                .filter(filter);

	            var layerLinks = layerList.selectAll('li.layer')
	                .data(sources, function(d) { return d.name(); });

	            var enter = layerLinks.enter()
	                .insert('li', '.custom_layer')
	                .attr('class', 'layer')
	                .classed('best', function(d) { return d.best(); });

	            enter.filter(function(d) { return d.best(); })
	                .append('div')
	                .attr('class', 'best')
	                .call(bootstrap.tooltip()
	                    .title(t('background.best_imagery'))
	                    .placement('left'))
	                .append('span')
	                .html('&#9733;');

	            var label = enter.append('label');

	            label.append('input')
	                .attr('type', type)
	                .attr('name', 'layers')
	                .on('change', change);

	            label.append('span')
	                .text(function(d) { return d.name(); });


	            layerLinks.exit()
	                .remove();

	            layerList.selectAll('li.layer')
	                .sort(sortSources)
	                .style('display', layerList.selectAll('li.layer').data().length > 0 ? 'block' : 'none');
	        }

	        function update() {
	            backgroundList.call(drawList, 'radio', clickSetSource, function(d) { return !d.overlay; });
	            overlayList.call(drawList, 'checkbox', clickSetOverlay, function(d) { return d.overlay; });

	            selectLayer();

	            var source = context.background().baseLayerSource();
	            if (source.id === 'custom') {
	                customTemplate = source.template;
	            }

	            updateOffsetVal();
	        }

	        function updateOffsetVal() {
	            var meters = iD.geo.offsetToMeters(context.background().offset()),
	                x = +meters[0].toFixed(2),
	                y = +meters[1].toFixed(2);

	            d3.selectAll('.nudge-inner-rect')
	                .select('input')
	                .classed('error', false)
	                .property('value', x + ', ' + y);

	            d3.selectAll('.nudge-reset')
	                .classed('disabled', function() {
	                    return (x === 0 && y === 0);
	                });
	        }

	        function resetOffset() {
	            context.background().offset([0, 0]);
	            updateOffsetVal();
	        }

	        function nudge(d) {
	            context.background().nudge(d, context.map().zoom());
	            updateOffsetVal();
	        }

	        function buttonOffset(d) {
	            var timeout = window.setTimeout(function() {
	                    interval = window.setInterval(nudge.bind(null, d), 100);
	                }, 500),
	                interval;

	            d3.select(window).on('mouseup', function() {
	                window.clearInterval(interval);
	                window.clearTimeout(timeout);
	                d3.select(window).on('mouseup', null);
	            });

	            nudge(d);
	        }

	        function inputOffset() {
	            var input = d3.select(this);
	            var d = input.node().value;

	            if (d === '') return resetOffset();

	            d = d.replace(/;/g, ',').split(',').map(function(n) {
	                // if n is NaN, it will always get mapped to false.
	                return !isNaN(n) && n;
	            });

	            if (d.length !== 2 || !d[0] || !d[1]) {
	                input.classed('error', true);
	                return;
	            }

	            context.background().offset(iD.geo.metersToOffset(d));
	            updateOffsetVal();
	        }

	        function dragOffset() {
	            var origin = [d3.event.clientX, d3.event.clientY];

	            context.container()
	                .append('div')
	                .attr('class', 'nudge-surface');

	            d3.select(window)
	                .on('mousemove.offset', function() {
	                    var latest = [d3.event.clientX, d3.event.clientY];
	                    var d = [
	                        -(origin[0] - latest[0]) / 4,
	                        -(origin[1] - latest[1]) / 4
	                    ];

	                    origin = latest;
	                    nudge(d);
	                })
	                .on('mouseup.offset', function() {
	                    d3.selectAll('.nudge-surface')
	                        .remove();

	                    d3.select(window)
	                        .on('mousemove.offset', null)
	                        .on('mouseup.offset', null);
	                });

	            d3.event.preventDefault();
	        }

	        function hide() {
	            setVisible(false);
	        }

	        function toggle() {
	            if (d3.event) d3.event.preventDefault();
	            tooltip.hide(button);
	            setVisible(!button.classed('active'));
	        }

	        function quickSwitch() {
	            if (previous) {
	                clickSetSource(previous);
	            }
	        }

	        function setVisible(show) {
	            if (show !== shown) {
	                button.classed('active', show);
	                shown = show;

	                if (show) {
	                    selection.on('mousedown.background-inside', function() {
	                        return d3.event.stopPropagation();
	                    });
	                    content.style('display', 'block')
	                        .style('right', '-300px')
	                        .transition()
	                        .duration(200)
	                        .style('right', '0px');
	                } else {
	                    content.style('display', 'block')
	                        .style('right', '0px')
	                        .transition()
	                        .duration(200)
	                        .style('right', '-300px')
	                        .each('end', function() {
	                            d3.select(this).style('display', 'none');
	                        });
	                    selection.on('mousedown.background-inside', null);
	                }
	            }
	        }


	        var content = selection.append('div')
	                .attr('class', 'fillL map-overlay col3 content hide'),
	            tooltip = bootstrap.tooltip()
	                .placement('left')
	                .html(true)
	                .title(iD.ui.tooltipHtml(t('background.description'), key)),
	            button = selection.append('button')
	                .attr('tabindex', -1)
	                .on('click', toggle)
	                .call(iD.svg.Icon('#icon-layers', 'light'))
	                .call(tooltip),
	            shown = false;


	        /* opacity switcher */

	        var opa = content.append('div')
	                .attr('class', 'opacity-options-wrapper');

	        opa.append('h4')
	            .text(t('background.title'));

	        var opacityList = opa.append('ul')
	            .attr('class', 'opacity-options');

	        opacityList.selectAll('div.opacity')
	            .data(opacities)
	            .enter()
	            .append('li')
	            .attr('data-original-title', function(d) {
	                return t('background.percent_brightness', { opacity: (d * 100) });
	            })
	            .on('click.set-opacity', setOpacity)
	            .html('<div class="select-box"></div>')
	            .call(bootstrap.tooltip()
	                .placement('left'))
	            .append('div')
	            .attr('class', 'opacity')
	            .style('opacity', function(d) { return 1.25 - d; });


	        /* background switcher */

	        var backgroundList = content.append('ul')
	            .attr('class', 'layer-list');

	        var custom = backgroundList.append('li')
	            .attr('class', 'custom_layer')
	            .datum(iD.BackgroundSource.Custom());

	        custom.append('button')
	            .attr('class', 'layer-browse')
	            .call(bootstrap.tooltip()
	                .title(t('background.custom_button'))
	                .placement('left'))
	            .on('click', editCustom)
	            .call(iD.svg.Icon('#icon-search'));

	        var label = custom.append('label');

	        label.append('input')
	            .attr('type', 'radio')
	            .attr('name', 'layers')
	            .on('change', function () {
	                if (customTemplate) {
	                    setCustom(customTemplate);
	                } else {
	                    editCustom();
	                }
	            });

	        label.append('span')
	            .text(t('background.custom'));

	        content.append('div')
	            .attr('class', 'imagery-faq')
	            .append('a')
	            .attr('target', '_blank')
	            .attr('tabindex', -1)
	            .call(iD.svg.Icon('#icon-out-link', 'inline'))
	            .attr('href', 'https://github.com/openstreetmap/iD/blob/master/FAQ.md#how-can-i-report-an-issue-with-background-imagery')
	            .append('span')
	            .text(t('background.imagery_source_faq'));

	        var overlayList = content.append('ul')
	            .attr('class', 'layer-list');

	        var controls = content.append('div')
	            .attr('class', 'controls-list');


	        /* minimap toggle */

	        var minimapLabel = controls
	            .append('label')
	            .call(bootstrap.tooltip()
	                .html(true)
	                .title(iD.ui.tooltipHtml(t('background.minimap.tooltip'), '/'))
	                .placement('top')
	            );

	        minimapLabel.classed('minimap-toggle', true)
	            .append('input')
	            .attr('type', 'checkbox')
	            .on('change', function() {
	                MapInMap.toggle();
	                d3.event.preventDefault();
	            });

	        minimapLabel.append('span')
	            .text(t('background.minimap.description'));


	        /* imagery offset controls */

	        var adjustments = content.append('div')
	            .attr('class', 'adjustments');

	        adjustments.append('a')
	            .text(t('background.fix_misalignment'))
	            .attr('href', '#')
	            .classed('hide-toggle', true)
	            .classed('expanded', false)
	            .on('click', function() {
	                var exp = d3.select(this).classed('expanded');
	                nudgeContainer.style('display', exp ? 'none' : 'block');
	                d3.select(this).classed('expanded', !exp);
	                d3.event.preventDefault();
	            });

	        var nudgeContainer = adjustments.append('div')
	            .attr('class', 'nudge-container cf')
	            .style('display', 'none');

	        nudgeContainer.append('div')
	            .attr('class', 'nudge-instructions')
	            .text(t('background.offset'));

	        var nudgeRect = nudgeContainer.append('div')
	            .attr('class', 'nudge-outer-rect')
	            .on('mousedown', dragOffset);

	        nudgeRect.append('div')
	            .attr('class', 'nudge-inner-rect')
	            .append('input')
	            .on('change', inputOffset)
	            .on('mousedown', function() {
	                d3.event.stopPropagation();
	            });

	        nudgeContainer.append('div')
	            .selectAll('button')
	            .data(directions).enter()
	            .append('button')
	            .attr('class', function(d) { return d[0] + ' nudge'; })
	            .on('mousedown', function(d) {
	                buttonOffset(d[1]);
	            });

	        nudgeContainer.append('button')
	            .attr('title', t('background.reset'))
	            .attr('class', 'nudge-reset disabled')
	            .on('click', resetOffset)
	            .call(iD.svg.Icon('#icon-undo'));

	        context.map()
	            .on('move.background-update', _.debounce(update, 1000));

	        context.background()
	            .on('change.background-update', update);


	        update();
	        setOpacity(opacityDefault);

	        var keybinding = d3.keybinding('background')
	            .on(key, toggle)
	            .on(cmd('⌘B'), quickSwitch)
	            .on('F', hide)
	            .on('H', hide);

	        d3.select(document)
	            .call(keybinding);

	        context.surface().on('mousedown.background-outside', hide);
	        context.container().on('mousedown.background-outside', hide);
	    }

	    return background;
	}

	function Commit(context) {
	    var dispatch = d3.dispatch('cancel', 'save');

	    function commit(selection) {
	        var changes = context.history().changes(),
	            summary = context.history().difference().summary();

	        function zoomToEntity(change) {
	            var entity = change.entity;
	            if (change.changeType !== 'deleted' &&
	                context.graph().entity(entity.id).geometry(context.graph()) !== 'vertex') {
	                context.map().zoomTo(entity);
	                context.surface().selectAll(
	                    iD.util.entityOrMemberSelector([entity.id], context.graph()))
	                    .classed('hover', true);
	            }
	        }

	        var header = selection.append('div')
	            .attr('class', 'header fillL');

	        header.append('h3')
	            .text(t('commit.title'));

	        var body = selection.append('div')
	            .attr('class', 'body');


	        // Comment Section
	        var commentSection = body.append('div')
	            .attr('class', 'modal-section form-field commit-form');

	        commentSection.append('label')
	            .attr('class', 'form-label')
	            .text(t('commit.message_label'));

	        var commentField = commentSection.append('textarea')
	            .attr('placeholder', t('commit.description_placeholder'))
	            .attr('maxlength', 255)
	            .property('value', context.storage('comment') || '')
	            .on('input.save', checkComment)
	            .on('change.save', checkComment)
	            .on('blur.save', function() {
	                context.storage('comment', this.value);
	            });

	        function checkComment() {
	            d3.selectAll('.save-section .save-button')
	                .attr('disabled', (this.value.length ? null : true));

	            var googleWarning = clippyArea
	               .html('')
	               .selectAll('a')
	               .data(this.value.match(/google/i) ? [true] : []);

	            googleWarning.exit().remove();

	            googleWarning.enter()
	               .append('a')
	               .attr('target', '_blank')
	               .attr('tabindex', -1)
	               .call(iD.svg.Icon('#icon-alert', 'inline'))
	               .attr('href', t('commit.google_warning_link'))
	               .append('span')
	               .text(t('commit.google_warning'));
	        }

	        commentField.node().select();

	        context.connection().userChangesets(function (err, changesets) {
	            if (err) return;

	            var comments = [];

	            for (var i = 0; i < changesets.length; i++) {
	                if (changesets[i].tags.comment) {
	                    comments.push({
	                        title: changesets[i].tags.comment,
	                        value: changesets[i].tags.comment
	                    });
	                }
	            }

	            commentField.call(d3.combobox().caseSensitive(true).data(comments));
	        });

	        var clippyArea = commentSection.append('div')
	            .attr('class', 'clippy-area');


	        var changeSetInfo = commentSection.append('div')
	            .attr('class', 'changeset-info');

	        changeSetInfo.append('a')
	            .attr('target', '_blank')
	            .attr('tabindex', -1)
	            .call(iD.svg.Icon('#icon-out-link', 'inline'))
	            .attr('href', t('commit.about_changeset_comments_link'))
	            .append('span')
	            .text(t('commit.about_changeset_comments'));

	        // Warnings
	        var warnings = body.selectAll('div.warning-section')
	            .data([context.history().validate(changes)])
	            .enter()
	            .append('div')
	            .attr('class', 'modal-section warning-section fillL2')
	            .style('display', function(d) { return _.isEmpty(d) ? 'none' : null; })
	            .style('background', '#ffb');

	        warnings.append('h3')
	            .text(t('commit.warnings'));

	        var warningLi = warnings.append('ul')
	            .attr('class', 'changeset-list')
	            .selectAll('li')
	            .data(function(d) { return d; })
	            .enter()
	            .append('li')
	            .style()
	            .on('mouseover', mouseover)
	            .on('mouseout', mouseout)
	            .on('click', warningClick);

	        warningLi
	            .call(iD.svg.Icon('#icon-alert', 'pre-text'));

	        warningLi
	            .append('strong').text(function(d) {
	                return d.message;
	            });

	        warningLi.filter(function(d) { return d.tooltip; })
	            .call(bootstrap.tooltip()
	                .title(function(d) { return d.tooltip; })
	                .placement('top')
	            );


	        // Upload Explanation
	        var saveSection = body.append('div')
	            .attr('class','modal-section save-section fillL cf');

	        var prose = saveSection.append('p')
	            .attr('class', 'commit-info')
	            .html(t('commit.upload_explanation'));

	        context.connection().userDetails(function(err, user) {
	            if (err) return;

	            var userLink = d3.select(document.createElement('div'));

	            if (user.image_url) {
	                userLink.append('img')
	                    .attr('src', user.image_url)
	                    .attr('class', 'icon pre-text user-icon');
	            }

	            userLink.append('a')
	                .attr('class','user-info')
	                .text(user.display_name)
	                .attr('href', context.connection().userURL(user.display_name))
	                .attr('tabindex', -1)
	                .attr('target', '_blank');

	            prose.html(t('commit.upload_explanation_with_user', {user: userLink.html()}));
	        });


	        // Buttons
	        var buttonSection = saveSection.append('div')
	            .attr('class','buttons fillL cf');

	        var cancelButton = buttonSection.append('button')
	            .attr('class', 'secondary-action col5 button cancel-button')
	            .on('click.cancel', function() { dispatch.cancel(); });

	        cancelButton.append('span')
	            .attr('class', 'label')
	            .text(t('commit.cancel'));

	        var saveButton = buttonSection.append('button')
	            .attr('class', 'action col5 button save-button')
	            .attr('disabled', function() {
	                var n = d3.select('.commit-form textarea').node();
	                return (n && n.value.length) ? null : true;
	            })
	            .on('click.save', function() {
	                dispatch.save({
	                    comment: commentField.node().value
	                });
	            });

	        saveButton.append('span')
	            .attr('class', 'label')
	            .text(t('commit.save'));


	        // Changes
	        var changeSection = body.selectAll('div.commit-section')
	            .data([0])
	            .enter()
	            .append('div')
	            .attr('class', 'commit-section modal-section fillL2');

	        changeSection.append('h3')
	            .text(t('commit.changes', {count: summary.length}));

	        var li = changeSection.append('ul')
	            .attr('class', 'changeset-list')
	            .selectAll('li')
	            .data(summary)
	            .enter()
	            .append('li')
	            .on('mouseover', mouseover)
	            .on('mouseout', mouseout)
	            .on('click', zoomToEntity);

	        li.each(function(d) {
	            d3.select(this)
	                .call(iD.svg.Icon('#icon-' + d.entity.geometry(d.graph), 'pre-text ' + d.changeType));
	        });

	        li.append('span')
	            .attr('class', 'change-type')
	            .text(function(d) {
	                return t('commit.' + d.changeType) + ' ';
	            });

	        li.append('strong')
	            .attr('class', 'entity-type')
	            .text(function(d) {
	                return context.presets().match(d.entity, d.graph).name();
	            });

	        li.append('span')
	            .attr('class', 'entity-name')
	            .text(function(d) {
	                var name = iD.util.displayName(d.entity) || '',
	                    string = '';
	                if (name !== '') string += ':';
	                return string += ' ' + name;
	            });

	        li.style('opacity', 0)
	            .transition()
	            .style('opacity', 1);


	        function mouseover(d) {
	            if (d.entity) {
	                context.surface().selectAll(
	                    iD.util.entityOrMemberSelector([d.entity.id], context.graph())
	                ).classed('hover', true);
	            }
	        }

	        function mouseout() {
	            context.surface().selectAll('.hover')
	                .classed('hover', false);
	        }

	        function warningClick(d) {
	            if (d.entity) {
	                context.map().zoomTo(d.entity);
	                context.enter(
	                    iD.modes.Select(context, [d.entity.id])
	                        .suppressMenu(true));
	            }
	        }

	        // Call checkComment off the bat, in case a changeset
	        // comment is recovered from localStorage
	        commentField.trigger('input');
	    }

	    return d3.rebind(commit, dispatch, 'on');
	}

	function modalModule(selection, blocking) {
	    var keybinding = d3.keybinding('modal');
	    var previous = selection.select('div.modal');
	    var animate = previous.empty();

	    previous.transition()
	        .duration(200)
	        .style('opacity', 0)
	        .remove();

	    var shaded = selection
	        .append('div')
	        .attr('class', 'shaded')
	        .style('opacity', 0);

	    shaded.close = function() {
	        shaded
	            .transition()
	            .duration(200)
	            .style('opacity',0)
	            .remove();
	        modal
	            .transition()
	            .duration(200)
	            .style('top','0px');

	        keybinding.off();
	    };


	    var modal = shaded.append('div')
	        .attr('class', 'modal fillL col6');

	    if (!blocking) {
	        shaded.on('click.remove-modal', function() {
	            if (d3.event.target === this) {
	                shaded.close();
	            }
	        });

	        modal.append('button')
	            .attr('class', 'close')
	            .on('click', shaded.close)
	            .call(iD.svg.Icon('#icon-close'));

	        keybinding
	            .on('⌫', shaded.close)
	            .on('⎋', shaded.close);

	        d3.select(document).call(keybinding);
	    }

	    modal.append('div')
	        .attr('class', 'content');

	    if (animate) {
	        shaded.transition().style('opacity', 1);
	    } else {
	        shaded.style('opacity', 1);
	    }

	    return shaded;
	}

	function confirm(selection) {
	    var modal = modalModule(selection);

	    modal.select('.modal')
	        .classed('modal-alert', true);

	    var section = modal.select('.content');

	    section.append('div')
	        .attr('class', 'modal-section header');

	    section.append('div')
	        .attr('class', 'modal-section message-text');

	    var buttons = section.append('div')
	        .attr('class', 'modal-section buttons cf');

	    modal.okButton = function() {
	        buttons
	            .append('button')
	            .attr('class', 'action col4')
	            .on('click.confirm', function() {
	                modal.remove();
	            })
	            .text(t('confirm.okay'));

	        return modal;
	    };

	    return modal;
	}

	function Conflicts(context) {
	    var dispatch = d3.dispatch('download', 'cancel', 'save'),
	        list;

	    function conflicts(selection) {
	        var header = selection
	            .append('div')
	            .attr('class', 'header fillL');

	        header
	            .append('button')
	            .attr('class', 'fr')
	            .on('click', function() { dispatch.cancel(); })
	            .call(iD.svg.Icon('#icon-close'));

	        header
	            .append('h3')
	            .text(t('save.conflict.header'));

	        var body = selection
	            .append('div')
	            .attr('class', 'body fillL');

	        body
	            .append('div')
	            .attr('class', 'conflicts-help')
	            .text(t('save.conflict.help'))
	            .append('a')
	            .attr('class', 'conflicts-download')
	            .text(t('save.conflict.download_changes'))
	            .on('click.download', function() { dispatch.download(); });

	        body
	            .append('div')
	            .attr('class', 'conflict-container fillL3')
	            .call(showConflict, 0);

	        body
	            .append('div')
	            .attr('class', 'conflicts-done')
	            .attr('opacity', 0)
	            .style('display', 'none')
	            .text(t('save.conflict.done'));

	        var buttons = body
	            .append('div')
	            .attr('class','buttons col12 joined conflicts-buttons');

	        buttons
	            .append('button')
	            .attr('disabled', list.length > 1)
	            .attr('class', 'action conflicts-button col6')
	            .text(t('save.title'))
	            .on('click.try_again', function() { dispatch.save(); });

	        buttons
	            .append('button')
	            .attr('class', 'secondary-action conflicts-button col6')
	            .text(t('confirm.cancel'))
	            .on('click.cancel', function() { dispatch.cancel(); });
	    }


	    function showConflict(selection, index) {
	        if (index < 0 || index >= list.length) return;

	        var parent = d3.select(selection.node().parentNode);

	        // enable save button if this is the last conflict being reviewed..
	        if (index === list.length - 1) {
	            window.setTimeout(function() {
	                parent.select('.conflicts-button')
	                    .attr('disabled', null);

	                parent.select('.conflicts-done')
	                    .transition()
	                    .attr('opacity', 1)
	                    .style('display', 'block');
	            }, 250);
	        }

	        var item = selection
	            .selectAll('.conflict')
	            .data([list[index]]);

	        var enter = item.enter()
	            .append('div')
	            .attr('class', 'conflict');

	        enter
	            .append('h4')
	            .attr('class', 'conflict-count')
	            .text(t('save.conflict.count', { num: index + 1, total: list.length }));

	        enter
	            .append('a')
	            .attr('class', 'conflict-description')
	            .attr('href', '#')
	            .text(function(d) { return d.name; })
	            .on('click', function(d) {
	                zoomToEntity(d.id);
	                d3.event.preventDefault();
	            });

	        var details = enter
	            .append('div')
	            .attr('class', 'conflict-detail-container');

	        details
	            .append('ul')
	            .attr('class', 'conflict-detail-list')
	            .selectAll('li')
	            .data(function(d) { return d.details || []; })
	            .enter()
	            .append('li')
	            .attr('class', 'conflict-detail-item')
	            .html(function(d) { return d; });

	        details
	            .append('div')
	            .attr('class', 'conflict-choices')
	            .call(addChoices);

	        details
	            .append('div')
	            .attr('class', 'conflict-nav-buttons joined cf')
	            .selectAll('button')
	            .data(['previous', 'next'])
	            .enter()
	            .append('button')
	            .text(function(d) { return t('save.conflict.' + d); })
	            .attr('class', 'conflict-nav-button action col6')
	            .attr('disabled', function(d, i) {
	                return (i === 0 && index === 0) ||
	                    (i === 1 && index === list.length - 1) || null;
	            })
	            .on('click', function(d, i) {
	                var container = parent.select('.conflict-container'),
	                sign = (i === 0 ? -1 : 1);

	                container
	                    .selectAll('.conflict')
	                    .remove();

	                container
	                    .call(showConflict, index + sign);

	                d3.event.preventDefault();
	            });

	        item.exit()
	            .remove();

	    }

	    function addChoices(selection) {
	        var choices = selection
	            .append('ul')
	            .attr('class', 'layer-list')
	            .selectAll('li')
	            .data(function(d) { return d.choices || []; });

	        var enter = choices.enter()
	            .append('li')
	            .attr('class', 'layer');

	        var label = enter
	            .append('label');

	        label
	            .append('input')
	            .attr('type', 'radio')
	            .attr('name', function(d) { return d.id; })
	            .on('change', function(d, i) {
	                var ul = this.parentNode.parentNode.parentNode;
	                ul.__data__.chosen = i;
	                choose(ul, d);
	            });

	        label
	            .append('span')
	            .text(function(d) { return d.text; });

	        choices
	            .each(function(d, i) {
	                var ul = this.parentNode;
	                if (ul.__data__.chosen === i) choose(ul, d);
	            });
	    }

	    function choose(ul, datum) {
	        if (d3.event) d3.event.preventDefault();

	        d3.select(ul)
	            .selectAll('li')
	            .classed('active', function(d) { return d === datum; })
	            .selectAll('input')
	            .property('checked', function(d) { return d === datum; });

	        var extent = iD.geo.Extent(),
	            entity;

	        entity = context.graph().hasEntity(datum.id);
	        if (entity) extent._extend(entity.extent(context.graph()));

	        datum.action();

	        entity = context.graph().hasEntity(datum.id);
	        if (entity) extent._extend(entity.extent(context.graph()));

	        zoomToEntity(datum.id, extent);
	    }

	    function zoomToEntity(id, extent) {
	        context.surface().selectAll('.hover')
	            .classed('hover', false);

	        var entity = context.graph().hasEntity(id);
	        if (entity) {
	            if (extent) {
	                context.map().trimmedExtent(extent);
	            } else {
	                context.map().zoomTo(entity);
	            }
	            context.surface().selectAll(
	                iD.util.entityOrMemberSelector([entity.id], context.graph()))
	                .classed('hover', true);
	        }
	    }


	    // The conflict list should be an array of objects like:
	    // {
	    //     id: id,
	    //     name: entityName(local),
	    //     details: merge.conflicts(),
	    //     chosen: 1,
	    //     choices: [
	    //         choice(id, keepMine, forceLocal),
	    //         choice(id, keepTheirs, forceRemote)
	    //     ]
	    // }
	    conflicts.list = function(_) {
	        if (!arguments.length) return list;
	        list = _;
	        return conflicts;
	    };

	    return d3.rebind(conflicts, dispatch, 'on');
	}

	function Contributors(context) {
	    var debouncedUpdate = _.debounce(function() { update(); }, 1000),
	        limit = 4,
	        hidden = false,
	        wrap = d3.select(null);

	    function update() {
	        var users = {},
	            entities = context.intersects(context.map().extent());

	        entities.forEach(function(entity) {
	            if (entity && entity.user) users[entity.user] = true;
	        });

	        var u = Object.keys(users),
	            subset = u.slice(0, u.length > limit ? limit - 1 : limit);

	        wrap.html('')
	            .call(iD.svg.Icon('#icon-nearby', 'pre-text light'));

	        var userList = d3.select(document.createElement('span'));

	        userList.selectAll()
	            .data(subset)
	            .enter()
	            .append('a')
	            .attr('class', 'user-link')
	            .attr('href', function(d) { return context.connection().userURL(d); })
	            .attr('target', '_blank')
	            .attr('tabindex', -1)
	            .text(String);

	        if (u.length > limit) {
	            var count = d3.select(document.createElement('span'));

	            count.append('a')
	                .attr('target', '_blank')
	                .attr('tabindex', -1)
	                .attr('href', function() {
	                    return context.connection().changesetsURL(context.map().center(), context.map().zoom());
	                })
	                .text(u.length - limit + 1);

	            wrap.append('span')
	                .html(t('contributors.truncated_list', { users: userList.html(), count: count.html() }));

	        } else {
	            wrap.append('span')
	                .html(t('contributors.list', { users: userList.html() }));
	        }

	        if (!u.length) {
	            hidden = true;
	            wrap
	                .transition()
	                .style('opacity', 0);

	        } else if (hidden) {
	            wrap
	                .transition()
	                .style('opacity', 1);
	        }
	    }

	    return function(selection) {
	        wrap = selection;
	        update();

	        context.connection().on('loaded.contributors', debouncedUpdate);
	        context.map().on('move.contributors', debouncedUpdate);
	    };
	}

	// toggles the visibility of ui elements, using a combination of the
	// hide class, which sets display=none, and a d3 transition for opacity.
	// this will cause blinking when called repeatedly, so check that the
	// value actually changes between calls.
	function Toggle(show, callback) {
	    return function(selection) {
	        selection
	            .style('opacity', show ? 0 : 1)
	            .classed('hide', false)
	            .transition()
	            .style('opacity', show ? 1 : 0)
	            .each('end', function() {
	                d3.select(this)
	                    .classed('hide', !show)
	                    .style('opacity', null);
	                if (callback) callback.apply(this);
	            });
	    };
	}

	function Disclosure() {
	    var dispatch = d3.dispatch('toggled'),
	        title,
	        expanded = false,
	        content = function () {};

	    var disclosure = function(selection) {
	        var $link = selection.selectAll('.hide-toggle')
	            .data([0]);

	        $link.enter().append('a')
	            .attr('href', '#')
	            .attr('class', 'hide-toggle');

	        $link.text(title)
	            .on('click', toggle)
	            .classed('expanded', expanded);

	        var $body = selection.selectAll('div')
	            .data([0]);

	        $body.enter().append('div');

	        $body.classed('hide', !expanded)
	            .call(content);

	        function toggle() {
	            expanded = !expanded;
	            $link.classed('expanded', expanded);
	            $body.call(Toggle(expanded));
	            dispatch.toggled(expanded);
	        }
	    };

	    disclosure.title = function(_) {
	        if (!arguments.length) return title;
	        title = _;
	        return disclosure;
	    };

	    disclosure.expanded = function(_) {
	        if (!arguments.length) return expanded;
	        expanded = _;
	        return disclosure;
	    };

	    disclosure.content = function(_) {
	        if (!arguments.length) return content;
	        content = _;
	        return disclosure;
	    };

	    return d3.rebind(disclosure, dispatch, 'on');
	}

	function preset(context) {
	    var event = d3.dispatch('change'),
	        state,
	        fields,
	        preset,
	        tags,
	        id;

	    function UIField(field, entity, show) {
	        field = _.clone(field);

	        field.input = iD.ui.preset[field.type](field, context)
	            .on('change', event.change);

	        if (field.input.entity) field.input.entity(entity);

	        field.keys = field.keys || [field.key];

	        field.show = show;

	        field.shown = function() {
	            return field.id === 'name' || field.show || _.some(field.keys, function(key) { return !!tags[key]; });
	        };

	        field.modified = function() {
	            var original = context.graph().base().entities[entity.id];
	            return _.some(field.keys, function(key) {
	                return original ? tags[key] !== original.tags[key] : tags[key];
	            });
	        };

	        field.revert = function() {
	            var original = context.graph().base().entities[entity.id],
	                t = {};
	            field.keys.forEach(function(key) {
	                t[key] = original ? original.tags[key] : undefined;
	            });
	            return t;
	        };

	        field.present = function() {
	            return _.some(field.keys, function(key) {
	                return tags[key];
	            });
	        };

	        field.remove = function() {
	            var t = {};
	            field.keys.forEach(function(key) {
	                t[key] = undefined;
	            });
	            return t;
	        };

	        return field;
	    }

	    function fieldKey(field) {
	        return field.id;
	    }

	    function presets(selection) {
	        selection.call(iD.ui.Disclosure()
	            .title(t('inspector.all_fields'))
	            .expanded(context.storage('preset_fields.expanded') !== 'false')
	            .on('toggled', toggled)
	            .content(content));

	        function toggled(expanded) {
	            context.storage('preset_fields.expanded', expanded);
	        }
	    }

	    function content(selection) {
	        if (!fields) {
	            var entity = context.entity(id),
	                geometry = context.geometry(id);

	            fields = [UIField(context.presets().field('name'), entity)];

	            preset.fields.forEach(function(field) {
	                if (field.matchGeometry(geometry)) {
	                    fields.push(UIField(field, entity, true));
	                }
	            });

	            if (entity.isHighwayIntersection(context.graph())) {
	                fields.push(UIField(context.presets().field('restrictions'), entity, true));
	            }

	            context.presets().universal().forEach(function(field) {
	                if (preset.fields.indexOf(field) < 0) {
	                    fields.push(UIField(field, entity));
	                }
	            });
	        }

	        var shown = fields.filter(function(field) { return field.shown(); }),
	            notShown = fields.filter(function(field) { return !field.shown(); });

	        var $form = selection.selectAll('.preset-form')
	            .data([0]);

	        $form.enter().append('div')
	            .attr('class', 'preset-form inspector-inner fillL3');

	        var $fields = $form.selectAll('.form-field')
	            .data(shown, fieldKey);

	        // Enter

	        var $enter = $fields.enter()
	            .append('div')
	            .attr('class', function(field) {
	                return 'form-field form-field-' + field.id;
	            });

	        var $label = $enter.append('label')
	            .attr('class', 'form-label')
	            .attr('for', function(field) { return 'preset-input-' + field.id; })
	            .text(function(field) { return field.label(); });

	        var wrap = $label.append('div')
	            .attr('class', 'form-label-button-wrap');

	        wrap.append('button')
	            .attr('class', 'remove-icon')
	            .attr('tabindex', -1)
	            .call(iD.svg.Icon('#operation-delete'));

	        wrap.append('button')
	            .attr('class', 'modified-icon')
	            .attr('tabindex', -1)
	            .call(iD.svg.Icon('#icon-undo'));

	        // Update

	        $fields.select('.form-label-button-wrap .remove-icon')
	            .on('click', remove);

	        $fields.select('.modified-icon')
	            .on('click', revert);

	        $fields
	            .order()
	            .classed('modified', function(field) {
	                return field.modified();
	            })
	            .classed('present', function(field) {
	                return field.present();
	            })
	            .each(function(field) {
	                var reference = iD.ui.TagReference(field.reference || {key: field.key}, context);

	                if (state === 'hover') {
	                    reference.showing(false);
	                }

	                d3.select(this)
	                    .call(field.input)
	                    .selectAll('input')
	                    .on('keydown', function() {
	                        // if user presses enter, and combobox is not active, accept edits..
	                        if (d3.event.keyCode === 13 && d3.select('.combobox').empty()) {
	                            context.enter(iD.modes.Browse(context));
	                        }
	                    })
	                    .call(reference.body)
	                    .select('.form-label-button-wrap')
	                    .call(reference.button);

	                field.input.tags(tags);
	            });

	        $fields.exit()
	            .remove();

	        notShown = notShown.map(function(field) {
	            return {
	                title: field.label(),
	                value: field.label(),
	                field: field
	            };
	        });

	        var $more = selection.selectAll('.more-fields')
	            .data((notShown.length > 0) ? [0] : []);

	        $more.enter().append('div')
	            .attr('class', 'more-fields')
	            .append('label')
	                .text(t('inspector.add_fields'));

	        var $input = $more.selectAll('.value')
	            .data([0]);

	        $input.enter().append('input')
	            .attr('class', 'value')
	            .attr('type', 'text');

	        $input.value('')
	            .attr('placeholder', function() {
	                var placeholder = [];
	                for (var field in notShown) {
	                    placeholder.push(notShown[field].title);
	                }
	                return placeholder.slice(0,3).join(', ') + ((placeholder.length > 3) ? '…' : '');
	            })
	            .call(d3.combobox().data(notShown)
	                .minItems(1)
	                .on('accept', show));

	        $more.exit()
	            .remove();

	        $input.exit()
	            .remove();

	        function show(field) {
	            field = field.field;
	            field.show = true;
	            content(selection);
	            field.input.focus();
	        }

	        function revert(field) {
	            d3.event.stopPropagation();
	            d3.event.preventDefault();
	            event.change(field.revert());
	        }

	        function remove(field) {
	            d3.event.stopPropagation();
	            d3.event.preventDefault();
	            event.change(field.remove());
	        }
	    }

	    presets.preset = function(_) {
	        if (!arguments.length) return preset;
	        if (preset && preset.id === _.id) return presets;
	        preset = _;
	        fields = null;
	        return presets;
	    };

	    presets.state = function(_) {
	        if (!arguments.length) return state;
	        state = _;
	        return presets;
	    };

	    presets.tags = function(_) {
	        if (!arguments.length) return tags;
	        tags = _;
	        // Don't reset fields here.
	        return presets;
	    };

	    presets.entityID = function(_) {
	        if (!arguments.length) return id;
	        if (id === _) return presets;
	        id = _;
	        fields = null;
	        return presets;
	    };

	    return d3.rebind(presets, event, 'on');
	}

	function PresetIcon() {
	    var preset, geometry;

	    function presetIcon(selection) {
	        selection.each(render);
	    }

	    function render() {
	        var selection = d3.select(this),
	            p = preset.apply(this, arguments),
	            geom = geometry.apply(this, arguments),
	            icon = p.icon || (geom === 'line' ? 'other-line' : 'marker-stroked'),
	            maki = iD.data.featureIcons.hasOwnProperty(icon + '-24');

	        if (icon === 'dentist') maki = true;  // workaround for dentist icon missing in `maki-sprite.json`

	        function tag_classes(p) {
	            var s = '';
	            for (var i in p.tags) {
	                s += ' tag-' + i;
	                if (p.tags[i] !== '*') {
	                    s += ' tag-' + i + '-' + p.tags[i];
	                }
	            }
	            return s;
	        }

	        var $fill = selection.selectAll('.preset-icon-fill')
	            .data([0]);

	        $fill.enter().append('div');

	        $fill.attr('class', function() {
	            return 'preset-icon-fill preset-icon-fill-' + geom + tag_classes(p);
	        });

	        var $frame = selection.selectAll('.preset-icon-frame')
	            .data([0]);

	        $frame.enter()
	            .append('div')
	            .call(iD.svg.Icon('#preset-icon-frame'));

	        $frame.attr('class', function() {
	            return 'preset-icon-frame ' + (geom === 'area' ? '' : 'hide');
	        });


	        var $icon = selection.selectAll('.preset-icon')
	            .data([0]);

	        $icon.enter()
	            .append('div')
	            .attr('class', 'preset-icon')
	            .call(iD.svg.Icon(''));

	        $icon
	            .attr('class', 'preset-icon preset-icon-' + (maki ? '32' : (geom === 'area' ? '44' : '60')));

	        $icon.selectAll('svg')
	            .attr('class', function() {
	                return 'icon ' + icon + tag_classes(p);
	            });

	        $icon.selectAll('use')       // workaround: maki parking-24 broken?
	            .attr('href', '#' + icon + (maki ? ( icon === 'parking' ? '-18' : '-24') : ''));
	    }

	    presetIcon.preset = function(_) {
	        if (!arguments.length) return preset;
	        preset = d3.functor(_);
	        return presetIcon;
	    };

	    presetIcon.geometry = function(_) {
	        if (!arguments.length) return geometry;
	        geometry = d3.functor(_);
	        return presetIcon;
	    };

	    return presetIcon;
	}

	function TagReference(tag, context) {
	    var tagReference = {},
	        button,
	        body,
	        loaded,
	        showing;

	    function findLocal(data) {
	        var locale = iD.detect().locale.toLowerCase(),
	            localized;

	        localized = _.find(data, function(d) {
	            return d.lang.toLowerCase() === locale;
	        });
	        if (localized) return localized;

	        // try the non-regional version of a language, like
	        // 'en' if the language is 'en-US'
	        if (locale.indexOf('-') !== -1) {
	            var first = locale.split('-')[0];
	            localized = _.find(data, function(d) {
	                return d.lang.toLowerCase() === first;
	            });
	            if (localized) return localized;
	        }

	        // finally fall back to english
	        return _.find(data, function(d) {
	            return d.lang.toLowerCase() === 'en';
	        });
	    }

	    function load(param) {
	        button.classed('tag-reference-loading', true);

	        context.taginfo().docs(param, function show(err, data) {
	            var docs;
	            if (!err && data) {
	                docs = findLocal(data);
	            }

	            body.html('');

	            if (!docs || !docs.description) {
	                if (param.hasOwnProperty('value')) {
	                    load(_.omit(param, 'value'));   // retry with key only
	                } else {
	                    body.append('p').text(t('inspector.no_documentation_key'));
	                    done();
	                }
	                return;
	            }

	            if (docs.image && docs.image.thumb_url_prefix) {
	                body
	                    .append('img')
	                    .attr('class', 'wiki-image')
	                    .attr('src', docs.image.thumb_url_prefix + '100' + docs.image.thumb_url_suffix)
	                    .on('load', function() { done(); })
	                    .on('error', function() { d3.select(this).remove(); done(); });
	            } else {
	                done();
	            }

	            body
	                .append('p')
	                .text(docs.description);

	            body
	                .append('a')
	                .attr('target', '_blank')
	                .attr('tabindex', -1)
	                .attr('href', 'https://wiki.openstreetmap.org/wiki/' + docs.title)
	                .call(iD.svg.Icon('#icon-out-link', 'inline'))
	                .append('span')
	                .text(t('inspector.reference'));
	        });
	    }

	    function done() {
	        loaded = true;

	        button.classed('tag-reference-loading', false);

	        body.transition()
	            .duration(200)
	            .style('max-height', '200px')
	            .style('opacity', '1');

	        showing = true;
	    }

	    function hide(selection) {
	        selection = selection || body.transition().duration(200);

	        selection
	            .style('max-height', '0px')
	            .style('opacity', '0');

	        showing = false;
	    }

	    tagReference.button = function(selection) {
	        button = selection.selectAll('.tag-reference-button')
	            .data([0]);

	        button.enter()
	            .append('button')
	            .attr('class', 'tag-reference-button')
	            .attr('tabindex', -1)
	            .call(iD.svg.Icon('#icon-inspect'));

	        button.on('click', function () {
	            d3.event.stopPropagation();
	            d3.event.preventDefault();
	            if (showing) {
	                hide();
	            } else if (loaded) {
	                done();
	            } else {
	                if (context.taginfo()) {
	                    load(tag);
	                }
	            }
	        });
	    };

	    tagReference.body = function(selection) {
	        body = selection.selectAll('.tag-reference-body')
	            .data([0]);

	        body.enter().append('div')
	            .attr('class', 'tag-reference-body cf')
	            .style('max-height', '0')
	            .style('opacity', '0');

	        if (showing === false) {
	            hide(body);
	        }
	    };

	    tagReference.showing = function(_) {
	        if (!arguments.length) return showing;
	        showing = _;
	        return tagReference;
	    };

	    return tagReference;
	}

	function RawTagEditor(context) {
	    var event = d3.dispatch('change'),
	        showBlank = false,
	        state,
	        preset,
	        tags,
	        id;

	    function rawTagEditor(selection) {
	        var count = Object.keys(tags).filter(function(d) { return d; }).length;

	        selection.call(Disclosure()
	            .title(t('inspector.all_tags') + ' (' + count + ')')
	            .expanded(context.storage('raw_tag_editor.expanded') === 'true' || preset.isFallback())
	            .on('toggled', toggled)
	            .content(content));

	        function toggled(expanded) {
	            context.storage('raw_tag_editor.expanded', expanded);
	            if (expanded) {
	                selection.node().parentNode.scrollTop += 200;
	            }
	        }
	    }

	    function content($wrap) {
	        var entries = d3.entries(tags);

	        if (!entries.length || showBlank) {
	            showBlank = false;
	            entries.push({key: '', value: ''});
	        }

	        var $list = $wrap.selectAll('.tag-list')
	            .data([0]);

	        $list.enter().append('ul')
	            .attr('class', 'tag-list');

	        var $newTag = $wrap.selectAll('.add-tag')
	            .data([0]);

	        $newTag.enter()
	            .append('button')
	            .attr('class', 'add-tag')
	            .call(iD.svg.Icon('#icon-plus', 'light'));

	        $newTag.on('click', addTag);

	        var $items = $list.selectAll('li')
	            .data(entries, function(d) { return d.key; });

	        // Enter

	        var $enter = $items.enter().append('li')
	            .attr('class', 'tag-row cf');

	        $enter.append('div')
	            .attr('class', 'key-wrap')
	            .append('input')
	            .property('type', 'text')
	            .attr('class', 'key')
	            .attr('maxlength', 255);

	        $enter.append('div')
	            .attr('class', 'input-wrap-position')
	            .append('input')
	            .property('type', 'text')
	            .attr('class', 'value')
	            .attr('maxlength', 255);

	        $enter.append('button')
	            .attr('tabindex', -1)
	            .attr('class', 'remove minor')
	            .call(iD.svg.Icon('#operation-delete'));

	        if (context.taginfo()) {
	            $enter.each(bindTypeahead);
	        }

	        // Update

	        $items.order();

	        $items.each(function(tag) {
	            var isRelation = (context.entity(id).type === 'relation'),
	                reference;
	            if (isRelation && tag.key === 'type')
	                reference = TagReference({rtype: tag.value}, context);
	            else
	                reference = TagReference({key: tag.key, value: tag.value}, context);

	            if (state === 'hover') {
	                reference.showing(false);
	            }

	            d3.select(this)
	                .call(reference.button)
	                .call(reference.body);
	        });

	        $items.select('input.key')
	            .attr('title', function(d) { return d.key; })
	            .value(function(d) { return d.key; })
	            .on('blur', keyChange)
	            .on('change', keyChange);

	        $items.select('input.value')
	            .attr('title', function(d) { return d.value; })
	            .value(function(d) { return d.value; })
	            .on('blur', valueChange)
	            .on('change', valueChange)
	            .on('keydown.push-more', pushMore);

	        $items.select('button.remove')
	            .on('click', removeTag);

	        $items.exit()
	            .each(unbind)
	            .remove();

	        function pushMore() {
	            if (d3.event.keyCode === 9 && !d3.event.shiftKey &&
	                $list.selectAll('li:last-child input.value').node() === this) {
	                addTag();
	            }
	        }

	        function bindTypeahead() {
	            var row = d3.select(this),
	                key = row.selectAll('input.key'),
	                value = row.selectAll('input.value');

	            function sort(value, data) {
	                var sameletter = [],
	                    other = [];
	                for (var i = 0; i < data.length; i++) {
	                    if (data[i].value.substring(0, value.length) === value) {
	                        sameletter.push(data[i]);
	                    } else {
	                        other.push(data[i]);
	                    }
	                }
	                return sameletter.concat(other);
	            }

	            key.call(d3.combobox()
	                .fetcher(function(value, callback) {
	                    context.taginfo().keys({
	                        debounce: true,
	                        geometry: context.geometry(id),
	                        query: value
	                    }, function(err, data) {
	                        if (!err) callback(sort(value, data));
	                    });
	                }));

	            value.call(d3.combobox()
	                .fetcher(function(value, callback) {
	                    context.taginfo().values({
	                        debounce: true,
	                        key: key.value(),
	                        geometry: context.geometry(id),
	                        query: value
	                    }, function(err, data) {
	                        if (!err) callback(sort(value, data));
	                    });
	                }));
	        }

	        function unbind() {
	            var row = d3.select(this);

	            row.selectAll('input.key')
	                .call(d3.combobox.off);

	            row.selectAll('input.value')
	                .call(d3.combobox.off);
	        }

	        function keyChange(d) {
	            var kOld = d.key,
	                kNew = this.value.trim(),
	                tag = {};

	            if (kNew && kNew !== kOld) {
	                var match = kNew.match(/^(.*?)(?:_(\d+))?$/),
	                    base = match[1],
	                    suffix = +(match[2] || 1);
	                while (tags[kNew]) {  // rename key if already in use
	                    kNew = base + '_' + suffix++;
	                }
	            }
	            tag[kOld] = undefined;
	            tag[kNew] = d.value;
	            d.key = kNew; // Maintain DOM identity through the subsequent update.
	            this.value = kNew;
	            event.change(tag);
	        }

	        function valueChange(d) {
	            var tag = {};
	            tag[d.key] = this.value;
	            event.change(tag);
	        }

	        function removeTag(d) {
	            var tag = {};
	            tag[d.key] = undefined;
	            event.change(tag);
	            d3.select(this.parentNode).remove();
	        }

	        function addTag() {
	            // Wrapped in a setTimeout in case it's being called from a blur
	            // handler. Without the setTimeout, the call to `content` would
	            // wipe out the pending value change.
	            setTimeout(function() {
	                showBlank = true;
	                content($wrap);
	                $list.selectAll('li:last-child input.key').node().focus();
	            }, 0);
	        }
	    }

	    rawTagEditor.state = function(_) {
	        if (!arguments.length) return state;
	        state = _;
	        return rawTagEditor;
	    };

	    rawTagEditor.preset = function(_) {
	        if (!arguments.length) return preset;
	        preset = _;
	        return rawTagEditor;
	    };

	    rawTagEditor.tags = function(_) {
	        if (!arguments.length) return tags;
	        tags = _;
	        return rawTagEditor;
	    };

	    rawTagEditor.entityID = function(_) {
	        if (!arguments.length) return id;
	        id = _;
	        return rawTagEditor;
	    };

	    return d3.rebind(rawTagEditor, event, 'on');
	}

	function RawMemberEditor(context) {
	    var id;

	    function selectMember(d) {
	        d3.event.preventDefault();
	        context.enter(iD.modes.Select(context, [d.id]));
	    }

	    function changeRole(d) {
	        var role = d3.select(this).property('value');
	        var member = {id: d.id, type: d.type, role: role};
	        context.perform(
	            iD.actions.ChangeMember(d.relation.id, member, d.index),
	            t('operations.change_role.annotation'));
	    }

	    function deleteMember(d) {
	        context.perform(
	            iD.actions.DeleteMember(d.relation.id, d.index),
	            t('operations.delete_member.annotation'));

	        if (!context.hasEntity(d.relation.id)) {
	            context.enter(iD.modes.Browse(context));
	        }
	    }

	    function rawMemberEditor(selection) {
	        var entity = context.entity(id),
	            memberships = [];

	        entity.members.forEach(function(member, index) {
	            memberships.push({
	                index: index,
	                id: member.id,
	                type: member.type,
	                role: member.role,
	                relation: entity,
	                member: context.hasEntity(member.id)
	            });
	        });

	        selection.call(Disclosure()
	            .title(t('inspector.all_members') + ' (' + memberships.length + ')')
	            .expanded(true)
	            .on('toggled', toggled)
	            .content(content));

	        function toggled(expanded) {
	            if (expanded) {
	                selection.node().parentNode.scrollTop += 200;
	            }
	        }

	        function content($wrap) {
	            var $list = $wrap.selectAll('.member-list')
	                .data([0]);

	            $list.enter().append('ul')
	                .attr('class', 'member-list');

	            var $items = $list.selectAll('li')
	                .data(memberships, function(d) {
	                    return iD.Entity.key(d.relation) + ',' + d.index + ',' +
	                        (d.member ? iD.Entity.key(d.member) : 'incomplete');
	                });

	            var $enter = $items.enter().append('li')
	                .attr('class', 'member-row form-field')
	                .classed('member-incomplete', function(d) { return !d.member; });

	            $enter.each(function(d) {
	                if (d.member) {
	                    var $label = d3.select(this).append('label')
	                        .attr('class', 'form-label')
	                        .append('a')
	                        .attr('href', '#')
	                        .on('click', selectMember);

	                    $label.append('span')
	                        .attr('class', 'member-entity-type')
	                        .text(function(d) { return context.presets().match(d.member, context.graph()).name(); });

	                    $label.append('span')
	                        .attr('class', 'member-entity-name')
	                        .text(function(d) { return iD.util.displayName(d.member); });

	                } else {
	                    d3.select(this).append('label')
	                        .attr('class', 'form-label')
	                        .text(t('inspector.incomplete'));
	                }
	            });

	            $enter.append('input')
	                .attr('class', 'member-role')
	                .property('type', 'text')
	                .attr('maxlength', 255)
	                .attr('placeholder', t('inspector.role'))
	                .property('value', function(d) { return d.role; })
	                .on('change', changeRole);

	            $enter.append('button')
	                .attr('tabindex', -1)
	                .attr('class', 'remove button-input-action member-delete minor')
	                .on('click', deleteMember)
	                .call(iD.svg.Icon('#operation-delete'));

	            $items.exit()
	                .remove();
	        }
	    }

	    rawMemberEditor.entityID = function(_) {
	        if (!arguments.length) return id;
	        id = _;
	        return rawMemberEditor;
	    };

	    return rawMemberEditor;
	}

	function RawMembershipEditor(context) {
	    var id, showBlank;

	    function selectRelation(d) {
	        d3.event.preventDefault();
	        context.enter(iD.modes.Select(context, [d.relation.id]));
	    }

	    function changeRole(d) {
	        var role = d3.select(this).property('value');
	        context.perform(
	            iD.actions.ChangeMember(d.relation.id, _.extend({}, d.member, {role: role}), d.index),
	            t('operations.change_role.annotation'));
	    }

	    function addMembership(d, role) {
	        showBlank = false;

	        if (d.relation) {
	            context.perform(
	                iD.actions.AddMember(d.relation.id, {id: id, type: context.entity(id).type, role: role}),
	                t('operations.add_member.annotation'));

	        } else {
	            var relation = iD.Relation();

	            context.perform(
	                iD.actions.AddEntity(relation),
	                iD.actions.AddMember(relation.id, {id: id, type: context.entity(id).type, role: role}),
	                t('operations.add.annotation.relation'));

	            context.enter(iD.modes.Select(context, [relation.id]));
	        }
	    }

	    function deleteMembership(d) {
	        context.perform(
	            iD.actions.DeleteMember(d.relation.id, d.index),
	            t('operations.delete_member.annotation'));
	    }

	    function relations(q) {
	        var newRelation = {
	                relation: null,
	                value: t('inspector.new_relation')
	            },
	            result = [],
	            graph = context.graph();

	        context.intersects(context.extent()).forEach(function(entity) {
	            if (entity.type !== 'relation' || entity.id === id)
	                return;

	            var presetName = context.presets().match(entity, graph).name(),
	                entityName = iD.util.displayName(entity) || '';

	            var value = presetName + ' ' + entityName;
	            if (q && value.toLowerCase().indexOf(q.toLowerCase()) === -1)
	                return;

	            result.push({
	                relation: entity,
	                value: value
	            });
	        });

	        result.sort(function(a, b) {
	            return iD.Relation.creationOrder(a.relation, b.relation);
	        });

	        // Dedupe identical names by appending relation id - see #2891
	        var dupeGroups = _(result)
	            .groupBy('value')
	            .filter(function(v) { return v.length > 1; })
	            .value();

	        dupeGroups.forEach(function(group) {
	            group.forEach(function(obj) {
	                obj.value += ' ' + obj.relation.id;
	            });
	        });

	        result.unshift(newRelation);

	        return result;
	    }

	    function rawMembershipEditor(selection) {
	        var entity = context.entity(id),
	            memberships = [];

	        context.graph().parentRelations(entity).forEach(function(relation) {
	            relation.members.forEach(function(member, index) {
	                if (member.id === entity.id) {
	                    memberships.push({relation: relation, member: member, index: index});
	                }
	            });
	        });

	        selection.call(Disclosure()
	            .title(t('inspector.all_relations') + ' (' + memberships.length + ')')
	            .expanded(true)
	            .on('toggled', toggled)
	            .content(content));

	        function toggled(expanded) {
	            if (expanded) {
	                selection.node().parentNode.scrollTop += 200;
	            }
	        }

	        function content($wrap) {
	            var $list = $wrap.selectAll('.member-list')
	                .data([0]);

	            $list.enter().append('ul')
	                .attr('class', 'member-list');

	            var $items = $list.selectAll('li.member-row-normal')
	                .data(memberships, function(d) { return iD.Entity.key(d.relation) + ',' + d.index; });

	            var $enter = $items.enter().append('li')
	                .attr('class', 'member-row member-row-normal form-field');

	            var $label = $enter.append('label')
	                .attr('class', 'form-label')
	                .append('a')
	                .attr('href', '#')
	                .on('click', selectRelation);

	            $label.append('span')
	                .attr('class', 'member-entity-type')
	                .text(function(d) { return context.presets().match(d.relation, context.graph()).name(); });

	            $label.append('span')
	                .attr('class', 'member-entity-name')
	                .text(function(d) { return iD.util.displayName(d.relation); });

	            $enter.append('input')
	                .attr('class', 'member-role')
	                .property('type', 'text')
	                .attr('maxlength', 255)
	                .attr('placeholder', t('inspector.role'))
	                .property('value', function(d) { return d.member.role; })
	                .on('change', changeRole);

	            $enter.append('button')
	                .attr('tabindex', -1)
	                .attr('class', 'remove button-input-action member-delete minor')
	                .on('click', deleteMembership)
	                .call(iD.svg.Icon('#operation-delete'));

	            $items.exit()
	                .remove();

	            if (showBlank) {
	                var $new = $list.selectAll('.member-row-new')
	                    .data([0]);

	                $enter = $new.enter().append('li')
	                    .attr('class', 'member-row member-row-new form-field');

	                $enter.append('input')
	                    .attr('type', 'text')
	                    .attr('class', 'member-entity-input')
	                    .call(d3.combobox()
	                        .minItems(1)
	                        .fetcher(function(value, callback) {
	                            callback(relations(value));
	                        })
	                        .on('accept', function(d) {
	                            addMembership(d, $new.select('.member-role').property('value'));
	                        }));

	                $enter.append('input')
	                    .attr('class', 'member-role')
	                    .property('type', 'text')
	                    .attr('maxlength', 255)
	                    .attr('placeholder', t('inspector.role'))
	                    .on('change', changeRole);

	                $enter.append('button')
	                    .attr('tabindex', -1)
	                    .attr('class', 'remove button-input-action member-delete minor')
	                    .on('click', deleteMembership)
	                    .call(iD.svg.Icon('#operation-delete'));

	            } else {
	                $list.selectAll('.member-row-new')
	                    .remove();
	            }

	            var $add = $wrap.selectAll('.add-relation')
	                .data([0]);

	            $add.enter()
	                .append('button')
	                .attr('class', 'add-relation')
	                .call(iD.svg.Icon('#icon-plus', 'light'));

	            $wrap.selectAll('.add-relation')
	                .on('click', function() {
	                    showBlank = true;
	                    content($wrap);
	                    $list.selectAll('.member-entity-input').node().focus();
	                });
	        }
	    }

	    rawMembershipEditor.entityID = function(_) {
	        if (!arguments.length) return id;
	        id = _;
	        return rawMembershipEditor;
	    };

	    return rawMembershipEditor;
	}

	function EntityEditor(context) {
	    var dispatch = d3.dispatch('choose'),
	        state = 'select',
	        coalesceChanges = false,
	        modified = false,
	        base,
	        id,
	        preset$$,
	        reference;

	    var presetEditor = preset(context)
	        .on('change', changeTags);
	    var rawTagEditor = RawTagEditor(context)
	        .on('change', changeTags);

	    function entityEditor(selection) {
	        var entity = context.entity(id),
	            tags = _.clone(entity.tags);

	        var $header = selection.selectAll('.header')
	            .data([0]);

	        // Enter
	        var $enter = $header.enter().append('div')
	            .attr('class', 'header fillL cf');

	        $enter.append('button')
	            .attr('class', 'fl preset-reset preset-choose')
	            .append('span')
	            .html('&#9668;');

	        $enter.append('button')
	            .attr('class', 'fr preset-close')
	            .call(iD.svg.Icon(modified ? '#icon-apply' : '#icon-close'));

	        $enter.append('h3');

	        // Update
	        $header.select('h3')
	            .text(t('inspector.edit'));

	        $header.select('.preset-close')
	            .on('click', function() {
	                context.enter(iD.modes.Browse(context));
	            });

	        var $body = selection.selectAll('.inspector-body')
	            .data([0]);

	        // Enter
	        $enter = $body.enter().append('div')
	            .attr('class', 'inspector-body');

	        $enter.append('div')
	            .attr('class', 'preset-list-item inspector-inner')
	            .append('div')
	            .attr('class', 'preset-list-button-wrap')
	            .append('button')
	            .attr('class', 'preset-list-button preset-reset')
	            .call(bootstrap.tooltip()
	                .title(t('inspector.back_tooltip'))
	                .placement('bottom'))
	            .append('div')
	            .attr('class', 'label');

	        $body.select('.preset-list-button-wrap')
	            .call(reference.button);

	        $body.select('.preset-list-item')
	            .call(reference.body);

	        $enter.append('div')
	            .attr('class', 'inspector-border inspector-preset');

	        $enter.append('div')
	            .attr('class', 'inspector-border raw-tag-editor inspector-inner');

	        $enter.append('div')
	            .attr('class', 'inspector-border raw-member-editor inspector-inner');

	        $enter.append('div')
	            .attr('class', 'raw-membership-editor inspector-inner');

	        selection.selectAll('.preset-reset')
	            .on('click', function() {
	                dispatch.choose(preset$$);
	            });

	        // Update
	        $body.select('.preset-list-item button')
	            .call(PresetIcon()
	                .geometry(context.geometry(id))
	                .preset(preset$$));

	        $body.select('.preset-list-item .label')
	            .text(preset$$.name());

	        $body.select('.inspector-preset')
	            .call(presetEditor
	                .preset(preset$$)
	                .entityID(id)
	                .tags(tags)
	                .state(state));

	        $body.select('.raw-tag-editor')
	            .call(rawTagEditor
	                .preset(preset$$)
	                .entityID(id)
	                .tags(tags)
	                .state(state));

	        if (entity.type === 'relation') {
	            $body.select('.raw-member-editor')
	                .style('display', 'block')
	                .call(RawMemberEditor(context)
	                    .entityID(id));
	        } else {
	            $body.select('.raw-member-editor')
	                .style('display', 'none');
	        }

	        $body.select('.raw-membership-editor')
	            .call(RawMembershipEditor(context)
	                .entityID(id));

	        function historyChanged() {
	            if (state === 'hide') return;

	            var entity = context.hasEntity(id),
	                graph = context.graph();
	            if (!entity) return;

	            entityEditor.preset(context.presets().match(entity, graph));
	            entityEditor.modified(base !== graph);
	            entityEditor(selection);
	        }

	        context.history()
	            .on('change.entity-editor', historyChanged);
	    }

	    function clean(o) {

	        function cleanVal(k, v) {
	            function keepSpaces(k) {
	                var whitelist = ['opening_hours', 'service_times', 'collection_times',
	                    'operating_times', 'smoking_hours', 'happy_hours'];
	                return _.some(whitelist, function(s) { return k.indexOf(s) !== -1; });
	            }

	            var blacklist = ['description', 'note', 'fixme'];
	            if (_.some(blacklist, function(s) { return k.indexOf(s) !== -1; })) return v;

	            var cleaned = v.split(';')
	                .map(function(s) { return s.trim(); })
	                .join(keepSpaces(k) ? '; ' : ';');

	            // The code below is not intended to validate websites and emails.
	            // It is only intended to prevent obvious copy-paste errors. (#2323)

	            // clean website- and email-like tags
	            if (k.indexOf('website') !== -1 ||
	                k.indexOf('email') !== -1 ||
	                cleaned.indexOf('http') === 0) {
	                cleaned = cleaned
	                    .replace(/[\u200B-\u200F\uFEFF]/g, '');  // strip LRM and other zero width chars

	            }

	            return cleaned;
	        }

	        var out = {}, k, v;
	        for (k in o) {
	            if (k && (v = o[k]) !== undefined) {
	                out[k] = cleanVal(k, v);
	            }
	        }
	        return out;
	    }

	    // Tag changes that fire on input can all get coalesced into a single
	    // history operation when the user leaves the field.  #2342
	    function changeTags(changed, onInput) {
	        var entity = context.entity(id),
	            annotation = t('operations.change_tags.annotation'),
	            tags = _.extend({}, entity.tags, changed);

	        if (!onInput) {
	            tags = clean(tags);
	        }
	        if (!_.isEqual(entity.tags, tags)) {
	            if (coalesceChanges) {
	                context.overwrite(iD.actions.ChangeTags(id, tags), annotation);
	            } else {
	                context.perform(iD.actions.ChangeTags(id, tags), annotation);
	                coalesceChanges = !!onInput;
	            }
	        }
	    }

	    entityEditor.modified = function(_) {
	        if (!arguments.length) return modified;
	        modified = _;
	        d3.selectAll('button.preset-close use')
	            .attr('xlink:href', (modified ? '#icon-apply' : '#icon-close'));
	    };

	    entityEditor.state = function(_) {
	        if (!arguments.length) return state;
	        state = _;
	        return entityEditor;
	    };

	    entityEditor.entityID = function(_) {
	        if (!arguments.length) return id;
	        id = _;
	        base = context.graph();
	        entityEditor.preset(context.presets().match(context.entity(id), base));
	        entityEditor.modified(false);
	        coalesceChanges = false;
	        return entityEditor;
	    };

	    entityEditor.preset = function(_) {
	        if (!arguments.length) return preset$$;
	        if (_ !== preset$$) {
	            preset$$ = _;
	            reference = TagReference(preset$$.reference(context.geometry(id)), context)
	                .showing(false);
	        }
	        return entityEditor;
	    };

	    return d3.rebind(entityEditor, dispatch, 'on');
	}

	function FeatureInfo(context) {
	    function update(selection) {
	        var features = context.features(),
	            stats = features.stats(),
	            count = 0,
	            hiddenList = _.compact(_.map(features.hidden(), function(k) {
	                if (stats[k]) {
	                    count += stats[k];
	                    return String(stats[k]) + ' ' + t('feature.' + k + '.description');
	                }
	            }));

	        selection.html('');

	        if (hiddenList.length) {
	            var tooltip = bootstrap.tooltip()
	                    .placement('top')
	                    .html(true)
	                    .title(function() {
	                        return iD.ui.tooltipHtml(hiddenList.join('<br/>'));
	                    });

	            var warning = selection.append('a')
	                .attr('href', '#')
	                .attr('tabindex', -1)
	                .html(t('feature_info.hidden_warning', { count: count }))
	                .call(tooltip)
	                .on('click', function() {
	                    tooltip.hide(warning);
	                    // open map data panel?
	                    d3.event.preventDefault();
	                });
	        }

	        selection
	            .classed('hide', !hiddenList.length);
	    }

	    return function(selection) {
	        update(selection);

	        context.features().on('change.feature_info', function() {
	            update(selection);
	        });
	    };
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var index = createCommonjsModule(function (module) {
	module.exports = element;
	module.exports.pair = pair;
	module.exports.format = format;
	module.exports.formatPair = formatPair;
	module.exports.coordToDMS = coordToDMS;

	function element(x, dims) {
	  return search(x, dims).val;
	}

	function formatPair(x) {
	  return format(x.lat, 'lat') + ' ' + format(x.lon, 'lon');
	}

	// Is 0 North or South?
	function format(x, dim) {
	  var dms = coordToDMS(x,dim);
	  return dms.whole + '° ' +
	    (dms.minutes ? dms.minutes + '\' ' : '') +
	    (dms.seconds ? dms.seconds + '" ' : '') + dms.dir;
	}

	function coordToDMS(x,dim) {
	  var dirs = {
	    lat: ['N', 'S'],
	    lon: ['E', 'W']
	  }[dim] || '',
	  dir = dirs[x >= 0 ? 0 : 1],
	    abs = Math.abs(x),
	    whole = Math.floor(abs),
	    fraction = abs - whole,
	    fractionMinutes = fraction * 60,
	    minutes = Math.floor(fractionMinutes),
	    seconds = Math.floor((fractionMinutes - minutes) * 60);

	  return {
	    whole: whole,
	    minutes: minutes,
	    seconds: seconds,
	    dir: dir
	  };
	}

	function search(x, dims, r) {
	  if (!dims) dims = 'NSEW';
	  if (typeof x !== 'string') return { val: null, regex: r };
	  r = r || /[\s\,]*([\-|\—|\―]?[0-9.]+)°? *(?:([0-9.]+)['’′‘] *)?(?:([0-9.]+)(?:''|"|”|″) *)?([NSEW])?/gi;
	  var m = r.exec(x);
	  if (!m) return { val: null, regex: r };
	  else if (m[4] && dims.indexOf(m[4]) === -1) return { val: null, regex: r };
	  else return {
	    val: (((m[1]) ? parseFloat(m[1]) : 0) +
	          ((m[2] ? parseFloat(m[2]) / 60 : 0)) +
	          ((m[3] ? parseFloat(m[3]) / 3600 : 0))) *
	          ((m[4] && m[4] === 'S' || m[4] === 'W') ? -1 : 1),
	    regex: r,
	    raw: m[0],
	    dim: m[4]
	  };
	}

	function pair(x, dims) {
	  x = x.trim();
	  var one = search(x, dims);
	  if (one.val === null) return null;
	  var two = search(x, dims, one.regex);
	  if (two.val === null) return null;
	  // null if one/two are not contiguous.
	  if (one.raw + two.raw !== x) return null;
	  if (one.dim) {
	    return swapdim(one.val, two.val, one.dim);
	  } else {
	    return [one.val, two.val];
	  }
	}

	function swapdim(a, b, dim) {
	  if (dim === 'N' || dim === 'S') return [a, b];
	  if (dim === 'W' || dim === 'E') return [b, a];
	}
	});

	var pair = index.pair;

	function FeatureList(context) {
	    var geocodeResults;

	    function featureList(selection) {
	        var header = selection.append('div')
	            .attr('class', 'header fillL cf');

	        header.append('h3')
	            .text(t('inspector.feature_list'));

	        function keypress() {
	            var q = search.property('value'),
	                items = list.selectAll('.feature-list-item');
	            if (d3.event.keyCode === 13 && q.length && items.size()) {
	                click(items.datum());
	            }
	        }

	        function inputevent() {
	            geocodeResults = undefined;
	            drawList();
	        }

	        var searchWrap = selection.append('div')
	            .attr('class', 'search-header');

	        var search = searchWrap.append('input')
	            .attr('placeholder', t('inspector.search'))
	            .attr('type', 'search')
	            .on('keypress', keypress)
	            .on('input', inputevent);

	        searchWrap
	            .call(iD.svg.Icon('#icon-search', 'pre-text'));

	        var listWrap = selection.append('div')
	            .attr('class', 'inspector-body');

	        var list = listWrap.append('div')
	            .attr('class', 'feature-list cf');

	        context
	            .on('exit.feature-list', clearSearch);
	        context.map()
	            .on('drawn.feature-list', mapDrawn);

	        function clearSearch() {
	            search.property('value', '');
	            drawList();
	        }

	        function mapDrawn(e) {
	            if (e.full) {
	                drawList();
	            }
	        }

	        function features() {
	            var entities = {},
	                result = [],
	                graph = context.graph(),
	                q = search.property('value').toLowerCase();

	            if (!q) return result;

	            var idMatch = q.match(/^([nwr])([0-9]+)$/);

	            if (idMatch) {
	                result.push({
	                    id: idMatch[0],
	                    geometry: idMatch[1] === 'n' ? 'point' : idMatch[1] === 'w' ? 'line' : 'relation',
	                    type: idMatch[1] === 'n' ? t('inspector.node') : idMatch[1] === 'w' ? t('inspector.way') : t('inspector.relation'),
	                    name: idMatch[2]
	                });
	            }

	            var locationMatch = pair(q.toUpperCase()) || q.match(/^(-?\d+\.?\d*)\s+(-?\d+\.?\d*)$/);

	            if (locationMatch) {
	                var loc = [parseFloat(locationMatch[0]), parseFloat(locationMatch[1])];
	                result.push({
	                    id: -1,
	                    geometry: 'point',
	                    type: t('inspector.location'),
	                    name: loc[0].toFixed(6) + ', ' + loc[1].toFixed(6),
	                    location: loc
	                });
	            }

	            function addEntity(entity) {
	                if (entity.id in entities || result.length > 200)
	                    return;

	                entities[entity.id] = true;

	                var name = iD.util.displayName(entity) || '';
	                if (name.toLowerCase().indexOf(q) >= 0) {
	                    result.push({
	                        id: entity.id,
	                        entity: entity,
	                        geometry: context.geometry(entity.id),
	                        type: context.presets().match(entity, graph).name(),
	                        name: name
	                    });
	                }

	                graph.parentRelations(entity).forEach(function(parent) {
	                    addEntity(parent);
	                });
	            }

	            var visible = context.surface().selectAll('.point, .line, .area')[0];
	            for (var i = 0; i < visible.length && result.length <= 200; i++) {
	                addEntity(visible[i].__data__);
	            }

	            (geocodeResults || []).forEach(function(d) {
	                // https://github.com/openstreetmap/iD/issues/1890
	                if (d.osm_type && d.osm_id) {
	                    result.push({
	                        id: iD.Entity.id.fromOSM(d.osm_type, d.osm_id),
	                        geometry: d.osm_type === 'relation' ? 'relation' : d.osm_type === 'way' ? 'line' : 'point',
	                        type: d.type !== 'yes' ? (d.type.charAt(0).toUpperCase() + d.type.slice(1)).replace('_', ' ')
	                                               : (d.class.charAt(0).toUpperCase() + d.class.slice(1)).replace('_', ' '),
	                        name: d.display_name,
	                        extent: new iD.geo.Extent(
	                            [parseFloat(d.boundingbox[3]), parseFloat(d.boundingbox[0])],
	                            [parseFloat(d.boundingbox[2]), parseFloat(d.boundingbox[1])])
	                    });
	                }
	            });

	            return result;
	        }

	        function drawList() {
	            var value = search.property('value'),
	                results = features();

	            list.classed('filtered', value.length);

	            var noResultsWorldwide = geocodeResults && geocodeResults.length === 0;

	            var resultsIndicator = list.selectAll('.no-results-item')
	                .data([0])
	                .enter().append('button')
	                .property('disabled', true)
	                .attr('class', 'no-results-item')
	                .call(iD.svg.Icon('#icon-alert', 'pre-text'));

	            resultsIndicator.append('span')
	                .attr('class', 'entity-name');

	            list.selectAll('.no-results-item .entity-name')
	                .text(noResultsWorldwide ? t('geocoder.no_results_worldwide') : t('geocoder.no_results_visible'));

	            list.selectAll('.geocode-item')
	                .data([0])
	                .enter().append('button')
	                .attr('class', 'geocode-item')
	                .on('click', geocode)
	                .append('div')
	                .attr('class', 'label')
	                .append('span')
	                .attr('class', 'entity-name')
	                .text(t('geocoder.search'));

	            list.selectAll('.no-results-item')
	                .style('display', (value.length && !results.length) ? 'block' : 'none');

	            list.selectAll('.geocode-item')
	                .style('display', (value && geocodeResults === undefined) ? 'block' : 'none');

	            list.selectAll('.feature-list-item')
	                .data([-1])
	                .remove();

	            var items = list.selectAll('.feature-list-item')
	                .data(results, function(d) { return d.id; });

	            var enter = items.enter()
	                .insert('button', '.geocode-item')
	                .attr('class', 'feature-list-item')
	                .on('mouseover', mouseover)
	                .on('mouseout', mouseout)
	                .on('click', click);

	            var label = enter
	                .append('div')
	                .attr('class', 'label');

	            label.each(function(d) {
	                d3.select(this)
	                    .call(iD.svg.Icon('#icon-' + d.geometry, 'pre-text'));
	            });

	            label.append('span')
	                .attr('class', 'entity-type')
	                .text(function(d) { return d.type; });

	            label.append('span')
	                .attr('class', 'entity-name')
	                .text(function(d) { return d.name; });

	            enter.style('opacity', 0)
	                .transition()
	                .style('opacity', 1);

	            items.order();

	            items.exit()
	                .remove();
	        }

	        function mouseover(d) {
	            if (d.id === -1) return;

	            context.surface().selectAll(iD.util.entityOrMemberSelector([d.id], context.graph()))
	                .classed('hover', true);
	        }

	        function mouseout() {
	            context.surface().selectAll('.hover')
	                .classed('hover', false);
	        }

	        function click(d) {
	            d3.event.preventDefault();
	            if (d.location) {
	                context.map().centerZoom([d.location[1], d.location[0]], 20);
	            }
	            else if (d.entity) {
	                if (d.entity.type === 'node') {
	                    context.map().center(d.entity.loc);
	                } else if (d.entity.type === 'way') {
	                    var center = context.projection(context.map().center()),
	                        edge = iD.geo.chooseEdge(context.childNodes(d.entity), center, context.projection);
	                    context.map().center(edge.loc);
	                }
	                context.enter(iD.modes.Select(context, [d.entity.id]).suppressMenu(true));
	            } else {
	                context.zoomToEntity(d.id);
	            }
	        }

	        function geocode() {
	            var searchVal = encodeURIComponent(search.property('value'));
	            d3.json('https://nominatim.openstreetmap.org/search/' + searchVal + '?limit=10&format=json', function(err, resp) {
	                geocodeResults = resp || [];
	                drawList();
	            });
	        }
	    }

	    return featureList;
	}

	function flash(selection) {
	    var modal = modalModule(selection);

	    modal.select('.modal').classed('modal-flash', true);

	    modal.select('.content')
	        .classed('modal-section', true)
	        .append('div')
	        .attr('class', 'description');

	    modal.on('click.flash', function() { modal.remove(); });

	    setTimeout(function() {
	        modal.remove();
	        return true;
	    }, 1500);

	    return modal;
	}

	function FullScreen(context) {
	    var element = context.container().node(),
	        keybinding = d3.keybinding('full-screen');
	        // button;

	    function getFullScreenFn() {
	        if (element.requestFullscreen) {
	            return element.requestFullscreen;
	        } else if (element.msRequestFullscreen) {
	            return  element.msRequestFullscreen;
	        } else if (element.mozRequestFullScreen) {
	            return  element.mozRequestFullScreen;
	        } else if (element.webkitRequestFullscreen) {
	            return element.webkitRequestFullscreen;
	        }
	    }

	    function getExitFullScreenFn() {
	        if (document.exitFullscreen) {
	            return document.exitFullscreen;
	        } else if (document.msExitFullscreen) {
	            return  document.msExitFullscreen;
	        } else if (document.mozCancelFullScreen) {
	            return  document.mozCancelFullScreen;
	        } else if (document.webkitExitFullscreen) {
	            return document.webkitExitFullscreen;
	        }
	    }

	    function isFullScreen() {
	        return document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement ||
	            document.msFullscreenElement;
	    }

	    function isSupported() {
	        return !!getFullScreenFn();
	    }

	    function fullScreen() {
	        d3.event.preventDefault();
	        if (!isFullScreen()) {
	            // button.classed('active', true);
	            getFullScreenFn().apply(element);
	        } else {
	            // button.classed('active', false);
	            getExitFullScreenFn().apply(document);
	        }
	    }

	    return function() { // selection) {
	        if (!isSupported())
	            return;

	        // var tooltip = bootstrap.tooltip()
	        //     .placement('left');

	        // button = selection.append('button')
	        //     .attr('title', t('full_screen'))
	        //     .attr('tabindex', -1)
	        //     .on('click', fullScreen)
	        //     .call(tooltip);

	        // button.append('span')
	        //     .attr('class', 'icon full-screen');

	        keybinding
	            .on('f11', fullScreen)
	            .on(cmd('⌘⇧F'), fullScreen);

	        d3.select(document)
	            .call(keybinding);
	    };
	}

	function Loading(context) {
	    var message = '',
	        blocking = false,
	        modal;

	    var loading = function(selection) {
	        modal = modalModule(selection, blocking);

	        var loadertext = modal.select('.content')
	            .classed('loading-modal', true)
	            .append('div')
	            .attr('class', 'modal-section fillL');

	        loadertext.append('img')
	            .attr('class', 'loader')
	            .attr('src', context.imagePath('loader-white.gif'));

	        loadertext.append('h3')
	            .text(message);

	        modal.select('button.close')
	            .attr('class', 'hide');

	        return loading;
	    };

	    loading.message = function(_) {
	        if (!arguments.length) return message;
	        message = _;
	        return loading;
	    };

	    loading.blocking = function(_) {
	        if (!arguments.length) return blocking;
	        blocking = _;
	        return loading;
	    };

	    loading.close = function() {
	        modal.remove();
	    };

	    return loading;
	}

	function Geolocate(context) {
	    var geoOptions = { enableHighAccuracy: false, timeout: 6000 /* 6sec */ },
	        locating = Loading(context).message(t('geolocate.locating')).blocking(true),
	        timeoutId;

	    function click() {
	        context.enter(iD.modes.Browse(context));
	        context.container().call(locating);
	        navigator.geolocation.getCurrentPosition(success, error, geoOptions);

	        // This timeout ensures that we still call finish() even if
	        // the user declines to share their location in Firefox
	        timeoutId = setTimeout(finish, 10000 /* 10sec */ );
	    }

	    function success(position) {
	        var map = context.map(),
	            extent = iD.geo.Extent([position.coords.longitude, position.coords.latitude])
	                .padByMeters(position.coords.accuracy);

	        map.centerZoom(extent.center(), Math.min(20, map.extentZoom(extent)));
	        finish();
	    }

	    function error() {
	        finish();
	    }

	    function finish() {
	        locating.close();  // unblock ui
	        if (timeoutId) { clearTimeout(timeoutId); }
	        timeoutId = undefined;
	    }

	    return function(selection) {
	        if (!navigator.geolocation) return;

	        selection.append('button')
	            .attr('tabindex', -1)
	            .attr('title', t('geolocate.title'))
	            .on('click', click)
	            .call(iD.svg.Icon('#icon-geolocate', 'light'))
	            .call(bootstrap.tooltip()
	                .placement('left'));
	    };
	}

	function intro(context) {
	    var step;

	    function intro(selection) {

	        function localizedName(id) {
	            var features = {
	                n2140018997: 'city_hall',
	                n367813436: 'fire_department',
	                w203988286: 'memory_isle_park',
	                w203972937: 'riverwalk_trail',
	                w203972938: 'riverwalk_trail',
	                w203972940: 'riverwalk_trail',
	                w41785752: 'w_michigan_ave',
	                w134150789: 'w_michigan_ave',
	                w134150795: 'w_michigan_ave',
	                w134150800: 'w_michigan_ave',
	                w134150811: 'w_michigan_ave',
	                w134150802: 'e_michigan_ave',
	                w134150836: 'e_michigan_ave',
	                w41074896: 'e_michigan_ave',
	                w17965834: 'spring_st',
	                w203986457: 'scidmore_park',
	                w203049587: 'petting_zoo',
	                w17967397: 'n_andrews_st',
	                w17967315: 's_andrews_st',
	                w17967326: 'n_constantine_st',
	                w17966400: 's_constantine_st',
	                w170848823: 'rocky_river',
	                w170848824: 'rocky_river',
	                w170848331: 'rocky_river',
	                w17967752: 'railroad_dr',
	                w17965998: 'conrail_rr',
	                w134150845: 'conrail_rr',
	                w170989131: 'st_joseph_river',
	                w143497377: 'n_main_st',
	                w134150801: 's_main_st',
	                w134150830: 's_main_st',
	                w17966462: 's_main_st',
	                w17967734: 'water_st',
	                w17964996: 'foster_st',
	                w170848330: 'portage_river',
	                w17965351: 'flower_st',
	                w17965502: 'elm_st',
	                w17965402: 'walnut_st',
	                w17964793: 'morris_ave',
	                w17967444: 'east_st',
	                w17966984: 'portage_ave'
	            };
	            return features[id] && t('intro.graph.' + features[id]);
	        }

	        context.enter(iD.modes.Browse(context));

	        // Save current map state
	        var history = context.history().toJSON(),
	            hash = window.location.hash,
	            center = context.map().center(),
	            zoom = context.map().zoom(),
	            background = context.background().baseLayerSource(),
	            opacity = d3.selectAll('#map .layer-background').style('opacity'),
	            loadedTiles = context.connection().loadedTiles(),
	            baseEntities = context.history().graph().base().entities,
	            introGraph, name;

	        // Block saving
	        context.inIntro(true);

	        // Load semi-real data used in intro
	        context.connection().toggle(false).flush();
	        context.history().reset();

	        introGraph = JSON.parse(iD.introGraph);
	        for (var key in introGraph) {
	            introGraph[key] = iD.Entity(introGraph[key]);
	            name = localizedName(key);
	            if (name) {
	                introGraph[key].tags.name = name;
	            }
	        }
	        context.history().merge(d3.values(iD.Graph().load(introGraph).entities));
	        context.background().bing();

	        d3.selectAll('#map .layer-background').style('opacity', 1);

	        var curtain = d3.curtain();
	        selection.call(curtain);

	        function reveal(box, text, options) {
	            options = options || {};
	            if (text) curtain.reveal(box, text, options.tooltipClass, options.duration);
	            else curtain.reveal(box, '', '', options.duration);
	        }

	        var steps = ['navigation', 'point', 'area', 'line', 'startEditing'].map(function(step, i) {
	            var s = iD.ui.intro[step](context, reveal)
	                .on('done', function() {
	                    entered.filter(function(d) {
	                        return d.title === s.title;
	                    }).classed('finished', true);
	                    enter(steps[i + 1]);
	                });
	            return s;
	        });

	        steps[steps.length - 1].on('startEditing', function() {
	            curtain.remove();
	            navwrap.remove();
	            d3.selectAll('#map .layer-background').style('opacity', opacity);
	            context.connection().toggle(true).flush().loadedTiles(loadedTiles);
	            context.history().reset().merge(d3.values(baseEntities));
	            context.background().baseLayerSource(background);
	            if (history) context.history().fromJSON(history, false);
	            context.map().centerZoom(center, zoom);
	            window.location.replace(hash);
	            context.inIntro(false);
	        });

	        var navwrap = selection.append('div').attr('class', 'intro-nav-wrap fillD');

	        var buttonwrap = navwrap.append('div')
	            .attr('class', 'joined')
	            .selectAll('button.step');

	        var entered = buttonwrap
	            .data(steps)
	            .enter()
	            .append('button')
	            .attr('class', 'step')
	            .on('click', enter);

	        entered
	            .call(iD.svg.Icon('#icon-apply', 'pre-text'));

	        entered
	            .append('label')
	            .text(function(d) { return t(d.title); });

	        enter(steps[0]);

	        function enter (newStep) {
	            if (step) { step.exit(); }

	            context.enter(iD.modes.Browse(context));

	            step = newStep;
	            step.enter();

	            entered.classed('active', function(d) {
	                return d.title === step.title;
	            });
	        }

	    }
	    return intro;
	}

	function Help(context) {
	    var key = 'H';

	    var docKeys = [
	        'help.help',
	        'help.editing_saving',
	        'help.roads',
	        'help.gps',
	        'help.imagery',
	        'help.addresses',
	        'help.inspector',
	        'help.buildings',
	        'help.relations'];

	    var docs = docKeys.map(function(key) {
	        var text = t(key);
	        return {
	            title: text.split('\n')[0].replace('#', '').trim(),
	            html: marked(text.split('\n').slice(1).join('\n'))
	        };
	    });

	    function help(selection) {

	        function hide() {
	            setVisible(false);
	        }

	        function toggle() {
	            if (d3.event) d3.event.preventDefault();
	            tooltip.hide(button);
	            setVisible(!button.classed('active'));
	        }

	        function setVisible(show) {
	            if (show !== shown) {
	                button.classed('active', show);
	                shown = show;

	                if (show) {
	                    selection.on('mousedown.help-inside', function() {
	                        return d3.event.stopPropagation();
	                    });
	                    pane.style('display', 'block')
	                        .style('right', '-500px')
	                        .transition()
	                        .duration(200)
	                        .style('right', '0px');
	                } else {
	                    pane.style('right', '0px')
	                        .transition()
	                        .duration(200)
	                        .style('right', '-500px')
	                        .each('end', function() {
	                            d3.select(this).style('display', 'none');
	                        });
	                    selection.on('mousedown.help-inside', null);
	                }
	            }
	        }

	        function clickHelp(d, i) {
	            pane.property('scrollTop', 0);
	            doctitle.html(d.title);
	            body.html(d.html);
	            body.selectAll('a')
	                .attr('target', '_blank');
	            menuItems.classed('selected', function(m) {
	                return m.title === d.title;
	            });

	            nav.html('');

	            if (i > 0) {
	                var prevLink = nav.append('a')
	                    .attr('class', 'previous')
	                    .on('click', function() {
	                        clickHelp(docs[i - 1], i - 1);
	                    });
	                prevLink.append('span').html('&#9668; ' + docs[i - 1].title);
	            }
	            if (i < docs.length - 1) {
	                var nextLink = nav.append('a')
	                    .attr('class', 'next')
	                    .on('click', function() {
	                        clickHelp(docs[i + 1], i + 1);
	                    });
	                nextLink.append('span').html(docs[i + 1].title + ' &#9658;');
	            }
	        }

	        function clickWalkthrough() {
	            d3.select(document.body).call(intro(context));
	            setVisible(false);
	        }


	        var pane = selection.append('div')
	                .attr('class', 'help-wrap map-overlay fillL col5 content hide'),
	            tooltip = bootstrap.tooltip()
	                .placement('left')
	                .html(true)
	                .title(iD.ui.tooltipHtml(t('help.title'), key)),
	            button = selection.append('button')
	                .attr('tabindex', -1)
	                .on('click', toggle)
	                .call(iD.svg.Icon('#icon-help', 'light'))
	                .call(tooltip),
	            shown = false;


	        var toc = pane.append('ul')
	            .attr('class', 'toc');

	        var menuItems = toc.selectAll('li')
	            .data(docs)
	            .enter()
	            .append('li')
	            .append('a')
	            .html(function(d) { return d.title; })
	            .on('click', clickHelp);

	        toc.append('li')
	            .attr('class','walkthrough')
	            .append('a')
	            .text(t('splash.walkthrough'))
	            .on('click', clickWalkthrough);

	        var content = pane.append('div')
	            .attr('class', 'left-content');

	        var doctitle = content.append('h2')
	            .text(t('help.title'));

	        var body = content.append('div')
	            .attr('class', 'body');

	        var nav = content.append('div')
	            .attr('class', 'nav');

	        clickHelp(docs[0], 0);

	        var keybinding = d3.keybinding('help')
	            .on(key, toggle)
	            .on('B', hide)
	            .on('F', hide);

	        d3.select(document)
	            .call(keybinding);

	        context.surface().on('mousedown.help-outside', hide);
	        context.container().on('mousedown.help-outside', hide);
	    }

	    return help;
	}

	function Info(context) {
	    var key = cmd('⌘I'),
	        imperial = (iD.detect().locale.toLowerCase() === 'en-us'),
	        hidden = true;

	    function info(selection) {
	        function radiansToMeters(r) {
	            // using WGS84 authalic radius (6371007.1809 m)
	            return r * 6371007.1809;
	        }

	        function steradiansToSqmeters(r) {
	            // http://gis.stackexchange.com/a/124857/40446
	            return r / 12.56637 * 510065621724000;
	        }

	        function toLineString(feature) {
	            if (feature.type === 'LineString') return feature;

	            var result = { type: 'LineString', coordinates: [] };
	            if (feature.type === 'Polygon') {
	                result.coordinates = feature.coordinates[0];
	            } else if (feature.type === 'MultiPolygon') {
	                result.coordinates = feature.coordinates[0][0];
	            }

	            return result;
	        }

	        function displayLength(m) {
	            var d = m * (imperial ? 3.28084 : 1),
	                p, unit;

	            if (imperial) {
	                if (d >= 5280) {
	                    d /= 5280;
	                    unit = 'mi';
	                } else {
	                    unit = 'ft';
	                }
	            } else {
	                if (d >= 1000) {
	                    d /= 1000;
	                    unit = 'km';
	                } else {
	                    unit = 'm';
	                }
	            }

	            // drop unnecessary precision
	            p = d > 1000 ? 0 : d > 100 ? 1 : 2;

	            return String(d.toFixed(p)) + ' ' + unit;
	        }

	        function displayArea(m2) {
	            var d = m2 * (imperial ? 10.7639111056 : 1),
	                d1, d2, p1, p2, unit1, unit2;

	            if (imperial) {
	                if (d >= 6969600) {     // > 0.25mi² show mi²
	                    d1 = d / 27878400;
	                    unit1 = 'mi²';
	                } else {
	                    d1 = d;
	                    unit1 = 'ft²';
	                }

	                if (d > 4356 && d < 43560000) {   // 0.1 - 1000 acres
	                    d2 = d / 43560;
	                    unit2 = 'ac';
	                }

	            } else {
	                if (d >= 250000) {    // > 0.25km² show km²
	                    d1 = d / 1000000;
	                    unit1 = 'km²';
	                } else {
	                    d1 = d;
	                    unit1 = 'm²';
	                }

	                if (d > 1000 && d < 10000000) {   // 0.1 - 1000 hectares
	                    d2 = d / 10000;
	                    unit2 = 'ha';
	                }
	            }

	            // drop unnecessary precision
	            p1 = d1 > 1000 ? 0 : d1 > 100 ? 1 : 2;
	            p2 = d2 > 1000 ? 0 : d2 > 100 ? 1 : 2;

	            return String(d1.toFixed(p1)) + ' ' + unit1 +
	                (d2 ? ' (' + String(d2.toFixed(p2)) + ' ' + unit2 + ')' : '');
	        }


	        function redraw() {
	            if (hidden) return;

	            var resolver = context.graph(),
	                selected = _.filter(context.selectedIDs(), function(e) { return context.hasEntity(e); }),
	                singular = selected.length === 1 ? selected[0] : null,
	                extent = iD.geo.Extent(),
	                entity;

	            wrap.html('');
	            wrap.append('h4')
	                .attr('class', 'infobox-heading fillD')
	                .text(singular || t('infobox.selected', { n: selected.length }));

	            if (!selected.length) return;

	            var center;
	            for (var i = 0; i < selected.length; i++) {
	                entity = context.entity(selected[i]);
	                extent._extend(entity.extent(resolver));
	            }
	            center = extent.center();


	            var list = wrap.append('ul');

	            // multiple wrap, just display extent center..
	            if (!singular) {
	                list.append('li')
	                    .text(t('infobox.center') + ': ' + center[0].toFixed(5) + ', ' + center[1].toFixed(5));
	                return;
	            }

	            // single wrap, display details..
	            if (!entity) return;
	            var geometry = entity.geometry(resolver);

	            if (geometry === 'line' || geometry === 'area') {
	                var closed = (entity.type === 'relation') || (entity.isClosed() && !entity.isDegenerate()),
	                    feature = entity.asGeoJSON(resolver),
	                    length = radiansToMeters(d3.geo.length(toLineString(feature))),
	                    lengthLabel = t('infobox.' + (closed ? 'perimeter' : 'length')),
	                    centroid = d3.geo.centroid(feature);

	                list.append('li')
	                    .text(t('infobox.geometry') + ': ' +
	                        (closed ? t('infobox.closed') + ' ' : '') + t('geometry.' + geometry) );

	                if (closed) {
	                    var area = steradiansToSqmeters(entity.area(resolver));
	                    list.append('li')
	                        .text(t('infobox.area') + ': ' + displayArea(area));
	                }

	                list.append('li')
	                    .text(lengthLabel + ': ' + displayLength(length));

	                list.append('li')
	                    .text(t('infobox.centroid') + ': ' + centroid[0].toFixed(5) + ', ' + centroid[1].toFixed(5));


	                var toggle  = imperial ? 'imperial' : 'metric';
	                wrap.append('a')
	                    .text(t('infobox.' + toggle))
	                    .attr('href', '#')
	                    .attr('class', 'button')
	                    .on('click', function() {
	                        d3.event.preventDefault();
	                        imperial = !imperial;
	                        redraw();
	                    });

	            } else {
	                var centerLabel = t('infobox.' + (entity.type === 'node' ? 'location' : 'center'));

	                list.append('li')
	                    .text(t('infobox.geometry') + ': ' + t('geometry.' + geometry));

	                list.append('li')
	                    .text(centerLabel + ': ' + center[0].toFixed(5) + ', ' + center[1].toFixed(5));
	            }
	        }


	        function toggle() {
	            if (d3.event) d3.event.preventDefault();

	            hidden = !hidden;

	            if (hidden) {
	                wrap
	                    .style('display', 'block')
	                    .style('opacity', 1)
	                    .transition()
	                    .duration(200)
	                    .style('opacity', 0)
	                    .each('end', function() {
	                        d3.select(this).style('display', 'none');
	                    });
	            } else {
	                wrap
	                    .style('display', 'block')
	                    .style('opacity', 0)
	                    .transition()
	                    .duration(200)
	                    .style('opacity', 1);

	                redraw();
	            }
	        }


	        var wrap = selection.selectAll('.infobox')
	            .data([0]);

	        wrap.enter()
	            .append('div')
	            .attr('class', 'infobox fillD2')
	            .style('display', (hidden ? 'none' : 'block'));

	        context.map()
	            .on('drawn.info', redraw);

	        redraw();

	        var keybinding = d3.keybinding('info')
	            .on(key, toggle);

	        d3.select(document)
	            .call(keybinding);
	    }

	    return info;
	}

	function PresetList(context) {
	    var event = d3.dispatch('choose'),
	        id,
	        currentPreset,
	        autofocus = false;

	    function presetList(selection) {
	        var geometry = context.geometry(id),
	            presets = context.presets().matchGeometry(geometry);

	        selection.html('');

	        var messagewrap = selection.append('div')
	            .attr('class', 'header fillL cf');

	        var message = messagewrap.append('h3')
	            .text(t('inspector.choose'));

	        if (context.entity(id).isUsed(context.graph())) {
	            messagewrap.append('button')
	                .attr('class', 'preset-choose')
	                .on('click', function() { event.choose(currentPreset); })
	                .append('span')
	                .html('&#9658;');
	        } else {
	            messagewrap.append('button')
	                .attr('class', 'close')
	                .on('click', function() {
	                    context.enter(iD.modes.Browse(context));
	                })
	                .call(iD.svg.Icon('#icon-close'));
	        }

	        function keydown() {
	            // hack to let delete shortcut work when search is autofocused
	            if (search.property('value').length === 0 &&
	                (d3.event.keyCode === d3.keybinding.keyCodes['⌫'] ||
	                 d3.event.keyCode === d3.keybinding.keyCodes['⌦'])) {
	                d3.event.preventDefault();
	                d3.event.stopPropagation();
	                iD.operations.Delete([id], context)();
	            } else if (search.property('value').length === 0 &&
	                (d3.event.ctrlKey || d3.event.metaKey) &&
	                d3.event.keyCode === d3.keybinding.keyCodes.z) {
	                d3.event.preventDefault();
	                d3.event.stopPropagation();
	                context.undo();
	            } else if (!d3.event.ctrlKey && !d3.event.metaKey) {
	                d3.select(this).on('keydown', null);
	            }
	        }

	        function keypress() {
	            // enter
	            var value = search.property('value');
	            if (d3.event.keyCode === 13 && value.length) {
	                list.selectAll('.preset-list-item:first-child').datum().choose();
	            }
	        }

	        function inputevent() {
	            var value = search.property('value');
	            list.classed('filtered', value.length);
	            if (value.length) {
	                var results = presets.search(value, geometry);
	                message.text(t('inspector.results', {
	                    n: results.collection.length,
	                    search: value
	                }));
	                list.call(drawList, results);
	            } else {
	                list.call(drawList, context.presets().defaults(geometry, 36));
	                message.text(t('inspector.choose'));
	            }
	        }

	        var searchWrap = selection.append('div')
	            .attr('class', 'search-header');

	        var search = searchWrap.append('input')
	            .attr('class', 'preset-search-input')
	            .attr('placeholder', t('inspector.search'))
	            .attr('type', 'search')
	            .on('keydown', keydown)
	            .on('keypress', keypress)
	            .on('input', inputevent);

	        searchWrap
	            .call(iD.svg.Icon('#icon-search', 'pre-text'));

	        if (autofocus) {
	            search.node().focus();
	        }

	        var listWrap = selection.append('div')
	            .attr('class', 'inspector-body');

	        var list = listWrap.append('div')
	            .attr('class', 'preset-list fillL cf')
	            .call(drawList, context.presets().defaults(geometry, 36));
	    }

	    function drawList(list, presets) {
	        var collection = presets.collection.map(function(preset) {
	            return preset.members ? CategoryItem(preset) : PresetItem(preset);
	        });

	        var items = list.selectAll('.preset-list-item')
	            .data(collection, function(d) { return d.preset.id; });

	        items.enter().append('div')
	            .attr('class', function(item) { return 'preset-list-item preset-' + item.preset.id.replace('/', '-'); })
	            .classed('current', function(item) { return item.preset === currentPreset; })
	            .each(function(item) {
	                d3.select(this).call(item);
	            })
	            .style('opacity', 0)
	            .transition()
	            .style('opacity', 1);

	        items.order();

	        items.exit()
	            .remove();
	    }

	    function CategoryItem(preset) {
	        var box, sublist, shown = false;

	        function item(selection) {
	            var wrap = selection.append('div')
	                .attr('class', 'preset-list-button-wrap category col12');

	            wrap.append('button')
	                .attr('class', 'preset-list-button')
	                .classed('expanded', false)
	                .call(PresetIcon()
	                    .geometry(context.geometry(id))
	                    .preset(preset))
	                .on('click', function() {
	                    var isExpanded = d3.select(this).classed('expanded');
	                    var triangle = isExpanded ? '▶ ' :  '▼ ';
	                    d3.select(this).classed('expanded', !isExpanded);
	                    d3.select(this).selectAll('.label').text(triangle + preset.name());
	                    item.choose();
	                })
	                .append('div')
	                .attr('class', 'label')
	                .text(function() {
	                  return '▶ ' + preset.name();
	                });

	            box = selection.append('div')
	                .attr('class', 'subgrid col12')
	                .style('max-height', '0px')
	                .style('opacity', 0);

	            box.append('div')
	                .attr('class', 'arrow');

	            sublist = box.append('div')
	                .attr('class', 'preset-list fillL3 cf fl');
	        }

	        item.choose = function() {
	            if (!box || !sublist) return;

	            if (shown) {
	                shown = false;
	                box.transition()
	                    .duration(200)
	                    .style('opacity', '0')
	                    .style('max-height', '0px')
	                    .style('padding-bottom', '0px');
	            } else {
	                shown = true;
	                sublist.call(drawList, preset.members);
	                box.transition()
	                    .duration(200)
	                    .style('opacity', '1')
	                    .style('max-height', 200 + preset.members.collection.length * 80 + 'px')
	                    .style('padding-bottom', '20px');
	            }
	        };

	        item.preset = preset;

	        return item;
	    }

	    function PresetItem(preset) {
	        function item(selection) {
	            var wrap = selection.append('div')
	                .attr('class', 'preset-list-button-wrap col12');

	            wrap.append('button')
	                .attr('class', 'preset-list-button')
	                .call(PresetIcon()
	                    .geometry(context.geometry(id))
	                    .preset(preset))
	                .on('click', item.choose)
	                .append('div')
	                .attr('class', 'label')
	                .text(preset.name());

	            wrap.call(item.reference.button);
	            selection.call(item.reference.body);
	        }

	        item.choose = function() {
	            context.presets().choose(preset);

	            context.perform(
	                iD.actions.ChangePreset(id, currentPreset, preset),
	                t('operations.change_tags.annotation'));

	            event.choose(preset);
	        };

	        item.help = function() {
	            d3.event.stopPropagation();
	            item.reference.toggle();
	        };

	        item.preset = preset;
	        item.reference = TagReference(preset.reference(context.geometry(id)), context);

	        return item;
	    }

	    presetList.autofocus = function(_) {
	        if (!arguments.length) return autofocus;
	        autofocus = _;
	        return presetList;
	    };

	    presetList.entityID = function(_) {
	        if (!arguments.length) return id;
	        id = _;
	        presetList.preset(context.presets().match(context.entity(id), context.graph()));
	        return presetList;
	    };

	    presetList.preset = function(_) {
	        if (!arguments.length) return currentPreset;
	        currentPreset = _;
	        return presetList;
	    };

	    return d3.rebind(presetList, event, 'on');
	}

	function ViewOnOSM(context) {
	    var id;

	    function viewOnOSM(selection) {
	        var entity = context.entity(id);

	        selection.style('display', entity.isNew() ? 'none' : null);

	        var $link = selection.selectAll('.view-on-osm')
	            .data([0]);

	        $link.enter()
	            .append('a')
	            .attr('class', 'view-on-osm')
	            .attr('target', '_blank')
	            .call(iD.svg.Icon('#icon-out-link', 'inline'))
	            .append('span')
	            .text(t('inspector.view_on_osm'));

	        $link
	            .attr('href', context.connection().entityURL(entity));
	    }

	    viewOnOSM.entityID = function(_) {
	        if (!arguments.length) return id;
	        id = _;
	        return viewOnOSM;
	    };

	    return viewOnOSM;
	}

	function Inspector(context) {
	    var presetList = PresetList(context),
	        entityEditor = EntityEditor(context),
	        state = 'select',
	        entityID,
	        newFeature = false;

	    function inspector(selection) {
	        presetList
	            .entityID(entityID)
	            .autofocus(newFeature)
	            .on('choose', setPreset);

	        entityEditor
	            .state(state)
	            .entityID(entityID)
	            .on('choose', showList);

	        var $wrap = selection.selectAll('.panewrap')
	            .data([0]);

	        var $enter = $wrap.enter().append('div')
	            .attr('class', 'panewrap');

	        $enter.append('div')
	            .attr('class', 'preset-list-pane pane');

	        $enter.append('div')
	            .attr('class', 'entity-editor-pane pane');

	        var $presetPane = $wrap.select('.preset-list-pane');
	        var $editorPane = $wrap.select('.entity-editor-pane');

	        var graph = context.graph(),
	            entity = context.entity(entityID),
	            showEditor = state === 'hover' ||
	                entity.isUsed(graph) ||
	                entity.isHighwayIntersection(graph);

	        if (showEditor) {
	            $wrap.style('right', '0%');
	            $editorPane.call(entityEditor);
	        } else {
	            $wrap.style('right', '-100%');
	            $presetPane.call(presetList);
	        }

	        var $footer = selection.selectAll('.footer')
	            .data([0]);

	        $footer.enter().append('div')
	            .attr('class', 'footer');

	        selection.select('.footer')
	            .call(ViewOnOSM(context)
	                .entityID(entityID));

	        function showList(preset) {
	            $wrap.transition()
	                .styleTween('right', function() { return d3.interpolate('0%', '-100%'); });

	            $presetPane.call(presetList
	                .preset(preset)
	                .autofocus(true));
	        }

	        function setPreset(preset) {
	            $wrap.transition()
	                .styleTween('right', function() { return d3.interpolate('-100%', '0%'); });

	            $editorPane.call(entityEditor
	                .preset(preset));
	        }
	    }

	    inspector.state = function(_) {
	        if (!arguments.length) return state;
	        state = _;
	        entityEditor.state(state);
	        return inspector;
	    };

	    inspector.entityID = function(_) {
	        if (!arguments.length) return entityID;
	        entityID = _;
	        return inspector;
	    };

	    inspector.newFeature = function(_) {
	        if (!arguments.length) return newFeature;
	        newFeature = _;
	        return inspector;
	    };

	    return inspector;
	}

	function Lasso(context) {
	    var group, polygon;

	    lasso.coordinates = [];

	    function lasso(selection) {

	        context.container().classed('lasso', true);

	        group = selection.append('g')
	            .attr('class', 'lasso hide');

	        polygon = group.append('path')
	            .attr('class', 'lasso-path');

	        group.call(Toggle(true));

	    }

	    function draw() {
	        if (polygon) {
	            polygon.data([lasso.coordinates])
	                .attr('d', function(d) { return 'M' + d.join(' L') + ' Z'; });
	        }
	    }

	    lasso.extent = function () {
	        return lasso.coordinates.reduce(function(extent, point) {
	            return extent.extend(iD.geo.Extent(point));
	        }, iD.geo.Extent());
	    };

	    lasso.p = function(_) {
	        if (!arguments.length) return lasso;
	        lasso.coordinates.push(_);
	        draw();
	        return lasso;
	    };

	    lasso.close = function() {
	        if (group) {
	            group.call(Toggle(false, function() {
	                d3.select(this).remove();
	            }));
	        }
	        context.container().classed('lasso', false);
	    };

	    return lasso;
	}

	function MapData(context) {
	    var key = 'F',
	        features = context.features().keys(),
	        layers = context.layers(),
	        fills = ['wireframe', 'partial', 'full'],
	        fillDefault = context.storage('area-fill') || 'partial',
	        fillSelected = fillDefault;


	    function map_data(selection) {

	        function showsFeature(d) {
	            return context.features().enabled(d);
	        }

	        function autoHiddenFeature(d) {
	            return context.features().autoHidden(d);
	        }

	        function clickFeature(d) {
	            context.features().toggle(d);
	            update();
	        }

	        function showsFill(d) {
	            return fillSelected === d;
	        }

	        function setFill(d) {
	            _.each(fills, function(opt) {
	                context.surface().classed('fill-' + opt, Boolean(opt === d));
	            });

	            fillSelected = d;
	            if (d !== 'wireframe') {
	                fillDefault = d;
	                context.storage('area-fill', d);
	            }
	            update();
	        }

	        function showsLayer(which) {
	            var layer = layers.layer(which);
	            if (layer) {
	                return layer.enabled();
	            }
	            return false;
	        }

	        function setLayer(which, enabled) {
	            var layer = layers.layer(which);
	            if (layer) {
	                layer.enabled(enabled);
	                update();
	            }
	        }

	        function toggleLayer(which) {
	            setLayer(which, !showsLayer(which));
	        }

	        function clickGpx() {
	            toggleLayer('gpx');
	        }

	        function clickMapillaryImages() {
	            toggleLayer('mapillary-images');
	            if (!showsLayer('mapillary-images')) {
	                setLayer('mapillary-signs', false);
	            }
	        }

	        function clickMapillarySigns() {
	            toggleLayer('mapillary-signs');
	        }


	        function drawMapillaryItems(selection) {
	            var mapillaryImages = layers.layer('mapillary-images'),
	                mapillarySigns = layers.layer('mapillary-signs'),
	                supportsMapillaryImages = mapillaryImages && mapillaryImages.supported(),
	                supportsMapillarySigns = mapillarySigns && mapillarySigns.supported(),
	                showsMapillaryImages = supportsMapillaryImages && mapillaryImages.enabled(),
	                showsMapillarySigns = supportsMapillarySigns && mapillarySigns.enabled();

	            var mapillaryList = selection
	                .selectAll('.layer-list-mapillary')
	                .data([0]);

	            // Enter
	            mapillaryList
	                .enter()
	                .append('ul')
	                .attr('class', 'layer-list layer-list-mapillary');

	            var mapillaryImageLayerItem = mapillaryList
	                .selectAll('.list-item-mapillary-images')
	                .data(supportsMapillaryImages ? [0] : []);

	            var enterImages = mapillaryImageLayerItem.enter()
	                .append('li')
	                .attr('class', 'list-item-mapillary-images');

	            var labelImages = enterImages.append('label')
	                .call(bootstrap.tooltip()
	                    .title(t('mapillary_images.tooltip'))
	                    .placement('top'));

	            labelImages.append('input')
	                .attr('type', 'checkbox')
	                .on('change', clickMapillaryImages);

	            labelImages.append('span')
	                .text(t('mapillary_images.title'));


	            var mapillarySignLayerItem = mapillaryList
	                .selectAll('.list-item-mapillary-signs')
	                .data(supportsMapillarySigns ? [0] : []);

	            var enterSigns = mapillarySignLayerItem.enter()
	                .append('li')
	                .attr('class', 'list-item-mapillary-signs');

	            var labelSigns = enterSigns.append('label')
	                .call(bootstrap.tooltip()
	                    .title(t('mapillary_signs.tooltip'))
	                    .placement('top'));

	            labelSigns.append('input')
	                .attr('type', 'checkbox')
	                .on('change', clickMapillarySigns);

	            labelSigns.append('span')
	                .text(t('mapillary_signs.title'));

	            // Update
	            mapillaryImageLayerItem
	                .classed('active', showsMapillaryImages)
	                .selectAll('input')
	                .property('checked', showsMapillaryImages);

	            mapillarySignLayerItem
	                .classed('active', showsMapillarySigns)
	                .selectAll('input')
	                .property('disabled', !showsMapillaryImages)
	                .property('checked', showsMapillarySigns);

	            mapillarySignLayerItem
	                .selectAll('label')
	                .classed('deemphasize', !showsMapillaryImages);

	            // Exit
	            mapillaryImageLayerItem.exit()
	                .remove();
	            mapillarySignLayerItem.exit()
	                .remove();
	        }


	        function drawGpxItem(selection) {
	            var gpx = layers.layer('gpx'),
	                hasGpx = gpx && gpx.hasGpx(),
	                showsGpx = hasGpx && gpx.enabled();

	            var gpxLayerItem = selection
	                .selectAll('.layer-list-gpx')
	                .data(gpx ? [0] : []);

	            // Enter
	            var enter = gpxLayerItem.enter()
	                .append('ul')
	                .attr('class', 'layer-list layer-list-gpx')
	                .append('li')
	                .classed('list-item-gpx', true);

	            enter.append('button')
	                .attr('class', 'list-item-gpx-extent')
	                .call(bootstrap.tooltip()
	                    .title(t('gpx.zoom'))
	                    .placement('left'))
	                .on('click', function() {
	                    d3.event.preventDefault();
	                    d3.event.stopPropagation();
	                    gpx.fitZoom();
	                })
	                .call(iD.svg.Icon('#icon-search'));

	            enter.append('button')
	                .attr('class', 'list-item-gpx-browse')
	                .call(bootstrap.tooltip()
	                    .title(t('gpx.browse'))
	                    .placement('left'))
	                .on('click', function() {
	                    d3.select(document.createElement('input'))
	                        .attr('type', 'file')
	                        .on('change', function() {
	                            gpx.files(d3.event.target.files);
	                        })
	                        .node().click();
	                })
	                .call(iD.svg.Icon('#icon-geolocate'));

	            var labelGpx = enter.append('label')
	                .call(bootstrap.tooltip()
	                    .title(t('gpx.drag_drop'))
	                    .placement('top'));

	            labelGpx.append('input')
	                .attr('type', 'checkbox')
	                .on('change', clickGpx);

	            labelGpx.append('span')
	                .text(t('gpx.local_layer'));

	            // Update
	            gpxLayerItem
	                .classed('active', showsGpx)
	                .selectAll('input')
	                .property('disabled', !hasGpx)
	                .property('checked', showsGpx);

	            gpxLayerItem
	                .selectAll('label')
	                .classed('deemphasize', !hasGpx);

	            // Exit
	            gpxLayerItem.exit()
	                .remove();
	        }


	        function drawList(selection, data, type, name, change, active) {
	            var items = selection.selectAll('li')
	                .data(data);

	            // Enter
	            var enter = items.enter()
	                .append('li')
	                .attr('class', 'layer')
	                .call(bootstrap.tooltip()
	                    .html(true)
	                    .title(function(d) {
	                        var tip = t(name + '.' + d + '.tooltip'),
	                            key = (d === 'wireframe' ? 'W' : null);

	                        if (name === 'feature' && autoHiddenFeature(d)) {
	                            tip += '<div>' + t('map_data.autohidden') + '</div>';
	                        }
	                        return iD.ui.tooltipHtml(tip, key);
	                    })
	                    .placement('top')
	                );

	            var label = enter.append('label');

	            label.append('input')
	                .attr('type', type)
	                .attr('name', name)
	                .on('change', change);

	            label.append('span')
	                .text(function(d) { return t(name + '.' + d + '.description'); });

	            // Update
	            items
	                .classed('active', active)
	                .selectAll('input')
	                .property('checked', active)
	                .property('indeterminate', function(d) {
	                    return (name === 'feature' && autoHiddenFeature(d));
	                });

	            // Exit
	            items.exit()
	                .remove();
	        }


	        function update() {
	            dataLayerContainer.call(drawMapillaryItems);
	            dataLayerContainer.call(drawGpxItem);

	            fillList.call(drawList, fills, 'radio', 'area_fill', setFill, showsFill);

	            featureList.call(drawList, features, 'checkbox', 'feature', clickFeature, showsFeature);
	        }

	        function hidePanel() {
	            setVisible(false);
	        }

	        function togglePanel() {
	            if (d3.event) d3.event.preventDefault();
	            tooltip.hide(button);
	            setVisible(!button.classed('active'));
	        }

	        function toggleWireframe() {
	            if (d3.event) {
	                d3.event.preventDefault();
	                d3.event.stopPropagation();
	            }
	            setFill((fillSelected === 'wireframe' ? fillDefault : 'wireframe'));
	            context.map().pan([0,0]);  // trigger a redraw
	        }

	        function setVisible(show) {
	            if (show !== shown) {
	                button.classed('active', show);
	                shown = show;

	                if (show) {
	                    update();
	                    selection.on('mousedown.map_data-inside', function() {
	                        return d3.event.stopPropagation();
	                    });
	                    content.style('display', 'block')
	                        .style('right', '-300px')
	                        .transition()
	                        .duration(200)
	                        .style('right', '0px');
	                } else {
	                    content.style('display', 'block')
	                        .style('right', '0px')
	                        .transition()
	                        .duration(200)
	                        .style('right', '-300px')
	                        .each('end', function() {
	                            d3.select(this).style('display', 'none');
	                        });
	                    selection.on('mousedown.map_data-inside', null);
	                }
	            }
	        }


	        var content = selection.append('div')
	                .attr('class', 'fillL map-overlay col3 content hide'),
	            tooltip = bootstrap.tooltip()
	                .placement('left')
	                .html(true)
	                .title(iD.ui.tooltipHtml(t('map_data.description'), key)),
	            button = selection.append('button')
	                .attr('tabindex', -1)
	                .on('click', togglePanel)
	                .call(iD.svg.Icon('#icon-data', 'light'))
	                .call(tooltip),
	            shown = false;

	        content.append('h4')
	            .text(t('map_data.title'));


	        // data layers
	        content.append('a')
	            .text(t('map_data.data_layers'))
	            .attr('href', '#')
	            .classed('hide-toggle', true)
	            .classed('expanded', true)
	            .on('click', function() {
	                var exp = d3.select(this).classed('expanded');
	                dataLayerContainer.style('display', exp ? 'none' : 'block');
	                d3.select(this).classed('expanded', !exp);
	                d3.event.preventDefault();
	            });

	        var dataLayerContainer = content.append('div')
	            .attr('class', 'data-data-layers')
	            .style('display', 'block');


	        // area fills
	        content.append('a')
	            .text(t('map_data.fill_area'))
	            .attr('href', '#')
	            .classed('hide-toggle', true)
	            .classed('expanded', false)
	            .on('click', function() {
	                var exp = d3.select(this).classed('expanded');
	                fillContainer.style('display', exp ? 'none' : 'block');
	                d3.select(this).classed('expanded', !exp);
	                d3.event.preventDefault();
	            });

	        var fillContainer = content.append('div')
	            .attr('class', 'data-area-fills')
	            .style('display', 'none');

	        var fillList = fillContainer.append('ul')
	            .attr('class', 'layer-list layer-fill-list');


	        // feature filters
	        content.append('a')
	            .text(t('map_data.map_features'))
	            .attr('href', '#')
	            .classed('hide-toggle', true)
	            .classed('expanded', false)
	            .on('click', function() {
	                var exp = d3.select(this).classed('expanded');
	                featureContainer.style('display', exp ? 'none' : 'block');
	                d3.select(this).classed('expanded', !exp);
	                d3.event.preventDefault();
	            });

	        var featureContainer = content.append('div')
	            .attr('class', 'data-feature-filters')
	            .style('display', 'none');

	        var featureList = featureContainer.append('ul')
	            .attr('class', 'layer-list layer-feature-list');


	        context.features()
	            .on('change.map_data-update', update);

	        setFill(fillDefault);

	        var keybinding = d3.keybinding('features')
	            .on(key, togglePanel)
	            .on('W', toggleWireframe)
	            .on('B', hidePanel)
	            .on('H', hidePanel);

	        d3.select(document)
	            .call(keybinding);

	        context.surface().on('mousedown.map_data-outside', hidePanel);
	        context.container().on('mousedown.map_data-outside', hidePanel);
	    }

	    return map_data;
	}

	function Modes(context) {
	    var modes = [
	        iD.modes.AddPoint(context),
	        iD.modes.AddLine(context),
	        iD.modes.AddArea(context)];

	    function editable() {
	        return context.editable() && context.mode().id !== 'save';
	    }

	    return function(selection) {
	        var buttons = selection.selectAll('button.add-button')
	            .data(modes);

	       buttons.enter().append('button')
	           .attr('tabindex', -1)
	           .attr('class', function(mode) { return mode.id + ' add-button col4'; })
	           .on('click.mode-buttons', function(mode) {
	               if (mode.id === context.mode().id) {
	                   context.enter(iD.modes.Browse(context));
	               } else {
	                   context.enter(mode);
	               }
	           })
	           .call(bootstrap.tooltip()
	               .placement('bottom')
	               .html(true)
	               .title(function(mode) {
	                   return iD.ui.tooltipHtml(mode.description, mode.key);
	               }));

	        context.map()
	            .on('move.modes', _.debounce(update, 500));

	        context
	            .on('enter.modes', update);

	        buttons.each(function(d) {
	            d3.select(this)
	                .call(iD.svg.Icon('#icon-' + d.button, 'pre-text'));
	        });

	        buttons.append('span')
	            .attr('class', 'label')
	            .text(function(mode) { return mode.title; });

	        context.on('enter.editor', function(entered) {
	            buttons.classed('active', function(mode) { return entered.button === mode.button; });
	            context.container()
	                .classed('mode-' + entered.id, true);
	        });

	        context.on('exit.editor', function(exited) {
	            context.container()
	                .classed('mode-' + exited.id, false);
	        });

	        var keybinding = d3.keybinding('mode-buttons');

	        modes.forEach(function(m) {
	            keybinding.on(m.key, function() { if (editable()) context.enter(m); });
	        });

	        d3.select(document)
	            .call(keybinding);

	        function update() {
	            buttons.property('disabled', !editable());
	        }
	    };
	}

	function Notice(context) {
	    return function(selection) {
	        var div = selection.append('div')
	            .attr('class', 'notice');

	        var button = div.append('button')
	            .attr('class', 'zoom-to notice')
	            .on('click', function() { context.map().zoom(context.minEditableZoom()); });

	        button
	            .call(iD.svg.Icon('#icon-plus', 'pre-text'))
	            .append('span')
	            .attr('class', 'label')
	            .text(t('zoom_in_edit'));

	        function disableTooHigh() {
	            div.style('display', context.editable() ? 'none' : 'block');
	        }

	        context.map()
	            .on('move.notice', _.debounce(disableTooHigh, 500));

	        disableTooHigh();
	    };
	}

	function RadialMenu(context, operations) {
	    var menu,
	        center = [0, 0],
	        tooltip;

	    var radialMenu = function(selection) {
	        if (!operations.length)
	            return;

	        selection.node().parentNode.focus();

	        function click(operation) {
	            d3.event.stopPropagation();
	            if (operation.disabled())
	                return;
	            operation();
	            radialMenu.close();
	        }

	        menu = selection.append('g')
	            .attr('class', 'radial-menu')
	            .attr('transform', 'translate(' + center + ')')
	            .attr('opacity', 0);

	        menu.transition()
	            .attr('opacity', 1);

	        var r = 50,
	            a = Math.PI / 4,
	            a0 = -Math.PI / 4,
	            a1 = a0 + (operations.length - 1) * a;

	        menu.append('path')
	            .attr('class', 'radial-menu-background')
	            .attr('d', 'M' + r * Math.sin(a0) + ',' +
	                             r * Math.cos(a0) +
	                      ' A' + r + ',' + r + ' 0 ' + (operations.length > 5 ? '1' : '0') + ',0 ' +
	                             (r * Math.sin(a1) + 1e-3) + ',' +
	                             (r * Math.cos(a1) + 1e-3)) // Force positive-length path (#1305)
	            .attr('stroke-width', 50)
	            .attr('stroke-linecap', 'round');

	        var button = menu.selectAll()
	            .data(operations)
	            .enter()
	            .append('g')
	            .attr('class', function(d) { return 'radial-menu-item radial-menu-item-' + d.id; })
	            .classed('disabled', function(d) { return d.disabled(); })
	            .attr('transform', function(d, i) {
	                return 'translate(' + iD.geo.roundCoords([
	                        r * Math.sin(a0 + i * a),
	                        r * Math.cos(a0 + i * a)]).join(',') + ')';
	            });

	        button.append('circle')
	            .attr('r', 15)
	            .on('click', click)
	            .on('mousedown', mousedown)
	            .on('mouseover', mouseover)
	            .on('mouseout', mouseout);

	        button.append('use')
	            .attr('transform', 'translate(-10,-10)')
	            .attr('width', '20')
	            .attr('height', '20')
	            .attr('xlink:href', function(d) { return '#operation-' + d.id; });

	        tooltip = d3.select(document.body)
	            .append('div')
	            .attr('class', 'tooltip-inner radial-menu-tooltip');

	        function mousedown() {
	            d3.event.stopPropagation(); // https://github.com/openstreetmap/iD/issues/1869
	        }

	        function mouseover(d, i) {
	            var rect = context.surfaceRect(),
	                angle = a0 + i * a,
	                top = rect.top + (r + 25) * Math.cos(angle) + center[1] + 'px',
	                left = rect.left + (r + 25) * Math.sin(angle) + center[0] + 'px',
	                bottom = rect.height - (r + 25) * Math.cos(angle) - center[1] + 'px',
	                right = rect.width - (r + 25) * Math.sin(angle) - center[0] + 'px';

	            tooltip
	                .style('top', null)
	                .style('left', null)
	                .style('bottom', null)
	                .style('right', null)
	                .style('display', 'block')
	                .html(iD.ui.tooltipHtml(d.tooltip(), d.keys[0]));

	            if (i === 0) {
	                tooltip
	                    .style('right', right)
	                    .style('top', top);
	            } else if (i >= 4) {
	                tooltip
	                    .style('left', left)
	                    .style('bottom', bottom);
	            } else {
	                tooltip
	                    .style('left', left)
	                    .style('top', top);
	            }
	        }

	        function mouseout() {
	            tooltip.style('display', 'none');
	        }
	    };

	    radialMenu.close = function() {
	        if (menu) {
	            menu
	                .style('pointer-events', 'none')
	                .transition()
	                .attr('opacity', 0)
	                .remove();
	        }

	        if (tooltip) {
	            tooltip.remove();
	        }
	    };

	    radialMenu.center = function(_) {
	        if (!arguments.length) return center;
	        center = _;
	        return radialMenu;
	    };

	    return radialMenu;
	}

	function Restore(context) {
	    return function(selection) {
	        if (!context.history().lock() || !context.history().restorableChanges())
	            return;

	        var modal = modalModule(selection, true);

	        modal.select('.modal')
	            .attr('class', 'modal fillL col6');

	        var introModal = modal.select('.content');

	        introModal.attr('class','cf');

	        introModal.append('div')
	            .attr('class', 'modal-section')
	            .append('h3')
	            .text(t('restore.heading'));

	        introModal.append('div')
	            .attr('class','modal-section')
	            .append('p')
	            .text(t('restore.description'));

	        var buttonWrap = introModal.append('div')
	            .attr('class', 'modal-actions cf');

	        var restore = buttonWrap.append('button')
	            .attr('class', 'restore col6')
	            .text(t('restore.restore'))
	            .on('click', function() {
	                context.history().restore();
	                modal.remove();
	            });

	        buttonWrap.append('button')
	            .attr('class', 'reset col6')
	            .text(t('restore.reset'))
	            .on('click', function() {
	                context.history().clearSaved();
	                modal.remove();
	            });

	        restore.node().focus();
	    };
	}

	function Save(context) {
	    var history = context.history(),
	        key = cmd('⌘S');


	    function saving() {
	        return context.mode().id === 'save';
	    }

	    function save() {
	        d3.event.preventDefault();
	        if (!context.inIntro() && !saving() && history.hasChanges()) {
	            context.enter(iD.modes.Save(context));
	        }
	    }

	    function getBackground(numChanges) {
	        var step;
	        if (numChanges === 0) {
	            return null;
	        } else if (numChanges <= 50) {
	            step = numChanges / 50;
	            return d3.interpolateRgb('#fff', '#ff8')(step);  // white -> yellow
	        } else {
	            step = Math.min((numChanges - 50) / 50, 1.0);
	            return d3.interpolateRgb('#ff8', '#f88')(step);  // yellow -> red
	        }
	    }

	    return function(selection) {
	        var tooltip = bootstrap.tooltip()
	            .placement('bottom')
	            .html(true)
	            .title(iD.ui.tooltipHtml(t('save.no_changes'), key));

	        var button = selection.append('button')
	            .attr('class', 'save col12 disabled')
	            .attr('tabindex', -1)
	            .on('click', save)
	            .call(tooltip);

	        button.append('span')
	            .attr('class', 'label')
	            .text(t('save.title'));

	        button.append('span')
	            .attr('class', 'count')
	            .text('0');

	        var keybinding = d3.keybinding('undo-redo')
	            .on(key, save, true);

	        d3.select(document)
	            .call(keybinding);

	        var numChanges = 0;

	        context.history().on('change.save', function() {
	            var _ = history.difference().summary().length;
	            if (_ === numChanges)
	                return;
	            numChanges = _;

	            tooltip.title(iD.ui.tooltipHtml(t(numChanges > 0 ?
	                    'save.help' : 'save.no_changes'), key));

	            var background = getBackground(numChanges);

	            button
	                .classed('disabled', numChanges === 0)
	                .classed('has-count', numChanges > 0)
	                .style('background', background);

	            button.select('span.count')
	                .text(numChanges)
	                .style('background', background)
	                .style('border-color', background);
	        });

	        context.on('enter.save', function() {
	            button.property('disabled', saving());
	            if (saving()) button.call(tooltip.hide);
	        });
	    };
	}

	function Scale(context) {
	    var projection = context.projection,
	        imperial = (iD.detect().locale.toLowerCase() === 'en-us'),
	        maxLength = 180,
	        tickHeight = 8;

	    function scaleDefs(loc1, loc2) {
	        var lat = (loc2[1] + loc1[1]) / 2,
	            conversion = (imperial ? 3.28084 : 1),
	            dist = iD.geo.lonToMeters(loc2[0] - loc1[0], lat) * conversion,
	            scale = { dist: 0, px: 0, text: '' },
	            buckets, i, val, dLon;

	        if (imperial) {
	            buckets = [5280000, 528000, 52800, 5280, 500, 50, 5, 1];
	        } else {
	            buckets = [5000000, 500000, 50000, 5000, 500, 50, 5, 1];
	        }

	        // determine a user-friendly endpoint for the scale
	        for (i = 0; i < buckets.length; i++) {
	            val = buckets[i];
	            if (dist >= val) {
	                scale.dist = Math.floor(dist / val) * val;
	                break;
	            }
	        }

	        dLon = iD.geo.metersToLon(scale.dist / conversion, lat);
	        scale.px = Math.round(projection([loc1[0] + dLon, loc1[1]])[0]);

	        if (imperial) {
	            if (scale.dist >= 5280) {
	                scale.dist /= 5280;
	                scale.text = String(scale.dist) + ' mi';
	            } else {
	                scale.text = String(scale.dist) + ' ft';
	            }
	        } else {
	            if (scale.dist >= 1000) {
	                scale.dist /= 1000;
	                scale.text = String(scale.dist) + ' km';
	            } else {
	                scale.text = String(scale.dist) + ' m';
	            }
	        }

	        return scale;
	    }

	    function update(selection) {
	        // choose loc1, loc2 along bottom of viewport (near where the scale will be drawn)
	        var dims = context.map().dimensions(),
	            loc1 = projection.invert([0, dims[1]]),
	            loc2 = projection.invert([maxLength, dims[1]]),
	            scale = scaleDefs(loc1, loc2);

	        selection.select('#scalepath')
	            .attr('d', 'M0.5,0.5v' + tickHeight + 'h' + scale.px + 'v-' + tickHeight);

	        selection.select('#scaletext')
	            .attr('x', scale.px + 8)
	            .attr('y', tickHeight)
	            .text(scale.text);
	    }


	    return function(selection) {
	        function switchUnits() {
	            imperial = !imperial;
	            selection.call(update);
	        }

	        var g = selection.append('svg')
	            .attr('id', 'scale')
	            .on('click', switchUnits)
	            .append('g')
	            .attr('transform', 'translate(10,11)');

	        g.append('path').attr('id', 'scalepath');
	        g.append('text').attr('id', 'scaletext');

	        selection.call(update);

	        context.map().on('move.scale', function() {
	            update(selection);
	        });
	    };
	}

	function SelectionList(context, selectedIDs) {

	    function selectEntity(entity) {
	        context.enter(iD.modes.Select(context, [entity.id]).suppressMenu(true));
	    }


	    function selectionList(selection) {
	        selection.classed('selection-list-pane', true);

	        var header = selection.append('div')
	            .attr('class', 'header fillL cf');

	        header.append('h3')
	            .text(t('inspector.multiselect'));

	        var listWrap = selection.append('div')
	            .attr('class', 'inspector-body');

	        var list = listWrap.append('div')
	            .attr('class', 'feature-list cf');

	        context.history().on('change.selection-list', drawList);
	        drawList();

	        function drawList() {
	            var entities = selectedIDs
	                .map(function(id) { return context.hasEntity(id); })
	                .filter(function(entity) { return entity; });

	            var items = list.selectAll('.feature-list-item')
	                .data(entities, iD.Entity.key);

	            var enter = items.enter().append('button')
	                .attr('class', 'feature-list-item')
	                .on('click', selectEntity);

	            // Enter
	            var label = enter.append('div')
	                .attr('class', 'label')
	                .call(iD.svg.Icon('', 'pre-text'));

	            label.append('span')
	                .attr('class', 'entity-type');

	            label.append('span')
	                .attr('class', 'entity-name');

	            // Update
	            items.selectAll('use')
	                .attr('href', function() {
	                    var entity = this.parentNode.parentNode.__data__;
	                    return '#icon-' + context.geometry(entity.id);
	                });

	            items.selectAll('.entity-type')
	                .text(function(entity) { return context.presets().match(entity, context.graph()).name(); });

	            items.selectAll('.entity-name')
	                .text(function(entity) { return iD.util.displayName(entity); });

	            // Exit
	            items.exit()
	                .remove();
	        }
	    }

	    return selectionList;

	}

	function Sidebar(context) {
	    var inspector = Inspector(context),
	        current;

	    function sidebar(selection) {
	        var featureListWrap = selection.append('div')
	            .attr('class', 'feature-list-pane')
	            .call(FeatureList(context));

	        selection.call(Notice(context));

	        var inspectorWrap = selection.append('div')
	            .attr('class', 'inspector-hidden inspector-wrap fr');

	        function hover(id) {
	            if (!current && context.hasEntity(id)) {
	                featureListWrap.classed('inspector-hidden', true);
	                inspectorWrap.classed('inspector-hidden', false)
	                    .classed('inspector-hover', true);

	                if (inspector.entityID() !== id || inspector.state() !== 'hover') {
	                    inspector
	                        .state('hover')
	                        .entityID(id);

	                    inspectorWrap.call(inspector);
	                }
	            } else if (!current) {
	                featureListWrap.classed('inspector-hidden', false);
	                inspectorWrap.classed('inspector-hidden', true);
	                inspector.state('hide');
	            }
	        }

	        sidebar.hover = _.throttle(hover, 200);

	        sidebar.select = function(id, newFeature) {
	            if (!current && id) {
	                featureListWrap.classed('inspector-hidden', true);
	                inspectorWrap.classed('inspector-hidden', false)
	                    .classed('inspector-hover', false);

	                if (inspector.entityID() !== id || inspector.state() !== 'select') {
	                    inspector
	                        .state('select')
	                        .entityID(id)
	                        .newFeature(newFeature);

	                    inspectorWrap.call(inspector);
	                }
	            } else if (!current) {
	                featureListWrap.classed('inspector-hidden', false);
	                inspectorWrap.classed('inspector-hidden', true);
	                inspector.state('hide');
	            }
	        };

	        sidebar.show = function(component) {
	            featureListWrap.classed('inspector-hidden', true);
	            inspectorWrap.classed('inspector-hidden', true);
	            if (current) current.remove();
	            current = selection.append('div')
	                .attr('class', 'sidebar-component')
	                .call(component);
	        };

	        sidebar.hide = function() {
	            featureListWrap.classed('inspector-hidden', false);
	            inspectorWrap.classed('inspector-hidden', true);
	            if (current) current.remove();
	            current = null;
	        };
	    }

	    sidebar.hover = function() {};
	    sidebar.hover.cancel = function() {};
	    sidebar.select = function() {};
	    sidebar.show = function() {};
	    sidebar.hide = function() {};

	    return sidebar;
	}

	function SourceSwitch(context) {
	    var keys;

	    function click() {
	        d3.event.preventDefault();

	        if (context.history().hasChanges() &&
	            !window.confirm(t('source_switch.lose_changes'))) return;

	        var live = d3.select(this)
	            .classed('live');

	        context.connection()
	            .switch(live ? keys[1] : keys[0]);

	        context.enter(iD.modes.Browse(context));
	        context.flush();

	        d3.select(this)
	            .text(live ? t('source_switch.dev') : t('source_switch.live'))
	            .classed('live', !live);
	    }

	    var sourceSwitch = function(selection) {
	        selection.append('a')
	            .attr('href', '#')
	            .text(t('source_switch.live'))
	            .classed('live', true)
	            .attr('tabindex', -1)
	            .on('click', click);
	    };

	    sourceSwitch.keys = function(_) {
	        if (!arguments.length) return keys;
	        keys = _;
	        return sourceSwitch;
	    };

	    return sourceSwitch;
	}

	function Spinner(context) {
	    var connection = context.connection();

	    return function(selection) {
	        var img = selection.append('img')
	            .attr('src', context.imagePath('loader-black.gif'))
	            .style('opacity', 0);

	        connection.on('loading.spinner', function() {
	            img.transition()
	                .style('opacity', 1);
	        });

	        connection.on('loaded.spinner', function() {
	            img.transition()
	                .style('opacity', 0);
	        });
	    };
	}

	function Splash(context) {
	    return function(selection) {
	        if (context.storage('sawSplash'))
	             return;

	        context.storage('sawSplash', true);

	        var modal = modalModule(selection);

	        modal.select('.modal')
	            .attr('class', 'modal-splash modal col6');

	        var introModal = modal.select('.content')
	            .append('div')
	            .attr('class', 'fillL');

	        introModal.append('div')
	            .attr('class','modal-section cf')
	            .append('h3').text(t('splash.welcome'));

	        introModal.append('div')
	            .attr('class','modal-section')
	            .append('p')
	            .html(t('splash.text', {
	                version: iD.version,
	                website: '<a href="http://ideditor.com/">ideditor.com</a>',
	                github: '<a href="https://github.com/openstreetmap/iD">github.com</a>'
	            }));

	        var buttons = introModal.append('div').attr('class', 'modal-actions cf');

	        buttons.append('button')
	            .attr('class', 'col6 walkthrough')
	            .text(t('splash.walkthrough'))
	            .on('click', function() {
	                d3.select(document.body).call(intro(context));
	                modal.close();
	            });

	        buttons.append('button')
	            .attr('class', 'col6 start')
	            .text(t('splash.start'))
	            .on('click', modal.close);

	        modal.select('button.close').attr('class','hide');

	    };
	}

	function Status(context) {
	    var connection = context.connection(),
	        errCount = 0;

	    return function(selection) {

	        function update() {

	            connection.status(function(err, apiStatus) {

	                selection.html('');

	                if (err && errCount++ < 2) return;

	                if (err) {
	                    selection.text(t('status.error'));

	                } else if (apiStatus === 'readonly') {
	                    selection.text(t('status.readonly'));

	                } else if (apiStatus === 'offline') {
	                    selection.text(t('status.offline'));
	                }

	                selection.attr('class', 'api-status ' + (err ? 'error' : apiStatus));
	                if (!err) errCount = 0;

	            });
	        }

	        connection.on('auth', function() { update(selection); });
	        window.setInterval(update, 90000);
	        update(selection);
	    };
	}

	function Success(context) {
	    var dispatch = d3.dispatch('cancel'),
	        changeset;

	    function success(selection) {
	        var message = (changeset.comment || t('success.edited_osm')).substring(0, 130) +
	            ' ' + context.connection().changesetURL(changeset.id);

	        var header = selection.append('div')
	            .attr('class', 'header fillL');

	        header.append('button')
	            .attr('class', 'fr')
	            .on('click', function() { dispatch.cancel(); })
	            .call(iD.svg.Icon('#icon-close'));

	        header.append('h3')
	            .text(t('success.just_edited'));

	        var body = selection.append('div')
	            .attr('class', 'body save-success fillL');

	        body.append('p')
	            .html(t('success.help_html'));

	        body.append('a')
	            .attr('class', 'details')
	            .attr('target', '_blank')
	            .attr('tabindex', -1)
	            .call(iD.svg.Icon('#icon-out-link', 'inline'))
	            .attr('href', t('success.help_link_url'))
	            .append('span')
	            .text(t('success.help_link_text'));

	        var changesetURL = context.connection().changesetURL(changeset.id);

	        body.append('a')
	            .attr('class', 'button col12 osm')
	            .attr('target', '_blank')
	            .attr('href', changesetURL)
	            .text(t('success.view_on_osm'));

	        var sharing = {
	            facebook: 'https://facebook.com/sharer/sharer.php?u=' + encodeURIComponent(changesetURL),
	            twitter: 'https://twitter.com/intent/tweet?source=webclient&text=' + encodeURIComponent(message),
	            google: 'https://plus.google.com/share?url=' + encodeURIComponent(changesetURL)
	        };

	        body.selectAll('.button.social')
	            .data(d3.entries(sharing))
	            .enter()
	            .append('a')
	            .attr('class', 'button social col4')
	            .attr('target', '_blank')
	            .attr('href', function(d) { return d.value; })
	            .call(bootstrap.tooltip()
	                .title(function(d) { return t('success.' + d.key); })
	                .placement('bottom'))
	            .each(function(d) { d3.select(this).call(iD.svg.Icon('#logo-' + d.key, 'social')); });
	    }

	    success.changeset = function(_) {
	        if (!arguments.length) return changeset;
	        changeset = _;
	        return success;
	    };

	    return d3.rebind(success, dispatch, 'on');
	}

	function UndoRedo(context) {
	    var commands = [{
	        id: 'undo',
	        cmd: cmd('⌘Z'),
	        action: function() { if (!(context.inIntro() || saving())) context.undo(); },
	        annotation: function() { return context.history().undoAnnotation(); }
	    }, {
	        id: 'redo',
	        cmd: cmd('⌘⇧Z'),
	        action: function() {if (!(context.inIntro() || saving())) context.redo(); },
	        annotation: function() { return context.history().redoAnnotation(); }
	    }];

	    function saving() {
	        return context.mode().id === 'save';
	    }

	    return function(selection) {
	        var tooltip = bootstrap.tooltip()
	            .placement('bottom')
	            .html(true)
	            .title(function (d) {
	                return iD.ui.tooltipHtml(d.annotation() ?
	                    t(d.id + '.tooltip', {action: d.annotation()}) :
	                    t(d.id + '.nothing'), d.cmd);
	            });

	        var buttons = selection.selectAll('button')
	            .data(commands)
	            .enter().append('button')
	            .attr('class', 'col6 disabled')
	            .on('click', function(d) { return d.action(); })
	            .call(tooltip);

	        buttons.each(function(d) {
	            d3.select(this)
	                .call(iD.svg.Icon('#icon-' + d.id));
	        });

	        var keybinding = d3.keybinding('undo')
	            .on(commands[0].cmd, function() { d3.event.preventDefault(); commands[0].action(); })
	            .on(commands[1].cmd, function() { d3.event.preventDefault(); commands[1].action(); });

	        d3.select(document)
	            .call(keybinding);

	        context.history()
	            .on('change.undo_redo', update);

	        context
	            .on('enter.undo_redo', update);

	        function update() {
	            buttons
	                .property('disabled', saving())
	                .classed('disabled', function(d) { return !d.annotation(); })
	                .each(function() {
	                    var selection = d3.select(this);
	                    if (selection.property('tooltipVisible')) {
	                        selection.call(tooltip.show);
	                    }
	                });
	        }
	    };
	}

	function Zoom(context) {
	    var zooms = [{
	        id: 'zoom-in',
	        icon: 'plus',
	        title: t('zoom.in'),
	        action: context.zoomIn,
	        key: '+'
	    }, {
	        id: 'zoom-out',
	        icon: 'minus',
	        title: t('zoom.out'),
	        action: context.zoomOut,
	        key: '-'
	    }];

	    function zoomIn() {
	        d3.event.preventDefault();
	        if (!context.inIntro()) context.zoomIn();
	    }

	    function zoomOut() {
	        d3.event.preventDefault();
	        if (!context.inIntro()) context.zoomOut();
	    }

	    function zoomInFurther() {
	        d3.event.preventDefault();
	        if (!context.inIntro()) context.zoomInFurther();
	    }

	    function zoomOutFurther() {
	        d3.event.preventDefault();
	        if (!context.inIntro()) context.zoomOutFurther();
	    }


	    return function(selection) {
	        var button = selection.selectAll('button')
	            .data(zooms)
	            .enter().append('button')
	            .attr('tabindex', -1)
	            .attr('class', function(d) { return d.id; })
	            .on('click.editor', function(d) { d.action(); })
	            .call(bootstrap.tooltip()
	                .placement('left')
	                .html(true)
	                .title(function(d) {
	                    return iD.ui.tooltipHtml(d.title, d.key);
	                }));

	        button.each(function(d) {
	            d3.select(this)
	                .call(iD.svg.Icon('#icon-' + d.icon, 'light'));
	        });

	        var keybinding = d3.keybinding('zoom');

	        _.each(['=','ffequals','plus','ffplus'], function(key) {
	            keybinding.on(key, zoomIn);
	            keybinding.on('⇧' + key, zoomIn);
	            keybinding.on(cmd('⌘' + key), zoomInFurther);
	            keybinding.on(cmd('⌘⇧' + key), zoomInFurther);
	        });
	        _.each(['-','ffminus','_','dash'], function(key) {
	            keybinding.on(key, zoomOut);
	            keybinding.on('⇧' + key, zoomOut);
	            keybinding.on(cmd('⌘' + key), zoomOutFurther);
	            keybinding.on(cmd('⌘⇧' + key), zoomOutFurther);
	        });

	        d3.select(document)
	            .call(keybinding);
	    };
	}

	exports.Account = Account;
	exports.Attribution = Attribution;
	exports.Background = Background;
	exports.cmd = cmd;
	exports.Commit = Commit;
	exports.confirm = confirm;
	exports.Conflicts = Conflicts;
	exports.Contributors = Contributors;
	exports.Disclosure = Disclosure;
	exports.EntityEditor = EntityEditor;
	exports.FeatureInfo = FeatureInfo;
	exports.FeatureList = FeatureList;
	exports.flash = flash;
	exports.FullScreen = FullScreen;
	exports.Geolocate = Geolocate;
	exports.Help = Help;
	exports.Info = Info;
	exports.Inspector = Inspector;
	exports.intro = intro;
	exports.Lasso = Lasso;
	exports.Loading = Loading;
	exports.MapData = MapData;
	exports.MapInMap = MapInMap;
	exports.modal = modalModule;
	exports.Modes = Modes;
	exports.Notice = Notice;
	exports.preset = preset;
	exports.PresetIcon = PresetIcon;
	exports.PresetList = PresetList;
	exports.RadialMenu = RadialMenu;
	exports.RawMemberEditor = RawMemberEditor;
	exports.RawMembershipEditor = RawMembershipEditor;
	exports.RawTagEditor = RawTagEditor;
	exports.Restore = Restore;
	exports.Save = Save;
	exports.Scale = Scale;
	exports.SelectionList = SelectionList;
	exports.Sidebar = Sidebar;
	exports.SourceSwitch = SourceSwitch;
	exports.Spinner = Spinner;
	exports.Splash = Splash;
	exports.Status = Status;
	exports.Success = Success;
	exports.TagReference = TagReference;
	exports.Toggle = Toggle;
	exports.UndoRedo = UndoRedo;
	exports.ViewOnOSM = ViewOnOSM;
	exports.Zoom = Zoom;

	Object.defineProperty(exports, '__esModule', { value: true });

}));