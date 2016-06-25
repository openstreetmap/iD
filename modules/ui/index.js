import { ui } from './ui';
import { presetObj } from './preset/index';
import {
    Account,
    Attribution,
    Background,
    cmd,
    Commit,
    confirm,
    Conflicts,
    Contributors,
    Disclosure,
    EntityEditor,
    FeatureInfo,
    FeatureList,
    flash,
    FullScreen,
    Geolocate,
    Help,
    Info,
    Inspector,
    intro,
    Lasso,
    Loading,
    MapData,
    MapInMap,
    modal,
    Modes,
    Notice,
    preset,
    PresetIcon,
    PresetList,
    RadialMenu,
    RawMemberEditor,
    RawMembershipEditor,
    RawTagEditor,
    Restore,
    Save,
    Scale,
    SelectionList,
    Sidebar,
    SourceSwitch,
    Spinner,
    Splash,
    Status,
    Success,
    TagReference,
    Toggle,
    tooltipHtml,
    UndoRedo,
    ViewOnOSM,
    Zoom
} from './core/index';
export {ui};

ui.preset = preset;
Object.keys(presetObj).map(function(p) {
    ui.preset[p] = presetObj[p];
});

// Need to do for test cases
ui.intro = intro;
ui.Account = Account;
ui.Attribution = Attribution;
ui.Background = Background;
ui.cmd = cmd;
ui.Commit = Commit;
ui.confirm = confirm;
ui.Conflicts = Conflicts;
ui.Contributors = Contributors;
ui.Disclosure = Disclosure;
ui.EntityEditor = EntityEditor;
ui.FeatureInfo = FeatureInfo;
ui.FeatureList = FeatureList;
ui.flash = flash;
ui.FullScreen = FullScreen;
ui.Geolocate = Geolocate;
ui.Help = Help;
ui.Info = Info;
ui.Inspector = Inspector;
ui.intro = intro;
ui.Lasso = Lasso;
ui.Loading = Loading;
ui.MapData = MapData;
ui.MapInMap = MapInMap;
ui.modal = modal;
ui.Modes = Modes;
ui.Notice = Notice;
ui.preset = preset;
ui.PresetIcon = PresetIcon;
ui.PresetList = PresetList;
ui.RadialMenu = RadialMenu;
ui.RawMemberEditor = RawMemberEditor;
ui.RawMembershipEditor = RawMembershipEditor;
ui.RawTagEditor = RawTagEditor;
ui.Restore = Restore;
ui.Save = Save;
ui.Scale = Scale;
ui.SelectionList = SelectionList;
ui.Sidebar = Sidebar;
ui.SourceSwitch = SourceSwitch;
ui.Spinner = Spinner;
ui.Splash = Splash;
ui.Status = Status;
ui.Success = Success;
ui.TagReference = TagReference;
ui.Toggle = Toggle;
ui.tooltipHtml = tooltipHtml;
ui.UndoRedo = UndoRedo;
ui.ViewOnOSM = ViewOnOSM;
ui.Zoom = Zoom;
