// WayUI classes for iD
// **** TODO:
// multipolygon support - http://mail.dojotoolkit.org/pipermail/dojo-interest/2011-January/052042.html
// support 'interactive'
// line decoration, dots etc.
// fill images
// opacity

// ----------------------------------------------------------------------
// WayUI class
iD.renderer.WayUI = function(entity, map) {
    this.entity = entity;
    this.map = map;
    this.draw();
};

iD.renderer.WayUI.prototype = {

    getClasses: function() {
        var classes = [];
        function clean(x) {
            return x.indexOf(' ') === -1 && x.length < 30;
        }
        for (var k in this.entity.tags) {
            var v = this.entity.tags[k];
            if (!clean(k) || !clean(v)) {
                continue;
            }
            classes.push(k + '-' + v);
            classes.push(k);
            classes.push(v);
        }
        return classes.join(' ');
    },

    draw: function() {
        // summary:		Draw the object and add hitzone sprites.
        var way = this.entity;

        if (!way.nodes.length) { return; }

        // Create tags and calculate styleList
        var tags = this.entity.tags;
        var classes = this.getClasses();

        // This is an area
        if (this.entity.isClosed()) {

            if (!this.stroke) {
                this.stroke = this.map.layers[0].fill.append("path")
                    .data([way.nodes])
                    .attr('class', function() {
                        return 'area ' + classes;
                    });
            }

            this.stroke.attr("d", this.map.linegen);

        } else {

            if (!this.casing) {
                this.casing = this.map.layers[0].casing.append("path")
                    .data([way.nodes])
                    .attr('class', function() {
                        return 'casing ' + classes;
                    });
            }

            this.casing.attr("d", this.map.linegen);

            if (!this.stroke) {
                this.stroke = this.map.layers[0].stroke.append("path")
                    .data([way.nodes])
                    .attr('class', function() {
                        return 'stroke ' + classes;
                    });
            }

            this.stroke.attr("d", this.map.linegen);

        }

        return this;
    },

    entityMouseEvent:function(event) {
        this.inherited(arguments);
    }
};
