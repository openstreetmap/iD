iD.ui.FullScreen = function(context) {
    var element = context.container().node();

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
        return document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement
            || document.msFullscreenElement;
    }

    function is_supported() {
        return !!getFullScreenFn();
    }

    function fullScreen() {
        d3.event.preventDefault();
        if (!isFullScreen()) {
            getFullScreenFn().apply(element);
        } else {
            getExitFullScreenFn().apply(document);
        }
    }

    return function(selection) {
        if (!is_supported())
            return;

        var tooltip = bootstrap.tooltip()
            .placement('left')
            .html(true)
            .title(iD.ui.tooltipHtml(t('full_screen.tooltip')));

        var button = selection.append('button')
            .attr('class', 'save col12')
            .attr('tabindex', -1)
            .on('click', fullScreen)
            .call(tooltip);

        button.append('span')
            .attr('class', 'label')
            .text(t('full_screen.title'));
    };
};
