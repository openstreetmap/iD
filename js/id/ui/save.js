iD.ui.Save = function(context) {
    var history = context.history(),
        key = iD.ui.cmd('⌘S'),
        prevNumchange = 0 ,
        color = 255 ,
        saveBtnBackground = '';
       
       

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
        var step = parseInt(255 / 50);
        var background = '';
        if(numChanges < 50) {
            prevNumchange = numChanges;
            return 'rgba(255,255,255)';
           }
        else if(numChanges === 50) {
            prevNumchange = numChanges;
            return 'rgb(255 , 255 , 136)';

        }
        else if(numChanges > 50 && numChanges < 100) {
            if(prevNumchange < numChanges) {
                color = color - step;
                background = 'rgb(255, ' + color + ' , 0)';
                }
            else if(prevNumchange > numChanges) {
                color = color +  step;
                background = 'rgb(255 , '+ color + ' , 0)';
                }
            prevNumchange = numChanges;  
            return background;
         }
         else {
            prevNumchange = numChanges;
            return 'rgb(255 , 0 , 0 )';
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
            saveBtnBackground =  getBackground(numChanges);
            button
                .classed('disabled', numChanges === 0)
                .classed('has-count', numChanges > 0)
                .style('background' , saveBtnBackground);
            button.select('span.count')
                .text(numChanges)
                .style('background' , saveBtnBackground)
                .style('opacity' ,  '0.5' );
               
        });

        context.on('enter.save', function() {
            button.property('disabled', saving());
            if (saving()) button.call(tooltip.hide);
        });
    };
};
