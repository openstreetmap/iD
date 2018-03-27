import {d3keybinding as d3_keybinding} from '../lib/d3.keybinding';
import {utilDetect} from '../util/detect';
import {uiCmd} from '../ui/cmd';
import {
    select as d3_select
} from 'd3-selection';
import {uiSave} from '../ui/save';
import {svgIcon} from '../svg';
import {t} from '../util/locale';
import {sendPost} from './utils';
import {url} from './url';

function addHideSideBarKEY() {
    var keybinding = d3_keybinding('hide-sideBar');
    var detected = utilDetect();
    var keys = detected.os === 'mac' ? uiCmd('⌘B') : uiCmd('⌘B');
    var setHide = function () {
        var select = window.id.container().select('#sidebar');
        select.classed('hide', !select.classed('hide'));
    };
    // setTimeout(setHide,100);
    keybinding.on(keys, setHide);

    d3_select(document)
        .call(keybinding);
}
function uploadOSM() {
    if (window.momentaPool && window.momentaPool.currentPackage){
        sendPost(url.upload_package,{'packageIds':window.momentaPool.currentPackage},function (result) {
            if (result==='success'){
                alert('审核通过:'+window.momentaPool.currentPackage);
            } else {
                alert('上传错误:'+window.momentaPool.currentPackage);
            }
        });
    }
}


function createPassButton() {
    var select = window.id.container().select('#bar');
    var button = select
        .append('div')
        .attr('style','right: 10px;   width: 100px;  position: fixed;   z-index: 100;')
        .attr('class', 'button-wrap col1')
        .append('button')
        .attr('class', 'save col12 disabled')
        .attr('id','checkButton')
        .attr('tabindex', -1)
        .on('click',uploadOSM);

    button
        .call(svgIcon('#icon-save', 'pre-text'))
        .append('span')
        .attr('class', 'label')
        .text('审核通过');
    function changeButtonState() {
        var select = window.id.container().select('#checkButton');
        if (window.momentaPool && window.momentaPool.currentPackage){
            select.classed('disabled',false);
        } else {
            select.classed('disabled',true);
        }
    }
    window.momentaPool.changeButtonState =changeButtonState;
}
setTimeout(createPassButton,1000)
// window.createPassButton = createPassButton;
addHideSideBarKEY();
export {addHideSideBarKEY};

