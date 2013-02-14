iD.ui.Inspector = function() {
    var event = d3.dispatch('changeTags', 'close', 'change'),
        taginfo = iD.taginfo(),
        presetData = iD.presetData(),
        initial = false,
        presetUI,
        context,
        tagList = iD.ui.Taglist();

    function inspector(selection) {
        var entity = selection.datum();

        var iwrap = selection.append('div')
                .attr('class','inspector content hide'),
            head = iwrap.append('div')
                .attr('class', 'head inspector-inner fillL'),
            h2 = head.append('h2');

        h2.append('span')
            .attr('class', 'icon big icon-pre-text big-' + entity.geometry(context.graph()));

        var name = h2.append('input')
            .attr('placeholder', 'name')
            .property('value', function() {
                return entity.tags.name || '';
            })
            .on('keyup', function() {
                var tags = inspector.tags();
                tags.name = this.value;
                inspector.tags(tags);
                event.change();
            });

        event.on('change.name', function() {
            var tags = inspector.tags();
            name.property('value', tags.name);
        });

        var inspectorbody = iwrap.append('div')
            .attr('class', 'inspector-body');

        var inspectorwrap = inspectorbody.append('div')
            .attr('class', 'inspector-inner tag-wrap fillL2');

        presetUI = iD.ui.preset()
            .on('change', function(tags) {
                inspector.tags(_.extend(inspector.tags(), tags));
                event.change();
            });

        event.on('change.preset', function() {
            var tags = inspector.tags();
            presetUI.change(tags);
        });

        var inspectorpresetsearch = inspectorwrap.append('div')
            .attr('class', 'inspector-preset cf')
            .call(iD.ui.presetsearch()
                .entity(entity)
                .presetData(presetData)
                .on('choose', function(preset) {
                    inspectorpreset.call(presetUI
                        .preset(preset)
                        .change(inspector.tags()));
                }));

        var inspectorpresetfavs = inspectorwrap.append('div')
            .attr('class', 'inspector-preset cf')
            .call(iD.ui.presetfavs()
                .presetData(presetData)
                .on('choose', function(preset) {
                    inspectorpreset.call(presetUI
                        .preset(preset)
                        .change(inspector.tags()));
                    inspectorpresetsearch
                        .select('input')
                        .property('value', preset.name);
                }));

        var inspectorpreset = inspectorwrap.append('div')
            .attr('class', 'inspector-preset cf');

        inspectorwrap.append('h4')
            .text(t('inspector.edit_tags'));

        inspectorwrap.call(tagList);

        inspectorbody.append('div')
            .attr('class', 'inspector-buttons pad1 fillD')
            .call(drawButtons);

        var presetMatch = presetData.matchTags(entity);
        if (presetMatch) {
            inspectorpreset.call(presetUI
                    .preset(presetMatch)
                    .change(inspector.tags()));
        }

        iwrap.call(iD.ui.Toggle(true));
    }

    function drawHead(selection) {
        var entity = selection.datum();

        var h2 = selection.append('h2');

        h2.append('span')
            .attr('class', 'icon big icon-pre-text big-' + entity.geometry(context.graph()));

        h2.append('span')
            .text(entity.friendlyName());
    }

    function drawButtons(selection) {
        var entity = selection.datum();

        var inspectorButton = selection.append('button')
            .attr('class', 'apply action')
            .on('click', apply);

        inspectorButton.append('span')
            .attr('class','label')
            .text(t('inspector.okay'));

        var minorButtons = selection.append('div')
            .attr('class','minor-buttons fl');

        minorButtons.append('a')
            .attr('href', 'http://www.openstreetmap.org/browse/' + entity.type + '/' + entity.osmId())
            .attr('target', '_blank')
            .text(t('inspector.view_on_osm'));
    }

    function apply(entity) {
        event.changeTags(entity, inspector.tags());
        event.close(entity);
    }

    inspector.tags = function(tags) {
        if (!arguments.length) {
            return _.extend(presetUI.tags(), tagList.tags());
        } else {
            tagList.tags(tags);
        }
    };

    inspector.initial = function(_) {
        initial = _;
        return inspector;
    };

    inspector.presetData = function(_) {
        presetData = _;
        return inspector;
    };

    inspector.context = function(_) {
        context = _;
        tagList.context(context);
        return inspector;
    };

    return d3.rebind(inspector, event, 'on');
};
