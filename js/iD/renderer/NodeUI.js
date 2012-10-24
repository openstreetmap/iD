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
        var x = Math.floor(this.map.lon2coord(this.node.lon));
        var y = Math.floor(this.map.latp2coord(this.node.latp));
        var tags = this.getEnhancedTags();

        var im = this.map.layers[0].hit.append("image")
            .attr('class', 'poi')
            .attr('x', x)
            .attr('y', y)
            .attr('width', 16)
            .attr('height', 16)
            .attr("xlink:href", function() {
                return tags.amenity ? 'icons/' + tags.amenity + '.png' : '';
            });
    }
};
