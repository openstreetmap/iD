export function getOriginalWidth(resizeDiv) {
    return parseFloat(getComputedStyle(resizeDiv, null).getPropertyValue('width').replace('px', ''));
}

export function isResizingAllowed(originalWidth, clientX) {
    return (clientX > window.innerWidth - originalWidth  && clientX < window.innerWidth - originalWidth+10);
}
 
export function startResizing(resizeDiv, e) {
    let originalWidth = getOriginalWidth(resizeDiv);
    if (isResizingAllowed(originalWidth, e.clientX)) {
        isResizing = true;

        if(e.stopPropagation) e.stopPropagation();
            if(e.preventDefault) e.preventDefault();
            e.cancelBubble=true;
            e.returnValue=false;

        document.addEventListener('mousemove', (evnt) => {
            if (!isResizing || isResizingAllowed(originalWidth, evnt.clientX)) return;
            const newWidth = evnt.clientX;
            if (window.innerWidth - newWidth <= 264) return;
            resizeDiv.style.width = (window.innerWidth - newWidth) + 'px';
        });

        resizeDiv.addEventListener('mouseup', () => {
            isResizing = false;
        });
    }
}

export function handleMouseMove(resizeDiv, e) {
    const originalWidth = getOriginalWidth(resizeDiv);
    if (e.clientX > window.innerWidth - originalWidth && e.clientX < window.innerWidth - originalWidth + 6) {
        resizeDiv.style.cursor = 'ew-resize';
    } else {
        resizeDiv.style.cursor = 'auto';
    }
}

export function initializeResizePane(resizeDiv) {

    let isResizing = false;

    resizeDiv.addEventListener('mousedown', (e) => {
        startResizing(resizeDiv, e);
    });

    document.addEventListener('mousemove', (e) => {
        handleMouseMove(resizeDiv, e);
    });
}



