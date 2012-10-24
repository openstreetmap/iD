iD.renderer.NodeUI = function(node, map) {
    this.node = node;
    this.map = map;
    this.draw();
};
iD.renderer.NodeUI.prototype = {
    getEnhancedTags: function() {
        var tags = this.node.tags;
        if (!this.node.entity.hasParentWays()) { tags[':poi']='yes'; }
        // add junction and dupe
        return tags;
    },
    draw: function() {
        // summary:		Draw the object (mostly icons) and add hitzone sprites.
        // Tags, position and styleList
        var tags = this.getEnhancedTags();

        function getIcon(tags) {
            if (tags.amenity) {
                return 'icons/' + tags.amenity + '.png';
            }
            if (tags.shop) {
                return 'icons/' + tags.shop + '.png';
            }
            if (tags.highway === 'bus_stop') {
                return 'icons/bus_stop.png';
            }
        }

        var icon = getIcon(tags);
        if (!icon) return;

        if (!this.marker) {
            this.marker = this.map.layers[0].hit.append("image")
                .attr('class', 'poi')
                .attr('width', 16)
                .attr('height', 16)
                .attr("xlink:href", icon);
        }
        this.marker.attr('transform',
            'translate(' + this.map.projection(this.node) + ')');
    }
};
