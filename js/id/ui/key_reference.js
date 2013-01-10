iD.keyReference = function(selection) {
    selection.each(function() {

        var selection = d3.select(this),
            data = selection.datum(),
            header = selection.append('div')
                .attr('class','modal-section')
                .append('h2'),
            body = selection.append('div')
                .attr('class', 'modal-section');

        header.append('span').attr('class', 'icon big icon-pre-text big-' + data.geometry);
        header.append('span').text(data.title);
        body.append('h3').text('Common Values');

        var table = body.append('table')
            .attr('class', 'tags'),
            thead = table.append('thead');

        thead.append('th').text('Value');
        thead.append('th').text('Description');
        thead.append('th').text('Count');

        var rows = table.selectAll('tr')
            .data(data.data)
            .enter()
            .append('tr');

        var cols = rows.selectAll('td')
            .data(function(d, i) {
                return [d.value, d.description || "", d.count];
            })
            .enter()
            .append('td')
            .text(String);
    });
};
