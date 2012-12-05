iD.modes.DrawArea = function(way_id) {
    return {
        enter: function() {
            this.map.dblclickEnable(false);

            var surface = this.map.surface,
                way = this.history.graph().entity(way_id),
                firstnode_id = _.first(way.nodes),
                node = iD.Node({loc: this.map.mouseCoordinates()});

            this.history.perform(iD.actions.addWayNode(way, node));

            function mousemove() {
                this.history.replace(iD.actions.addWayNode(way, node.update({loc: this.map.mouseCoordinates()})));
            }

            function click() {
                d3.event.stopPropagation();

                var datum = d3.select(d3.event.target).datum();

                if (datum.type === 'node') {
                    if (datum.id == firstnode_id) {
                        this.history.replace(iD.actions.addWayNode(way,
                            this.history.graph().entity(way.nodes[0])));

                        delete way.tags.elastic;
                        this.history.perform(iD.actions.changeTags(way, way.tags));

                        // End by clicking on own tail
                        return this.controller.enter(iD.modes.Select(way));
                    } else {
                        // connect a way to an existing way
                        this.history.replace(iD.actions.addWayNode(way, datum));
                    }
                } else {
                    node = node.update({loc: this.map.mouseCoordinates()});
                    this.history.replace(iD.actions.addWayNode(way, node));
                }

                this.controller.enter(iD.modes.DrawArea(way_id));
            }

            this.map.keybinding().on('⎋.exit', function() {
                this.controller.exit();
            }.bind(this));

            surface.on('click.drawarea', click.bind(this))
                .on('mousemove.drawarea', mousemove.bind(this));
        },

        exit: function() {
            this.map.surface.on('mousemove.drawarea', null)
                .on('click.drawarea', null);
            this.map.keybinding().on('⎋.exit', null);
            window.setTimeout(function() {
                this.map.dblclickEnable(true);
            }.bind(this), 1000);
        }
    };
};
