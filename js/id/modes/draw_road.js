iD.modes.DrawRoad = function(way_id, direction) {
    return {
        enter: function() {
            this.map.dblclickEnable(false);
            this.map.dragEnable(false);

            var index = (direction === 'forward') ? undefined : -1,
                surface = this.map.surface,
                node = iD.Node({loc: this.map.mouseCoordinates()}),
                way = this.history.graph().entity(way_id),
                firstNode = way.nodes[0],
                lastNode = _.last(way.nodes);

            this.history.perform(iD.actions.addWayNode(way, node, index));

            function mousemove() {
                this.history.replace(iD.actions.addWayNode(way, node.update({loc: this.map.mouseCoordinates()}), index));
            }

            function click() {
                d3.event.stopPropagation();

                var datum = d3.select(d3.event.target).datum() || {};

                if (datum.type === 'node') {
                    if (datum.id == firstNode || datum.id == lastNode) {
                        // If this is drawing a loop and this is not the drawing
                        // end of the stick, finish the circle
                        if (direction === 'forward' && datum.id == firstNode) {
                            this.history.replace(iD.actions.addWayNode(way,
                                this.history.graph().entity(firstNode), index));
                        } else if (direction === 'backward' && datum.id == lastNode) {
                            this.history.replace(iD.actions.addWayNode(way,
                                this.history.graph().entity(lastNode), index));
                        }

                        delete way.tags.elastic;
                        this.history.perform(iD.actions.changeTags(way, way.tags));

                        // End by clicking on own tail
                        return this.controller.enter(iD.modes.Select(way));
                    } else {
                        // connect a way to an existing way
                        this.history.replace(iD.actions.addWayNode(way, datum, index));
                    }
                } else if (datum.type === 'way') {
                    node = node.update({loc: this.map.mouseCoordinates()});
                    this.history.replace(iD.actions.addWayNode(way, node, index));

                    var connectedWay = this.history.graph().entity(datum.id);
                    var connectedIndex = iD.modes.chooseIndex(datum, d3.mouse(surface.node()), this.map);
                    this.history.perform(iD.actions.addWayNode(connectedWay, node, connectedIndex));
                } else {
                    node = node.update({loc: this.map.mouseCoordinates()});
                    this.history.replace(iD.actions.addWayNode(way, node, index));
                }

                this.controller.enter(iD.modes.DrawRoad(way_id, direction));
            }

            surface.on('mousemove.drawroad', mousemove.bind(this))
                .on('click.drawroad', click.bind(this));

            this.map.keybinding().on('⎋.exit', function() {
                this.controller.exit();
            }.bind(this));
        },

        exit: function() {
            this.map.surface.on('mousemove.drawroad', null)
                .on('click.drawroad', null);
            this.map.keybinding().on('⎋.exit', null);
            window.setTimeout(function() {
                this.map.dblclickEnable(true);
                this.map.dragEnable(true);
            }.bind(this), 1000);
        }
    };
};
