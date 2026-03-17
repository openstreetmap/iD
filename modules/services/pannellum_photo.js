import { select as d3_select } from "d3-selection";
import { dispatch as d3_dispatch } from "d3-dispatch";
import { utilRebind } from "../util";

const pannellumViewerCSS = "pannellum/pannellum.css";
const pannellumViewerJS = "pannellum/pannellum.js";
const PANNELLUM_MIN_HFOV = 10;
const PANNELLUM_MAX_HFOV = 90;
const PANNELLUM_WHEEL_LINE_PIXELS = 18.001;
const PANNELLUM_WHEEL_PAGE_PIXELS = 180;

export async function pannellumPhotoFrame(context, selection) {
  const dispatch = d3_dispatch("viewerChanged");

  const module = {};
  module.event = utilRebind(module, dispatch, "on");
  module.loadPannellum = function (context) {
    const head = d3_select("head");

    return Promise.all([
      new Promise((resolve, reject) => {
        // load pannellum viewer css
        head
          .selectAll("#ideditor-pannellum-viewercss")
          .data([0])
          .enter()
          .append("link")
          .attr("id", "ideditor-pannellum-viewercss")
          .attr("rel", "stylesheet")
          .attr("crossorigin", "anonymous")
          .attr("href", context.asset(pannellumViewerCSS))
          .on("load.pannellum", resolve)
          .on("error.pannellum", reject);
      }),
      new Promise((resolve, reject) => {
        // load pannellum viewer js
        head
          .selectAll("#ideditor-pannellum-viewerjs")
          .data([0])
          .enter()
          .append("script")
          .attr("id", "ideditor-pannellum-viewerjs")
          .attr("crossorigin", "anonymous")
          .attr("src", context.asset(pannellumViewerJS))
          .on("load.pannellum", resolve)
          .on("error.pannellum", reject);
      }),
    ]);
  };

  let _currScenes = [];
  let _pannellumViewer;
  let _activeSceneKey;

  selection
    .append("div")
    .attr("class", "photo-frame pannellum-frame")
    .attr("id", "ideditor-pannellum-viewer")
    .classed("hide", true)
    .on("mousedown", function (e) {
      e.stopPropagation();
    });

  if (!window.pannellum) {
    await module.loadPannellum(context);
  }

  const options = {
    default: { firstScene: "" },
    scenes: {},
    minHfov: PANNELLUM_MIN_HFOV,
    maxHfov: PANNELLUM_MAX_HFOV,
    disableKeyboardCtrl: true,
    mouseZoom: false,
    sceneFadeDuration: 0,
  };

  _pannellumViewer = window.pannellum.viewer(
    "ideditor-pannellum-viewer",
    options,
  );

  const viewerEl = d3_select("#ideditor-pannellum-viewer");
  viewerEl.on("wheel.pannellum", function (d3_event) {
    if (!_pannellumViewer || !_pannellumViewer.getHfov) return;

    d3_event.preventDefault();
    d3_event.stopPropagation();

    let deltaY = d3_event.deltaY;
    if (d3_event.deltaMode === 1) {
      deltaY *= PANNELLUM_WHEEL_LINE_PIXELS;
    } else if (d3_event.deltaMode === 2) {
      deltaY *= PANNELLUM_WHEEL_PAGE_PIXELS;
    }

    const currentHfov = _pannellumViewer.getHfov();
    const nextHfov = Math.max(
      PANNELLUM_MIN_HFOV,
      Math.min(PANNELLUM_MAX_HFOV, currentHfov * Math.pow(2, deltaY / 500)),
    );

    if (Math.abs(nextHfov - currentHfov) > 0.00001) {
      if (typeof _pannellumViewer.setHfov === "function") {
        _pannellumViewer.setHfov(nextHfov);
      }
      dispatch.call("viewerChanged");
    }
  });

  _pannellumViewer
    .on("mousedown", () =>
      d3_select(window).on("pointermove.pannellum mousemove.pannellum", () =>
        dispatch.call("viewerChanged"),
      ),
    )
    .on("mouseup", () =>
      d3_select(window).on("pointermove.pannellum mousemove.pannellum", null),
    )
    .on("animatefinished", () => dispatch.call("viewerChanged"));

  context.ui().photoviewer.on("resize.pannellum", () => {
    _pannellumViewer.resize();
  });

  /**
   * Shows the photo frame if hidden
   * @param {*} context the HTML wrap of the frame
   */
  module.showPhotoFrame = function (context) {
    const isHidden = context
      .selectAll(".photo-frame.pannellum-frame.hide")
      .size();

    if (isHidden) {
      context
        .selectAll(".photo-frame:not(.pannellum-frame)")
        .classed("hide", true);

      context.selectAll(".photo-frame.pannellum-frame").classed("hide", false);
    }

    return module;
  };

  /**
   * Hides the photo frame if shown
   * @param {*} context the HTML wrap of the frame
   */
  module.hidePhotoFrame = function (viewerContext) {
    viewerContext.select("photo-frame.pannellum-frame").classed("hide", false);

    return module;
  };

  /**
   * Renders an image inside the frame
   * @param {*} data the image data, it should contain an image_path attribute, a link to the actual image.
   * @param {boolean} keepOrientation if true, HFOV, pitch and yaw will be kept between images
   */
  module.selectPhoto = function (data, keepOrientation) {
    const key = data.image_path;
    _activeSceneKey = key;
    if (!_currScenes.includes(key)) {
      let newSceneOptions = {
        showFullscreenCtrl: false,
        autoLoad: false,
        compass: false,
        yaw: 0,
        type: "equirectangular",
        preview: data.preview_path,
        panorama: data.image_path,
        northOffset: data.ca,
      };

      _currScenes.push(key);
      _pannellumViewer.addScene(key, newSceneOptions);
    }

    let yaw = 0;
    let pitch = 0;
    let hfov = 0;

    if (keepOrientation) {
      yaw = module.getYaw();
      pitch = module.getPitch();
      hfov = module.getHfov();
    }
    if (_pannellumViewer.isLoaded() !== false) {
      _pannellumViewer.loadScene(key, pitch, yaw, hfov);
      dispatch.call("viewerChanged");
    } else {
      // pannellum is currently loading another scene: wait for it to finish
      // loading the previous panorama first
      const retry = setInterval(() => {
        if (_pannellumViewer.isLoaded() === false) {
          // still not done: wait a bit longer
          return;
        }
        if (_activeSceneKey === key) {
          // only load scene if no other photo has been selected in the meantime
          _pannellumViewer.loadScene(key, pitch, yaw, hfov);
          dispatch.call("viewerChanged");
        }
        clearInterval(retry);
      }, 100);
    }

    if (_currScenes.length > 3) {
      const old_key = _currScenes.shift();
      _pannellumViewer.removeScene(old_key);
    }

    _pannellumViewer.resize();

    return module;
  };

  module.getYaw = function () {
    return _pannellumViewer.getYaw();
  };

  module.getPitch = function () {
    return _pannellumViewer.getPitch();
  };

  module.getHfov = function () {
    return _pannellumViewer.getHfov();
  };

  return module;
}
