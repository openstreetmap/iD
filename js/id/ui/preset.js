iD.ui.preset = function() {
    var preset;

    // generate form fields for a given field.
    function input(d) {
        switch (d.type) {

            case 'tel':
                this.append('input')
                    .attr('type', 'tel')
                    .attr('placeholder', '1-555-555-5555');
                break;

            case 'email':
                this.append('input')
                    .attr('type', 'email')
                    .attr('placeholder', 'email@domain.com');
                break;

            case 'url':
                this.append('input')
                    .attr('type', 'url')
                    .attr('placeholder', 'http://example.com/');
                break;

            case 'select':
                var select = this.append('select');
                var options = d.option.slice();
                options.unshift('');
                select.selectAll('option')
                    .data(options)
                    .enter()
                    .append('option')
                    .text(String);
                break;
        }
    }

    function presets(selection) {
        var sections = selection.selectAll('div.preset-section')
            .data(preset.main)
            .enter()
            .append('div')
            .attr('class', 'preset-section');

        sections.each(function(d) {
            var s = d3.select(this);

            s.append('h4')
                .text(d.title || d.tag);

            input.call(s, d);
        });
    }

    presets.preset = function(_) {
        if (!arguments.length) return preset;
        preset = _;
        return presets;
    };

    return presets;
};
