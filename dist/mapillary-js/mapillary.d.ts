import { Observable, Subject, Subscription, BehaviorSubject, Scheduler } from 'rxjs';
import * as THREE from 'three';
import * as vd from 'virtual-dom';

/**
 * Convert coordinates from geodetic (WGS84) reference to local topocentric
 * (ENU) reference.
 *
 * @param {number} lng Longitude in degrees.
 * @param {number} lat Latitude in degrees.
 * @param {number} alt Altitude in meters.
 * @param {number} refLng Reference longitude in degrees.
 * @param {number} refLat Reference latitude in degrees.
 * @param {number} refAlt Reference altitude in meters.
 * @returns {Array<number>} The x, y, z local topocentric ENU coordinates.
 */
declare function geodeticToEnu(lng: number, lat: number, alt: number, refLng: number, refLat: number, refAlt: number): number[];
/**
 * Convert coordinates from local topocentric (ENU) reference to
 * geodetic (WGS84) reference.
 *
 * @param {number} x Topocentric ENU coordinate in East direction.
 * @param {number} y Topocentric ENU coordinate in North direction.
 * @param {number} z Topocentric ENU coordinate in Up direction.
 * @param {number} refLng Reference longitude in degrees.
 * @param {number} refLat Reference latitude in degrees.
 * @param {number} refAlt Reference altitude in meters.
 * @returns {Array<number>} The longitude, latitude in degrees
 * and altitude in meters.
 */
declare function enuToGeodetic(x: number, y: number, z: number, refLng: number, refLat: number, refAlt: number): number[];
/**
 * Convert coordinates from Earth-Centered, Earth-Fixed (ECEF) reference
 * to local topocentric (ENU) reference.
 *
 * @param {number} X ECEF X-value.
 * @param {number} Y ECEF Y-value.
 * @param {number} Z ECEF Z-value.
 * @param {number} refLng Reference longitude in degrees.
 * @param {number} refLat Reference latitude in degrees.
 * @param {number} refAlt Reference altitude in meters.
 * @returns {Array<number>} The x, y, z topocentric ENU coordinates in East, North
 * and Up directions respectively.
 */
declare function ecefToEnu(X: number, Y: number, Z: number, refLng: number, refLat: number, refAlt: number): number[];
/**
 * Convert coordinates from local topocentric (ENU) reference
 * to Earth-Centered, Earth-Fixed (ECEF) reference.
 *
 * @param {number} x Topocentric ENU coordinate in East direction.
 * @param {number} y Topocentric ENU coordinate in North direction.
 * @param {number} z Topocentric ENU coordinate in Up direction.
 * @param {number} refLng Reference longitude in degrees.
 * @param {number} refLat Reference latitude in degrees.
 * @param {number} refAlt Reference altitude in meters.
 * @returns {Array<number>} The X, Y, Z ECEF coordinates.
 */
declare function enuToEcef(x: number, y: number, z: number, refLng: number, refLat: number, refAlt: number): number[];
/**
 * Convert coordinates from geodetic reference (WGS84) to Earth-Centered,
 * Earth-Fixed (ECEF) reference.
 *
 * @param {number} lng Longitude in degrees.
 * @param {number} lat Latitude in degrees.
 * @param {number} alt Altitude in meters.
 * @returns {Array<number>} The X, Y, Z ECEF coordinates.
 */
declare function geodeticToEcef(lng: number, lat: number, alt: number): number[];
/**
 * Convert coordinates from Earth-Centered, Earth-Fixed (ECEF) reference
 * to geodetic reference (WGS84).
 *
 * @param {number} X ECEF X-value.
 * @param {number} Y ECEF Y-value.
 * @param {number} Z ECEF Z-value.
 * @returns {Array<number>} The longitude, latitude in degrees
 * and altitude in meters.
 */
declare function ecefToGeodetic(X: number, Y: number, Z: number): number[];

/**
 * Contract describing triangulated meshes.
 */
interface MeshContract {
    /**
     * Flattened array of faces for the mesh. Each face consist
     * three vertex indices.
     */
    faces: number[];
    /**
     * Flattened array of vertices for the mesh. Each vertex
     * consists of X, Y and Z coordinates in the camera
     * reference frame.
     */
    vertices: number[];
}

/**
 * Decompress and parse an array buffer containing zipped
 * json data and return as a json object.
 *
 * @description Handles array buffers continaing zipped json
 * data.
 *
 * @param {ArrayBuffer} buffer - Array buffer to decompress.
 * @returns {Object} Parsed object.
 */
declare function decompress<T>(buffer: ArrayBuffer): T;
/**
 * Retrieves a resource as an array buffer and returns a promise
 * to the buffer.
 *
 * @description Rejects the promise on request failure.
 *
 * @param {string} url - URL for resource to retrieve.
 * @param {Promise} [abort] - Optional promise for aborting
 * the request through rejection.
 * @returns {Promise<ArrayBuffer>} Promise to the array buffer
 * resource.
 */
declare function fetchArrayBuffer(url: string, abort?: Promise<void>): Promise<ArrayBuffer>;
/**
 * Read the fields of a protobuf array buffer into a mesh
 * object.
 *
 * @param {ArrayBuffer} buffer - Protobuf array buffer
 * to read from.
 * @returns {MeshContract} Mesh object.
 */
declare function readMeshPbf(buffer: ArrayBuffer): MeshContract;

/**
 * Interface describing event emitter members.
 */
interface IEventEmitter {
    /**
     * @ignore
     */
    fire<T>(type: string, event: T): void;
    /**
     * Unsubscribe from an event by its name.
     * @param {string} type - The name of the event
     * to unsubscribe from.
     * @param {(event: T) => void} handler - The
     * handler to remove.
     */
    off<T>(type: string, handler: (event: T) => void): void;
    /**
     * Subscribe to an event by its name.
     * @param {string} type - The name of the event
     * to subscribe to.
     * @param {(event: T) => void} handler - The
     * handler called when the event occurs.
     */
    on<T>(type: string, handler: (event: T) => void): void;
}

declare class EventEmitter implements IEventEmitter {
    private _events;
    constructor();
    /**
     * @ignore
     */
    fire<T>(type: string, event: T): void;
    /**
     * Unsubscribe from an event by its name.
     * @param {string} type - The name of the event
     * to unsubscribe from.
     * @param {(event: T) => void} handler - The
     * handler to remove.
     */
    off<T>(type: string, handler: (event: T) => void): void;
    /**
     * Subscribe to an event by its name.
     * @param {string} type - The name of the event
     * to subscribe to.
     * @param {(event: T) => void} handler - The
     * handler called when the event occurs.
     */
    on<T>(type: string, handler: (event: T) => void): void;
    private _listens;
}

/**
 * Interface that represents a longitude, latitude coordinate,
 * measured in degrees. Coordinates are defined in the WGS84 datum.
 */
interface LngLat {
    /**
     * Latitude, measured in degrees.
     */
    lat: number;
    /**
     * Longitude, measured in degrees.
     */
    lng: number;
}

/**
 * Interface that represents longitude-latitude-altitude
 * coordinates. Longitude and latitude are measured in degrees
 * and altitude in meters. Coordinates are defined in the WGS84 datum.
 *
 * @interface
 */
interface LngLatAlt extends LngLat {
    /**
     * Altitude, measured in meters.
     */
    alt: number;
}

/**
 * Contract describing a reconstruction point.
 */
interface PointContract {
    /**
     * RGB color vector of the point, normalized to floats
     * on the interval [0, 1];
     */
    color: number[];
    /**
     * Coordinates in metric scale in topocentric ENU
     * reference frame with respect to a geo reference.
     */
    coordinates: number[];
}

/**
 * Contract describing cluster reconstruction data.
 */
interface ClusterContract {
    /**
     * The unique id of the cluster.
     */
    id: string;
    /**
     * The points of the reconstruction.
     */
    points: {
        [pointId: string]: PointContract;
    };
    /**
     * The reference longitude, latitude, altitude of
     * the reconstruction. Determines the
     * position of the reconstruction in world reference
     * frame.
     */
    reference: LngLatAlt;
}

/**
 * Ent representing an entity with a unique ID.
 *
 * @interface IDEnt
 */
interface IDEnt {
    /**
     * Unique ID.
     */
    id: string;
}

/**
 * Ent representing core image properties.
 */
interface CoreImageEnt extends IDEnt {
    /**
     * SfM computed longitude, latitude in WGS84 datum, measured in degrees.
     *
     * @description Optional - no 3D interaction available
     * if unset.
     */
    computed_geometry?: LngLat;
    /**
     * Original EXIF longitude, latitude in WGS84 datum, measured in degrees.
     */
    geometry: LngLat;
    /**
     * Sequence that the image is part of.
     */
    sequence: IDEnt;
}

/**
 * Contract describing core image results.
 */
interface CoreImagesContract {
    /**
     * Geometry cell ID.
     */
    cell_id: string;
    /**
     * Array of core image ents.
     */
    images: CoreImageEnt[];
}

/**
 * Ent representing camera properties.
 */
interface CameraEnt {
    /**
     * Camera type dependent camera parameters.
     *
     * For perspective and fisheye camera types,
     * the camera parameters array should be
     * constructed according to
     *
     * `[focal, k1, k2]`
     *
     * where focal is the camera focal length,
     * and k1, k2 are radial distortion parameters.
     *
     * For spherical camera type the camera
     * parameters should be an emtpy array.
     */
    camera_parameters: number[];
    /**
     * Projection type of the camera.
     *
     * @description Supported camera types are:
     *
     * ```js
     *   'spherical'
     *   'fisheye'
     *   'perspective'
     * ```
     *
     * Other camera types will be treated as
     * perspective images.
     */
    camera_type: string;
}

/**
 * Ent representing URL properties.
 */
interface URLEnt extends IDEnt {
    /**
     * URL for fetching ent data.
     */
    url: string;
}

/**
 * Ent representing image creator properties.
 */
interface CreatorEnt extends IDEnt {
    /**
     * The username of the creator.
     */
    username: string;
}

/**
 * Ent representing spatial image properties.
 */
interface SpatialImageEnt extends CameraEnt, IDEnt {
    /**
     * Original EXIF altitude above sea level, in meters.
     */
    altitude: number;
    /**
     * Scale of atomic reconstruction.
     *
     * @description Optional - no 3D interaction available
     * if unset.
     */
    atomic_scale?: number;
    /**
     * Timestamp representing the capture date and time.
     *
     * @description Unix epoch timestamp in milliseconds.
     */
    captured_at: number;
    /**
     * Original EXIF compass angle, measured in degrees.
     */
    compass_angle: number;
    /**
     * Computed altitude, in meters.
     *
     * @description Optional - no 3D interaction available
     * if unset.
     */
    computed_altitude?: number;
    /**
     * SfM computed compass angle, measured in degrees.
     *
     * @description Optional - no 3D interaction available
     * if unset.
     */
    computed_compass_angle?: number;
    /**
     * Rotation vector in angle axis representation.
     *
     * @description Optional - no 3D interaction available
     * if unset.
     */
    computed_rotation?: number[];
    /**
     * Cluster reconstruction to which the image belongs.
     */
    cluster: URLEnt;
    /**
     * Image creator.
     */
    creator: CreatorEnt;
    /**
     * EXIF orientation of original image.
     */
    exif_orientation: number;
    /**
     * Height of original image, not adjusted for orientation.
     */
    height: number;
    /**
     * SfM connected component id to which the image belongs.
     *
     * @description Optional - no 3D interaction available
     * if unset.
     */
    merge_id?: string;
    /**
     * 3D mesh resource.
     */
    mesh: URLEnt;
    /**
     * Owner to which the image belongs.
     */
    owner: IDEnt;
    /**
     * Value specifying if image is accessible to organization members only
     * or to everyone.
     */
    private?: boolean;
    /**
     * Image quality score on the interval [0, 1].
     */
    quality_score?: number;
    /**
     * Image thumbnail resource.
     */
    thumb: URLEnt;
    /**
     * Width of original image, not adjusted for orientation.
     */
    width: number;
}

/**
 * Contract describing ent results.
 */
interface EntContract<T> {
    /**
     * Ent node.
     */
    node: T;
    /**
     * Ent node id.
     */
    node_id: string;
}

/**
 * Contract describing spatial image results.
 */
declare type SpatialImagesContract = EntContract<SpatialImageEnt>[];

/**
 * Ent representing image properties.
 */
interface ImageEnt extends CoreImageEnt, SpatialImageEnt {
}

/**
 * Contract describing image results.
 */
declare type ImagesContract = EntContract<ImageEnt>[];

/**
 * Ent representing sequence properties.
 *
 * @interface SequenceEnt
 */
interface SequenceEnt extends IDEnt {
    /**
     * The image IDs of the sequence sorted in
     * acsending order based on capture time.
     */
    image_ids: string[];
}

/**
 * Contract describing sequence results.
 */
declare type SequenceContract = SequenceEnt;

/**
 * Ent representing image tile properties.
 */
interface ImageTileEnt {
    /**
     * URL for fetching image tile pixel data.
     */
    url: string;
    /**
     * X tile coordinate.
     */
    x: number;
    /**
     * Y tile coordinate.
     */
    y: number;
    /**
     * Tile level.
     */
    z: number;
}

/**
 * Contract describing image tile results.
 */
declare type ImageTilesContract = EntContract<ImageTileEnt[]>;

/**
 * Contract describing image tile requests.
 */
interface ImageTilesRequestContract {
    /**
     * ID of the tile's image.
     */
    imageId: string;
    /**
     * Tile level.
     */
    z: number;
}

/**
 * @event
 */
declare type ProviderEventType = "datacreate";

/**
 *
 * Interface for data provider cell events.
 */
interface ProviderCellEvent extends ProviderEvent {
    /**
     * Cell ids for cells where data have been created.
     */
    cellIds: string[];
    /**
     * Provider event type.
     */
    type: "datacreate";
}

/**
 * @interface IGeometryProvider
 *
 * Interface describing geometry provider members.
 *
 * This is a specification for implementers to model: it
 * is not an exported method or class.
 */
interface IGeometryProvider {
    /**
     * Convert a geodetic bounding box to the the minimum set
     * of cell ids containing the bounding box.
     *
     * @description The bounding box needs
     * to be sufficiently small to be contained in an area with the size
     * of maximally four tiles. Up to nine adjacent tiles may be returned.
     *
     * @param {LngLat} sw - South west corner of bounding box.
     * @param {LngLat} ne - North east corner of bounding box.
     *
     * @returns {Array<string>} Array of cell ids.
     */
    bboxToCellIds(sw: LngLat, ne: LngLat): string[];
    /**
     * Get the cell ids of all adjacent cells.
     *
     * @description In the case of approximately rectangular cells
     * this is typically the eight orthogonally and diagonally adjacent
     * cells.
     *
     * @param {string} cellId - Id of cell.
     * @returns {Array<string>} Array of cell ids. No specific
     * order is guaranteed.
     */
    getAdjacent(cellId: string): string[];
    /**
     * Get the vertices of a cell.
     *
     * @description The vertices form an unclosed
     * clockwise polygon in the 2D longitude, latitude
     * space. No assumption on the position of the first
     * vertex relative to the others can be made.
     *
     * @param {string} cellId - Id of cell.
     * @returns {Array<LngLat>} Unclosed clockwise polygon.
     */
    getVertices(cellId: string): LngLat[];
    /**
     * Convert geodetic coordinates to a cell id.
     *
     * @param {LngLat} lngLat - Longitude, latitude to convert.
     * @returns {string} Cell id for the longitude, latitude.
     */
    lngLatToCellId(lngLat: LngLat): string;
}

/**
 * @interface IDataProvider
 *
 * Interface describing data provider members.
 *
 * This is a specification for implementers to model: it is
 * not an exported method or class.
 *
 * @fires datacreate
 */
interface IDataProvider extends EventEmitter {
    /**
     * Get geometry property.
     *
     * @returns {IGeometryProvider} Geometry provider instance.
     */
    geometry: IGeometryProvider;
    /**
     * Fire when data has been created in the data provider
     * after initial load.
     *
     * @param type datacreate
     * @param event Provider cell event
     *
     * @example
     * ```js
     * // Initialize the data provider
     * class MyDataProvider extends DataProviderBase {
     *   // Class implementation
     * }
     * var provider = new MyDataProvider();
     * // Create the event
     * var cellIds = [ // Determine updated cells ];
     * var target = provider;
     * var type = "datacreate";
     * var event = {
     *   cellIds,
     *   target,
     *   type,
     * };
     * // Fire the event
     * provider.fire(type, event);
     * ```
     */
    fire(type: "datacreate", event: ProviderCellEvent): void;
    /** @ignore */
    fire(type: ProviderEventType, event: ProviderEvent): void;
    fire<T>(type: ProviderEventType, event: T): void;
    /**
     * Get core images in a geometry cell.
     *
     * @param {string} cellId - The id of the geometry cell.
     * @returns {Promise<CoreImagesContract>} Promise to
     * the core images of the requested geometry cell id.
     * @throws Rejects the promise on errors.
     */
    getCoreImages(cellId: string): Promise<CoreImagesContract>;
    /**
     * Get a cluster reconstruction.
     *
     * @param {string} url - URL for the cluster reconstruction
     * to retrieve.
     * @param {Promise} [abort] - Optional promise for aborting
     * the request through rejection.
     * @returns {Promise<ClusterContract>} Promise to the
     * cluster reconstruction.
     * @throws Rejects the promise on errors.
     */
    getCluster(url: string, abort?: Promise<void>): Promise<ClusterContract>;
    /**
     * Get spatial images.
     *
     * @param {Array<string>} imageIds - The ids for the
     * images to retrieve.
     * @returns {Promise<SpatialImagesContract>} Promise to
     * the spatial images of the requested image ids.
     * @throws Rejects the promise on errors.
     */
    getSpatialImages(imageIds: string[]): Promise<SpatialImagesContract>;
    /**
     * Get complete images.
     *
     * @param {Array<string>} imageIds - The ids for the
     * images to retrieve.
     * @returns {Promise<ImagesContract>} Promise to the images of the
     * requested image ids.
     * @throws Rejects the promise on errors.
     */
    getImages(imageIds: string[]): Promise<ImagesContract>;
    /**
     * Get an image as an array buffer.
     *
     * @param {string} url - URL for image to retrieve.
     * @param {Promise<void>} [abort] - Optional promise for aborting
     * the request through rejection.
     * @returns {Promise<ArrayBuffer>} Promise to the array
     * buffer containing the image.
     * @throws Rejects the promise on errors.
     */
    getImageBuffer(url: string, abort?: Promise<void>): Promise<ArrayBuffer>;
    /**
     * Get image tiles urls for a tile level.
     *
     * @param {ImageTilesRequestContract} tiles - Tiles to request
     * @returns {Promise<ImageTilesContract>} Promise to the
     * image tiles response contract
     *
     * @throws Rejects the promise on errors.
     *
     * @example
     * ```js
     * var tileRequest = { imageId: 'image-id', z: 12 };
     * provider.getImageTiles(tileRequest)
     *   .then((response) => console.log(response));
     * ```
     */
    getImageTiles(tiles: ImageTilesRequestContract): Promise<ImageTilesContract>;
    /**
     * Get a mesh.
     *
     * @param {string} url - URL for mesh to retrieve.
     * @param {Promise<void>} [abort] - Optional promise for aborting
     * the request through rejection.
     * @returns {Promise<MeshContract>} Promise to the mesh.
     * @throws Rejects the promise on errors.
     */
    getMesh(url: string, abort?: Promise<void>): Promise<MeshContract>;
    /**
     * Get sequence.
     *
     * @param {Array<string>} sequenceId - The id for the
     * sequence to retrieve.
     * @returns {Promise} Promise to the sequences of the
     * requested image ids.
     * @throws Rejects the promise on errors.
     */
    getSequence(sequenceId: string): Promise<SequenceContract>;
    off(type: ProviderCellEvent["type"], handler: (event: ProviderCellEvent) => void): void;
    /** @ignore */
    off(type: ProviderEventType, handler: (event: ProviderEvent) => void): void;
    /** @ignore */
    off<T>(type: ProviderEventType, handler: (event: T) => void): void;
    /**
     * Fired when data has been created in the data provider
     * after initial load.
     *
     * @event datacreate
     * @example
     * ```js
     * // Initialize the data provider
     * class MyDataProvider extends DataProviderBase {
     *   // implementation
     * }
     * var provider = new MyDataProvider();
     * // Set an event listener
     * provider.on("datacreate", function() {
     *   console.log("A datacreate event has occurred.");
     * });
     * ```
     */
    on(type: "datacreate", handler: (event: ProviderCellEvent) => void): void;
    /** @ignore */
    on(type: ProviderEventType, handler: (event: ProviderEvent) => void): void;
    /** @ignore */
    on<T>(type: ProviderEventType, handler: (event: T) => void): void;
    /**
     * Set an access token for authenticated API requests of
     * protected resources.
     *
     * @param {string} [accessToken] accessToken - User access
     * token or client access token.
     */
    setAccessToken(accessToken?: string): void;
}

/**
 * Interface for general provider events.
 */
interface ProviderEvent {
    /**
     * Data provider target that emitted the event.
     */
    target: IDataProvider;
    /**
     * Provider event type.
     */
    type: ProviderEventType;
}

/**
 * @class DataProviderBase
 *
 * @classdesc Base class to extend if implementing a data provider
 * class.
 *
 * @fires datacreate
 *
 * @example
 * ```js
 * class MyDataProvider extends DataProviderBase {
 *   constructor() {
 *     super(new S2GeometryProvider());
 *   }
 *   ...
 * }
 * ```
 */
declare abstract class DataProviderBase extends EventEmitter implements IDataProvider {
    protected _geometry: IGeometryProvider;
    /**
     * Create a new data provider base instance.
     *
     * @param {IGeometryProvider} geometry - Geometry
     * provider instance.
     */
    constructor(_geometry: IGeometryProvider);
    /**
     * Get geometry property.
     *
     * @returns {IGeometryProvider} Geometry provider instance.
     */
    get geometry(): IGeometryProvider;
    /**
     * Fire when data has been created in the data provider
     * after initial load.
     *
     * @param type datacreate
     * @param event Provider cell event
     *
     * @example
     * ```js
     * // Initialize the data provider
     * class MyDataProvider extends DataProviderBase {
     *   // Class implementation
     * }
     * var provider = new MyDataProvider();
     * // Create the event
     * var cellIds = [ // Determine updated cells ];
     * var target = provider;
     * var type = "datacreate";
     * var event = {
     *   cellIds,
     *   target,
     *   type,
     * };
     * // Fire the event
     * provider.fire(type, event);
     * ```
     */
    fire(type: "datacreate", event: ProviderCellEvent): void;
    /** @ignore */
    fire(type: ProviderEventType, event: ProviderEvent): void;
    /**
     * Get core images in a geometry cell.
     *
     * @param {string} cellId - The id of the geometry cell.
     * @returns {Promise<CoreImagesContract>} Promise to
     * the core images of the requested geometry cell id.
     * @throws Rejects the promise on errors.
     */
    getCoreImages(cellId: string): Promise<CoreImagesContract>;
    /**
     * Get a cluster reconstruction.
     *
     * @param {string} url - URL for the cluster reconstruction
     * to retrieve.
     * @param {Promise} [abort] - Optional promise for aborting
     * the request through rejection.
     * @returns {Promise<ClusterContract>} Promise to the
     * cluster reconstruction.
     * @throws Rejects the promise on errors.
     */
    getCluster(url: string, abort?: Promise<void>): Promise<ClusterContract>;
    /**
     * Get spatial images.
     *
     * @param {Array<string>} imageIds - The ids for the
     * images to retrieve.
     * @returns {Promise<SpatialImagesContract>} Promise to
     * the spatial images of the requested image ids.
     * @throws Rejects the promise on errors.
     */
    getSpatialImages(imageIds: string[]): Promise<SpatialImagesContract>;
    /**
     * Get complete images.
     *
     * @param {Array<string>} imageIds - The ids for the
     * images to retrieve.
     * @returns {Promise<ImagesContract>} Promise to the images of the
     * requested image ids.
     * @throws Rejects the promise on errors.
     */
    getImages(imageIds: string[]): Promise<ImagesContract>;
    /**
     * Get an image as an array buffer.
     *
     * @param {string} url - URL for image to retrieve.
     * @param {Promise<void>} [abort] - Optional promise for aborting
     * the request through rejection.
     * @returns {Promise<ArrayBuffer>} Promise to the array
     * buffer containing the image.
     * @throws Rejects the promise on errors.
     */
    getImageBuffer(url: string, abort?: Promise<void>): Promise<ArrayBuffer>;
    /**
     * Get image tiles urls for a tile level.
     *
     * @param {ImageTilesRequestContract} tiles - Tiles to request
     * @returns {Promise<ImageTilesContract>} Promise to the
     * image tiles response contract
     *
     * @throws Rejects the promise on errors.
     *
     * @example
     * ```js
     * var tileRequest = { imageId: 'image-id', z: 12 };
     * provider.getImageTiles(tileRequest)
     *   .then((response) => console.log(response));
     * ```
     */
    getImageTiles(tiles: ImageTilesRequestContract): Promise<ImageTilesContract>;
    /**
     * Get a mesh.
     *
     * @param {string} url - URL for mesh to retrieve.
     * @param {Promise<void>} [abort] - Optional promise for aborting
     * the request through rejection.
     * @returns {Promise<MeshContract>} Promise to the mesh.
     * @throws Rejects the promise on errors.
     */
    getMesh(url: string, abort?: Promise<void>): Promise<MeshContract>;
    /**
     * Get sequence.
     *
     * @param {Array<string>} sequenceId - The id for the
     * sequence to retrieve.
     * @returns {Promise} Promise to the sequences of the
     * requested image ids.
     * @throws Rejects the promise on errors.
     */
    getSequence(sequenceId: string): Promise<SequenceContract>;
    off(type: ProviderCellEvent["type"], handler: (event: ProviderCellEvent) => void): void;
    /** @ignore */
    off(type: ProviderEventType, handler: (event: ProviderEvent) => void): void;
    /**
     * Fired when data has been created in the data provider
     * after initial load.
     *
     * @event datacreate
     * @example
     * ```js
     * // Initialize the data provider
     * class MyDataProvider extends DataProviderBase {
     *   // implementation
     * }
     * var provider = new MyDataProvider();
     * // Set an event listener
     * provider.on("datacreate", function() {
     *   console.log("A datacreate event has occurred.");
     * });
     * ```
     */
    on(type: "datacreate", handler: (event: ProviderCellEvent) => void): void;
    /** @ignore */
    on(type: ProviderEventType, handler: (event: ProviderEvent) => void): void;
    /**
     * Set an access token for authenticated API requests of
     * protected resources.
     *
     * @param {string} [accessToken] accessToken - User access
     * token or client access token.
     */
    setAccessToken(accessToken?: string): void;
}

/**
 * @class GeometryProviderBase
 *
 * @classdesc Base class to extend if implementing a geometry
 * provider class.
 *
 * @example
 * ```js
 * class MyGeometryProvider extends GeometryProviderBase {
 *      ...
 * }
 * ```
 */
declare abstract class GeometryProviderBase implements IGeometryProvider {
    /**
     * Create a new geometry provider base instance.
     */
    constructor();
    /**
     * Convert a geodetic bounding box to the the minimum set
     * of cell ids containing the bounding box.
     *
     * @description The bounding box needs
     * to be sufficiently small to be contained in an area with the size
     * of maximally four tiles. Up to nine adjacent tiles may be returned.
     *
     * @param {LngLat} sw - South west corner of bounding box.
     * @param {LngLat} ne - North east corner of bounding box.
     *
     * @returns {Array<string>} Array of cell ids.
     */
    bboxToCellIds(sw: LngLat, ne: LngLat): string[];
    /**
     * Get the cell ids of all adjacent cells.
     *
     * @description In the case of approximately rectangular cells
     * this is typically the eight orthogonally and diagonally adjacent
     * cells.
     *
     * @param {string} cellId - Id of cell.
     * @returns {Array<string>} Array of cell ids. No specific
     * order is guaranteed.
     */
    getAdjacent(cellId: string): string[];
    /**
     * Get the vertices of a cell.
     *
     * @description The vertices form an unclosed
     * clockwise polygon in the 2D longitude, latitude
     * space. No assumption on the position of the first
     * vertex relative to the others can be made.
     *
     * @param {string} cellId - Id of cell.
     * @returns {Array<LngLat>} Unclosed clockwise polygon.
     */
    getVertices(cellId: string): LngLat[];
    /**
     * Convert geodetic coordinates to a cell id.
     *
     * @param {LngLat} lngLat - Longitude, latitude to convert.
     * @returns {string} Cell id for the longitude, latitude.
     */
    lngLatToCellId(lngLat: LngLat): string;
    /** @ignore */
    protected _approxBboxToCellIds(sw: LngLat, ne: LngLat): string[];
    /** @ignore */
    private _enuToGeodetic;
    /** @ignore */
    private _getLngLatBoundingBoxCorners;
    /**
     * Convert a geodetic square to cell ids.
     *
     * The square is specified as a longitude, latitude
     * and a threshold from the position using Manhattan distance.
     *
     * @param {LngLat} lngLat - Longitude, latitude.
     * @param {number} threshold - Threshold of the conversion in meters.
     *
     * @returns {Array<string>} Array of cell ids reachable within
     * the threshold.
     *
     * @ignore
     */
    private _lngLatToCellIds;
}

interface GraphCameraContract {
    focal: number;
    k1: number;
    k2: number;
    projection_type: string;
}
interface GraphCameraShotContract {
    camera: string;
    rotation: number[];
    translation: number[];
}
interface GraphReferenceContract {
    altitude: number;
    latitude: number;
    longitude: number;
}
interface GraphPointContract {
    color: number[];
    coordinates: number[];
}
interface GraphClusterContract {
    cameras: {
        [cameraId: string]: GraphCameraContract;
    };
    points: {
        [pointId: string]: GraphPointContract;
    };
    reference_lla: GraphReferenceContract;
    shots: {
        [imageKey: string]: GraphCameraShotContract;
    };
}

interface GraphGeometry {
    coordinates: [number, number];
}
interface GraphCoreImageEnt extends IDEnt {
    computed_geometry: GraphGeometry;
    geometry: GraphGeometry;
    sequence: string;
}
interface GraphSpatialImageEnt extends SpatialImageEnt {
    merge_cc: number;
    sfm_cluster: URLEnt;
    thumb_1024_url: string;
    thumb_2048_url: string;
}

declare class GraphConverter {
    clusterReconstruction(source: GraphClusterContract): ClusterContract;
    coreImage(source: GraphCoreImageEnt): CoreImageEnt;
    spatialImage(source: GraphSpatialImageEnt): SpatialImageEnt;
    private _geometry;
}

interface GraphDataProviderOptions {
    endpoint?: string;
    accessToken?: string;
}

declare class GraphQueryCreator {
    readonly imagesPath: string;
    readonly sequencePath: string;
    readonly coreFields: string[];
    readonly idFields: string[];
    readonly spatialFields: string[];
    readonly imageTileFields: string[];
    private readonly _imageTilesPath;
    constructor();
    images(imageIds: string[], fields: string[]): string;
    imagesS2(cellId: string, fields: string[]): string;
    imageTiles(z: number, fields: string[]): string;
    imageTilesPath(imageId: string): string;
    sequence(sequenceId: string): string;
}

declare class GraphDataProvider extends DataProviderBase {
    private readonly _method;
    private readonly _endpoint;
    private readonly _convert;
    private readonly _query;
    private _accessToken;
    constructor(options?: GraphDataProviderOptions, geometry?: IGeometryProvider, converter?: GraphConverter, queryCreator?: GraphQueryCreator);
    getCluster(url: string, abort?: Promise<void>): Promise<ClusterContract>;
    getCoreImages(cellId: string): Promise<CoreImagesContract>;
    getImageBuffer(url: string, abort?: Promise<void>): Promise<ArrayBuffer>;
    getImages(imageIds: string[]): Promise<ImagesContract>;
    getImageTiles(request: ImageTilesRequestContract): Promise<ImageTilesContract>;
    getMesh(url: string, abort?: Promise<void>): Promise<MeshContract>;
    getSequence(sequenceId: string): Promise<SequenceContract>;
    getSpatialImages(imageIds: string[]): Promise<SpatialImagesContract>;
    setAccessToken(accessToken: string): void;
    private _createHeaders;
    private _fetchGraphContract;
    private _makeErrorMessage;
}

/**
 * @class S2GeometryProvider
 *
 * @classdesc Geometry provider based on S2 cells.
 *
 * @example
 * ```js
 * class MyDataProvider extends DataProviderBase {
 *      ...
 * }
 *
 * const geometryProvider = new S2GeometryProvider();
 * const dataProvider = new MyDataProvider(geometryProvider);
 * ```
 */
declare class S2GeometryProvider extends GeometryProviderBase {
    private readonly _level;
    /**
     * Create a new S2 geometry provider instance.
     */
    constructor(_level?: number);
    /** @inheritdoc */
    bboxToCellIds(sw: LngLat, ne: LngLat): string[];
    /** @inheritdoc */
    getAdjacent(cellId: string): string[];
    /** @inheritdoc */
    getVertices(cellId: string): LngLat[];
    /** @inheritdoc */
    lngLatToCellId(lngLat: LngLat): string;
    private _getNeighbors;
    private _lngLatToId;
}

interface ComponentConfiguration {
    [key: string]: any;
}

/**
 * Enumeration for render mode
 * @enum {number}
 * @readonly
 * @description Modes for specifying how rendering is done
 * in the viewer. All modes preserves the original aspect
 * ratio of the images.
 */
declare enum RenderMode {
    /**
     * Displays all content within the viewer.
     *
     * @description Black bars shown on both
     * sides of the content. Bars are shown
     * either below and above or to the left
     * and right of the content depending on
     * the aspect ratio relation between the
     * image and the viewer.
     */
    Letterbox = 0,
    /**
     * Fills the viewer by cropping content.
     *
     * @description Cropping is done either
     * in horizontal or vertical direction
     * depending on the aspect ratio relation
     * between the image and the viewer.
     */
    Fill = 1
}

interface ViewportSize {
    height: number;
    width: number;
}

declare type CameraType = "spherical" | "fisheye" | "perspective";

/**
 * @class Transform
 *
 * @classdesc Class used for calculating coordinate transformations
 * and projections.
 */
declare class Transform {
    private _width;
    private _height;
    private _focal;
    private _orientation;
    private _scale;
    private _basicWidth;
    private _basicHeight;
    private _basicAspect;
    private _worldToCamera;
    private _worldToCameraInverse;
    private _scaledWorldToCamera;
    private _scaledWorldToCameraInverse;
    private _basicWorldToCamera;
    private _textureScale;
    private _ck1;
    private _ck2;
    private _cameraType;
    private _radialPeak;
    /**
     * Create a new transform instance.
     * @param {number} orientation - Image orientation.
     * @param {number} width - Image height.
     * @param {number} height - Image width.
     * @param {number} focal - Focal length.
     * @param {number} scale - Atomic scale.
     * @param {Array<number>} rotation - Rotation vector in three dimensions.
     * @param {Array<number>} translation - Translation vector in three dimensions.
     * @param {HTMLImageElement} image - Image for fallback size calculations.
     */
    constructor(orientation: number, width: number, height: number, scale: number, rotation: number[], translation: number[], image: HTMLImageElement, textureScale?: number[], cameraParameters?: number[], cameraType?: CameraType);
    get ck1(): number;
    get ck2(): number;
    get cameraType(): CameraType;
    /**
     * Get basic aspect.
     * @returns {number} The orientation adjusted aspect ratio.
     */
    get basicAspect(): number;
    /**
     * Get basic height.
     *
     * @description Does not fall back to image image height but
     * uses original value from API so can be faulty.
     *
     * @returns {number} The height of the basic version image
     * (adjusted for orientation).
     */
    get basicHeight(): number;
    get basicRt(): THREE.Matrix4;
    /**
     * Get basic width.
     *
     * @description Does not fall back to image image width but
     * uses original value from API so can be faulty.
     *
     * @returns {number} The width of the basic version image
     * (adjusted for orientation).
     */
    get basicWidth(): number;
    /**
     * Get focal.
     * @returns {number} The image focal length.
     */
    get focal(): number;
    /**
     * Get height.
     *
     * @description Falls back to the image image height if
     * the API data is faulty.
     *
     * @returns {number} The orientation adjusted image height.
     */
    get height(): number;
    /**
     * Get orientation.
     * @returns {number} The image orientation.
     */
    get orientation(): number;
    /**
     * Get rt.
     * @returns {THREE.Matrix4} The extrinsic camera matrix.
     */
    get rt(): THREE.Matrix4;
    /**
     * Get srt.
     * @returns {THREE.Matrix4} The scaled extrinsic camera matrix.
     */
    get srt(): THREE.Matrix4;
    /**
     * Get srtInverse.
     * @returns {THREE.Matrix4} The scaled extrinsic camera matrix.
     */
    get srtInverse(): THREE.Matrix4;
    /**
     * Get scale.
     * @returns {number} The image atomic reconstruction scale.
     */
    get scale(): number;
    /**
     * Get has valid scale.
     * @returns {boolean} Value indicating if the scale of the transform is valid.
     */
    get hasValidScale(): boolean;
    /**
     * Get radial peak.
     * @returns {number} Value indicating the radius where the radial
     * undistortion function peaks.
     */
    get radialPeak(): number;
    /**
     * Get width.
     *
     * @description Falls back to the image image width if
     * the API data is faulty.
     *
     * @returns {number} The orientation adjusted image width.
     */
    get width(): number;
    /**
     * Calculate the up vector for the image transform.
     *
     * @returns {THREE.Vector3} Normalized and orientation adjusted up vector.
     */
    upVector(): THREE.Vector3;
    /**
     * Calculate projector matrix for projecting 3D points to texture map
     * coordinates (u and v).
     *
     * @returns {THREE.Matrix4} Projection matrix for 3D point to texture
     * map coordinate calculations.
     */
    projectorMatrix(): THREE.Matrix4;
    /**
     * Project 3D world coordinates to basic coordinates.
     *
     * @param {Array<number>} point3d - 3D world coordinates.
     * @return {Array<number>} 2D basic coordinates.
     */
    projectBasic(point3d: number[]): number[];
    /**
     * Unproject basic coordinates to 3D world coordinates.
     *
     * @param {Array<number>} basic - 2D basic coordinates.
     * @param {Array<number>} distance - Distance to unproject from camera center.
     * @param {boolean} [depth] - Treat the distance value as depth from camera center.
     *                            Only applicable for perspective images. Will be
     *                            ignored for spherical.
     * @returns {Array<number>} Unprojected 3D world coordinates.
     */
    unprojectBasic(basic: number[], distance: number, depth?: boolean): number[];
    /**
     * Project 3D world coordinates to SfM coordinates.
     *
     * @param {Array<number>} point3d - 3D world coordinates.
     * @return {Array<number>} 2D SfM coordinates.
     */
    projectSfM(point3d: number[]): number[];
    /**
     * Unproject SfM coordinates to a 3D world coordinates.
     *
     * @param {Array<number>} sfm - 2D SfM coordinates.
     * @param {Array<number>} distance - Distance to unproject
     * from camera center.
     * @param {boolean} [depth] - Treat the distance value as
     * depth from camera center. Only applicable for perspective
     * images. Will be ignored for spherical.
     * @returns {Array<number>} Unprojected 3D world coordinates.
     */
    unprojectSfM(sfm: number[], distance: number, depth?: boolean): number[];
    /**
     * Transform SfM coordinates to bearing vector (3D cartesian
     * coordinates on the unit sphere).
     *
     * @param {Array<number>} sfm - 2D SfM coordinates.
     * @returns {Array<number>} Bearing vector (3D cartesian coordinates
     * on the unit sphere).
     */
    private _sfmToBearing;
    /** Compute distortion given the distorted radius.
     *
     *  Solves for d in the equation
     *    y = d(x, k1, k2) * x
     * given the distorted radius, y.
     */
    private _distortionFromDistortedRadius;
    /**
     * Transform bearing vector (3D cartesian coordiantes on the unit sphere) to
     * SfM coordinates.
     *
     * @param {Array<number>} bearing - Bearing vector (3D cartesian coordinates on the
     * unit sphere).
     * @returns {Array<number>} 2D SfM coordinates.
     */
    private _bearingToSfm;
    /**
     * Convert basic coordinates to SfM coordinates.
     *
     * @param {Array<number>} basic - 2D basic coordinates.
     * @returns {Array<number>} 2D SfM coordinates.
     */
    private _basicToSfm;
    /**
     * Convert SfM coordinates to basic coordinates.
     *
     * @param {Array<number>} sfm - 2D SfM coordinates.
     * @returns {Array<number>} 2D basic coordinates.
     */
    private _sfmToBasic;
    /**
     * Checks a value and returns it if it exists and is larger than 0.
     * Fallbacks if it is null.
     *
     * @param {number} value - Value to check.
     * @param {number} fallback - Value to fall back to.
     * @returns {number} The value or its fallback value if it is not defined or negative.
     */
    private _getValue;
    private _getCameraParameters;
    /**
     * Creates the extrinsic camera matrix [ R | t ].
     *
     * @param {Array<number>} rotation - Rotation vector in angle axis representation.
     * @param {Array<number>} translation - Translation vector.
     * @returns {THREE.Matrix4} Extrisic camera matrix.
     */
    private createWorldToCamera;
    /**
     * Calculates the scaled extrinsic camera matrix scale * [ R | t ].
     *
     * @param {THREE.Matrix4} worldToCamera - Extrisic camera matrix.
     * @param {number} scale - Scale factor.
     * @returns {THREE.Matrix4} Scaled extrisic camera matrix.
     */
    private _createScaledWorldToCamera;
    private _createBasicWorldToCamera;
    private _getRadialPeak;
    /**
     * Calculate a transformation matrix from normalized coordinates for
     * texture map coordinates.
     *
     * @returns {THREE.Matrix4} Normalized coordinates to texture map
     * coordinates transformation matrix.
     */
    private _normalizedToTextureMatrix;
}

/**
 * @class Camera
 *
 * @classdesc Holds information about a camera.
 */
declare class Camera {
    private _position;
    private _lookat;
    private _up;
    private _focal;
    /**
     * Create a new camera instance.
     * @param {Transform} [transform] - Optional transform instance.
     */
    constructor(transform?: Transform);
    /**
     * Get position.
     * @returns {THREE.Vector3} The position vector.
     */
    get position(): THREE.Vector3;
    /**
     * Get lookat.
     * @returns {THREE.Vector3} The lookat vector.
     */
    get lookat(): THREE.Vector3;
    /**
     * Get up.
     * @returns {THREE.Vector3} The up vector.
     */
    get up(): THREE.Vector3;
    /**
     * Get focal.
     * @returns {number} The focal length.
     */
    get focal(): number;
    /**
     * Set focal.
     */
    set focal(value: number);
    /**
     * Update this camera to the linearly interpolated value of two other cameras.
     *
     * @param {Camera} a - First camera.
     * @param {Camera} b - Second camera.
     * @param {number} alpha - Interpolation value on the interval [0, 1].
     */
    lerpCameras(a: Camera, b: Camera, alpha: number): void;
    /**
     * Copy the properties of another camera to this camera.
     *
     * @param {Camera} other - Another camera.
     */
    copy(other: Camera): void;
    /**
     * Clone this camera.
     *
     * @returns {Camera} A camera with cloned properties equal to this camera.
     */
    clone(): Camera;
    /**
     * Determine the distance between this camera and another camera.
     *
     * @param {Camera} other - Another camera.
     * @returns {number} The distance between the cameras.
     */
    diff(other: Camera): number;
    /**
     * Get the focal length based on the transform.
     *
     * @description Returns the focal length corresponding
     * to a 90 degree field of view for spherical
     * transforms.
     *
     * Returns the transform focal length for other
     * projection types.
     *
     * @returns {number} Focal length.
     */
    private _getFocal;
}

declare enum State {
    Custom = 0,
    Earth = 1,
    Traversing = 2,
    Waiting = 3,
    WaitingInteractively = 4
}

/**
 * Enumeration for edge directions
 * @enum {number}
 * @readonly
 * @description Directions for edges in image graph describing
 * sequence, spatial and image type relations between nodes.
 */
declare enum NavigationDirection {
    /**
     * Next image in the sequence.
     */
    Next = 0,
    /**
     * Previous image in the sequence.
     */
    Prev = 1,
    /**
     * Step to the left keeping viewing direction.
     */
    StepLeft = 2,
    /**
     * Step to the right keeping viewing direction.
     */
    StepRight = 3,
    /**
     * Step forward keeping viewing direction.
     */
    StepForward = 4,
    /**
     * Step backward keeping viewing direction.
     */
    StepBackward = 5,
    /**
     * Turn 90 degrees counter clockwise.
     */
    TurnLeft = 6,
    /**
     * Turn 90 degrees clockwise.
     */
    TurnRight = 7,
    /**
     * Turn 180 degrees.
     */
    TurnU = 8,
    /**
     * Spherical in general direction.
     */
    Spherical = 9,
    /**
     * Looking in roughly the same direction at rougly the same position.
     */
    Similar = 10
}

/**
 * Interface that describes additional properties of an edge.
 *
 * @interface NavigationEdgeData
 */
interface NavigationEdgeData {
    /**
     * The edge direction.
     */
    direction: NavigationDirection;
    /**
     * The counter clockwise horizontal rotation angle from
     * the X-axis in a spherical coordiante system of the
     * motion from the source image to the destination node.
     */
    worldMotionAzimuth: number;
}

/**
 * Interface that describes the properties for a
 * navigation edge from a source image to a
 * target image.
 *
 * @interface NavigationEdge
 */
interface NavigationEdge {
    /**
     * The id of the source image.
     */
    source: string;
    /**
     * The id of the target image.
     */
    target: string;
    /**
     * Additional data describing properties of the edge.
     */
    data: NavigationEdgeData;
}

/**
 * Interface that indicates edge status.
 *
 * @interface NavigationEdgeStatus
 */
interface NavigationEdgeStatus {
    /**
     * Value indicating whether the edges have been cached.
     */
    cached: boolean;
    /**
     * The edges.
     *
     * @description If the cached property is false the edges
     * property will always be an empty array. If the cached
     * property is true, there will exist edges in the the
     * array if the image has edges.
     */
    edges: NavigationEdge[];
}

/**
 * @class ImageCache
 *
 * @classdesc Represents the cached properties of a image.
 */
declare class ImageCache {
    private _disposed;
    private _provider;
    private _image;
    private _mesh;
    private _sequenceEdges;
    private _spatialEdges;
    private _imageAborter;
    private _meshAborter;
    private _imageChanged$;
    private _image$;
    private _sequenceEdgesChanged$;
    private _sequenceEdges$;
    private _spatialEdgesChanged$;
    private _spatialEdges$;
    private _cachingAssets$;
    private _iamgeSubscription;
    private _sequenceEdgesSubscription;
    private _spatialEdgesSubscription;
    /**
     * Create a new image cache instance.
     */
    constructor(provider: IDataProvider);
    /**
     * Get image.
     *
     * @description Will not be set when assets have not been cached
     * or when the object has been disposed.
     *
     * @returns {HTMLImageElement} Cached image element of the image.
     */
    get image(): HTMLImageElement;
    /**
     * Get image$.
     *
     * @returns {Observable<HTMLImageElement>} Observable emitting
     * the cached image when it is updated.
     */
    get image$(): Observable<HTMLImageElement>;
    /**
     * Get mesh.
     *
     * @description Will not be set when assets have not been cached
     * or when the object has been disposed.
     *
     * @returns {MeshContract} SfM triangulated mesh of reconstructed
     * atomic 3D points.
     */
    get mesh(): MeshContract;
    /**
     * Get sequenceEdges.
     *
     * @returns {NavigationEdgeStatus} Value describing the status of the
     * sequence edges.
     */
    get sequenceEdges(): NavigationEdgeStatus;
    /**
     * Get sequenceEdges$.
     *
     * @returns {Observable<NavigationEdgeStatus>} Observable emitting
     * values describing the status of the sequence edges.
     */
    get sequenceEdges$(): Observable<NavigationEdgeStatus>;
    /**
     * Get spatialEdges.
     *
     * @returns {NavigationEdgeStatus} Value describing the status of the
     * spatial edges.
     */
    get spatialEdges(): NavigationEdgeStatus;
    /**
     * Get spatialEdges$.
     *
     * @returns {Observable<NavigationEdgeStatus>} Observable emitting
     * values describing the status of the spatial edges.
     */
    get spatialEdges$(): Observable<NavigationEdgeStatus>;
    /**
     * Cache the image and mesh assets.
     *
     * @param {SpatialImageEnt} spatial - Spatial props of the image to cache.
     * @param {boolean} spherical - Value indicating whether image is a spherical.
     * @param {boolean} merged - Value indicating whether image is merged.
     * @returns {Observable<ImageCache>} Observable emitting this image
     * cache whenever the load status has changed and when the mesh or image
     * has been fully loaded.
     */
    cacheAssets$(spatial: SpatialImageEnt, merged: boolean): Observable<ImageCache>;
    /**
     * Cache an image with a higher resolution than the current one.
     *
     * @param {SpatialImageEnt} spatial - Spatial props.
     * @returns {Observable<ImageCache>} Observable emitting a single item,
     * the image cache, when the image has been cached. If supplied image
     * size is not larger than the current image size the image cache is
     * returned immediately.
     */
    cacheImage$(spatial: SpatialImageEnt): Observable<ImageCache>;
    /**
     * Cache the sequence edges.
     *
     * @param {Array<NavigationEdge>} edges - Sequence edges to cache.
     */
    cacheSequenceEdges(edges: NavigationEdge[]): void;
    /**
     * Cache the spatial edges.
     *
     * @param {Array<NavigationEdge>} edges - Spatial edges to cache.
     */
    cacheSpatialEdges(edges: NavigationEdge[]): void;
    /**
     * Dispose the image cache.
     *
     * @description Disposes all cached assets and unsubscribes to
     * all streams.
     */
    dispose(): void;
    /**
     * Reset the sequence edges.
     */
    resetSequenceEdges(): void;
    /**
     * Reset the spatial edges.
     */
    resetSpatialEdges(): void;
    /**
     * Cache the image.
     *
     * @param {SpatialImageEnt} spatial - Spatial image.
     * @param {boolean} spherical - Value indicating whether image is a spherical.
     * @returns {Observable<ILoadStatusObject<HTMLImageElement>>} Observable
     * emitting a load status object every time the load status changes
     * and completes when the image is fully loaded.
     */
    private _cacheImage$;
    /**
     * Cache the mesh.
     *
     * @param {SpatialImageEnt} spatial - Spatial props.
     * @param {boolean} merged - Value indicating whether image is merged.
     * @returns {Observable<ILoadStatusObject<MeshContract>>} Observable emitting
     * a load status object every time the load status changes and completes
     * when the mesh is fully loaded.
     */
    private _cacheMesh$;
    /**
     * Create a load status object with an empty mesh.
     *
     * @returns {ILoadStatusObject<MeshContract>} Load status object
     * with empty mesh.
     */
    private _createEmptyMesh;
    private _disposeImage;
}

/**
 * @class Image
 *
 * @classdesc Represents a image in the navigation graph.
 *
 * Explanation of position and bearing properties:
 *
 * When images are uploaded they will have GPS information in the EXIF, this is what
 * is called `originalLngLat` {@link Image.originalLngLat}.
 *
 * When Structure from Motions has been run for a image a `computedLngLat` that
 * differs from the `originalLngLat` will be created. It is different because
 * GPS positions are not very exact and SfM aligns the camera positions according
 * to the 3D reconstruction {@link Image.computedLngLat}.
 *
 * At last there exist a `lngLat` property which evaluates to
 * the `computedLngLat` from SfM if it exists but falls back
 * to the `originalLngLat` from the EXIF GPS otherwise {@link Image.lngLat}.
 *
 * Everything that is done in in the Viewer is based on the SfM positions,
 * i.e. `computedLngLat`. That is why the smooth transitions go in the right
 * direction (nd not in strange directions because of bad GPS).
 *
 * E.g. when placing a marker in the Viewer it is relative to the SfM
 * position i.e. the `computedLngLat`.
 *
 * The same concept as above also applies to the compass angle (or bearing) properties
 * `originalCa`, `computedCa` and `ca`.
 */
declare class Image {
    private _cache;
    private _core;
    private _spatial;
    /**
     * Create a new image instance.
     *
     * @description Images are always created internally by the library.
     * Images can not be added to the library through any API method.
     *
     * @param {CoreImageEnt} core- Raw core image data.
     * @ignore
     */
    constructor(core: CoreImageEnt);
    /**
     * Get assets cached.
     *
     * @description The assets that need to be cached for this property
     * to report true are the following: fill properties, image and mesh.
     * The library ensures that the current image will always have the
     * assets cached.
     *
     * @returns {boolean} Value indicating whether all assets have been
     * cached.
     *
     * @ignore
     */
    get assetsCached(): boolean;
    /**
     * Get cameraParameters.
     *
     * @description Will be undefined if SfM has
     * not been run.
     *
     * Camera type dependent parameters.
     *
     * For perspective and fisheye camera types,
     * the camera parameters array should be
     * constructed according to
     *
     * `[focal, k1, k2]`
     *
     * where focal is the camera focal length,
     * and k1, k2 are radial distortion parameters.
     *
     * For spherical camera type the camera
     * parameters are unset or emtpy array.
     *
     * @returns {Array<number>} The parameters
     * related to the camera type.
     */
    get cameraParameters(): number[];
    /**
     * Get cameraType.
     *
     * @description Will be undefined if SfM has not been run.
     *
     * @returns {string} The camera type that captured the image.
     */
    get cameraType(): string;
    /**
     * Get capturedAt.
     *
     * @description Timestamp of the image capture date
     * and time represented as a Unix epoch timestamp in milliseconds.
     *
     * @returns {number} Timestamp when the image was captured.
     */
    get capturedAt(): number;
    /**
     * Get clusterId.
     *
     * @returns {string} Globally unique id of the SfM cluster to which
     * the image belongs.
     */
    get clusterId(): string;
    /**
     * Get clusterUrl.
     *
     * @returns {string} Url to the cluster reconstruction file.
     *
     * @ignore
     */
    get clusterUrl(): string;
    /**
     * Get compassAngle.
     *
     * @description If the SfM computed compass angle exists it will
     * be returned, otherwise the original EXIF compass angle.
     *
     * @returns {number} Compass angle, measured in degrees
     * clockwise with respect to north.
     */
    get compassAngle(): number;
    /**
     * Get complete.
     *
     * @description The library ensures that the current image will
     * always be full.
     *
     * @returns {boolean} Value indicating whether the image has all
     * properties filled.
     *
     * @ignore
     */
    get complete(): boolean;
    /**
     * Get computedAltitude.
     *
     * @description If SfM has not been run the computed altitude is
     * set to a default value of two meters.
     *
     * @returns {number} Altitude, in meters.
     */
    get computedAltitude(): number;
    /**
     * Get computedCompassAngle.
     *
     * @description Will not be set if SfM has not been run.
     *
     * @returns {number} SfM computed compass angle, measured
     * in degrees clockwise with respect to north.
     */
    get computedCompassAngle(): number;
    /**
     * Get computedLngLat.
     *
     * @description Will not be set if SfM has not been run.
     *
     * @returns {LngLat} SfM computed longitude, latitude in WGS84 datum,
     * measured in degrees.
     */
    get computedLngLat(): LngLat;
    /**
     * Get creatorId.
     *
     * @description Note that the creator ID will not be set when using
     * the Mapillary API.
     *
     * @returns {string} Globally unique id of the user who uploaded
     * the image.
     */
    get creatorId(): string;
    /**
     * Get creatorUsername.
     *
     * @description Note that the creator username will not be set when
     * using the Mapillary API.
     *
     * @returns {string} Username of the creator who uploaded
     * the image.
     */
    get creatorUsername(): string;
    /**
     * Get exifOrientation.
     *
     * @returns {number} EXIF orientation of original image.
     */
    get exifOrientation(): number;
    /**
     * Get height.
     *
     * @returns {number} Height of original image, not adjusted
     * for orientation.
     */
    get height(): number;
    /**
     * Get image.
     *
     * @description The image will always be set on the current image.
     *
     * @returns {HTMLImageElement} Cached image element of the image.
     */
    get image(): HTMLImageElement;
    /**
     * Get image$.
     *
     * @returns {Observable<HTMLImageElement>} Observable emitting
     * the cached image when it is updated.
     *
     * @ignore
     */
    get image$(): Observable<HTMLImageElement>;
    /**
     * Get id.
     *
     * @returns {string} Globally unique id of the image.
     */
    get id(): string;
    /**
     * Get lngLat.
     *
     * @description If the SfM computed longitude, latitude exist
     * it will be returned, otherwise the original EXIF latitude
     * longitude.
     *
     * @returns {LngLat} Longitude, latitude in WGS84 datum,
     * measured in degrees.
     */
    get lngLat(): LngLat;
    /**
     * Get merged.
     *
     * @returns {boolean} Value indicating whether SfM has been
     * run on the image and the image has been merged into a
     * connected component.
     */
    get merged(): boolean;
    /**
     * Get mergeId.
     *
     * @description Will not be set if SfM has not yet been run on
     * image.
     *
     * @returns {stirng} Id of connected component to which image
     * belongs after the aligning merge.
     */
    get mergeId(): string;
    /**
     * Get mesh.
     *
     * @description The mesh will always be set on the current image.
     *
     * @returns {MeshContract} SfM triangulated mesh of reconstructed
     * atomic 3D points.
     */
    get mesh(): MeshContract;
    /**
     * Get originalAltitude.
     *
     * @returns {number} EXIF altitude, in meters, if available.
     */
    get originalAltitude(): number;
    /**
     * Get originalCompassAngle.
     *
     * @returns {number} Original EXIF compass angle, measured in
     * degrees.
     */
    get originalCompassAngle(): number;
    /**
     * Get originalLngLat.
     *
     * @returns {LngLat} Original EXIF longitude, latitude in
     * WGS84 datum, measured in degrees.
     */
    get originalLngLat(): LngLat;
    /**
     * Get ownerId.
     *
     * @returns {string} Globally unique id of the owner to which
     * the image belongs. If the image does not belong to an
     * owner the owner id will be undefined.
     */
    get ownerId(): string;
    /**
     * Get private.
     *
     * @returns {boolean} Value specifying if image is accessible to
     * organization members only or to everyone.
     */
    get private(): boolean;
    /**
     * Get qualityScore.
     *
     * @returns {number} A number between zero and one
     * determining the quality of the image. Blurriness
     * (motion blur / out-of-focus), occlusion (camera
     * mount, ego vehicle, water-drops), windshield
     * reflections, bad illumination (exposure, glare),
     * and bad weather condition (fog, rain, snow)
     * affect the quality score.
     *
     * @description Value should be on the interval [0, 1].
     */
    get qualityScore(): number;
    /**
     * Get rotation.
     *
     * @description Will not be set if SfM has not been run.
     *
     * @returns {Array<number>} Rotation vector in angle axis representation.
     */
    get rotation(): number[];
    /**
     * Get scale.
     *
     * @description Will not be set if SfM has not been run.
     *
     * @returns {number} Scale of reconstruction the image
     * belongs to.
     */
    get scale(): number;
    /**
     * Get sequenceId.
     *
     * @returns {string} Globally unique id of the sequence
     * to which the image belongs.
     */
    get sequenceId(): string;
    /**
     * Get sequenceEdges.
     *
     * @returns {NavigationEdgeStatus} Value describing the status of the
     * sequence edges.
     *
     * @ignore
     */
    get sequenceEdges(): NavigationEdgeStatus;
    /**
     * Get sequenceEdges$.
     *
     * @description Internal observable, should not be used as an API.
     *
     * @returns {Observable<NavigationEdgeStatus>} Observable emitting
     * values describing the status of the sequence edges.
     *
     * @ignore
     */
    get sequenceEdges$(): Observable<NavigationEdgeStatus>;
    /**
     * Get spatialEdges.
     *
     * @returns {NavigationEdgeStatus} Value describing the status of the
     * spatial edges.
     *
     * @ignore
     */
    get spatialEdges(): NavigationEdgeStatus;
    /**
     * Get spatialEdges$.
     *
     * @description Internal observable, should not be used as an API.
     *
     * @returns {Observable<NavigationEdgeStatus>} Observable emitting
     * values describing the status of the spatial edges.
     *
     * @ignore
     */
    get spatialEdges$(): Observable<NavigationEdgeStatus>;
    /**
     * Get width.
     *
     * @returns {number} Width of original image, not
     * adjusted for orientation.
     */
    get width(): number;
    /**
     * Cache the image and mesh assets.
     *
     * @description The assets are always cached internally by the
     * library prior to setting a image as the current image.
     *
     * @returns {Observable<Image>} Observable emitting this image whenever the
     * load status has changed and when the mesh or image has been fully loaded.
     *
     * @ignore
     */
    cacheAssets$(): Observable<Image>;
    /**
     * Cache the image asset.
     *
     * @description Use for caching a differently sized image than
     * the one currently held by the image.
     *
     * @returns {Observable<Image>} Observable emitting this image whenever the
     * load status has changed and when the mesh or image has been fully loaded.
     *
     * @ignore
     */
    cacheImage$(): Observable<Image>;
    /**
     * Cache the sequence edges.
     *
     * @description The sequence edges are cached asynchronously
     * internally by the library.
     *
     * @param {Array<NavigationEdge>} edges - Sequence edges to cache.
     * @ignore
     */
    cacheSequenceEdges(edges: NavigationEdge[]): void;
    /**
     * Cache the spatial edges.
     *
     * @description The spatial edges are cached asynchronously
     * internally by the library.
     *
     * @param {Array<NavigationEdge>} edges - Spatial edges to cache.
     * @ignore
     */
    cacheSpatialEdges(edges: NavigationEdge[]): void;
    /**
     * Dispose the image.
     *
     * @description Disposes all cached assets.
     * @ignore
     */
    dispose(): void;
    /**
     * Initialize the image cache.
     *
     * @description The image cache is initialized internally by
     * the library.
     *
     * @param {ImageCache} cache - The image cache to set as cache.
     * @ignore
     */
    initializeCache(cache: ImageCache): void;
    /**
     * Complete an image with spatial properties.
     *
     * @description The image is completed internally by
     * the library.
     *
     * @param {SpatialImageEnt} fill - The spatial image struct.
     * @ignore
     */
    makeComplete(fill: SpatialImageEnt): void;
    /**
     * Reset the sequence edges.
     *
     * @ignore
     */
    resetSequenceEdges(): void;
    /**
     * Reset the spatial edges.
     *
     * @ignore
     */
    resetSpatialEdges(): void;
    /**
     * Clears the image and mesh assets, aborts
     * any outstanding requests and resets edges.
     *
     * @ignore
     */
    uncache(): void;
}

interface IAnimationState {
    reference: LngLatAlt;
    alpha: number;
    camera: Camera;
    zoom: number;
    currentImage: Image;
    currentCamera: Camera;
    previousImage: Image;
    trajectory: Image[];
    currentIndex: number;
    lastImage: Image;
    imagesAhead: number;
    currentTransform: Transform;
    previousTransform: Transform;
    motionless: boolean;
    state: State;
    stateTransitionAlpha: number;
}

interface AnimationFrame {
    id: number;
    fps: number;
    state: IAnimationState;
}

interface EulerRotation {
    phi: number;
    theta: number;
}

declare class RenderCamera {
    private _spatial;
    private _viewportCoords;
    private _alpha;
    private _stateTransitionAlpha;
    private _stateTransitionFov;
    private _renderMode;
    private _zoom;
    private _frameId;
    private _size;
    private _camera;
    private _perspective;
    private _rotation;
    private _changed;
    private _changedForFrame;
    private _currentImageId;
    private _previousImageId;
    private _currentSpherical;
    private _previousSpherical;
    private _state;
    private _currentProjectedPoints;
    private _previousProjectedPoints;
    private _currentFov;
    private _previousFov;
    private _initialFov;
    constructor(elementWidth: number, elementHeight: number, renderMode: RenderMode);
    get alpha(): number;
    get camera(): Camera;
    get changed(): boolean;
    get frameId(): number;
    get perspective(): THREE.PerspectiveCamera;
    get renderMode(): RenderMode;
    get rotation(): EulerRotation;
    get zoom(): number;
    get size(): ViewportSize;
    getTilt(): number;
    fovToZoom(fov: number): number;
    setFrame(frame: AnimationFrame): void;
    setProjectionMatrix(matrix: number[]): void;
    setRenderMode(renderMode: RenderMode): void;
    setSize(size: ViewportSize): void;
    private _computeAspect;
    private _computeCurrentFov;
    private _computeFov;
    private _computePreviousFov;
    private _computeProjectedPoints;
    private _computeRequiredVerticalFov;
    private _computeRotation;
    private _computeVerticalFov;
    private _yToFov;
    private _focalToFov;
    private _fovToY;
    private _interpolateFov;
    private _setFrameId;
}

declare class RenderService {
    private _bearing$;
    private _element;
    private _currentFrame$;
    private _projectionMatrix$;
    private _renderCameraOperation$;
    private _renderCameraHolder$;
    private _renderCameraFrame$;
    private _renderCamera$;
    private _resize$;
    private _size$;
    private _spatial;
    private _renderMode$;
    private _subscriptions;
    constructor(element: HTMLElement, currentFrame$: Observable<AnimationFrame>, renderMode: RenderMode, renderCamera?: RenderCamera);
    get bearing$(): Observable<number>;
    get element(): HTMLElement;
    get projectionMatrix$(): Subject<number[]>;
    get renderCamera$(): Observable<RenderCamera>;
    get renderCameraFrame$(): Observable<RenderCamera>;
    get renderMode$(): Subject<RenderMode>;
    get resize$(): Subject<void>;
    get size$(): Observable<ViewportSize>;
    dispose(): void;
}

interface VirtualNodeHash {
    name: string;
    vNode: vd.VNode;
}

declare class DOMRenderer {
    private _renderService;
    private _currentFrame$;
    private _adaptiveOperation$;
    private _offset$;
    private _element$;
    private _vPatch$;
    private _vNode$;
    private _render$;
    private _renderAdaptive$;
    private _subscriptions;
    constructor(element: HTMLElement, renderService: RenderService, currentFrame$: Observable<AnimationFrame>);
    get element$(): Observable<Element>;
    get render$(): Subject<VirtualNodeHash>;
    get renderAdaptive$(): Subject<VirtualNodeHash>;
    clear(name: string): void;
    remove(): void;
}

interface GLRenderFunction extends Function {
    (perspectiveCamera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer): void;
}

declare enum RenderPass$1 {
    Background = 0,
    Opaque = 1
}

interface GLFrameRenderer {
    frameId: number;
    needsRender: boolean;
    render: GLRenderFunction;
    pass: RenderPass$1;
}

interface GLRenderHash {
    name: string;
    renderer: GLFrameRenderer;
}

declare class GLRenderer {
    private _renderService;
    private _renderFrame$;
    private _renderCameraOperation$;
    private _renderCamera$;
    private _render$;
    private _clear$;
    private _renderOperation$;
    private _renderCollection$;
    private _rendererOperation$;
    private _renderer$;
    private _eraserOperation$;
    private _eraser$;
    private _triggerOperation$;
    private _webGLRenderer$;
    private _renderFrameSubscription;
    private _subscriptions;
    private _opaqueRender$;
    constructor(canvas: HTMLCanvasElement, canvasContainer: HTMLElement, renderService: RenderService);
    get render$(): Subject<GLRenderHash>;
    get opaqueRender$(): Observable<void>;
    get webGLRenderer$(): Observable<THREE.WebGLRenderer>;
    clear(name: string): void;
    remove(): void;
    triggerRerender(): void;
    private _renderFrameSubscribe;
}

/**
 * Enumeration for transition mode
 * @enum {number}
 * @readonly
 * @description Modes for specifying how transitions
 * between images are performed.
 */
declare enum TransitionMode {
    /**
     * Default transitions.
     *
     * @description The viewer dynamically determines
     * whether transitions should be performed with or
     * without motion and blending for each transition
     * based on the underlying data.
     */
    Default = 0,
    /**
     * Instantaneous transitions.
     *
     * @description All transitions are performed
     * without motion or blending.
     */
    Instantaneous = 1
}

declare class StateService {
    private _start$;
    private _frame$;
    private _contextOperation$;
    private _context$;
    private _state$;
    private _currentState$;
    private _lastState$;
    private _currentImage$;
    private _currentImageExternal$;
    private _currentCamera$;
    private _currentId$;
    private _currentTransform$;
    private _reference$;
    private _inMotionOperation$;
    private _inMotion$;
    private _inTranslationOperation$;
    private _inTranslation$;
    private _appendImage$;
    private _frameGenerator;
    private _frameId;
    private _clock;
    private _subscriptions;
    constructor(initialState: State, transitionMode?: TransitionMode);
    get currentState$(): Observable<AnimationFrame>;
    get currentImage$(): Observable<Image>;
    get currentId$(): Observable<string>;
    get currentImageExternal$(): Observable<Image>;
    get currentCamera$(): Observable<Camera>;
    get currentTransform$(): Observable<Transform>;
    get state$(): Observable<State>;
    get reference$(): Observable<LngLatAlt>;
    get inMotion$(): Observable<boolean>;
    get inTranslation$(): Observable<boolean>;
    get appendImage$(): Subject<Image>;
    dispose(): void;
    custom(): void;
    earth(): void;
    traverse(): void;
    wait(): void;
    waitInteractively(): void;
    appendImagess(images: Image[]): void;
    prependImages(images: Image[]): void;
    removeImages(n: number): void;
    clearImages(): void;
    clearPriorImages(): void;
    cutImages(): void;
    setImages(images: Image[]): void;
    setViewMatrix(matrix: number[]): void;
    rotate(delta: EulerRotation): void;
    rotateUnbounded(delta: EulerRotation): void;
    rotateWithoutInertia(delta: EulerRotation): void;
    rotateBasic(basicRotation: number[]): void;
    rotateBasicUnbounded(basicRotation: number[]): void;
    rotateBasicWithoutInertia(basicRotation: number[]): void;
    rotateToBasic(basic: number[]): void;
    move(delta: number): void;
    moveTo(position: number): void;
    dolly(delta: number): void;
    orbit(rotation: EulerRotation): void;
    truck(direction: number[]): void;
    /**
     * Change zoom level while keeping the reference point position approximately static.
     *
     * @parameter {number} delta - Change in zoom level.
     * @parameter {Array<number>} reference - Reference point in basic coordinates.
     */
    zoomIn(delta: number, reference: number[]): void;
    getCenter(): Observable<number[]>;
    getZoom(): Observable<number>;
    setCenter(center: number[]): void;
    setSpeed(speed: number): void;
    setTransitionMode(mode: TransitionMode): void;
    setZoom(zoom: number): void;
    start(): void;
    stop(): void;
    private _invokeContextOperation;
    private _frame;
}

declare class DOM {
    private _document;
    constructor(doc?: Node);
    get document(): HTMLDocument;
    createElement<K extends keyof HTMLElementTagNameMap>(tagName: K, className?: string, container?: HTMLElement): HTMLElementTagNameMap[K];
}

/**
 * Enumeration for component size.
 * @enum {number}
 * @readonly
 * @description May be used by a component to allow for resizing
 * of the UI elements rendered by the component.
 */
declare enum ComponentSize {
    /**
     * Automatic size. The size of the elements will automatically
     * change at a predefined threshold.
     */
    Automatic = 0,
    /**
     * Large size. The size of the elements will be fixed until another
     * component size is configured.
     */
    Large = 1,
    /**
     * Small size. The size of the elements will be fixed until another
     * component size is configured.
     */
    Small = 2
}

interface BearingConfiguration extends ComponentConfiguration {
    /**
     * The size of the ui elements.
     *
     * @default ComponentSize.Automatic
     */
    size?: ComponentSize;
}

/**
 * Interface for configuration of cache depth.
 *
 * @interface
 * @example
 * ```js
 * var viewer = new Viewer({
 *     ...
 *     component: {
 *         cache: {
 *             depth: {
 *                 spherical: 2,
 *                 sequence: 3,
 *             }
 *         },
 *     },
 *     ...
 * });
 * ```
 */
interface CacheDepthConfiguration {
    /**
     * Cache depth in the sequence directions.
     *
     * @description Max value is 4. Value will be clamped
     * to the interval [0, 4].
     * @default 2
     */
    sequence: number;
    /**
     * Cache depth in the spherical direction.
     *
     * @description Max value is 2. Value will be clamped
     * to the interval [0, 2].
     * @default 1
     */
    spherical: number;
    /**
     * Cache depth in the step directions.
     *
     * @description Max value is 3. Value will be clamped
     * to the interval [0, 3].
     * @default 1
     */
    step: number;
    /**
     * Cache depth in the turn directions.
     *
     * @description Max value is 1. Value will be clamped
     * to the interval [0, 1].
     * @default 0
     */
    turn: number;
}
/**
 * Interface for configuration of cache component.
 *
 * @interface
 */
interface CacheConfiguration extends ComponentConfiguration {
    /**
     * Cache depth struct.
     */
    depth?: CacheDepthConfiguration;
}

/**
 * Interface for configuration of direction component.
 *
 * @interface
 * @example
 * ```js
 * var viewer = new Viewer({
 *     ...
 *     component: {
 *         direction: {
 *             minWidth: 140,
 *             maxWidth: 340,
 *         },
 *     },
 *     ...
 * });
 * ```
 */
interface DirectionConfiguration extends ComponentConfiguration {
    /**
     * Determines if the sequence arrow appearance should be different from
     * the non sequence arrows.
     *
     * @description Needs to be set to true for the sequence suffixed classes
     * to be applied to the navigation elements. Additional calculations will be
     * performed resulting in a performance cost.
     *
     * @default false
     */
    distinguishSequence?: boolean;
    /**
     * The image id representing the direction arrow to be highlighted.
     *
     * @description The arrow pointing towards the image corresponding to the
     * highlight id will be highlighted.
     *
     * @default undefined
     */
    highlightId?: string;
    /**
     * The min width of the non transformed container element holding
     * the navigation arrows.
     *
     * @description  Set min width of the non transformed
     * container element holding the navigation arrows.
     * If the min width is larger than the max width the
     * min width value will be used.
     *
     * The container element is automatically resized when the resize
     * method on the Viewer class is called.
     *
     * @default 260
     */
    minWidth?: number;
    /**
     * The max width of the non transformed container element holding
     * the navigation arrows.
     *
     * @description Set max width of the non transformed
     * container element holding the navigation arrows.
     * If the min width is larger than the max width the
     * min width value will be used.
     *
     * The container element is automatically resized when the resize
     * method on the Viewer class is called.
     *
     * @default 460
     */
    maxWidth?: number;
}

/**
 * Interface for configuration of keyboard component.
 *
 * @interface
 * @example
 * ```js
 * var viewer = new Viewer({
 *     ...
 *     component: {
 *         keyboard: {
 *             keyZoom: false,
 *             keySequenceNavigation: false,
 *             keySpatialNavigation: false,
 *         },
 *     },
 *     ...
 * });
 * ```
 */
interface KeyboardConfiguration extends ComponentConfiguration {
    /**
     * Enable or disable the `KeyPlayHandler`.
     *
     * @default true
     */
    keyPlay?: boolean;
    /**
     * Enable or disable the `KeySequenceNavigationHandler`.
     *
     * @default true
     */
    keySequenceNavigation?: boolean;
    /**
     * Enable or disable the `KeySpatialNavigationHandler`.
     *
     * @default true
     */
    keySpatialNavigation?: boolean;
    /**
     * Enable or disable the `KeyZoomHandler`.
     *
     * @default true
     */
    keyZoom?: boolean;
}

/**
 * Interface for configuration of marker component.
 *
 * @interface
 * @example
 * ```js
 * var viewer = new Viewer({
 *     ...
 *     component: {
 *         marker: {
 *             visibleBBoxSize: 80,
 *         },
 *     },
 *     ...
 * });
 * ```
 */
interface MarkerConfiguration extends ComponentConfiguration {
    /**
     * The size of the bounding box for which markers will be visible.
     *
     * @description Provided values will be clamped to the [1, 200]
     * interval.
     *
     * @default 100
     */
    visibleBBoxSize?: number;
}

/**
 * Interface for configuration of mouse component.
 *
 * @interface
 * @example
 * ```js
 * var viewer = new Viewer({
 *     ...
 *     component: {
 *         pointer: {
 *             dragPan: false,
 *             scrollZoom: false,
 *             touchZoom: false,
 *         },
 *     },
 *     ...
 * });
 * ```
 */
interface PointerConfiguration extends ComponentConfiguration {
    /**
     * Activate or deactivate the `DragPanHandler`.
     *
     * @default true
     */
    dragPan?: boolean;
    /**
     * Activate or deactivate the `EarthControlHandler`.
     *
     * @default true
     */
    earthControl?: boolean;
    /**
     * Activate or deactivate the `ScrollZoomHandler`.
     *
     * @default true
     */
    scrollZoom?: boolean;
    /**
     * Activate or deactivate the `TouchZoomHandler`.
     *
     * @default true
     */
    touchZoom?: boolean;
}

/**
 * Interface for configuration of sequence component.
 *
 * @interface
 * @example
 * ```js
 * const viewer = new Viewer({
 *     ...
 *     component: {
 *         sequence: {
 *             minWidth: 40,
 *             maxWidth: 80,
 *             visible: false,
 *         },
 *     },
 *     ...
 * });
 * ```
 */
interface SequenceConfiguration extends ComponentConfiguration {
    /**
     * Set the direction to follow when playing.
     *
     * @default EdgeDirection.Next
     */
    direction?: NavigationDirection;
    /**
     * The node id representing the direction arrow to be highlighted.
     *
     * @description When set to null no direction will be highlighted.
     * The arrow pointing towards the node corresponding to the
     * highlight id will be highlighted.
     *
     * @default undefined
     *
     * @ignore
     */
    highlightId?: string;
    /**
     * The max width of the sequence container.
     *
     * @description Set max width of the container element holding
     * the sequence navigation elements. If the min width is larger than the
     * max width the min width value will be used.
     *
     * The container element is automatically resized when the resize
     * method on the Viewer class is called.
     *
     * @default 117
     */
    maxWidth?: number;
    /**
     * The min width of the sequence container.
     *
     * @description Set min width of the container element holding
     * the sequence navigation elements. If the min width is larger than the
     * max width the min width value will be used.
     *
     * The container element is automatically resized when the resize
     * method on the Viewer class is called.
     *
     * @default 70
     */
    minWidth?: number;
    /**
     * Indicating whether the component is playing.
     *
     * @default false
     */
    playing?: boolean;
    /**
     * Determine whether the sequence UI elements
     * should be visible.
     *
     * @default true
     */
    visible?: boolean;
}

/**
 * Enumeration for slider mode.
 *
 * @enum {number}
 * @readonly
 *
 * @description Modes for specifying how transitions
 * between images are performed in slider mode. Only
 * applicable when the slider component determines
 * that transitions with motion is possilble. When it
 * is not, the stationary mode will be applied.
 */
declare enum SliderConfigurationMode {
    /**
     * Transitions with motion.
     *
     * @description The slider component moves the
     * camera between the image origins.
     *
     * In this mode it is not possible to zoom or pan.
     *
     * The slider component falls back to stationary
     * mode when it determines that the pair of images
     * does not have a strong enough relation.
     */
    Motion = 0,
    /**
     * Stationary transitions.
     *
     * @description The camera is stationary.
     *
     * In this mode it is possible to zoom and pan.
     */
    Stationary = 1
}
/**
 * Interface for configuration of slider ids.
 *
 * @interface
 */
interface SliderConfigurationIds {
    /**
     * Id for the image plane in the background.
     */
    background: string;
    /**
     * Id for the image plane in the foreground.
     */
    foreground: string;
}
/**
 * Interface for configuration of slider component.
 *
 * @interface
 * ```js
 * var viewer = new Viewer({
 *     ...
 *     component: {
 *         slider: {
 *             initialPosition: 0.5,
 *             ids: {
 *                 background: '<background-id>',
 *                 foreground: '<foreground-id>',
 *             },
 *             sliderVisible: true,
 *         },
 *     },
 *     ...
 * });
 * ```
 */
interface SliderConfiguration extends ComponentConfiguration {
    /**
     * Initial position of the slider on the interval [0, 1].
     *
     * @description Configures the initial position of the slider.
     * The inital position value will be used when the component
     * is activated.
     *
     * @default 1
     */
    initialPosition?: number;
    /**
     * Slider image ids.
     *
     * @description Configures the component to show the image
     * planes for the supplied image ids  in the foreground
     * and the background.
     */
    ids?: SliderConfigurationIds;
    /**
     * Value indicating whether the slider should be visible.
     *
     * @description Set the value controlling if the
     * slider is visible.
     *
     * @default true
     */
    sliderVisible?: boolean;
    /**
     * Mode used for image pair transitions.
     *
     * @description Configures the mode for transitions between
     * image pairs.
     */
    mode?: SliderConfigurationMode;
}

declare enum CameraVisualizationMode {
    /**
     * Cameras are hidden.
     */
    Hidden = 0,
    /**
     * Cameras are shown, all with the same color.
     */
    Homogeneous = 1,
    /**
     * Cameras are shown with colors based on the
     * their clusters.
     */
    Cluster = 2,
    /**
     * Cameras are shown with colors based on the
     * their connected components.
     */
    ConnectedComponent = 3,
    /**
     * Cameras are shown, with colors based on the
     * their sequence.
     */
    Sequence = 4
}

declare enum OriginalPositionMode {
    /**
     * Original positions are hidden.
     */
    Hidden = 0,
    /**
     * Visualize original positions with altitude change.
     */
    Altitude = 1,
    /**
     * Visualize original positions without altitude change,
     * i.e. as flat lines from the camera origin.
     */
    Flat = 2
}

declare enum PointVisualizationMode {
    /**
     * Points are hidden.
     */
    Hidden = 0,
    /**
     * Visualize points with original colors.
     */
    Original = 1,
    /**
     * Paint all points belonging to a specific
     * cluster with the same random color.
     */
    Cluster = 2
}

/**
 * Interface for configuration of spatial component.
 *
 * @interface
 * @example
 * ```js
 * var viewer = new Viewer({
 *     ...
 *     component: {
 *         spatial: {
 *             cameraSize: 0.5,
 *             cameraVisualizationMode: CameraVisualizationMode.Cluster,
 *             cellsVisible: true,
 *             originalPositionMode: OriginalPositionMode.Altitude,
 *             pointSize: 0.5,
 *             pointVisualizationMode: PointVisualizationMode.Hidden,
 *         },
 *     },
 *     ...
 * });
 * ```
 */
interface SpatialConfiguration extends ComponentConfiguration {
    /**
     * The camera size on the interval [0.01, 1].
     *
     * @default 0.1
     */
    cameraSize?: number;
    /**
     * Specify the camera visualization mode.
     *
     * @default CameraVisualizationMode.Homogeneous
     */
    cameraVisualizationMode?: CameraVisualizationMode;
    /**
     * Specify if the currently rendered cells should be visualize on
     * an approximated ground plane.
     *
     * @default false
     */
    cellsVisible?: boolean;
    /**
     * Cell grid depth from the cell of the currently
     * selected camera.
     *
     * @description Max value is 3. Value will be clamped
     * to the interval [1, 3].
     * @default 1
     */
    cellGridDepth?: number;
    /**
     * Specify the original position visualization mode.
     *
     * @description The original positions are hidden
     * by default.
     *
     * @default OriginalPositionMode.Hidden
     */
    originalPositionMode?: OriginalPositionMode;
    /**
     * The point size on the interval [0.01, 1].
     *
     * @default 0.1
     */
    pointSize?: number;
    /**
     * Specify if the points should be visible or not.
     *
     * @deprecated `pointsVisible` will be removed in
     * v5.x. Use {@link pointVisualizationMode} instead.
     *
     * @default true
     */
    pointsVisible?: boolean;
    /**
     * Specify how point clouds should be visualized.
     *
     * @default PointVisualizationMode.Original
     */
    pointVisualizationMode?: PointVisualizationMode;
}

/**
 * Enumeration for tag modes
 * @enum {number}
 * @readonly
 * @description Modes for the interaction in the tag component.
 */
declare enum TagMode {
    /**
     * Disables creating tags.
     */
    Default = 0,
    /**
     * Create a point geometry through a click.
     */
    CreatePoint = 1,
    /**
     * Create a points geometry through clicks.
     */
    CreatePoints = 2,
    /**
     * Create a polygon geometry through clicks.
     */
    CreatePolygon = 3,
    /**
     * Create a rect geometry through clicks.
     */
    CreateRect = 4,
    /**
     * Create a rect geometry through drag.
     *
     * @description Claims the mouse which results in mouse handlers like
     * drag pan and scroll zoom becoming inactive.
     */
    CreateRectDrag = 5
}

/**
 * Interface for configuration of tag component.
 *
 * @interface
 * @example
 * ```js
 * var viewer = new Viewer({
 *     ...
 *     component: {
 *         tag: {
 *             createColor: 0xFF0000,
 *             mode: TagMode.CreateRect,
 *         },
 *     },
 *     ...
 * });
 * ```
 */
interface TagConfiguration extends ComponentConfiguration {
    /**
     * The color of vertices and edges for tags that
     * are being created.
     *
     * @default 0xFFFFFF
     */
    createColor?: number;
    /**
     * Show an indicator at the centroid of the points geometry
     * that creates the geometry when clicked.
     * @default true
     */
    indicatePointsCompleter?: boolean;
    /**
     * The interaction mode of the tag component.
     *
     * @default TagMode.Default
     */
    mode?: TagMode;
}

interface ZoomConfiguration extends ComponentConfiguration {
    /**
     * The size of the ui elements.
     *
     * @default ComponentSize.Automatic
     */
    size?: ComponentSize;
}

/**
 * Interface for configuration of navigation component.
 *
 * @interface
 *  @example
 * ```js
 * var viewer = new Viewer({
 *     ...
 *     component: {
 *         fallback: {
 *             navigation: {
 *                 spatial: false,
 *             },
 *         },
 *     },
 *     ...
 * });
 * ```
 */
interface NavigationFallbackConfiguration extends ComponentConfiguration {
    /**
     * Enable or disable the sequence arrows.
     *
     * @default true
     */
    sequence?: boolean;
    /**
     * Enable or disable the spatial arrows.
     *
     * @default true
     */
    spatial?: boolean;
}

/**
 * Interface for the fallback component options that can be
 * provided to the viewer when the browser does not have
 * WebGL support.
 *
 * @interface
 */
interface FallbackOptions {
    /**
     * Show static images without pan, zoom, or transitions.
     *
     * @description Fallback for `image` when WebGL is not supported.
     *
     * @default false
     */
    image?: boolean;
    /**
     * Show static navigation arrows in the corners.
     *
     * @description Fallback for `direction` and `sequence` when WebGL is not supported.
     *
     * @default false
     */
    navigation?: boolean | NavigationFallbackConfiguration;
}

/**
 * Interface for the component options that can be provided to the viewer.
 *
 * @interface
 */
interface ComponentOptions {
    /**
     * Show attribution.
     *
     * @default true
     */
    attribution?: boolean;
    /**
     * Show indicator for bearing and field of view.
     *
     * @default true
     */
    bearing?: boolean | BearingConfiguration;
    /**
     * Cache images around the current one.
     *
     * @default true
     */
    cache?: boolean | CacheConfiguration;
    /**
     * Use a cover to avoid loading data until viewer interaction.
     *
     * @default true
     */
    cover?: boolean;
    /**
     * Show spatial direction arrows for navigation.
     *
     * @description Default spatial navigation when there is WebGL support.
     * Requires WebGL support.
     *
     * @default true
     */
    direction?: boolean | DirectionConfiguration;
    /**
     * Enable fallback component options
     * when the browser does not have WebGL support.
     *
     * @default undefined
     */
    fallback?: FallbackOptions;
    /**
     * Show image planes in 3D.
     *
     * @description Requires WebGL support.
     *
     * @default true
     */
    image?: boolean;
    /**
     * Enable use of keyboard commands.
     *
     * @description Requires WebGL support.
     *
     * @default true
     */
    keyboard?: boolean | KeyboardConfiguration;
    /**
     * Enable an interface for showing 3D markers in the viewer.
     *
     * @description Requires WebGL support.
     *
     * @default false
     */
    marker?: boolean | MarkerConfiguration;
    /**
     * Enable mouse, pen, and touch interaction for zoom and pan.
     *
     * @description Requires WebGL support.
     *
     * @default true
     */
    pointer?: boolean | PointerConfiguration;
    /**
     * Show HTML popups over images.
     *
     * @description Requires WebGL support.
     *
     * @default false
     */
    popup?: boolean;
    /**
     * Show sequence related navigation.
     *
     * @description Default sequence navigation when there is WebGL support.
     *
     * @default true
     */
    sequence?: boolean | SequenceConfiguration;
    /**
     * Show a slider for transitioning between image planes.
     *
     * @description Requires WebGL support.
     *
     * @default false
     */
    slider?: boolean | SliderConfiguration;
    /**
     * Enable an interface for showing spatial data in the viewer.
     *
     * @description Requires WebGL support.
     *
     * @default false
     */
    spatial?: boolean | SpatialConfiguration;
    /**
     * Enable an interface for drawing 2D geometries on top of images.
     *
     * @description Requires WebGL support.
     *
     * @default false
     */
    tag?: boolean | TagConfiguration;
    /**
     * Show buttons for zooming in and out.
     *
     * @description Requires WebGL support.
     *
     * @default true
     */
    zoom?: boolean | ZoomConfiguration;
}

/**
 * Interface for the URL options that can be provided to the viewer.
 *
 * @interface
 */
interface UrlOptions {
    /**
     * Explore host.
     *
     * @description Host used for links to the full
     * mapillary website.
     *
     * @default {"www.mapillary.com"}
     */
    exploreHost?: string;
    /**
     * Scheme.
     *
     * @description Used for all hosts.
     *
     * @default {"https"}
     */
    scheme?: string;
}

/**
 * Enumeration for camera controls.
 *
 * @description Specifies different modes for how the
 * camera is controlled through pointer, keyboard or
 * other modes of input.
 *
 * @enum {number}
 * @readonly
 */
declare enum CameraControls {
    /**
     * Control the camera with custom logic by
     * attaching a custom camera controls
     * instance to the {@link Viewer}.
     */
    Custom = 0,
    /**
     * Control the camera from a birds perspective
     * to get an overview.
     */
    Earth = 1,
    /**
     * Control the camera in a first person view
     * from the street level perspective.
     */
    Street = 2
}

/**
 * Interface for the options that can be provided to the {@link Viewer}.
 */
interface ViewerOptions {
    /**
     * Optional access token for API requests of
     * resources.
     *
     * @description Can be a user access token or
     * a client access token.
     *
     * A Mapillary client access token can be obtained
     * by [signing in](https://www.mapillary.com/app/?login=true) and
     * [registering an application](https://www.mapillary.com/dashboard/developers).
     *
     * The access token can also be set through the
     * {@link Viewer.setAccessToken} method.
     */
    accessToken?: string;
    /**
     * Value specifying the initial camera controls of
     * the viewer.
     *
     * @default {@link CameraControls.Street}
     */
    cameraControls?: CameraControls;
    /**
     * Value specifying if combined panning should be activated.
     *
     * @default true
     */
    combinedPanning?: boolean;
    /**
     * Component options.
     */
    component?: ComponentOptions;
    /**
     * The HTML element in which MapillaryJS will render the
     * viewer, or the element's string `id`. The
     * specified element must have no children.
     */
    container: string | HTMLElement;
    /**
     * Optional data provider class instance for API and static
     * resource requests.
     *
     * @description The data provider will override the
     * default MapillaryJS data provider and take responsibility
     * for all IO handling.
     *
     * The data provider takes precedence over the {@link ViewerOptions.accessToken} property.
     *
     * A data provider instance must implement all members
     * specified in the {@link IDataProvider} interface. This can
     * be done by extending the {@link DataProviderBase} class or
     * implementing the interface directly.
     */
    dataProvider?: IDataProvider;
    /**
     * Optional `image-id` to start from. The id
     * can be any Mapillary image. If a id is provided the viewer is
     * bound to that id until it has been fully loaded. If null is provided
     * no image is loaded at viewer initialization and the viewer is not
     * bound to any particular id. Any image can then be navigated to
     * with e.g. `viewer.moveTo("<my-image-id>")`.
     */
    imageId?: string;
    /**
     * Value indicating if the viewer should fetch high resolution
     * image tiles.
     *
     * @description Can be used when extending MapillaryJS with
     * a custom data provider. If no image tiling server exists
     * the image tiling can be inactivated to avoid error
     * messages about non-existing tiles in the console.
     *
     * @default true
     */
    imageTiling?: boolean;
    /**
     * The render mode in the viewer.
     *
     * @default {@link RenderMode.Fill}
     */
    renderMode?: RenderMode;
    /**
     * A base URL for retrieving a PNG sprite image and json metadata file.
     * File name extensions will be automatically appended.
     */
    sprite?: string;
    /**
     * If `true`, the viewer will automatically resize when the
     * browser window resizes.
     *
     * @default true
     */
    trackResize?: boolean;
    /**
     * The transtion mode in the viewer.
     *
     * @default {@link TransitionMode.Default}
     */
    transitionMode?: TransitionMode;
    /**
     * The URL options.
     */
    url?: UrlOptions;
}

declare class KeyboardService {
    private _keyDown$;
    private _keyUp$;
    constructor(canvasContainer: HTMLElement);
    get keyDown$(): Observable<KeyboardEvent>;
    get keyUp$(): Observable<KeyboardEvent>;
}

declare class MouseService {
    private _activeSubject$;
    private _active$;
    private _domMouseDown$;
    private _domMouseMove$;
    private _domMouseDragStart$;
    private _domMouseDrag$;
    private _domMouseDragEnd$;
    private _documentMouseMove$;
    private _documentMouseUp$;
    private _mouseDown$;
    private _mouseEnter$;
    private _mouseMove$;
    private _mouseLeave$;
    private _mouseUp$;
    private _mouseOut$;
    private _mouseOver$;
    private _contextMenu$;
    private _consistentContextMenu$;
    private _click$;
    private _dblClick$;
    private _deferPixelClaims$;
    private _deferPixels$;
    private _proximateClick$;
    private _staticClick$;
    private _mouseWheel$;
    private _mouseDragStart$;
    private _mouseDrag$;
    private _mouseDragEnd$;
    private _mouseRightDragStart$;
    private _mouseRightDrag$;
    private _mouseRightDragEnd$;
    private _claimMouse$;
    private _claimWheel$;
    private _mouseOwner$;
    private _wheelOwner$;
    private _windowBlur$;
    private _subscriptions;
    constructor(container: EventTarget, canvasContainer: EventTarget, domContainer: EventTarget, doc: EventTarget);
    get active$(): Observable<boolean>;
    get activate$(): Subject<boolean>;
    get documentMouseMove$(): Observable<MouseEvent>;
    get documentMouseUp$(): Observable<MouseEvent>;
    get domMouseDragStart$(): Observable<MouseEvent>;
    get domMouseDrag$(): Observable<MouseEvent>;
    get domMouseDragEnd$(): Observable<MouseEvent | FocusEvent>;
    get domMouseDown$(): Observable<MouseEvent>;
    get domMouseMove$(): Observable<MouseEvent>;
    get mouseOwner$(): Observable<string>;
    get mouseDown$(): Observable<MouseEvent>;
    get mouseEnter$(): Observable<MouseEvent>;
    get mouseMove$(): Observable<MouseEvent>;
    get mouseLeave$(): Observable<MouseEvent>;
    get mouseOut$(): Observable<MouseEvent>;
    get mouseOver$(): Observable<MouseEvent>;
    get mouseUp$(): Observable<MouseEvent>;
    get click$(): Observable<MouseEvent>;
    get dblClick$(): Observable<MouseEvent>;
    get contextMenu$(): Observable<MouseEvent>;
    get mouseWheel$(): Observable<WheelEvent>;
    get mouseDragStart$(): Observable<MouseEvent>;
    get mouseDrag$(): Observable<MouseEvent>;
    get mouseDragEnd$(): Observable<MouseEvent | FocusEvent>;
    get mouseRightDragStart$(): Observable<MouseEvent>;
    get mouseRightDrag$(): Observable<MouseEvent>;
    get mouseRightDragEnd$(): Observable<MouseEvent | FocusEvent>;
    get proximateClick$(): Observable<MouseEvent>;
    get staticClick$(): Observable<MouseEvent>;
    get windowBlur$(): Observable<FocusEvent>;
    dispose(): void;
    claimMouse(name: string, zindex: number): void;
    unclaimMouse(name: string): void;
    deferPixels(name: string, deferPixels: number): void;
    undeferPixels(name: string): void;
    claimWheel(name: string, zindex: number): void;
    unclaimWheel(name: string): void;
    filtered$<T>(name: string, observable$: Observable<T>): Observable<T>;
    filteredWheel$<T>(name: string, observable$: Observable<T>): Observable<T>;
    private _createDeferredMouseMove$;
    private _createMouseDrag$;
    private _createMouseDragEnd$;
    private _createMouseDragStart$;
    private _createMouseDragInitiate$;
    private _createOwner$;
    private _filtered;
    private _mouseButton;
    private _buttonReleased;
    private _isMousePen;
}

/**
 * Enumeration for alignments
 * @enum {number}
 * @readonly
 */
declare enum Alignment {
    /**
     * Align to bottom
     */
    Bottom = 0,
    /**
     * Align to bottom left
     */
    BottomLeft = 1,
    /**
     * Align to bottom right
     */
    BottomRight = 2,
    /**
     * Align to center
     */
    Center = 3,
    /**
     * Align to left
     */
    Left = 4,
    /**
     * Align to right
     */
    Right = 5,
    /**
     * Align to top
     */
    Top = 6,
    /**
     * Align to top left
     */
    TopLeft = 7,
    /**
     * Align to top right
     */
    TopRight = 8
}

interface ISpriteAtlas {
    loaded: boolean;
    getGLSprite(name: string): THREE.Object3D;
    getDOMSprite(name: string, float?: Alignment): vd.VNode;
}

declare class SpriteAtlas implements ISpriteAtlas {
    private _image;
    private _texture;
    private _json;
    set json(value: Sprites);
    set image(value: HTMLImageElement);
    get loaded(): boolean;
    getGLSprite(name: string): THREE.Object3D;
    getDOMSprite(name: string, float?: Alignment): vd.VNode;
}
interface Sprite {
    width: number;
    height: number;
    x: number;
    y: number;
    pixelRatio: number;
}
interface Sprites {
    [key: string]: Sprite;
}
declare class SpriteService {
    private _retina;
    private _spriteAtlasOperation$;
    private _spriteAtlas$;
    private _atlasSubscription;
    constructor(sprite?: string);
    get spriteAtlas$(): Observable<SpriteAtlas>;
    dispose(): void;
}

interface TouchPinch {
    /**
     * X client coordinate for center of pinch.
     */
    clientX: number;
    /**
     * Y client coordinate for center of pinch.
     */
    clientY: number;
    /**
     * X page coordinate for center of pinch.
     */
    pageX: number;
    /**
     * Y page coordinate for center of pinch.
     */
    pageY: number;
    /**
     * X screen coordinate for center of pinch.
     */
    screenX: number;
    /**
     * Y screen coordinate for center of pinch.
     */
    screenY: number;
    /**
     * Distance change in X direction between touches
     * compared to previous event.
     */
    changeX: number;
    /**
     * Distance change in Y direction between touches
     * compared to previous event.
     */
    changeY: number;
    /**
     * Pixel distance between touches.
     */
    distance: number;
    /**
     * Change in pixel distance between touches compared
     * to previous event.
     */
    distanceChange: number;
    /**
     * Distance in X direction between touches.
     */
    distanceX: number;
    /**
     * Distance in Y direction between touches.
     */
    distanceY: number;
    /**
     * Original touch event.
     */
    originalEvent: TouchEvent;
    /**
     * First touch.
     */
    touch1: Touch;
    /**
     * Second touch.
     */
    touch2: Touch;
}

declare class TouchService {
    private _activeSubject$;
    private _active$;
    private _touchStart$;
    private _touchMove$;
    private _touchEnd$;
    private _touchCancel$;
    private _singleTouchDrag$;
    private _singleTouchDragStart$;
    private _singleTouchDragEnd$;
    private _singleTouchMove$;
    private _pinchOperation$;
    private _pinch$;
    private _pinchStart$;
    private _pinchEnd$;
    private _pinchChange$;
    private _doubleTap$;
    private _subscriptions;
    constructor(canvasContainer: HTMLElement, domContainer: HTMLElement);
    get active$(): Observable<boolean>;
    get activate$(): Subject<boolean>;
    get doubleTap$(): Observable<TouchEvent>;
    get touchStart$(): Observable<TouchEvent>;
    get touchMove$(): Observable<TouchEvent>;
    get touchEnd$(): Observable<TouchEvent>;
    get touchCancel$(): Observable<TouchEvent>;
    get singleTouchDragStart$(): Observable<TouchEvent>;
    get singleTouchDrag$(): Observable<TouchEvent>;
    get singleTouchDragEnd$(): Observable<TouchEvent>;
    get pinch$(): Observable<TouchPinch>;
    get pinchStart$(): Observable<TouchEvent>;
    get pinchEnd$(): Observable<TouchEvent>;
    dispose(): void;
}

/**
 * Test whether the current browser supports the full
 * functionality of MapillaryJS.
 *
 * @description The full functionality includes WebGL rendering.
 *
 * @return {boolean}
 *
 * @example `var supported = isSupported();`
 */
declare function isSupported(): boolean;
/**
 * Test whether the current browser supports the fallback
 * functionality of MapillaryJS.
 *
 * @description The fallback functionality does not include WebGL
 * rendering, only 2D canvas rendering.
 *
 * @return {boolean}
 *
 * @example `var fallbackSupported = isFallbackSupported();`
 */
declare function isFallbackSupported(): boolean;

declare type ComparisonFilterOperator = "==" | "!=" | ">" | ">=" | "<" | "<=";
declare type SetMembershipFilterOperator = "in" | "!in";
declare type CombiningFilterOperator = "all";
declare type FilterOperator = CombiningFilterOperator | ComparisonFilterOperator | SetMembershipFilterOperator;
declare type FilterImage = Pick<Image, "cameraType" | "capturedAt" | "clusterId" | "creatorId" | "creatorUsername" | "exifOrientation" | "height" | "id" | "mergeId" | "merged" | "ownerId" | "private" | "qualityScore" | "sequenceId" | "width">;
declare type FilterKey = keyof FilterImage;
declare type FilterValue = boolean | number | string;
declare type ComparisonFilterExpression = [
    ComparisonFilterOperator,
    FilterKey,
    FilterValue
];
declare type SetMembershipFilterExpression = [
    SetMembershipFilterOperator,
    FilterKey,
    ...FilterValue[]
];
declare type CombiningFilterExpression = [
    CombiningFilterOperator,
    ...(ComparisonFilterExpression | SetMembershipFilterExpression)[]
];
declare type FilterExpression = ComparisonFilterExpression | SetMembershipFilterExpression | CombiningFilterExpression;

/**
 * @event
 */
declare type ViewerEventType = "bearing" | "click" | "contextmenu" | "dblclick" | "fov" | "dataloading" | "load" | "mousedown" | "mousemove" | "mouseout" | "mouseover" | "mouseup" | "moveend" | "movestart" | "navigable" | "image" | "position" | "pov" | "reference" | "remove" | "sequenceedges" | "spatialedges";

/**
 * @interface
 *
 * @description Interface for custom camera controls.
 * This is a specification for implementers to model:
 * it is not an exported method or class.
 *
 * Custom camera controls allow the API user to freely
 * move the viewer's camera and define the camera
 * projection used. These camera properties are used
 * to render the viewer 3D scene directly into the
 * viewer's GL context.
 *
 * Custom camera controls must implement the
 * onActivate, onAnimationFrame, onAttach, onDeactivate,
 * onDetach, onReference, and onResize methods.
 *
 * Custom camera controls trigger rerendering
 * automatically when the camera pose or projection
 * is changed through the projectionMatrix and
 * viewMatrix callbacks.
 *
 * See the
 * [model view projection article]{@link https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection}
 * on MDN for an introduction to view and projection matrices.
 *
 * Custom camera controls can choose to make updates on
 * each animation frame or only based on user input.
 * Invoking updates on each camera frame is more resource
 * intensive.
 *
 * Only a single custom camera control instance can be
 * attached to the viewer at any given time.
 */
interface ICustomCameraControls {
    /**
     * Method called when the camera controls have been
     * activated and is responsible for moving the
     * viewer's camera and defining its projection. This
     * method gives the camera controls a chance to initialize
     * resources, perform any transitions, and determine
     * initial state.
     *
     * @description Use the {@link Viewer.getContainer} method
     * to get the container for determining the viewer size
     * and aspect as well as for attaching event handlers.
     *
     * Use the view matrix to determine initial properties such
     * as camera position, forward vector, and up vector.
     *
     * Use the projection matrix to determine the initial
     * projection properties.
     *
     * Store the reference coordiante translations
     * during future reference reference changes.
     *
     * @param {IViewer} viewer - The viewer this custom
     * camera controls instance was just added to.
     * @param {Array<number>} viewMatrix - The viewer's view matrix.
     * @param {Array<number>} projectionMatrix - The viewers's
     * projection matrix.
     * @param {LngLatAlt} reference - The viewer's reference.
     */
    onActivate(viewer: IViewer, viewMatrix: number[], projectionMatrix: number[], reference: LngLatAlt): void;
    /**
     * Method called for each animation frame.
     *
     * @desdcription Custom camera controls can choose to
     * make updates on each animation frame or only based on
     * user input. Invoking updates on each animation frame is
     * more resource intensive.
     *
     * @param {IViewer} viewer - The viewer this custom
     * camera controls instance is attached to.
     *
     * @param {number} frameId - The request animation frame's id.
     */
    onAnimationFrame(viewer: IViewer, frameId: number): void;
    /**
     * Method called when the camera controls have been
     * attached to the viewer.
     * This gives the camera controls a chance to initialize
     * resources.
     *
     * @description Camera controls are attached to the
     * viewer with the  with {@link Viewer.attachCustomCameraControls}
     * method.
     *
     * Use the matrix callback functions
     * to modify the camera pose and projection of the
     * viewer's camera.
     *
     * Invoking the matrix callbacks has no effect if the
     * custom camera controls have not been activated.
     *
     * @param {IViewer} viewer - The viewer this custom
     * camera controls instance was just added to.
     */
    onAttach(viewer: IViewer, viewMatrixCallback: (viewMatrix: number[]) => void, projectionMatrixCallback: (projectionMatrix: number[]) => void): void;
    /**
     * Method called when the camera controls have been deactivated.
     * This gives the camera controls a chance to clean up resources
     * and event listeners.
     *
     * @param {IViewer} viewer - The viewer this custom camera controls
     * instance is attached to.
     */
    onDeactivate(viewer: IViewer): void;
    /**
     * Method called when the camera controls have been detached from
     * the viewer. This gives the camera controls a chance to clean
     * up resources and event listeners.
     *
     * @description Camera controls are attached to the
     * viewer with the  with {@link Viewer.detachCustomCameraControls}
     * method.
     *
     * @param {IViewer} viewer - The viewer this custom camera
     * controls instance was just detached from.
     */
    onDetach(viewer: IViewer): void;
    /**
     * Method called when the viewer's reference position has changed.
     * This gives the custom camera controls a chance to reposition
     * the camera.
     *
     * @description Calculate the updated topocentric positions
     * for scene objects using the previous reference, the
     * new provided reference as well as the
     * {@link geodeticToEnu} and
     * {@link enuToGeodetic} functions.
     *
     * @param {IViewer} viewer - The viewer this custom renderer
     * is added to.
     * @param {LngLatAlt} reference - The viewer's current
     * reference position.
     */
    onReference(viewer: IViewer, reference: LngLatAlt): void;
    /**
     * Method called when the viewer has been resized.
     *
     * @description Use this method to modify the projection.
     */
    onResize(viewer: IViewer): void;
}

declare enum RenderPass {
    /**
     * Occurs after the background render pass.
     */
    Opaque = 0
}

/**
 * @interface
 *
 * @description Interface for custom renderers. This is a
 * specification for implementers to model: it is not
 * an exported method or class.
 *
 * A custom renderer allows the API user to render directly
 * into the viewer's GL context using the viewer's camera.
 *
 * Custom renderers must have a unique id. They must implement
 * render, onReferenceChanged, onAdd, and onRemove. They can
 * trigger rendering using {@link Viewer.triggerRerender}.
 *
 * The viewer uses a metric topocentric
 * [local east, north, up coordinate system](https://en.wikipedia.org/wiki/Local_tangent_plane_coordinates).
 *
 * Custom renderers can calculate the topocentric positions
 * of their objects using the reference parameter of the
 * renderer interface methods and the {@link geodeticToEnu}
 * method.
 *
 * During a render pass, custom renderers
 * are called in the order they were added.
 */
interface ICustomRenderer {
    /**
     * A unique renderer id.
     */
    id: string;
    /**
     * The custom renderer's render pass.
     *
     * @description The {@link ICustomRenderer.render} method
     * will be called during this render pass.
     */
    renderPass: RenderPass;
    /**
     * Method called when the renderer has been added to the
     * viewer. This gives the
     * renderer a chance to initialize gl resources and
     * register event listeners.
     *
     * @description Custom renderers are added with the
     * with {@link Viewer.addCustomRenderer} method.
     *
     * Calculate the topocentric positions
     * for scene objects using the provided reference and
     * the {@link geodeticToEnu} function.
     *
     * @param {IViewer} viewer - The viewer this custom renderer
     * was just added to.
     * @param {LngLatAlt} reference - The viewer's current
     * reference position.
     * @param {WebGLRenderingContext | WebGL2RenderingContext} context -
     * The viewer's gl context.
     */
    onAdd(viewer: IViewer, reference: LngLatAlt, context: WebGLRenderingContext | WebGL2RenderingContext): void;
    /**
     * Method called when the viewer's reference position has changed.
     * This gives the renderer a chance to reposition its scene objects.
     *
     * @description Calculate the updated topocentric positions
     * for scene objects using the provided reference and
     * the {@link geodeticToEnu} function.
     *
     * @param {IViewer} viewer - The viewer this custom renderer
     * is added to.
     * @param {LngLatAlt} reference - The viewer's current
     * reference position.
     */
    onReference(viewer: IViewer, reference: LngLatAlt): void;
    /**
     * Method called when the renderer has been removed from the
     * viewer. This gives the
     * renderer a chance to clean up gl resources and event
     * listeners.
     *
     * @description Custom renderers are remove with the
     * {@link Viewer.removeCustomRenderer} method.
     *
     * @param {IViewer} viewer - The viewer this custom renderer
     * was just removed from.
     * @param {WebGLRenderingContext | WebGL2RenderingContext} context -
     * The viewer's gl context.
     */
    onRemove(viewer: IViewer, context: WebGLRenderingContext | WebGL2RenderingContext): void;
    /**
     * Called during an animation frame allowing the renderer to draw
     * into the GL context. The layer cannot make assumptions
     * about the current GL state.
     *
     * @description Take a look at the
     * [WebGL model view projection article](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection)
     * on MDN for an introduction to the view and projection matrices.
     *
     * @param {WebGLRenderingContext | WebGL2RenderingContext} context The
     * viewer's WebGL context.
     * @param {Array<number>} viewMatrix The viewer's view matrix.
     * @param {Array<number>} projectionMatrix The viewers's projection
     * matrix.
     */
    render(context: WebGLRenderingContext | WebGL2RenderingContext, viewMatrix: number[], projectionMatrix: number[]): void;
}

/**
 * @interface PointOfView
 *
 * Interface that represents the point of view of the viewer.
 */
interface PointOfView {
    /**
     * Value indicating the current bearing of the viewer
     * measured in degrees clockwise with respect to north.
     * Ranges from 0° to 360°.
     */
    bearing: number;
    /**
     * The camera tilt in degrees, relative to a horizontal plane.
     * Ranges from 90° (directly upwards) to -90° (directly downwards).
     */
    tilt: number;
}

interface IViewer {
    readonly dataProvider: IDataProvider;
    readonly isNavigable: boolean;
    activateCombinedPanning(): void;
    activateComponent(name: string): void;
    activateCover(): void;
    addCustomRenderer(renderer: ICustomRenderer): void;
    attachCustomCameraControls(controls: ICustomCameraControls): void;
    deactivateCombinedPanning(): void;
    deactivateComponent(name: string): void;
    deactivateCover(): void;
    detachCustomCameraControls(): Promise<ICustomCameraControls>;
    fire<T>(type: ViewerEventType, event: T): void;
    getBearing(): Promise<number>;
    getCameraControls(): Promise<CameraControls>;
    getCanvas(): HTMLCanvasElement;
    getCanvasContainer(): HTMLDivElement;
    getCenter(): Promise<number[]>;
    getComponent<TComponent extends Component<ComponentConfiguration>>(name: string): TComponent;
    getContainer(): HTMLElement;
    getFieldOfView(): Promise<number>;
    getImage(): Promise<Image>;
    getPointOfView(): Promise<PointOfView>;
    getPosition(): Promise<LngLat>;
    getReference(): Promise<LngLatAlt>;
    getZoom(): Promise<number>;
    hasCustomCameraControls(controls: ICustomCameraControls): boolean;
    hasCustomRenderer(rendererId: string): boolean;
    moveDir(direction: NavigationDirection): Promise<Image>;
    moveTo(imageId: string): Promise<Image>;
    off<T>(type: ViewerEventType, handler: (event: T) => void): void;
    on<T>(type: ViewerEventType, handler: (event: T) => void): void;
    project(lngLat: LngLat): Promise<number[]>;
    projectFromBasic(basicPoint: number[]): Promise<number[]>;
    remove(): void;
    removeCustomRenderer(rendererId: string): void;
    resize(): void;
    setCameraControls(controls: CameraControls): void;
    setCenter(center: number[]): void;
    setFieldOfView(fov: number): void;
    setFilter(filter?: FilterExpression): Promise<void>;
    setRenderMode(renderMode: RenderMode): void;
    setTransitionMode(transitionMode: TransitionMode): void;
    setAccessToken(accessToken?: string): Promise<void>;
    setZoom(zoom: number): void;
    triggerRerender(): void;
    unproject(pixelPoint: number[]): Promise<LngLat>;
    unprojectToBasic(pixelPoint: number[]): Promise<number[]>;
}

/**
 * Interface for general viewer events.
 */
interface ViewerEvent {
    /**
     * The viewer object that fired the event.
     */
    target: IViewer;
    /**
     * The event type.
     */
    type: ViewerEventType;
}

/**
 * Interface for bearing viewer events.
 */
interface ViewerBearingEvent extends ViewerEvent {
    /**
     * Bearing is measured in degrees
     * clockwise with respect to north.
     *
     * @description Bearing is related to the computed
     * compass angle ({@link Image.computedCompassAngle})
     * from SfM, not the original EXIF compass angle.
     */
    bearing: number;
    type: "bearing";
}

/**
 * Interface for viewer data loading events.
 *
 * @description Fired when any viewer data (image, mesh, metadata, etc)
 * begins loading or changing asyncronously as a result of viewer
 * navigation.
 *
 * Also fired when the data has finished loading and the viewer
 * is able to perform the navigation.
 */
interface ViewerDataLoadingEvent extends ViewerEvent {
    /**
     * Indicates if the viewer navigation is awaiting data load.
     */
    loading: boolean;
    type: "dataloading";
}

/**
 * Interface for mouse-related viewer events.
 *
 * @example
 * ```js
 * // The `click` event is an example of a `ViewerMouseEvent`.
 * // Set up an event listener on the viewer.
 * viewer.on('click', function(e) {
 *   // The event object contains information like the
 *   // coordinates of the point in the viewer that was clicked.
 *   console.log('A click event has occurred at ' + e.lngLat);
 * });
 * ```
 */
interface ViewerMouseEvent extends ViewerEvent {
    /**
     * The basic coordinates in the current image of the mouse
     * event target.
     *
     * @description In some situations mouse events can occur outside of
     * the border of a image. In that case the basic coordinates will be
     * `null`.
     *
     * The basic point is only provided when the
     * {@link CameraControls.Street} mode is active. For all other camera
     * control modes, the basic point will be `null`.
     *
     * Basic coordinates are 2D coordinates on the [0, 1] interval
     * and has the origin point, (0, 0), at the top left corner and the
     * maximum value, (1, 1), at the bottom right corner of the original
     * image.
     */
    basicPoint: number[];
    /**
     * The geographic location in the viewer of the mouse event target.
     *
     * @description In some situations the viewer can not determine a valid
     * geographic location for the mouse event target. In that case the
     * geographic coordinates will be `null`.
     */
    lngLat: LngLat;
    /**
     * The pixel coordinates of the mouse event target, relative to
     * the viewer and measured from the top left corner.
     */
    pixelPoint: number[];
    /**
     * The original event that triggered the viewer event.
     */
    originalEvent: MouseEvent;
    /**
     * The event type.
     */
    type: "click" | "contextmenu" | "dblclick" | "mousedown" | "mousemove" | "mouseout" | "mouseover" | "mouseup";
}

/**
 * Interface for navigable viewer events.
 */
interface ViewerNavigableEvent extends ViewerEvent {
    /**
     * The navigable state indicates if the viewer supports
     * moving, i.e. calling the `moveTo` and `moveDir`
     * methods. The viewer will not be in a navigable state if the cover
     * is activated and the viewer has been supplied a id. When the cover
     * is deactivated or activated without being supplied a id it will
     * be navigable.
     */
    navigable: boolean;
    type: "navigable";
}

/**
 * Interface for navigation edge viewer events.
 */
interface ViewerNavigationEdgeEvent extends ViewerEvent {
    /**
     * The viewer's current navigation edge status.
     */
    status: NavigationEdgeStatus;
    type: "sequenceedges" | "spatialedges";
}

/**
 * Interface for viewer image events.
 */
interface ViewerImageEvent extends ViewerEvent {
    /**
     * The viewer's current image.
     */
    image: Image;
    type: "image";
}

/**
 * Interface for viewer state events.
 *
 * @example
 * ```js
 * // The `fov` event is an example of a `ViewerStateEvent`.
 * // Set up an event listener on the viewer.
 * viewer.on('fov', function(e) {
 *   console.log('A fov event has occured');
 * });
 * ```
 */
interface ViewerStateEvent extends ViewerEvent {
    /**
     * The event type.
     */
    type: "fov" | "moveend" | "movestart" | "position" | "pov" | "remove";
}

declare type ComponentName = "attribution" | "bearing" | "cache" | "cover" | "direction" | "image" | "keyboard" | "marker" | "pointer" | "popup" | "sequence" | "slider" | "spatial" | "tag" | "zoom";

declare type FallbackComponentName = "imagefallback" | "navigationfallback";

/**
 * Interface for viewer load events.
 *
 * @description Fired immediately after all necessary resources
 * have been downloaded and the first visually complete
 * rendering of the viewer has occurred.
 *
 * The visually complete rendering does not include custom
 * renderers.
 *
 * This event is only fired for viewer configurations where
 * the WebGL context is created, i.e. not when using the
 * fallback functionality only.
 *
 * @example
 * ```js
 * // Set up an event listener on the viewer.
 * viewer.on('load', function(e) {
 *   console.log('A load event has occured');
 * });
 * ```
 */
interface ViewerLoadEvent extends ViewerEvent {
    type: "load";
}

/**
 * Interface for viewer reference events.
 */
interface ViewerReferenceEvent extends ViewerEvent {
    /**
     * The viewer's current reference.
     */
    reference: LngLatAlt;
    type: "reference";
}

/**
 * @class Viewer
 *
 * @classdesc The Viewer object represents the navigable image viewer.
 * Create a Viewer by specifying a container, client ID, image ID and
 * other options. The viewer exposes methods and events for programmatic
 * interaction.
 *
 * In the case of asynchronous methods, MapillaryJS returns promises to
 * the results. Notifications are always emitted through JavaScript events.
 */
declare class Viewer extends EventEmitter implements IViewer {
    /**
     * Private component controller object which manages component states.
     */
    private _componentController;
    /**
     * Private container object which maintains the DOM Element,
     * renderers and relevant services.
     */
    private _container;
    /**
     * Private observer object which observes the viewer state and
     * fires events on behalf of the viewer.
     */
    private _observer;
    /**
     * Private navigator object which controls navigation.
     */
    private _navigator;
    /**
     * Private custom camera controls object which handles
     * custom control subscriptions.
     */
    private _customCameraControls;
    /**
     * Private custom renderer object which controls WebGL custom
     * rendering subscriptions.
     */
    private _customRenderer;
    /**
     * Create a new viewer instance.
     *
     * @description The `Viewer` object represents the street imagery
     * viewer on your web page. It exposes methods and properties that
     * you can use to programatically change the view, and fires
     * events as users interact with it.
     *
     * It is possible to initialize the viewer with or
     * without a ID.
     *
     * When you want to show a specific image in the viewer from
     * the start you should initialize it with a ID.
     *
     * When you do not know the first image ID at implementation
     * time, e.g. in a map-viewer application you should initialize
     * the viewer without a ID and call `moveTo` instead.
     *
     * When initializing with an ID the viewer is bound to that ID
     * until the image for that ID has been successfully loaded.
     * Also, a cover with the image of the ID will be shown.
     * If the data for that ID can not be loaded because the ID is
     * faulty or other errors occur it is not possible to navigate
     * to another ID because the viewer is not navigable. The viewer
     * becomes navigable when the data for the ID has been loaded and
     * the image is shown in the viewer. This way of initializing
     * the viewer is mostly for embedding in blog posts and similar
     * where one wants to show a specific image initially.
     *
     * If the viewer is initialized without a ID (with null or
     * undefined) it is not bound to any particular ID and it is
     * possible to move to any ID with `viewer.moveTo("<my-image-id>")`.
     * If the first move to a ID fails it is possible to move to another
     * ID. The viewer will show a black background until a move
     * succeeds. This way of intitializing is suited for a map-viewer
     * application when the initial ID is not known at implementation
     * time.
     *
     * @param {ViewerOptions} options - Optional configuration object
     * specifying Viewer's and the components' initial setup.
     *
     * @example
     * ```js
     * var viewer = new Viewer({
     *     accessToken: "<my-access-token>",
     *     container: "<my-container-id>",
     * });
     * ```
     */
    constructor(options: ViewerOptions);
    /**
     * Returns the data provider used by the viewer to fetch
     * all contracts, ents, and buffers.
     *
     * @description The viewer's data provider can be set
     * upon initialization through the {@link ViewerOptions.dataProvider}
     * property.
     *
     * @returns {IDataProvider} The viewer's data provider.
     */
    get dataProvider(): IDataProvider;
    /**
     * Return a boolean indicating if the viewer is in a navigable state.
     *
     * @description The navigable state indicates if the viewer supports
     * moving, i.e. calling the {@link moveTo} and {@link moveDir}
     * methods or changing the authentication state,
     * i.e. calling {@link setAccessToken}. The viewer will not be in a navigable
     * state if the cover is activated and the viewer has been supplied a ID.
     * When the cover is deactivated or the viewer is activated without being
     * supplied a ID it will be navigable.
     *
     * @returns {boolean} Boolean indicating whether the viewer is navigable.
     */
    get isNavigable(): boolean;
    /**
     * Activate the combined panning functionality.
     *
     * @description The combined panning functionality is active by default.
     */
    activateCombinedPanning(): void;
    /**
     * Activate a component.
     *
     * @param {ComponentName | FallbackComponentName} name - Name of
     * the component which will become active.
     *
     * @example
     * ```js
     * viewer.activateComponent("marker");
     * ```
     */
    activateComponent(name: ComponentName | FallbackComponentName): void;
    /**
     * Activate the cover (deactivates all other components).
     */
    activateCover(): void;
    /**
     * Add a custom renderer to the viewer's rendering pipeline.
     *
     * @description During a render pass, custom renderers
     * are called in the order they were added.
     *
     * @param renderer - The custom renderer implementation.
     */
    addCustomRenderer(renderer: ICustomRenderer): void;
    /**
     * Attach custom camera controls to control the viewer's
     * camera pose and projection.
     *
     * @description Custom camera controls allow the API user
     * to move the viewer's camera freely and define the camera
     * projection. These camera properties are used
     * to render the viewer 3D scene directly into the
     * viewer's GL context.
     *
     * Only a single custom camera control instance can be
     * attached to the viewer. A new custom camera control
     * instance can be attached after detaching a previous
     * one.
     *
     * Set the viewer's camera controls to
     * {@link CameraControls.Custom} to activate attached
     * camera controls. If {@link CameraControls.Custom}
     * has already been set when a custom camera control
     * instance is attached, it will be activated immediately.
     *
     * Set the viewer's camera controls to any other
     * {@link CameraControls} mode to deactivate the
     * custom camera controls.
     *
     * @param controls - The custom camera controls implementation.
     *
     * @throws {MapillaryError} When camera controls attached
     * are already attached to the viewer.
     */
    attachCustomCameraControls(controls: ICustomCameraControls): void;
    /**
     * Deactivate the combined panning functionality.
     *
     * @description Deactivating the combined panning functionality
     * could be needed in scenarios involving sequence only navigation.
     */
    deactivateCombinedPanning(): void;
    /**
     * Deactivate a component.
     *
     * @param {ComponentName | FallbackComponentName} name - Name
     * of component which become inactive.
     *
     * @example
     * ```js
     * viewer.deactivateComponent("pointer");
     * ```
     */
    deactivateComponent(name: ComponentName | FallbackComponentName): void;
    /**
     * Deactivate the cover (activates all components marked as active).
     */
    deactivateCover(): void;
    /**
     * Detach a previously attached custom camera control
     * instance from the viewer.
     *
     * @description If no custom camera control instance
     * has previously been attached, calling this method
     * has no effect.
     *
     * Already attached custom camera controls need to
     * be detached before attaching another custom camera
     * control instance.
     */
    detachCustomCameraControls(): Promise<ICustomCameraControls>;
    fire(type: ViewerBearingEvent["type"], event: ViewerBearingEvent): void;
    fire(type: ViewerDataLoadingEvent["type"], event: ViewerDataLoadingEvent): void;
    fire(type: ViewerNavigableEvent["type"], event: ViewerNavigableEvent): void;
    fire(type: ViewerImageEvent["type"], event: ViewerImageEvent): void;
    fire(type: ViewerNavigationEdgeEvent["type"], event: ViewerNavigationEdgeEvent): void;
    fire(type: ViewerReferenceEvent["type"], event: ViewerReferenceEvent): void;
    fire(type: ViewerStateEvent["type"], event: ViewerStateEvent): void;
    fire(type: ViewerMouseEvent["type"], event: ViewerMouseEvent): void;
    /**
     * Get the bearing of the current viewer camera.
     *
     * @description The bearing depends on how the camera
     * is currently rotated and does not correspond
     * to the compass angle of the current image if the view
     * has been panned.
     *
     * Bearing is measured in degrees clockwise with respect to
     * north.
     *
     * @returns {Promise<number>} Promise to the bearing
     * of the current viewer camera.
     *
     * @example
     * ```js
     * viewer.getBearing().then(b => { console.log(b); });
     * ```
     */
    getBearing(): Promise<number>;
    /**
     * Get the viewer's camera control mode.
     *
     * @description The camera control mode determines
     * how the camera is controlled when the viewer
     * receives pointer and keyboard input.
     *
     * @returns {CameraControls} controls - Camera control mode.
     *
     * @example
     * ```js
     * viewer.getCameraControls().then(c => { console.log(c); });
     * ```
     */
    getCameraControls(): Promise<CameraControls>;
    /**
     * Returns the viewer's canvas element.
     *
     * @description This is the element onto which the viewer renders
     * the WebGL content.
     *
     * @returns {HTMLCanvasElement} The viewer's canvas element, or
     * null or not initialized.
     */
    getCanvas(): HTMLCanvasElement;
    /**
     * Returns the HTML element containing the viewer's canvas element.
     *
     * @description This is the element to which event bindings for viewer
     * interactivity (such as panning and zooming) are attached.
     *
     * @returns {HTMLDivElement} The container for the viewer's
     * canvas element.
     */
    getCanvasContainer(): HTMLDivElement;
    /**
     * Get the basic coordinates of the current image that is
     * at the center of the viewport.
     *
     * @description Basic coordinates are 2D coordinates on the [0, 1] interval
     * and have the origin point, (0, 0), at the top left corner and the
     * maximum value, (1, 1), at the bottom right corner of the original
     * image.
     *
     * @returns {Promise<number[]>} Promise to the basic coordinates
     * of the current image at the center for the viewport.
     *
     * @example
     * ```js
     * viewer.getCenter().then(c => { console.log(c); });
     * ```
     */
    getCenter(): Promise<number[]>;
    /**
     * Get a component.
     *
     * @param {string} name - Name of component.
     * @returns {Component} The requested component.
     *
     * @example
     * ```js
     * var pointerComponent = viewer.getComponent("pointer");
     * ```
     */
    getComponent<TComponent extends Component<ComponentConfiguration>>(name: ComponentName | FallbackComponentName): TComponent;
    /**
     * Returns the viewer's containing HTML element.
     *
     * @returns {HTMLElement} The viewer's container.
     */
    getContainer(): HTMLElement;
    /**
     * Get the viewer's current vertical field of view.
     *
     * @description The vertical field of view rendered on the viewer canvas
     * measured in degrees.
     *
     * @returns {Promise<number>} Promise to the current field of view
     * of the viewer camera.
     *
     * @example
     * ```js
     * viewer.getFieldOfView().then(fov => { console.log(fov); });
     * ```
     */
    getFieldOfView(): Promise<number>;
    /**
     * Get the viewer's current image.
     *
     * @returns {Promise<Image>} Promise to the current image.
     *
     * @example
     * ```js
     * viewer.getImage().then(image => { console.log(image.id); });
     * ```
     */
    getImage(): Promise<Image>;
    /**
     * Get the viewer's current point of view.
     *
     * @returns {Promise<PointOfView>} Promise to the current point of view
     * of the viewer camera.
     *
     * @example
     * ```js
     * viewer.getPointOfView().then(pov => { console.log(pov); });
     * ```
     */
    getPointOfView(): Promise<PointOfView>;
    /**
     * Get the viewer's current position
     *
     * @returns {Promise<LngLat>} Promise to the viewers's current
     * position.
     *
     * @example
     * ```js
     * viewer.getPosition().then(pos => { console.log(pos); });
     * ```
     */
    getPosition(): Promise<LngLat>;
    /**
     * Get the viewer's current reference position.
     *
     * @description The reference position specifies the origin in
     * the viewer's topocentric coordinate system.
     *
     * @returns {Promise<LngLatAlt>} Promise to the reference position.
     *
     * @example
     * ```js
     * viewer.getReference().then(reference => { console.log(reference); });
     * ```
     */
    getReference(): Promise<LngLatAlt>;
    /**
     * Get the image's current zoom level.
     *
     * @returns {Promise<number>} Promise to the viewers's current
     * zoom level.
     *
     * @example
     * ```js
     * viewer.getZoom().then(z => { console.log(z); });
     * ```
     */
    getZoom(): Promise<number>;
    /**
     * Check if a controls instance is the camera controls that are
     * currently attached to the viewer.
     *
     * @param {ICustomCameraControls} controls - Camera controls instance.
     * @returns {boolean} Value indicating whether the controls instance
     * is currently attached.
     */
    hasCustomCameraControls(controls: ICustomCameraControls): boolean;
    /**
     * Check if a custom renderer has been added to the viewer's
     * rendering pipeline.
     *
     * @param {string} id - Unique ID of the custom renderer.
     * @returns {boolean} Value indicating whether the customer
     * renderer has been added.
     */
    hasCustomRenderer(rendererId: string): boolean;
    /**
     * Navigate in a given direction.
     *
     * @param {NavigationDirection} direction - Direction in which which to move.
     * @returns {Promise<Image>} Promise to the image that was navigated to.
     * @throws If the current image does not have the edge direction
     * or the edges has not yet been cached.
     * @throws Propagates any IO errors to the caller.
     * @throws When viewer is not navigable.
     * @throws {@link CancelMapillaryError} When a subsequent move request
     * is made before the move dir call has completed.
     *
     * @example
     * ```js
     * viewer.moveDir(NavigationDirection.Next).then(
     *     image => { console.log(image); },
     *     error => { console.error(error); });
     * ```
     */
    moveDir(direction: NavigationDirection): Promise<Image>;
    /**
     * Navigate to a given image ID.
     *
     * @param {string} imageId - Id of the image to move to.
     * @returns {Promise<Image>} Promise to the image that was navigated to.
     * @throws Propagates any IO errors to the caller.
     * @throws When viewer is not navigable.
     * @throws {@link CancelMapillaryError} When a subsequent
     * move request is made before the move to ID call has completed.
     *
     * @example
     * ```js
     * viewer.moveTo("<my-image-id>").then(
     *     image => { console.log(image); },
     *     error => { console.error(error); });
     * ```
     */
    moveTo(imageId: string): Promise<Image>;
    off(type: ViewerBearingEvent["type"], handler: (event: ViewerBearingEvent) => void): void;
    off(type: ViewerDataLoadingEvent["type"], handler: (event: ViewerDataLoadingEvent) => void): void;
    off(type: ViewerNavigableEvent["type"], handler: (event: ViewerNavigableEvent) => void): void;
    off(type: ViewerImageEvent["type"], handler: (event: ViewerImageEvent) => void): void;
    off(type: ViewerNavigationEdgeEvent["type"], handler: (event: ViewerNavigationEdgeEvent) => void): void;
    off(type: ViewerReferenceEvent["type"], handler: (event: ViewerReferenceEvent) => void): void;
    off(type: ViewerStateEvent["type"], handler: (event: ViewerStateEvent) => void): void;
    off(type: ViewerMouseEvent["type"], handler: (event: ViewerMouseEvent) => void): void;
    /**
     * Fired when the viewing direction of the camera changes.
     *
     * @event bearing
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("bearing", function() {
     *   console.log("A bearing event has occurred.");
     * });
     * ```
     */
    on(type: "bearing", handler: (event: ViewerBearingEvent) => void): void;
    /**
     * Fired when a pointing device (usually a mouse) is
     * pressed and released at the same point in the viewer.
     *
     * @event click
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("click", function() {
     *   console.log("A click event has occurred.");
     * });
     * ```
     */
    on(type: "click", handler: (event: ViewerMouseEvent) => void): void;
    /**
     * Fired when the right button of the mouse is clicked
     * within the viewer.
     *
     * @event contextmenu
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("contextmenu", function() {
     *   console.log("A contextmenu event has occurred.");
     * });
     * ```
     */
    on(type: "contextmenu", handler: (event: ViewerMouseEvent) => void): void;
    /**
     * Fired when the viewer is loading data.
     *
     * @event loading
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("dataloading", function() {
     *   console.log("A loading event has occurred.");
     * });
     * ```
     */
    on(type: "dataloading", handler: (event: ViewerDataLoadingEvent) => void): void;
    /**
     * Fired when a pointing device (usually a mouse) is clicked twice at
     * the same point in the viewer.
     *
     * @event dblclick
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("dblclick", function() {
     *   console.log("A dblclick event has occurred.");
     * });
     * ```
     */
    on(type: "dblclick", handler: (event: ViewerMouseEvent) => void): void;
    /**
     * Fired when the viewer's vertical field of view changes.
     *
     * @event fov
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("fov", function() {
     *   console.log("A fov event has occurred.");
     * });
     * ```
     */
    on(type: "fov", handler: (event: ViewerStateEvent) => void): void;
    /**
     * Fired immediately after all necessary resources
     * have been downloaded and the first visually complete
     * rendering of the viewer has occurred.
     *
     * This event is only fired for viewer configurations where
     * the WebGL context is created, i.e. not when using the
     * fallback functionality only.
     *
     * @event load
     * @example
     * @example
     * ```js
     * // Set an event listener
     * viewer.on('load', function(event) {
     *   console.log('A load event has occured');
     * });
     * ```
     */
    on(type: "load", handler: (event: ViewerLoadEvent) => void): void;
    /**
     * Fired when a pointing device (usually a mouse) is pressed
     * within the viewer.
     *
     * @event mousedown
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("mousedown", function() {
     *   console.log("A mousedown event has occurred.");
     * });
     * ```
     */
    on(type: "mousedown", handler: (event: ViewerMouseEvent) => void): void;
    /**
     * Fired when a pointing device (usually a mouse)
     * is moved within the viewer.
     *
     * @event mousemove
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("mousemove", function() {
     *   console.log("A mousemove event has occurred.");
     * });
     * ```
     */
    on(type: "mousemove", handler: (event: ViewerMouseEvent) => void): void;
    /**
     * Fired when a pointing device (usually a mouse)
     * leaves the viewer's canvas.
     *
     * @event mouseout
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("mouseout", function() {
     *   console.log("A mouseout event has occurred.");
     * });
     * ```
     */
    on(type: "mouseout", handler: (event: ViewerMouseEvent) => void): void;
    /**
     * Fired when a pointing device (usually a mouse)
     * is moved onto the viewer's canvas.
     *
     * @event mouseover
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("mouseover", function() {
     *   console.log("A mouseover event has occurred.");
     * });
     * ```
     */
    on(type: "mouseover", handler: (event: ViewerMouseEvent) => void): void;
    /**
     * Fired when a pointing device (usually a mouse)
     * is released within the viewer.
     *
     * @event mouseup
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("mouseup", function() {
     *   console.log("A mouseup event has occurred.");
     * });
     * ```
     */
    on(type: "mouseup", handler: (event: ViewerMouseEvent) => void): void;
    /**
     * Fired when the viewer motion stops and it is in a fixed
     * position with a fixed point of view.
     *
     * @event moveend
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("moveend", function() {
     *   console.log("A moveend event has occurred.");
     * });
     * ```
     */
    on(type: "moveend", handler: (event: ViewerStateEvent) => void): void;
    /**
     * Fired when the motion from one view to another start,
     * either by changing the position (e.g. when changing image)
     * or when changing point of view
     * (e.g. by interaction such as pan and zoom).
     *
     * @event movestart
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("movestart", function() {
     *   console.log("A movestart event has occurred.");
     * });
     * ```
     */
    on(type: "movestart", handler: (event: ViewerStateEvent) => void): void;
    /**
     * Fired when the navigable state of the viewer changes.
     *
     * @event navigable
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("navigable", function() {
     *   console.log("A navigable event has occurred.");
     * });
     * ```
     */
    on(type: "navigable", handler: (event: ViewerNavigableEvent) => void): void;
    /**
     * Fired every time the viewer navigates to a new image.
     *
     * @event image
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("image", function() {
     *   console.log("A image event has occurred.");
     * });
     * ```
     */
    on(type: "image", handler: (event: ViewerImageEvent) => void): void;
    /**
     * Fired when the viewer's position changes.
     *
     * @description The viewer's position changes when transitioning
     * between images.
     *
     * @event position
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("position", function() {
     *   console.log("A position event has occurred.");
     * });
     * ```
     */
    on(type: "position", handler: (event: ViewerStateEvent) => void): void;
    /**
     * Fired when the viewer's point of view changes. The
     * point of view changes when the bearing, or tilt changes.
     *
     * @event pov
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("pov", function() {
     *   console.log("A pov event has occurred.");
     * });
     * ```
     */
    on(type: "pov", handler: (event: ViewerStateEvent) => void): void;
    /**
     * Fired when the viewer's reference position changes.
     *
     * The reference position specifies the origin in
     * the viewer's topocentric coordinate system.
     *
     * @event reference
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("reference", function(reference) {
     *   console.log("A reference event has occurred.");
     * });
     * ```
     */
    on(type: "reference", handler: (event: ViewerReferenceEvent) => void): void;
    /**
     * Fired when the viewer is removed. After this event is emitted
     * you must not call any methods on the viewer.
     *
     * @event remove
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("remove", function() {
     *   console.log("A remove event has occurred.");
     * });
     * ```
     */
    on(type: "remove", handler: (event: ViewerStateEvent) => void): void;
    /**
     * Fired every time the sequence edges of the current image changes.
     *
     * @event sequenceedges
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("sequenceedges", function() {
     *   console.log("A sequenceedges event has occurred.");
     * });
     * ```
     */
    on(type: "sequenceedges", handler: (event: ViewerNavigationEdgeEvent) => void): void;
    /**
     * Fired every time the spatial edges of the current image changes.
     *
     * @event spatialedges
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("spatialedges", function() {
     *   console.log("A spatialedges event has occurred.");
     * });
     * ```
     */
    on(type: "spatialedges", handler: (event: ViewerNavigationEdgeEvent) => void): void;
    /**
     * Project geodetic coordinates to canvas pixel coordinates.
     *
     * @description The geodetic coordinates may not always correspond to pixel
     * coordinates, e.g. if the geodetic coordinates have a position behind the
     * viewer camera. In the case of no correspondence the returned value will
     * be `null`.
     *
     * If the distance from the viewer camera position to the provided
     * longitude-latitude is more than 1000 meters `null` will be returned.
     *
     * The projection is performed from the ground plane, i.e.
     * the altitude with respect to the ground plane for the geodetic
     * point is zero.
     *
     * Note that whenever the camera moves, the result of the method will be
     * different.
     *
     * @param {LngLat} lngLat - Geographical coordinates to project.
     * @returns {Promise<Array<number>>} Promise to the pixel coordinates corresponding
     * to the lngLat.
     *
     * @example
     * ```js
     * viewer.project({ lat: 0, lng: 0 })
     *     .then(pixelPoint => {
     *          if (!pixelPoint) {
     *              console.log("no correspondence");
     *          }
     *
     *          console.log(pixelPoint);
     *     });
     * ```
     */
    project(lngLat: LngLat): Promise<number[]>;
    /**
     * Project basic image coordinates for the current image to canvas pixel
     * coordinates.
     *
     * @description The basic image coordinates may not always correspond to a
     * pixel point that lies in the visible area of the viewer container. In the
     * case of no correspondence the returned value can be `null`.
     *
     *
     * @param {Array<number>} basicPoint - Basic images coordinates to project.
     * @returns {Promise<Array<number>>} Promise to the pixel coordinates corresponding
     * to the basic image point.
     *
     * @example
     * ```js
     * viewer.projectFromBasic([0.3, 0.7])
     *     .then(pixelPoint => { console.log(pixelPoint); });
     * ```
     */
    projectFromBasic(basicPoint: number[]): Promise<number[]>;
    /**
     * Clean up and release all internal resources associated with
     * this viewer.
     *
     * @description This includes DOM elements, event bindings, and
     * WebGL resources.
     *
     * Use this method when you are done using the viewer and wish to
     * ensure that it no longer consumes browser resources. Afterwards,
     * you must not call any other methods on the viewer.
     *
     * @fires remove
     *
     * @example
     * ```js
     * viewer.remove();
     * ```
     */
    remove(): void;
    /**
     * Remove a custom renderer from the viewer's rendering pipeline.
     *
     * @param id - Unique ID of the custom renderer.
     */
    removeCustomRenderer(rendererId: string): void;
    /**
     * Detect the viewer's new width and height and resize it
     * manually.
     *
     * @description The components will also detect the viewer's
     * new size and resize their rendered elements if needed.
     *
     * When the {@link ViewerOptions.trackResize} option is
     * set to true, the viewer will automatically resize
     * when the browser window is resized. If any other
     * custom behavior is preferred, the option should be set
     * to false and the {@link Viewer.resize} method should
     * be called on demand.
     *
     * @example
     * ```js
     * viewer.resize();
     * ```
     */
    resize(): void;
    /**
     * Set the viewer's camera control mode.
     *
     * @description The camera control mode determines
     * how the camera is controlled when the viewer
     * receives pointer and keyboard input.
     *
     * Changing the camera control mode is not possible
     * when the slider component is active and attempts
     * to do so will be ignored.
     *
     * @param {CameraControls} controls - Camera control mode.
     *
     * @example
     * ```js
     * viewer.setCameraControls(CameraControls.Street);
     * ```
     */
    setCameraControls(controls: CameraControls): void;
    /**
     * Set the basic coordinates of the current image to be in the
     * center of the viewport.
     *
     * @description Basic coordinates are 2D coordinates on the [0, 1] interval
     * and has the origin point, (0, 0), at the top left corner and the
     * maximum value, (1, 1), at the bottom right corner of the original
     * image.
     *
     * @param {number[]} The basic coordinates of the current
     * image to be at the center for the viewport.
     *
     * @example
     * ```js
     * viewer.setCenter([0.5, 0.5]);
     * ```
     */
    setCenter(center: number[]): void;
    /**
     * Set the viewer's current vertical field of view.
     *
     * @description Sets the vertical field of view rendered
     * on the viewer canvas measured in degrees. The value
     * will be clamped to be able to set a valid zoom level
     * based on the projection model of the current image and
     * the viewer's current render mode.
     *
     * @param {number} fov - Vertical field of view in degrees.
     *
     * @example
     * ```js
     * viewer.setFieldOfView(45);
     * ```
     */
    setFieldOfView(fov: number): void;
    /**
     * Set the filter selecting images to use when calculating
     * the spatial edges.
     *
     * @description The following filter types are supported:
     *
     * Comparison
     *
     * `["==", key, value]` equality: `image[key] = value`
     *
     * `["!=", key, value]` inequality: `image[key] ≠ value`
     *
     * `["<", key, value]` less than: `image[key] < value`
     *
     * `["<=", key, value]` less than or equal: `image[key] ≤ value`
     *
     * `[">", key, value]` greater than: `image[key] > value`
     *
     * `[">=", key, value]` greater than or equal: `image[key] ≥ value`
     *
     * Set membership
     *
     * `["in", key, v0, ..., vn]` set inclusion: `image[key] ∈ {v0, ..., vn}`
     *
     * `["!in", key, v0, ..., vn]` set exclusion: `image[key] ∉ {v0, ..., vn}`
     *
     * Combining
     *
     * `["all", f0, ..., fn]` logical `AND`: `f0 ∧ ... ∧ fn`
     *
     * A key must be a string that identifies a property name of a
     * simple {@link Image} property, i.e. a key of the {@link FilterKey}
     * type. A value must be a string, number, or
     * boolean. Strictly-typed comparisons are used. The values
     * `f0, ..., fn` of the combining filter must be filter expressions.
     *
     * Clear the filter by setting it to null or empty array.
     *
     * Commonly used filter properties (see the {@link Image} class
     * documentation for a full list of properties that can be used
     * in a filter) are shown the the example code.
     *
     * @param {FilterExpression} [filter] - The filter expression.
     * Applied filter is cleared if omitted.
     * @returns {Promise<void>} Promise that resolves after filter is applied.
     *
     * @example
     * ```js
     * // Examples
     * viewer.setFilter(["==", "cameraType", "spherical"]);
     * viewer.setFilter([">=", "capturedAt", <my-time-stamp>]);
     * viewer.setFilter(["in", "sequenceId", "<sequence-id-1>", "<sequence-id-2>"]);
     * ```
     */
    setFilter(filter?: FilterExpression): Promise<void>;
    /**
     * Set the viewer's render mode.
     *
     * @param {RenderMode} renderMode - Render mode.
     *
     * @example
     * ```js
     * viewer.setRenderMode(RenderMode.Letterbox);
     * ```
     */
    setRenderMode(renderMode: RenderMode): void;
    /**
     * Set the viewer's transition mode.
     *
     * @param {TransitionMode} transitionMode - Transition mode.
     *
     * @example
     * ```js
     * viewer.setTransitionMode(TransitionMode.Instantaneous);
     * ```
     */
    setTransitionMode(transitionMode: TransitionMode): void;
    /**
     * Set an access token for authenticated API requests of protected
     * resources.
     *
     * The token may be a user access token or a client access token.
     *
     * @description When the supplied user token is null or undefined,
     * any previously set user bearer token will be cleared and the
     * viewer will make unauthenticated requests.
     *
     * Calling setAccessToken aborts all outstanding move requests.
     * The promises of those move requests will be rejected with a
     * {@link CancelMapillaryError} the rejections need to be caught.
     *
     * Calling setAccessToken also resets the complete viewer cache
     * so it should not be called repeatedly.
     *
     * @param {string} [accessToken] accessToken - Optional user
     * access token or client access token.
     * @returns {Promise<void>} Promise that resolves after token
     * is set.
     *
     * @throws When viewer is not navigable.
     *
     * @example
     * ```js
     * viewer.setAccessToken("<my access token>")
     *     .then(() => { console.log("user token set"); });
     * ```
     */
    setAccessToken(accessToken?: string): Promise<void>;
    /**
     * Set the image's current zoom level.
     *
     * @description Possible zoom level values are on the [0, 3] interval.
     * Zero means zooming out to fit the image to the view whereas three
     * shows the highest level of detail.
     *
     * @param {number} The image's current zoom level.
     *
     * @example
     * ```js
     * viewer.setZoom(2);
     * ```
     */
    setZoom(zoom: number): void;
    /**
     * Trigger the rendering of a single frame.
     *
     * @description Use this method with custom renderers to
     * force the viewer to rerender when the custom content
     * changes. Calling this multiple times before the next
     * frame is rendered will still result in only a single
     * frame being rendered.
     */
    triggerRerender(): void;
    /**
     * Unproject canvas pixel coordinates to geodetic
     * coordinates.
     *
     * @description The pixel point may not always correspond to geodetic
     * coordinates. In the case of no correspondence the returned value will
     * be `null`.
     *
     * The unprojection to a lngLat will be performed towards the ground plane, i.e.
     * the altitude with respect to the ground plane for the returned lngLat is zero.
     *
     * @param {Array<number>} pixelPoint - Pixel coordinates to unproject.
     * @returns {Promise<LngLat>} Promise to the lngLat corresponding to the pixel point.
     *
     * @example
     * ```js
     * viewer.unproject([100, 100])
     *     .then(lngLat => { console.log(lngLat); });
     * ```
     */
    unproject(pixelPoint: number[]): Promise<LngLat>;
    /**
     * Unproject canvas pixel coordinates to basic image coordinates for the
     * current image.
     *
     * @description The pixel point may not always correspond to basic image
     * coordinates. In the case of no correspondence the returned value will
     * be `null`.
     *
     * @param {Array<number>} pixelPoint - Pixel coordinates to unproject.
     * @returns {Promise<LngLat>} Promise to the basic coordinates corresponding
     * to the pixel point.
     *
     * @example
     * ```js
     * viewer.unprojectToBasic([100, 100])
     *     .then(basicPoint => { console.log(basicPoint); });
     * ```
     */
    unprojectToBasic(pixelPoint: number[]): Promise<number[]>;
}

/**
 * @class MapillaryError
 *
 * @classdesc Generic Mapillary error.
 */
declare class MapillaryError extends Error {
    constructor(message?: string);
}

/**
 * @class CancelMapillaryError
 *
 * @classdesc Error thrown when a move to request has been
 * cancelled before completing because of a subsequent request.
 */
declare class CancelMapillaryError extends MapillaryError {
    constructor(message?: string);
}

declare class ArgumentMapillaryError extends MapillaryError {
    constructor(message?: string);
}

declare class GraphMapillaryError extends MapillaryError {
    constructor(message: string);
}

declare class ConfigurationService {
    private _imageTiling$;
    private _exploreUrl$;
    constructor(options: ViewerOptions);
    get exploreUrl$(): Observable<string>;
    get imageTiling$(): Observable<boolean>;
}

declare class Container {
    id: string;
    renderService: RenderService;
    glRenderer: GLRenderer;
    domRenderer: DOMRenderer;
    keyboardService: KeyboardService;
    mouseService: MouseService;
    touchService: TouchService;
    spriteService: SpriteService;
    readonly configurationService: ConfigurationService;
    private _canvasContainer;
    private _canvas;
    private _container;
    private _domContainer;
    private _dom;
    private readonly _trackResize;
    constructor(options: ViewerOptions, stateService: StateService, dom?: DOM);
    get canvas(): HTMLCanvasElement;
    get canvasContainer(): HTMLDivElement;
    get container(): HTMLElement;
    get domContainer(): HTMLDivElement;
    remove(): void;
    private _onWindowResize;
    private _removeNode;
}

declare type Func<T, TResult> = (item: T) => TResult;

declare type FilterFunction = Func<Image, boolean>;
/**
 * @class Filter
 *
 * @classdesc Represents a class for creating image filters. Implementation and
 * definitions based on https://github.com/mapbox/feature-filter.
 */
declare class FilterCreator {
    /**
     * Create a filter from a filter expression.
     *
     * @description The following filters are supported:
     *
     * Comparison
     * `==`
     * `!=`
     * `<`
     * `<=`
     * `>`
     * `>=`
     *
     * Set membership
     * `in`
     * `!in`
     *
     * Combining
     * `all`
     *
     * @param {FilterExpression} filter - Comparison, set membership or combinding filter
     * expression.
     * @returns {FilterFunction} Function taking a image and returning a boolean that
     * indicates whether the image passed the test or not.
     */
    createFilter(filter: FilterExpression): FilterFunction;
    private _compile;
    private _compare;
    private _compileComparisonOp;
    private _compileInOp;
    private _compileLogicalOp;
    private _compileNegation;
    private _compilePropertyReference;
}

/**
 * @class GraphCalculator
 *
 * @classdesc Represents a calculator for graph entities.
 */
declare class GraphCalculator {
    /**
     * Get the bounding box corners for a circle with radius of a threshold
     * with center in a geodetic position.
     *
     * @param {LngLat} lngLat - Longitude, latitude to encode.
     * @param {number} threshold - Threshold distance from the position in meters.
     *
     * @returns {Array<LngLat>} The south west and north east corners of the
     * bounding box.
     */
    boundingBoxCorners(lngLat: LngLat, threshold: number): [LngLat, LngLat];
    /**
     * Convert a compass angle to an angle axis rotation vector.
     *
     * @param {number} compassAngle - The compass angle in degrees.
     * @param {number} orientation - The orientation of the original image.
     *
     * @returns {Array<number>} Angle axis rotation vector.
     */
    rotationFromCompass(compassAngle: number, orientation: number): number[];
}

/**
 * @class Sequence
 *
 * @classdesc Represents a sequence of ordered images.
 */
declare class Sequence {
    private _id;
    private _imageIds;
    /**
     * Create a new sequene instance.
     *
     * @param {SequenceEnt} sequence - Raw sequence data.
     */
    constructor(sequence: SequenceEnt);
    /**
     * Get id.
     *
     * @returns {string} Unique sequence id.
     */
    get id(): string;
    /**
     * Get ids.
     *
     * @returns {Array<string>} Array of ordered image ids in the sequence.
     */
    get imageIds(): string[];
    /**
     * Dispose the sequence.
     *
     * @description Disposes all cached assets.
     */
    dispose(): void;
    /**
     * Find the next image id in the sequence with respect to
     * the provided image id.
     *
     * @param {string} id - Reference image id.
     * @returns {string} Next id in sequence if it exists, null otherwise.
     */
    findNext(id: string): string;
    /**
     * Find the previous image id in the sequence with respect to
     * the provided image id.
     *
     * @param {string} id - Reference image id.
     * @returns {string} Previous id in sequence if it exists, null otherwise.
     */
    findPrev(id: string): string;
}

/**
 * Interface for graph configuration.
 *
 * @interface GraphConfiguration
 */
interface GraphConfiguration {
    /**
     * The maximum number of cached sequences left
     * after uncache.
     */
    maxSequences: number;
    /**
     * The maximum number of unused cached images left
     * after uncache.
     */
    maxUnusedImages: number;
    /**
     * The maximum number of unused pre-stored cached images left
     * after uncache.
     */
    maxUnusedPreStoredImages: number;
    /**
     * The maximum number of unused cached tiles left
     * after uncache.
     */
    maxUnusedTiles: number;
}

declare class EdgeCalculatorCoefficients {
    sphericalPreferredDistance: number;
    sphericalMotion: number;
    sphericalSequencePenalty: number;
    sphericalMergeCCPenalty: number;
    stepPreferredDistance: number;
    stepMotion: number;
    stepRotation: number;
    stepSequencePenalty: number;
    stepMergeCCPenalty: number;
    similarDistance: number;
    similarRotation: number;
    turnDistance: number;
    turnMotion: number;
    turnSequencePenalty: number;
    turnMergeCCPenalty: number;
    constructor();
}

interface SphericalDirection {
    direction: NavigationDirection;
    prev: NavigationDirection;
    next: NavigationDirection;
    directionChange: number;
}

interface StepDirection {
    direction: NavigationDirection;
    motionChange: number;
    useFallback: boolean;
}

interface TurnDirection {
    direction: NavigationDirection;
    directionChange: number;
    motionChange?: number;
}

declare class EdgeCalculatorDirections {
    steps: {
        [direction: string]: StepDirection;
    };
    turns: {
        [direction: string]: TurnDirection;
    };
    spherical: {
        [direction: string]: SphericalDirection;
    };
    constructor();
}

declare class EdgeCalculatorSettings {
    sphericalMinDistance: number;
    sphericalMaxDistance: number;
    sphericalPreferredDistance: number;
    sphericalMaxItems: number;
    sphericalMaxStepTurnChange: number;
    rotationMaxDistance: number;
    rotationMaxDirectionChange: number;
    rotationMaxVerticalDirectionChange: number;
    similarMaxDirectionChange: number;
    similarMaxDistance: number;
    similarMinTimeDifference: number;
    stepMaxDistance: number;
    stepMaxDirectionChange: number;
    stepMaxDrift: number;
    stepPreferredDistance: number;
    turnMaxDistance: number;
    turnMaxDirectionChange: number;
    turnMaxRigDistance: number;
    turnMinRigDirectionChange: number;
    constructor();
    get maxDistance(): number;
}

/**
 * Interface that describes the properties for a image that is the destination of a
 * potential edge from an origin image.
 *
 * @interface PotentialEdge
 */
interface PotentialEdge {
    /**
     * Timestamp when the image was captured.
     * @property {number} capturedAt
     */
    capturedAt: number;
    /**
     * Change in viewing direction with respect to the origin image.
     * @property {number} directionChange
     */
    directionChange: number;
    /**
     * Distance to the origin image.
     * @property {number} distance
     */
    distance: number;
    /**
     * Determines if the destination image is spherical.
     * @property {boolean} spherical
     */
    spherical: boolean;
    /**
     * Unique image id.
     * @property {string} id
     */
    id: string;
    /**
     * Change in motion with respect to the viewing direction
     * of the origin image.
     * @property {number} motionChange
     */
    motionChange: number;
    /**
     * General camera rotation with respect to the origin image.
     * @property {number} rotation
     */
    rotation: number;
    /**
     * Determines if the origin and destination image are considered
     * to be in the same merge connected component.
     * @property {boolean} sameMergeCC
     */
    sameMergeCC: boolean;
    /**
     * Determines if the origin and destination image are in the
     * same sequence.
     * @property {boolean} sameSequence
     */
    sameSequence: boolean;
    /**
     * Determines if the origin and destination image have been captured
     * by the same user.
     * @property {boolean} sameUser
     */
    sameUser: boolean;
    /**
     * Determines which sequence the destination image of the potential edge
     * belongs to.
     * @property {string} sequenceId
     */
    sequenceId: string;
    /**
     * Change in viewing direction with respect to the XY-plane.
     * @property {number} verticalDirectionChange
     */
    verticalDirectionChange: number;
    /**
     * The angle between motion vector and the XY-plane
     * @property {number} verticalMotion
     */
    verticalMotion: number;
    /**
     * The counter clockwise horizontal rotation angle from
     * the X-axis in a spherical coordiante system.
     * @property {number} worldMotionAzimuth
     */
    worldMotionAzimuth: number;
}

/**
 * @class EdgeCalculator
 *
 * @classdesc Represents a class for calculating node edges.
 */
declare class EdgeCalculator {
    private _spatial;
    private _settings;
    private _directions;
    private _coefficients;
    /**
     * Create a new edge calculator instance.
     *
     * @param {EdgeCalculatorSettings} settings - Settings struct.
     * @param {EdgeCalculatorDirections} directions - Directions struct.
     * @param {EdgeCalculatorCoefficients} coefficients - Coefficients struct.
     */
    constructor(settings?: EdgeCalculatorSettings, directions?: EdgeCalculatorDirections, coefficients?: EdgeCalculatorCoefficients);
    /**
     * Returns the potential edges to destination nodes for a set
     * of nodes with respect to a source node.
     *
     * @param {Image} node - Source node.
     * @param {Array<Image>} nodes - Potential destination nodes.
     * @param {Array<string>} fallbackIds - Ids for destination nodes
     * that should be returned even if they do not meet the
     * criteria for a potential edge.
     * @throws {ArgumentMapillaryError} If node is not full.
     */
    getPotentialEdges(node: Image, potentialImages: Image[], fallbackIds: string[]): PotentialEdge[];
    /**
     * Computes the sequence edges for a node.
     *
     * @param {Image} node - Source node.
     * @throws {ArgumentMapillaryError} If node is not full.
     */
    computeSequenceEdges(node: Image, sequence: Sequence): NavigationEdge[];
    /**
     * Computes the similar edges for a node.
     *
     * @description Similar edges for perspective images
     * look roughly in the same direction and are positioned closed to the node.
     * Similar edges for spherical only target other spherical.
     *
     * @param {Image} node - Source node.
     * @param {Array<PotentialEdge>} potentialEdges - Potential edges.
     * @throws {ArgumentMapillaryError} If node is not full.
     */
    computeSimilarEdges(node: Image, potentialEdges: PotentialEdge[]): NavigationEdge[];
    /**
     * Computes the step edges for a perspective node.
     *
     * @description Step edge targets can only be other perspective nodes.
     * Returns an empty array for spherical.
     *
     * @param {Image} node - Source node.
     * @param {Array<PotentialEdge>} potentialEdges - Potential edges.
     * @param {string} prevId - Id of previous node in sequence.
     * @param {string} nextId - Id of next node in sequence.
     * @throws {ArgumentMapillaryError} If node is not full.
     */
    computeStepEdges(node: Image, potentialEdges: PotentialEdge[], prevId: string, nextId: string): NavigationEdge[];
    /**
     * Computes the turn edges for a perspective node.
     *
     * @description Turn edge targets can only be other perspective images.
     * Returns an empty array for spherical.
     *
     * @param {Image} node - Source node.
     * @param {Array<PotentialEdge>} potentialEdges - Potential edges.
     * @throws {ArgumentMapillaryError} If node is not full.
     */
    computeTurnEdges(node: Image, potentialEdges: PotentialEdge[]): NavigationEdge[];
    /**
     * Computes the spherical edges for a perspective node.
     *
     * @description Perspective to spherical edge targets can only be
     * spherical nodes. Returns an empty array for spherical.
     *
     * @param {Image} node - Source node.
     * @param {Array<PotentialEdge>} potentialEdges - Potential edges.
     * @throws {ArgumentMapillaryError} If node is not full.
     */
    computePerspectiveToSphericalEdges(node: Image, potentialEdges: PotentialEdge[]): NavigationEdge[];
    /**
     * Computes the spherical and step edges for a spherical node.
     *
     * @description Spherical to spherical edge targets can only be
     * spherical nodes. spherical to step edge targets can only be perspective
     * nodes.
     *
     * @param {Image} node - Source node.
     * @param {Array<PotentialEdge>} potentialEdges - Potential edges.
     * @throws {ArgumentMapillaryError} If node is not full.
     */
    computeSphericalEdges(node: Image, potentialEdges: PotentialEdge[]): NavigationEdge[];
}

/**
 * @class API
 *
 * @classdesc Provides methods for access to the API.
 */
declare class APIWrapper {
    private readonly _data;
    constructor(_data: IDataProvider);
    get data(): IDataProvider;
    getCoreImages$(cellId: string): Observable<CoreImagesContract>;
    getImages$(imageIds: string[]): Observable<ImagesContract>;
    getImageTiles$(tiles: ImageTilesRequestContract): Observable<ImageTilesContract>;
    getSequence$(sequenceId: string): Observable<SequenceContract>;
    getSpatialImages$(imageIds: string[]): Observable<SpatialImagesContract>;
    setAccessToken(accessToken?: string): void;
    private _wrap$;
}

/**
 * @class Graph
 *
 * @classdesc Represents a graph of nodes with edges.
 */
declare class Graph {
    private static _spatialIndex;
    private _api;
    /**
     * Nodes that have initialized cache with a timestamp of last access.
     */
    private _cachedNodes;
    /**
     * Nodes for which the required tiles are cached.
     */
    private _cachedNodeTiles;
    /**
     * Sequences for which the nodes are cached.
     */
    private _cachedSequenceNodes;
    /**
     * Nodes for which the spatial edges are cached.
     */
    private _cachedSpatialEdges;
    /**
     * Cached tiles with a timestamp of last access.
     */
    private _cachedTiles;
    /**
     * Nodes for which fill properties are being retreived.
     */
    private _cachingFill$;
    /**
     * Nodes for which full properties are being retrieved.
     */
    private _cachingFull$;
    /**
     * Sequences for which the nodes are being retrieved.
     */
    private _cachingSequenceNodes$;
    /**
     * Sequences that are being retrieved.
     */
    private _cachingSequences$;
    /**
     * Nodes for which the spatial area fill properties are being retrieved.
     */
    private _cachingSpatialArea$;
    /**
     * Tiles that are being retrieved.
     */
    private _cachingTiles$;
    private _changed$;
    private _defaultAlt;
    private _edgeCalculator;
    private _graphCalculator;
    private _configuration;
    private _filter;
    private _filterCreator;
    private _filterSubject$;
    private _filter$;
    private _filterSubscription;
    /**
     * All nodes in the graph.
     */
    private _nodes;
    /**
     * Contains all nodes in the graph. Used for fast spatial lookups.
     */
    private _nodeIndex;
    /**
     * All node index items sorted in tiles for easy uncache.
     */
    private _nodeIndexTiles;
    /**
     * Node to tile dictionary for easy tile access updates.
     */
    private _nodeToTile;
    /**
     * Nodes retrieved before tiles, stored on tile level.
     */
    private _preStored;
    /**
     * Tiles required for a node to retrive spatial area.
     */
    private _requiredNodeTiles;
    /**
     * Other nodes required for node to calculate spatial edges.
     */
    private _requiredSpatialArea;
    /**
     * All sequences in graph with a timestamp of last access.
     */
    private _sequences;
    private _tileThreshold;
    /**
     * Create a new graph instance.
     *
     * @param {APIWrapper} [api] - API instance for retrieving data.
     * @param {rbush.RBush<NodeIndexItem>} [nodeIndex] - Node index for fast spatial retreival.
     * @param {GraphCalculator} [graphCalculator] - Instance for graph calculations.
     * @param {EdgeCalculator} [edgeCalculator] - Instance for edge calculations.
     * @param {FilterCreator} [filterCreator] - Instance for  filter creation.
     * @param {GraphConfiguration} [configuration] - Configuration struct.
     */
    constructor(api: APIWrapper, nodeIndex?: any, graphCalculator?: GraphCalculator, edgeCalculator?: EdgeCalculator, filterCreator?: FilterCreator, configuration?: GraphConfiguration);
    static register(spatialIndex: new (...args: any[]) => any): void;
    /**
     * Get api.
     *
     * @returns {APIWrapper} The API instance used by
     * the graph.
     */
    get api(): APIWrapper;
    /**
     * Get changed$.
     *
     * @returns {Observable<Graph>} Observable emitting
     * the graph every time it has changed.
     */
    get changed$(): Observable<Graph>;
    /**
     * Get filter$.
     *
     * @returns {Observable<FilterFunction>} Observable emitting
     * the filter every time it has changed.
     */
    get filter$(): Observable<FilterFunction>;
    /**
     * Caches the full node data for all images within a bounding
     * box.
     *
     * @description The node assets are not cached.
     *
     * @param {LngLat} sw - South west corner of bounding box.
     * @param {LngLat} ne - North east corner of bounding box.
     * @returns {Observable<Array<Image>>} Observable emitting
     * the full nodes in the bounding box.
     */
    cacheBoundingBox$(sw: LngLat, ne: LngLat): Observable<Image[]>;
    /**
     * Caches the full node data for all images of a cell.
     *
     * @description The node assets are not cached.
     *
     * @param {string} cellId - Cell id.
     * @returns {Observable<Array<Image>>} Observable
     * emitting the full nodes of the cell.
     */
    cacheCell$(cellId: string): Observable<Image[]>;
    /**
     * Retrieve and cache node fill properties.
     *
     * @param {string} key - Key of node to fill.
     * @returns {Observable<Graph>} Observable emitting the graph
     * when the node has been updated.
     * @throws {GraphMapillaryError} When the operation is not valid on the
     * current graph.
     */
    cacheFill$(key: string): Observable<Graph>;
    /**
     * Retrieve and cache full node properties.
     *
     * @param {string} key - Key of node to fill.
     * @returns {Observable<Graph>} Observable emitting the graph
     * when the node has been updated.
     * @throws {GraphMapillaryError} When the operation is not valid on the
     * current graph.
     */
    cacheFull$(key: string): Observable<Graph>;
    /**
     * Retrieve and cache a node sequence.
     *
     * @param {string} key - Key of node for which to retrieve sequence.
     * @returns {Observable<Graph>} Observable emitting the graph
     * when the sequence has been retrieved.
     * @throws {GraphMapillaryError} When the operation is not valid on the
     * current graph.
     */
    cacheNodeSequence$(key: string): Observable<Graph>;
    /**
     * Retrieve and cache a sequence.
     *
     * @param {string} sequenceKey - Key of sequence to cache.
     * @returns {Observable<Graph>} Observable emitting the graph
     * when the sequence has been retrieved.
     * @throws {GraphMapillaryError} When the operation is not valid on the
     * current graph.
     */
    cacheSequence$(sequenceKey: string): Observable<Graph>;
    /**
     * Cache sequence edges for a node.
     *
     * @param {string} key - Key of node.
     * @throws {GraphMapillaryError} When the operation is not valid on the
     * current graph.
     */
    cacheSequenceEdges(key: string): void;
    /**
     * Retrieve and cache full nodes for all keys in a sequence.
     *
     * @param {string} sequenceKey - Key of sequence.
     * @param {string} referenceNodeKey - Key of node to use as reference
     * for optimized caching.
     * @returns {Observable<Graph>} Observable emitting the graph
     * when the nodes of the sequence has been cached.
     */
    cacheSequenceNodes$(sequenceKey: string, referenceNodeKey?: string): Observable<Graph>;
    /**
     * Retrieve and cache full nodes for a node spatial area.
     *
     * @param {string} key - Key of node for which to retrieve sequence.
     * @returns {Observable<Graph>} Observable emitting the graph
     * when the nodes in the spatial area has been made full.
     * @throws {GraphMapillaryError} When the operation is not valid on the
     * current graph.
     */
    cacheSpatialArea$(key: string): Observable<Graph>[];
    /**
     * Cache spatial edges for a node.
     *
     * @param {string} key - Key of node.
     * @throws {GraphMapillaryError} When the operation is not valid on the
     * current graph.
     */
    cacheSpatialEdges(key: string): void;
    /**
     * Retrieve and cache tiles for a node.
     *
     * @param {string} key - Key of node for which to retrieve tiles.
     * @returns {Array<Observable<Graph>>} Array of observables emitting
     * the graph for each tile required for the node has been cached.
     * @throws {GraphMapillaryError} When the operation is not valid on the
     * current graph.
     */
    cacheTiles$(key: string): Observable<Graph>[];
    /**
     * Initialize the cache for a node.
     *
     * @param {string} key - Key of node.
     * @throws {GraphMapillaryError} When the operation is not valid on the
     * current graph.
     */
    initializeCache(key: string): void;
    /**
     * Get a value indicating if the graph is fill caching a node.
     *
     * @param {string} key - Key of node.
     * @returns {boolean} Value indicating if the node is being fill cached.
     */
    isCachingFill(key: string): boolean;
    /**
     * Get a value indicating if the graph is fully caching a node.
     *
     * @param {string} key - Key of node.
     * @returns {boolean} Value indicating if the node is being fully cached.
     */
    isCachingFull(key: string): boolean;
    /**
     * Get a value indicating if the graph is caching a sequence of a node.
     *
     * @param {string} key - Key of node.
     * @returns {boolean} Value indicating if the sequence of a node is
     * being cached.
     */
    isCachingNodeSequence(key: string): boolean;
    /**
     * Get a value indicating if the graph is caching a sequence.
     *
     * @param {string} sequenceKey - Key of sequence.
     * @returns {boolean} Value indicating if the sequence is
     * being cached.
     */
    isCachingSequence(sequenceKey: string): boolean;
    /**
     * Get a value indicating if the graph is caching sequence nodes.
     *
     * @param {string} sequenceKey - Key of sequence.
     * @returns {boolean} Value indicating if the sequence nodes are
     * being cached.
     */
    isCachingSequenceNodes(sequenceKey: string): boolean;
    /**
     * Get a value indicating if the graph is caching the tiles
     * required for calculating spatial edges of a node.
     *
     * @param {string} key - Key of node.
     * @returns {boolean} Value indicating if the tiles of
     * a node are being cached.
     */
    isCachingTiles(key: string): boolean;
    /**
     * Get a value indicating if the cache has been initialized
     * for a node.
     *
     * @param {string} key - Key of node.
     * @returns {boolean} Value indicating if the cache has been
     * initialized for a node.
     */
    hasInitializedCache(key: string): boolean;
    /**
     * Get a value indicating if a node exist in the graph.
     *
     * @param {string} key - Key of node.
     * @returns {boolean} Value indicating if a node exist in the graph.
     */
    hasNode(key: string): boolean;
    /**
     * Get a value indicating if a node sequence exist in the graph.
     *
     * @param {string} key - Key of node.
     * @returns {boolean} Value indicating if a node sequence exist
     * in the graph.
     */
    hasNodeSequence(key: string): boolean;
    /**
     * Get a value indicating if a sequence exist in the graph.
     *
     * @param {string} sequenceKey - Key of sequence.
     * @returns {boolean} Value indicating if a sequence exist
     * in the graph.
     */
    hasSequence(sequenceKey: string): boolean;
    /**
     * Get a value indicating if sequence nodes has been cached in the graph.
     *
     * @param {string} sequenceKey - Key of sequence.
     * @returns {boolean} Value indicating if a sequence nodes has been
     * cached in the graph.
     */
    hasSequenceNodes(sequenceKey: string): boolean;
    /**
     * Get a value indicating if the graph has fully cached
     * all nodes in the spatial area of a node.
     *
     * @param {string} key - Key of node.
     * @returns {boolean} Value indicating if the spatial area
     * of a node has been cached.
     */
    hasSpatialArea(key: string): boolean;
    /**
     * Get a value indicating if the graph has a tiles required
     * for a node.
     *
     * @param {string} key - Key of node.
     * @returns {boolean} Value indicating if the the tiles required
     * by a node has been cached.
     */
    hasTiles(key: string): boolean;
    /**
     * Get a node.
     *
     * @param {string} key - Key of node.
     * @returns {Image} Retrieved node.
     */
    getNode(key: string): Image;
    /**
     * Get a sequence.
     *
     * @param {string} sequenceKey - Key of sequence.
     * @returns {Image} Retrieved sequence.
     */
    getSequence(sequenceKey: string): Sequence;
    /**
     * Reset all spatial edges of the graph nodes.
     */
    resetSpatialEdges(): void;
    /**
     * Reset the complete graph but keep the nodes corresponding
     * to the supplied keys. All other nodes will be disposed.
     *
     * @param {Array<string>} keepKeys - Keys for nodes to keep
     * in graph after reset.
     */
    reset(keepKeys: string[]): void;
    /**
     * Set the spatial node filter.
     *
     * @emits FilterFunction The filter function to the {@link Graph.filter$}
     * observable.
     *
     * @param {FilterExpression} filter - Filter expression to be applied
     * when calculating spatial edges.
     */
    setFilter(filter: FilterExpression): void;
    /**
     * Uncache the graph according to the graph configuration.
     *
     * @description Uncaches unused tiles, unused nodes and
     * sequences according to the numbers specified in the
     * graph configuration. Sequences does not have a direct
     * reference to either tiles or nodes and may be uncached
     * even if they are related to the nodes that should be kept.
     *
     * @param {Array<string>} keepIds - Ids of nodes to keep in
     * graph unrelated to last access. Tiles related to those keys
     * will also be kept in graph.
     * @param {Array<string>} keepCellIds - Ids of cells to keep in
     * graph unrelated to last access. The nodes of the cells may
     * still be uncached if not specified in the keep ids param
     * but are guaranteed to not be disposed.
     * @param {string} keepSequenceId - Optional id of sequence
     * for which the belonging nodes should not be disposed or
     * removed from the graph. These nodes may still be uncached if
     * not specified in keep ids param but are guaranteed to not
     * be disposed.
     */
    uncache(keepIds: string[], keepCellIds: string[], keepSequenceId?: string): void;
    /**
     * Updates existing cells with new core nodes.
     *
     * @description Non-existing cells are discarded
     * and not requested at all.
     *
     * Existing nodes are not changed.
     *
     * New nodes are not made full or getting assets
     * cached.
     *
     * @param {Array<string>} cellIds - Cell ids.
     * @returns {Observable<Array<Image>>} Observable
     * emitting the updated cells.
     */
    updateCells$(cellIds: string[]): Observable<string>;
    /**
     * Unsubscribes all subscriptions.
     *
     * @description Afterwards, you must not call any other methods
     * on the graph instance.
     */
    unsubscribe(): void;
    private _addNewKeys;
    private _cacheSequence$;
    private _cacheTile$;
    private _makeFull;
    private _preStore;
    private _removeFromPreStore;
    private _setNode;
    private _uncacheTile;
    private _uncachePreStored;
    private _updateCachedTileAccess;
    private _updateCachedNodeAccess;
    private _updateCell$;
}

/**
 * Enumeration for graph modes.
 * @enum {number}
 * @readonly
 * @description Modes for the retrieval and caching performed
 * by the graph service on the graph.
 */
declare enum GraphMode {
    /**
     * Caching is performed on sequences only and sequence edges are
     * calculated. Spatial tiles
     * are not retrieved and spatial edges are not calculated when
     * caching nodes. Complete sequences are being cached for requested
     * nodes within the graph.
     */
    Sequence = 0,
    /**
     * Caching is performed with emphasis on spatial data. Sequence edges
     * as well as spatial edges are cached. Sequence data
     * is still requested but complete sequences are not being cached
     * for requested nodes.
     *
     * This is the initial mode of the graph service.
     */
    Spatial = 1
}

/**
 * @class GraphService
 *
 * @classdesc Represents a service for graph operations.
 */
declare class GraphService {
    private _graph$;
    private _graphMode;
    private _graphMode$;
    private _graphModeSubject$;
    private _firstGraphSubjects$;
    private _dataAdded$;
    private _initializeCacheSubscriptions;
    private _sequenceSubscriptions;
    private _spatialSubscriptions;
    private _subscriptions;
    /**
     * Create a new graph service instance.
     *
     * @param {Graph} graph - Graph instance to be operated on.
     */
    constructor(graph: Graph);
    /**
     * Get dataAdded$.
     *
     * @returns {Observable<string>} Observable emitting
     * a cell id every time data has been added to a cell.
     */
    get dataAdded$(): Observable<string>;
    /**
     * Get filter observable.
     *
     * @desciption Emits the filter every time it has changed.
     *
     * @returns {Observable<FilterFunction>} Observable
     * emitting the filter function every time it is set.
     */
    get filter$(): Observable<FilterFunction>;
    /**
     * Get graph mode observable.
     *
     * @description Emits the current graph mode.
     *
     * @returns {Observable<GraphMode>} Observable
     * emitting the current graph mode when it changes.
     */
    get graphMode$(): Observable<GraphMode>;
    /**
     * Cache full images in a bounding box.
     *
     * @description When called, the full properties of
     * the image are retrieved. The image cache is not initialized
     * for any new images retrieved and the image assets are not
     * retrieved, {@link cacheImage$} needs to be called for caching
     * assets.
     *
     * @param {LngLat} sw - South west corner of bounding box.
     * @param {LngLat} ne - North east corner of bounding box.
     * @return {Observable<Array<Image>>} Observable emitting a single item,
     * the images of the bounding box, when they have all been retrieved.
     * @throws {Error} Propagates any IO image caching errors to the caller.
     */
    cacheBoundingBox$(sw: LngLat, ne: LngLat): Observable<Image[]>;
    /**
     * Cache full images in a cell.
     *
     * @description When called, the full properties of
     * the image are retrieved. The image cache is not initialized
     * for any new images retrieved and the image assets are not
     * retrieved, {@link cacheImage$} needs to be called for caching
     * assets.
     *
     * @param {string} cellId - Id of the cell.
     * @return {Observable<Array<Image>>} Observable emitting a single item,
     * the images of the cell, when they have all been retrieved.
     * @throws {Error} Propagates any IO image caching errors to the caller.
     */
    cacheCell$(cellId: string): Observable<Image[]>;
    /**
     * Cache a image in the graph and retrieve it.
     *
     * @description When called, the full properties of
     * the image are retrieved and the image cache is initialized.
     * After that the image assets are cached and the image
     * is emitted to the observable when.
     * In parallel to caching the image assets, the sequence and
     * spatial edges of the image are cached. For this, the sequence
     * of the image and the required tiles and spatial images are
     * retrieved. The sequence and spatial edges may be set before
     * or after the image is returned.
     *
     * @param {string} id - Id of the image to cache.
     * @return {Observable<Image>} Observable emitting a single item,
     * the image, when it has been retrieved and its assets are cached.
     * @throws {Error} Propagates any IO image caching errors to the caller.
     */
    cacheImage$(id: string): Observable<Image>;
    /**
     * Cache a sequence in the graph and retrieve it.
     *
     * @param {string} sequenceId - Sequence id.
     * @returns {Observable<Sequence>} Observable emitting a single item,
     * the sequence, when it has been retrieved and its assets are cached.
     * @throws {Error} Propagates any IO image caching errors to the caller.
     */
    cacheSequence$(sequenceId: string): Observable<Sequence>;
    /**
     * Cache a sequence and its images in the graph and retrieve the sequence.
     *
     * @description Caches a sequence and its assets are cached and
     * retrieves all images belonging to the sequence. The image assets
     * or edges will not be cached.
     *
     * @param {string} sequenceId - Sequence id.
     * @param {string} referenceImageId - Id of image to use as reference
     * for optimized caching.
     * @returns {Observable<Sequence>} Observable emitting a single item,
     * the sequence, when it has been retrieved, its assets are cached and
     * all images belonging to the sequence has been retrieved.
     * @throws {Error} Propagates any IO image caching errors to the caller.
     */
    cacheSequenceImages$(sequenceId: string, referenceImageId?: string): Observable<Sequence>;
    /**
     * Dispose the graph service and its children.
     */
    dispose(): void;
    /**
     * Set a spatial edge filter on the graph.
     *
     * @description Resets the spatial edges of all cached images.
     *
     * @param {FilterExpression} filter - Filter expression to be applied.
     * @return {Observable<Graph>} Observable emitting a single item,
     * the graph, when the spatial edges have been reset.
     */
    setFilter$(filter: FilterExpression): Observable<void>;
    /**
     * Set the graph mode.
     *
     * @description If graph mode is set to spatial, caching
     * is performed with emphasis on spatial edges. If graph
     * mode is set to sequence no tile data is requested and
     * no spatial edges are computed.
     *
     * When setting graph mode to sequence all spatial
     * subscriptions are aborted.
     *
     * @param {GraphMode} mode - Graph mode to set.
     */
    setGraphMode(mode: GraphMode): void;
    /**
     * Reset the graph.
     *
     * @description Resets the graph but keeps the images of the
     * supplied ids.
     *
     * @param {Array<string>} keepIds - Ids of images to keep in graph.
     * @return {Observable<Image>} Observable emitting a single item,
     * the graph, when it has been reset.
     */
    reset$(keepIds: string[]): Observable<void>;
    /**
     * Uncache the graph.
     *
     * @description Uncaches the graph by removing tiles, images and
     * sequences. Keeps the images of the supplied ids and the tiles
     * related to those images.
     *
     * @param {Array<string>} keepIds - Ids of images to keep in graph.
     * @param {Array<string>} keepCellIds - Ids of cells to keep in graph.
     * @param {string} keepSequenceId - Optional id of sequence
     * for which the belonging images should not be disposed or
     * removed from the graph. These images may still be uncached if
     * not specified in keep ids param.
     * @return {Observable<Graph>} Observable emitting a single item,
     * the graph, when the graph has been uncached.
     */
    uncache$(keepIds: string[], keepCellIds: string[], keepSequenceId?: string): Observable<void>;
    private _abortSubjects;
    private _onDataAdded;
    private _removeFromArray;
    private _resetSubscriptions;
}

interface CacheServiceConfiguration {
    cellDepth: number;
}
declare class CacheService {
    private readonly _graphService;
    private readonly _stateService;
    private readonly _api;
    private _subscriptions;
    private _started;
    private _cellDepth;
    constructor(_graphService: GraphService, _stateService: StateService, _api: APIWrapper);
    get started(): boolean;
    configure(configuration?: CacheServiceConfiguration): void;
    start(): void;
    stop(): void;
    private _keyToEdges;
}

declare class LoadingService {
    private _loaders$;
    private _loadersSubject$;
    constructor();
    get loading$(): Observable<boolean>;
    taskLoading$(task: string): Observable<boolean>;
    startLoading(task: string): void;
    stopLoading(task: string): void;
}

/**
 * @class Spatial
 *
 * @classdesc Provides methods for scalar, vector and matrix calculations.
 */
declare class Spatial {
    private _epsilon;
    /**
     * Converts azimuthal phi rotation (counter-clockwise with origin on X-axis) to
     * bearing (clockwise with origin at north or Y-axis).
     *
     * @param {number} phi - Azimuthal phi angle in radians.
     * @returns {number} Bearing in radians.
     */
    azimuthalToBearing(phi: number): number;
    /**
     * Converts degrees to radians.
     *
     * @param {number} deg - Degrees.
     * @returns {number} Radians.
     */
    degToRad(deg: number): number;
    /**
     * Converts radians to degrees.
     *
     * @param {number} rad - Radians.
     * @returns {number} Degrees.
     */
    radToDeg(rad: number): number;
    /**
     * Creates a rotation matrix from an angle-axis vector.
     *
     * @param {Array<number>} angleAxis - Angle-axis representation of a rotation.
     * @returns {THREE.Matrix4} Rotation matrix.
     */
    rotationMatrix(angleAxis: number[]): THREE.Matrix4;
    /**
     * Rotates a vector according to a angle-axis rotation vector.
     *
     * @param {Array<number>} vector - Vector to rotate.
     * @param {Array<number>} angleAxis - Angle-axis representation of a rotation.
     * @returns {THREE.Vector3} Rotated vector.
     */
    rotate(vector: number[], angleAxis: number[]): THREE.Vector3;
    /**
     * Calculates the optical center from a rotation vector
     * on the angle-axis representation and a translation vector
     * according to C = -R^T t.
     *
     * @param {Array<number>} rotation - Angle-axis representation of a rotation.
     * @param {Array<number>} translation - Translation vector.
     * @returns {THREE.Vector3} Optical center.
     */
    opticalCenter(rotation: number[], translation: number[]): THREE.Vector3;
    /**
     * Calculates the viewing direction from a rotation vector
     * on the angle-axis representation.
     *
     * @param {number[]} rotation - Angle-axis representation of a rotation.
     * @returns {THREE.Vector3} Viewing direction.
     */
    viewingDirection(rotation: number[]): THREE.Vector3;
    /**
     * Wrap a number on the interval [min, max].
     *
     * @param {number} value - Value to wrap.
     * @param {number} min - Lower endpoint of interval.
     * @param {number} max - Upper endpoint of interval.
     * @returns {number} The wrapped number.
     */
    wrap(value: number, min: number, max: number): number;
    /**
     * Wrap an angle on the interval [-Pi, Pi].
     *
     * @param {number} angle - Value to wrap.
     * @returns {number} Wrapped angle.
     */
    wrapAngle(angle: number): number;
    /**
     * Limit the value to the interval [min, max] by changing the value to
     * the nearest available one when it is outside the interval.
     *
     * @param {number} value - Value to clamp.
     * @param {number} min - Minimum of the interval.
     * @param {number} max - Maximum of the interval.
     * @returns {number} Clamped value.
     */
    clamp(value: number, min: number, max: number): number;
    /**
     * Calculates the counter-clockwise angle from the first
     * vector (x1, y1)^T to the second (x2, y2)^T.
     *
     * @param {number} x1 - X coordinate of first vector.
     * @param {number} y1 - Y coordinate of first vector.
     * @param {number} x2 - X coordinate of second vector.
     * @param {number} y2 - Y coordinate of second vector.
     * @returns {number} Counter clockwise angle between the vectors.
     */
    angleBetweenVector2(x1: number, y1: number, x2: number, y2: number): number;
    /**
     * Calculates the minimum (absolute) angle change for rotation
     * from one angle to another on the [-Pi, Pi] interval.
     *
     * @param {number} angle1 - Start angle.
     * @param {number} angle2 - Destination angle.
     * @returns {number} Absolute angle change between angles.
     */
    angleDifference(angle1: number, angle2: number): number;
    /**
     * Calculates the relative rotation angle between two
     * angle-axis vectors.
     *
     * @param {number} rotation1 - First angle-axis vector.
     * @param {number} rotation2 - Second angle-axis vector.
     * @returns {number} Relative rotation angle.
     */
    relativeRotationAngle(rotation1: number[], rotation2: number[]): number;
    /**
     * Calculates the angle from a vector to a plane.
     *
     * @param {Array<number>} vector - The vector.
     * @param {Array<number>} planeNormal - Normal of the plane.
     * @returns {number} Angle from between plane and vector.
     */
    angleToPlane(vector: number[], planeNormal: number[]): number;
    azimuthal(direction: number[], up: number[]): number;
    /**
     * Calculates the distance between two coordinates
     * (longitude, latitude pairs) in meters according to
     * the haversine formula.
     *
     * @param {number} lat1 - Latitude of the first coordinate in degrees.
     * @param {number} lng1 - Longitude of the first coordinate in degrees.
     * @param {number} lat2 - Latitude of the second coordinate in degrees.
     * @param {number} lng2 - Longitude of the second coordinate in degrees.
     * @returns {number} Distance between lat lon positions in meters.
     */
    distanceFromLngLat(lng1: number, lat1: number, lng2: number, lat2: number): number;
}

/**
 * @class ViewportCoords
 *
 * @classdesc Provides methods for calculating 2D coordinate conversions
 * as well as 3D projection and unprojection.
 *
 * Basic coordinates are 2D coordinates on the [0, 1] interval and
 * have the origin point, (0, 0), at the top left corner and the
 * maximum value, (1, 1), at the bottom right corner of the original
 * image.
 *
 * Viewport coordinates are 2D coordinates on the [-1, 1] interval and
 * have the origin point in the center. The bottom left corner point is
 * (-1, -1) and the top right corner point is (1, 1).
 *
 * Canvas coordiantes are 2D pixel coordinates on the [0, canvasWidth] and
 * [0, canvasHeight] intervals. The origin point (0, 0) is in the top left
 * corner and the maximum value is (canvasWidth, canvasHeight) is in the
 * bottom right corner.
 *
 * 3D coordinates are in the topocentric world reference frame.
 */
declare class ViewportCoords {
    private _unprojectDepth;
    /**
     * Convert basic coordinates to canvas coordinates.
     *
     * @description Transform origin and camera position needs to be the
     * equal for reliable return value.
     *
     * @param {number} basicX - Basic X coordinate.
     * @param {number} basicY - Basic Y coordinate.
     * @param {HTMLElement} container - The viewer container.
     * @param {Transform} transform - Transform of the image to unproject from.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 2D canvas coordinates.
     */
    basicToCanvas(basicX: number, basicY: number, container: {
        offsetHeight: number;
        offsetWidth: number;
    }, transform: Transform, camera: THREE.Camera): number[];
    /**
     * Convert basic coordinates to canvas coordinates safely. If 3D point is
     * behind camera null will be returned.
     *
     * @description Transform origin and camera position needs to be the
     * equal for reliable return value.
     *
     * @param {number} basicX - Basic X coordinate.
     * @param {number} basicY - Basic Y coordinate.
     * @param {HTMLElement} container - The viewer container.
     * @param {Transform} transform - Transform of the image to unproject from.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 2D canvas coordinates if the basic point represents a 3D point
     * in front of the camera, otherwise null.
     */
    basicToCanvasSafe(basicX: number, basicY: number, container: {
        offsetHeight: number;
        offsetWidth: number;
    }, transform: Transform, camera: THREE.Camera): number[];
    /**
     * Convert basic coordinates to viewport coordinates.
     *
     * @description Transform origin and camera position needs to be the
     * equal for reliable return value.
     *
     * @param {number} basicX - Basic X coordinate.
     * @param {number} basicY - Basic Y coordinate.
     * @param {Transform} transform - Transform of the image to unproject from.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 2D viewport coordinates.
     */
    basicToViewport(basicX: number, basicY: number, transform: Transform, camera: THREE.Camera): number[];
    /**
     * Convert basic coordinates to viewport coordinates safely. If 3D point is
     * behind camera null will be returned.
     *
     * @description Transform origin and camera position needs to be the
     * equal for reliable return value.
     *
     * @param {number} basicX - Basic X coordinate.
     * @param {number} basicY - Basic Y coordinate.
     * @param {Transform} transform - Transform of the image to unproject from.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 2D viewport coordinates.
     */
    basicToViewportSafe(basicX: number, basicY: number, transform: Transform, camera: THREE.Camera): number[];
    /**
     * Convert camera 3D coordinates to viewport coordinates.
     *
     * @param {number} pointCamera - 3D point in camera coordinate system.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 2D viewport coordinates.
     */
    cameraToViewport(pointCamera: number[], camera: THREE.Camera): number[];
    /**
     * Get canvas pixel position from event.
     *
     * @param {Event} event - Event containing clientX and clientY properties.
     * @param {HTMLElement} element - HTML element.
     * @returns {Array<number>} 2D canvas coordinates.
     */
    canvasPosition(event: {
        clientX: number;
        clientY: number;
    }, element: HTMLElement): number[];
    /**
     * Convert canvas coordinates to basic coordinates.
     *
     * @description Transform origin and camera position needs to be the
     * equal for reliable return value.
     *
     * @param {number} canvasX - Canvas X coordinate.
     * @param {number} canvasY - Canvas Y coordinate.
     * @param {HTMLElement} container - The viewer container.
     * @param {Transform} transform - Transform of the image to unproject from.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 2D basic coordinates.
     */
    canvasToBasic(canvasX: number, canvasY: number, container: {
        offsetHeight: number;
        offsetWidth: number;
    }, transform: Transform, camera: THREE.Camera): number[];
    /**
     * Convert canvas coordinates to viewport coordinates.
     *
     * @param {number} canvasX - Canvas X coordinate.
     * @param {number} canvasY - Canvas Y coordinate.
     * @param {HTMLElement} container - The viewer container.
     * @returns {Array<number>} 2D viewport coordinates.
     */
    canvasToViewport(canvasX: number, canvasY: number, container: {
        offsetHeight: number;
        offsetWidth: number;
    }): number[];
    /**
     * Determines the width and height of the container in canvas coordinates.
     *
     * @param {HTMLElement} container - The viewer container.
     * @returns {Array<number>} 2D canvas coordinates.
     */
    containerToCanvas(container: {
        offsetHeight: number;
        offsetWidth: number;
    }): number[];
    /**
     * Determine basic distances from image to canvas corners.
     *
     * @description Transform origin and camera position needs to be the
     * equal for reliable return value.
     *
     * Determines the smallest basic distance for every side of the canvas.
     *
     * @param {Transform} transform - Transform of the image to unproject from.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} Array of basic distances as [top, right, bottom, left].
     */
    getBasicDistances(transform: Transform, camera: THREE.Camera): number[];
    /**
     * Determine pixel distances from image to canvas corners.
     *
     * @description Transform origin and camera position needs to be the
     * equal for reliable return value.
     *
     * Determines the smallest pixel distance for every side of the canvas.
     *
     * @param {HTMLElement} container - The viewer container.
     * @param {Transform} transform - Transform of the image to unproject from.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} Array of pixel distances as [top, right, bottom, left].
     */
    getPixelDistances(container: {
        offsetHeight: number;
        offsetWidth: number;
    }, transform: Transform, camera: THREE.Camera): number[];
    /**
     * Determine if an event occured inside an element.
     *
     * @param {Event} event - Event containing clientX and clientY properties.
     * @param {HTMLElement} element - HTML element.
     * @returns {boolean} Value indicating if the event occured inside the element or not.
     */
    insideElement(event: {
        clientX: number;
        clientY: number;
    }, element: HTMLElement): boolean;
    /**
     * Project 3D world coordinates to canvas coordinates.
     *
     * @param {Array<number>} point3D - 3D world coordinates.
     * @param {HTMLElement} container - The viewer container.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 2D canvas coordinates.
     */
    projectToCanvas(point3d: number[], container: {
        offsetHeight: number;
        offsetWidth: number;
    }, camera: THREE.Camera): number[];
    /**
     * Project 3D world coordinates to canvas coordinates safely. If 3D
     * point is behind camera null will be returned.
     *
     * @param {Array<number>} point3D - 3D world coordinates.
     * @param {HTMLElement} container - The viewer container.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 2D canvas coordinates.
     */
    projectToCanvasSafe(point3d: number[], container: {
        offsetHeight: number;
        offsetWidth: number;
    }, camera: THREE.Camera): number[];
    /**
     * Project 3D world coordinates to viewport coordinates.
     *
     * @param {Array<number>} point3D - 3D world coordinates.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 2D viewport coordinates.
     */
    projectToViewport(point3d: number[], camera: THREE.Camera): number[];
    /**
     * Uproject canvas coordinates to 3D world coordinates.
     *
     * @param {number} canvasX - Canvas X coordinate.
     * @param {number} canvasY - Canvas Y coordinate.
     * @param {HTMLElement} container - The viewer container.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 3D world coordinates.
     */
    unprojectFromCanvas(canvasX: number, canvasY: number, container: {
        offsetHeight: number;
        offsetWidth: number;
    }, camera: THREE.Camera): THREE.Vector3;
    /**
     * Unproject viewport coordinates to 3D world coordinates.
     *
     * @param {number} viewportX - Viewport X coordinate.
     * @param {number} viewportY - Viewport Y coordinate.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 3D world coordinates.
     */
    unprojectFromViewport(viewportX: number, viewportY: number, camera: THREE.Camera): THREE.Vector3;
    /**
     * Convert viewport coordinates to basic coordinates.
     *
     * @description Transform origin and camera position needs to be the
     * equal for reliable return value.
     *
     * @param {number} viewportX - Viewport X coordinate.
     * @param {number} viewportY - Viewport Y coordinate.
     * @param {Transform} transform - Transform of the image to unproject from.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 2D basic coordinates.
     */
    viewportToBasic(viewportX: number, viewportY: number, transform: Transform, camera: THREE.Camera): number[];
    /**
     * Convert viewport coordinates to canvas coordinates.
     *
     * @param {number} viewportX - Viewport X coordinate.
     * @param {number} viewportY - Viewport Y coordinate.
     * @param {HTMLElement} container - The viewer container.
     * @returns {Array<number>} 2D canvas coordinates.
     */
    viewportToCanvas(viewportX: number, viewportY: number, container: {
        offsetHeight: number;
        offsetWidth: number;
    }): number[];
    /**
     * Convert 3D world coordinates to 3D camera coordinates.
     *
     * @param {number} point3D - 3D point in world coordinate system.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 3D camera coordinates.
     */
    worldToCamera(point3d: number[], camera: THREE.Camera): number[];
}

declare class PanService {
    private _graphService;
    private _stateService;
    private _graphCalculator;
    private _spatial;
    private _viewportCoords;
    private _panImagesSubject$;
    private _panImages$;
    private _panImagesSubscription;
    private _subscriptions;
    private _mode;
    constructor(graphService: GraphService, stateService: StateService, enabled?: boolean, graphCalculator?: GraphCalculator, spatial?: Spatial, viewportCoords?: ViewportCoords);
    get panImages$(): Observable<[Image, Transform, number][]>;
    dispose(): void;
    enable(): void;
    disable(): void;
    start(): void;
    stop(): void;
    private _distance;
    private _timeDifference;
    private _createTransform;
    private _computeProjectedPoints;
    private _computeHorizontalFov;
    private _coordToFov;
}

declare class PlayService {
    static readonly sequenceSpeed: number;
    private _graphService;
    private _stateService;
    private _imagesAhead;
    private _playing;
    private _speed;
    private _direction$;
    private _directionSubject$;
    private _playing$;
    private _playingSubject$;
    private _speed$;
    private _speedSubject$;
    private _playingSubscription;
    private _cacheSubscription;
    private _clearSubscription;
    private _earthSubscription;
    private _graphModeSubscription;
    private _stopSubscription;
    private _subscriptions;
    private _bridging$;
    constructor(graphService: GraphService, stateService: StateService);
    get playing(): boolean;
    get direction$(): Observable<NavigationDirection>;
    get playing$(): Observable<boolean>;
    get speed$(): Observable<number>;
    play(): void;
    dispose(): void;
    setDirection(direction: NavigationDirection): void;
    setSpeed(speed: number): void;
    stop(): void;
    private _mapSpeed;
    private _mapImagesAhead;
    private _setPlaying;
    private _setSpeed;
}

declare class Navigator {
    private _api;
    private _cacheService;
    private _graphService;
    private _loadingService;
    private _loadingName;
    private _panService;
    private _playService;
    private _stateService;
    private _idRequested$;
    private _movedToId$;
    private _request$;
    private _requestSubscription;
    private _imageRequestSubscription;
    constructor(options: ViewerOptions, api?: APIWrapper, graphService?: GraphService, loadingService?: LoadingService, stateService?: StateService, cacheService?: CacheService, playService?: PlayService, panService?: PanService);
    get api(): APIWrapper;
    get cacheService(): CacheService;
    get graphService(): GraphService;
    get loadingService(): LoadingService;
    get movedToId$(): Observable<string>;
    get panService(): PanService;
    get playService(): PlayService;
    get stateService(): StateService;
    dispose(): void;
    moveTo$(id: string): Observable<Image>;
    moveDir$(direction: NavigationDirection): Observable<Image>;
    setFilter$(filter: FilterExpression): Observable<void>;
    setAccessToken$(accessToken?: string): Observable<void>;
    private _cacheIds$;
    private _abortRequest;
    private _makeRequest$;
    private _moveTo$;
    private _trajectoryIds$;
}

declare class SubscriptionHolder {
    private _subscriptions;
    push(subscription: Subscription): void;
    unsubscribe(): void;
}

interface IComponent {
    /**
     * Value indicating if the component is currently active.
     */
    readonly activated: boolean;
    /**
     * Default configuration for the component.
     */
    readonly defaultConfiguration: ComponentConfiguration;
    /**
     * The name of the component. Used when interacting with the
     * component through the Viewer's API.
     */
    readonly name: string;
    /**
     * Configure the component.
     */
    configure(configuration: ComponentConfiguration): void;
}

/**
 * @event
 */
declare type ComponentEventType = "geometrycreate" | "hover" | "markerdragend" | "markerdragstart" | "markerposition" | "playing" | "tagcreateend" | "tagcreatestart" | "tagmode" | "tags";

declare abstract class Component<TConfiguration extends ComponentConfiguration> extends EventEmitter implements IComponent {
    static componentName: ComponentName | FallbackComponentName;
    protected _activated: boolean;
    protected _container: Container;
    protected _name: string;
    protected _navigator: Navigator;
    protected readonly _subscriptions: SubscriptionHolder;
    protected _activated$: BehaviorSubject<boolean>;
    protected _configuration$: Observable<TConfiguration>;
    protected _configurationSubject$: Subject<TConfiguration>;
    constructor(name: string, container: Container, navigator: Navigator);
    /**
     * Get activated.
     *
     * @returns {boolean} Value indicating if the component is
     * currently active.
     */
    get activated(): boolean;
    /** @ignore */
    get activated$(): Observable<boolean>;
    /**
     * Get default configuration.
     *
     * @returns {TConfiguration} Default configuration for component.
     */
    get defaultConfiguration(): TConfiguration;
    /** @ignore */
    get configuration$(): Observable<TConfiguration>;
    /**
     * Get name.
     *
     * @description The name of the component. Used when interacting with the
     * component through the Viewer's API.
     */
    get name(): string;
    /** @ignore */
    activate(conf?: TConfiguration): void;
    /**
     * Configure the component.
     *
     * @param configuration Component configuration.
     */
    configure(configuration: TConfiguration): void;
    /** @ignore */
    deactivate(): void;
    /** @inheritdoc */
    fire<T>(type: ComponentEventType, event: T): void;
    /** @inheritdoc */
    off<T>(type: ComponentEventType, handler: (event: T) => void): void;
    /** @inheritdoc */
    on<T>(type: ComponentEventType, handler: (event: T) => void): void;
    /**
     * Detect the viewer's new width and height and resize the component's
     * rendered elements accordingly if applicable.
     *
     * @ignore
     */
    resize(): void;
    protected abstract _activate(): void;
    protected abstract _deactivate(): void;
    protected abstract _getDefaultConfiguration(): TConfiguration;
}

/**
 * @class BearingComponent
 *
 * @classdesc Component for indicating bearing and field of view.
 *
 * @example
 * ```js
 * var viewer = new Viewer({ ... });
 * var bearingComponent = viewer.getComponent("bearing");
 * bearingComponent.configure({ size: ComponentSize.Small });
 * ```
 */
declare class BearingComponent extends Component<BearingConfiguration> {
    static componentName: ComponentName;
    private _spatial;
    private _viewportCoords;
    private _svgNamespace;
    private _distinctThreshold;
    private _animationSpeed;
    /** @ignore */
    constructor(name: string, container: Container, navigator: Navigator);
    protected _activate(): void;
    protected _deactivate(): void;
    protected _getDefaultConfiguration(): BearingConfiguration;
    private _createFovIndicator;
    private _createFovArc;
    private _createCircleSectorCompass;
    private _createCircleSector;
    private _createNorth;
    private _createBackground;
    private _computeProjectedPoints;
    private _computeHorizontalFov;
    private _coordToFov;
    private _interpolate;
}

declare class CacheComponent extends Component<CacheConfiguration> {
    static componentName: ComponentName;
    /** @ignore */
    constructor(name: string, container: Container, navigator: Navigator);
    protected _activate(): void;
    protected _deactivate(): void;
    protected _getDefaultConfiguration(): CacheConfiguration;
    private _cache$;
    private _imageToEdges$;
}

/**
 * Interface for general component events.
 */
interface ComponentEvent {
    /**
     * The component object that fired the event.
     */
    target: IComponent;
    /**
     * The event type.
     */
    type: ComponentEventType;
}

/**
 * Interface for component hover events.
 */
interface ComponentHoverEvent extends ComponentEvent {
    /**
     * The image id corresponding to the element or object that
     * is being hovered. When the mouse leaves the element or
     * object the id will be null.
     */
    id: string;
    type: "hover";
}

/**
 * @class Geometry
 * @abstract
 * @classdesc Represents a geometry.
 */
declare abstract class Geometry {
    protected _notifyChanged$: Subject<Geometry>;
    /**
     * Create a geometry.
     *
     * @constructor
     * @ignore
     */
    constructor();
    /**
     * Get changed observable.
     *
     * @description Emits the geometry itself every time the geometry
     * has changed.
     *
     * @returns {Observable<Geometry>} Observable emitting the geometry instance.
     * @ignore
     */
    get changed$(): Observable<Geometry>;
    /**
     * Get the 2D basic coordinates for the centroid of the geometry.
     *
     * @returns {Array<number>} 2D basic coordinates representing the centroid.
     * @ignore
     */
    abstract getCentroid2d(): number[];
    /**
     * Get the 3D world coordinates for the centroid of the geometry.
     *
     * @param {Transform} transform - The transform of the image related to the geometry.
     * @returns {Array<number>} 3D world coordinates representing the centroid.
     * @ignore
     */
    abstract getCentroid3d(transform: Transform): number[];
    /**
     * Set the 2D centroid of the geometry.
     *
     * @param {Array<number>} value - The new value of the centroid in basic coordinates.
     * @param {Transform} transform - The transform of the image related to the geometry.
     * @ignore
     */
    abstract setCentroid2d(value: number[], transform: Transform): void;
}

/**
 * Interface for component geometry events.
 */
interface ComponentGeometryEvent extends ComponentEvent {
    /**
     * Geometry related to the event.
     */
    geometry: Geometry;
    type: "geometrycreate";
}

/**
 * @class Marker
 *
 * @classdesc Represents an abstract marker class that should be extended
 * by marker implementations used in the marker component.
 */
declare abstract class Marker {
    protected _id: string;
    protected _geometry: THREE.Object3D;
    protected _lngLat: LngLat;
    constructor(id: string, lngLat: LngLat);
    /**
     * Get id.
     * @returns {string} The id of the marker.
     */
    get id(): string;
    /**
     * Get geometry.
     *
     * @ignore
     */
    get geometry(): THREE.Object3D;
    /**
     * Get lngLat.
     * @returns {LngLat} The geographic coordinates of the marker.
     */
    get lngLat(): LngLat;
    /** @ignore */
    createGeometry(position: number[]): void;
    /** @ignore */
    disposeGeometry(): void;
    /** @ignore */
    getInteractiveObjects(): THREE.Object3D[];
    /** @ignore */
    lerpAltitude(alt: number, alpha: number): void;
    /** @ignore */
    updatePosition(position: number[], lngLat?: LngLat): void;
    protected abstract _createGeometry(position: number[]): void;
    protected abstract _disposeGeometry(): void;
    protected abstract _getInteractiveObjects(): THREE.Object3D[];
}

/**
 * Interface for component marker events.
 */
interface ComponentMarkerEvent extends ComponentEvent {
    /**
     * The marker that was affected by the event.
     */
    marker: Marker;
    type: "markerdragend" | "markerdragstart" | "markerposition";
}

/**
 * Interface for component play events.
 */
interface ComponentPlayEvent extends ComponentEvent {
    /**
     * Value indiciating if the component is playing or not.
     */
    playing: boolean;
    type: "playing";
}

/**
 * Interface for component state events.
 *
 * @example
 * ```js
 * // The `hover` event is an example of a `ComponentStateEvent`.
 * // Set up an event listener on the direction component.
 * var directionComponent = viewer.getComponent('direction');
 * directionComponent.on('hover', function(e) {
 *   console.log('A hover event has occured');
 * });
 * ```
 */
interface ComponentStateEvent extends ComponentEvent {
    type: "tagcreateend" | "tagcreatestart" | "tags";
}

/**
 * Interface for component tag mode events.
 */
interface ComponentTagModeEvent extends ComponentEvent {
    /**
     * Value indicating the current tag mode of the component.
     */
    mode: TagMode;
    type: "tagmode";
}

/**
 * @class DirectionDOMRenderer
 * @classdesc DOM renderer for direction arrows.
 */
declare class DirectionDOMRenderer {
    private _spatial;
    private _calculator;
    private _image;
    private _rotation;
    private _epsilon;
    private _highlightKey;
    private _distinguishSequence;
    private _needsRender;
    private _stepEdges;
    private _turnEdges;
    private _sphericalEdges;
    private _sequenceEdgeKeys;
    private _stepDirections;
    private _turnDirections;
    private _turnNames;
    private _isEdge;
    constructor(configuration: DirectionConfiguration, size: ViewportSize);
    /**
     * Get needs render.
     *
     * @returns {boolean} Value indicating whether render should be called.
     */
    get needsRender(): boolean;
    /**
     * Renders virtual DOM elements.
     *
     * @description Calling render resets the needs render property.
     */
    render(navigator: Navigator): vd.VNode;
    setEdges(edgeStatus: NavigationEdgeStatus, sequence: Sequence): void;
    /**
     * Set image for which to show edges.
     *
     * @param {Image} image
     */
    setImage(image: Image): void;
    /**
     * Set the render camera to use for calculating rotations.
     *
     * @param {RenderCamera} renderCamera
     */
    setRenderCamera(renderCamera: RenderCamera): void;
    /**
     * Set configuration values.
     *
     * @param {DirectionConfiguration} configuration
     */
    setConfiguration(configuration: DirectionConfiguration): void;
    /**
     * Detect the element's width and height and resize
     * elements accordingly.
     *
     * @param {ViewportSize} size Size of vßiewer container element.
     */
    resize(size: ViewportSize): void;
    private _setNeedsRender;
    private _clearEdges;
    private _setEdges;
    private _createSphericalArrows;
    private _createSphericalToPerspectiveArrow;
    private _createPerspectiveToSphericalArrows;
    private _createStepArrows;
    private _createTurnArrows;
    private _createVNodeByKey;
    private _createVNodeByDirection;
    private _createVNodeByTurn;
    private _createVNodeInactive;
    private _createVNode;
    private _getContainer;
}

/**
 * @class DirectionComponent
 * @classdesc Component showing navigation arrows for steps and turns.
 */
declare class DirectionComponent extends Component<DirectionConfiguration> {
    /** @inheritdoc */
    static componentName: ComponentName;
    private _renderer;
    private _hoveredIdSubject$;
    private _hoveredId$;
    /** @ignore */
    constructor(name: string, container: Container, navigator: Navigator, directionDOMRenderer?: DirectionDOMRenderer);
    fire(type: "hover", event: ComponentHoverEvent): void;
    /** @ignore */
    fire(type: ComponentEventType, event: ComponentStateEvent): void;
    off(type: "hover", handler: (event: ComponentHoverEvent) => void): void;
    /** @ignore */
    off(type: ComponentEventType, handler: (event: ComponentStateEvent) => void): void;
    /**
     * Fired when the hovered element of a component changes.
     *
     * @event hover
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * var component = viewer.getComponent('<component-name>');
     * // Set an event listener
     * component.on('hover', function() {
     *   console.log("A hover event has occurred.");
     * });
     * ```
     */
    on(type: "hover", handler: (event: ComponentHoverEvent) => void): void;
    /** @ignore */
    on(type: ComponentEventType, handler: (event: ComponentStateEvent) => void): void;
    protected _activate(): void;
    protected _deactivate(): void;
    protected _getDefaultConfiguration(): DirectionConfiguration;
}

declare abstract class HandlerBase<TConfiguration extends ComponentConfiguration> {
    protected _component: Component<TConfiguration>;
    protected _container: Container;
    protected _navigator: Navigator;
    protected _enabled: boolean;
    /** @ignore */
    constructor(component: Component<TConfiguration>, container: Container, navigator: Navigator);
    /**
     * Returns a Boolean indicating whether the interaction is enabled.
     *
     * @returns {boolean} `true` if the interaction is enabled.
     */
    get isEnabled(): boolean;
    /**
     * Enables the interaction.
     *
     * @example
     * ```js
     * <component-name>.<handler-name>.enable();
     * ```
     */
    enable(): void;
    /**
     * Disables the interaction.
     *
     * @example
     * ```js
     * <component-name>.<handler-name>.disable();
     * ```
     */
    disable(): void;
    protected abstract _enable(): void;
    protected abstract _disable(): void;
    protected abstract _getConfiguration(enable: boolean): TConfiguration;
}

/**
 * The `KeySequenceNavigationHandler` allows the user to navigate through a sequence using the
 * following key commands:
 *
 * `ALT` + `Up Arrow`: Navigate to next image in the sequence.
 * `ALT` + `Down Arrow`: Navigate to previous image in sequence.
 *
 * @example
 * ```js
 * var keyboardComponent = viewer.getComponent("keyboard");
 *
 * keyboardComponent.keySequenceNavigation.disable();
 * keyboardComponent.keySequenceNavigation.enable();
 *
 * var isEnabled = keyboardComponent.keySequenceNavigation.isEnabled;
 * ```
 */
declare class KeySequenceNavigationHandler extends HandlerBase<KeyboardConfiguration> {
    private _keyDownSubscription;
    protected _enable(): void;
    protected _disable(): void;
    protected _getConfiguration(enable: boolean): KeyboardConfiguration;
}

/**
 * The `KeySpatialNavigationHandler` allows the user to navigate through a sequence using the
 * following key commands:
 *
 * `Up Arrow`: Step forward.
 * `Down Arrow`: Step backward.
 * `Left Arrow`: Step to the left.
 * `Rigth Arrow`: Step to the right.
 * `SHIFT` + `Down Arrow`: Turn around.
 * `SHIFT` + `Left Arrow`: Turn to the left.
 * `SHIFT` + `Rigth Arrow`: Turn to the right.
 *
 * @example
 * ```js
 * var keyboardComponent = viewer.getComponent("keyboard");
 *
 * keyboardComponent.keySpatialNavigation.disable();
 * keyboardComponent.keySpatialNavigation.enable();
 *
 * var isEnabled = keyboardComponent.keySpatialNavigation.isEnabled;
 * ```
 */
declare class KeySpatialNavigationHandler extends HandlerBase<KeyboardConfiguration> {
    private _spatial;
    private _keyDownSubscription;
    /** @ignore */
    constructor(component: Component<KeyboardConfiguration>, container: Container, navigator: Navigator, spatial: Spatial);
    protected _enable(): void;
    protected _disable(): void;
    protected _getConfiguration(enable: boolean): KeyboardConfiguration;
    private _moveDir;
    private _moveTo;
    private _rotationFromCamera;
}

/**
 * The `KeyZoomHandler` allows the user to zoom in and out using the
 * following key commands:
 *
 * `+`: Zoom in.
 * `-`: Zoom out.
 *
 * @example
 * ```js
 * var keyboardComponent = viewer.getComponent("keyboard");
 *
 * keyboardComponent.keyZoom.disable();
 * keyboardComponent.keyZoom.enable();
 *
 * var isEnabled = keyboardComponent.keyZoom.isEnabled;
 * ```
 */
declare class KeyZoomHandler extends HandlerBase<KeyboardConfiguration> {
    private _keyDownSubscription;
    private _viewportCoords;
    /** @ignore */
    constructor(component: Component<KeyboardConfiguration>, container: Container, navigator: Navigator, viewportCoords: ViewportCoords);
    protected _enable(): void;
    protected _disable(): void;
    protected _getConfiguration(enable: boolean): KeyboardConfiguration;
}

/**
 * The `KeyPlayHandler` allows the user to control the play behavior
 * using the following key commands:
 *
 * `Spacebar`: Start or stop playing.
 * `SHIFT` + `D`: Switch direction.
 * `<`: Decrease speed.
 * `>`: Increase speed.
 *
 * @example
 * ```js
 * var keyboardComponent = viewer.getComponent("keyboard");
 *
 * keyboardComponent.keyPlay.disable();
 * keyboardComponent.keyPlay.enable();
 *
 * var isEnabled = keyboardComponent.keyPlay.isEnabled;
 * ```
 */
declare class KeyPlayHandler extends HandlerBase<KeyboardConfiguration> {
    private _keyDownSubscription;
    protected _enable(): void;
    protected _disable(): void;
    protected _getConfiguration(enable: boolean): KeyboardConfiguration;
}

/**
 * @class KeyboardComponent
 *
 * @classdesc Component for keyboard event handling.
 *
 * To retrive and use the keyboard component
 *
 * @example
 * ```js
 * var viewer = new Viewer({ ... });
 *
 * var keyboardComponent = viewer.getComponent("keyboard");
 * ```
 */
declare class KeyboardComponent extends Component<KeyboardConfiguration> {
    static componentName: ComponentName;
    private _keyPlayHandler;
    private _keySequenceNavigationHandler;
    private _keySpatialNavigationHandler;
    private _keyZoomHandler;
    /** @ignore */
    constructor(name: string, container: Container, navigator: Navigator);
    /**
     * Get key play.
     *
     * @returns {KeyPlayHandler} The key play handler.
     */
    get keyPlay(): KeyPlayHandler;
    /**
     * Get key sequence navigation.
     *
     * @returns {KeySequenceNavigationHandler} The key sequence navigation handler.
     */
    get keySequenceNavigation(): KeySequenceNavigationHandler;
    /**
     * Get spatial.
     *
     * @returns {KeySpatialNavigationHandler} The spatial handler.
     */
    get keySpatialNavigation(): KeySpatialNavigationHandler;
    /**
     * Get key zoom.
     *
     * @returns {KeyZoomHandler} The key zoom handler.
     */
    get keyZoom(): KeyZoomHandler;
    protected _activate(): void;
    protected _deactivate(): void;
    protected _getDefaultConfiguration(): KeyboardConfiguration;
}

/**
 * @interface CircleMarkerOptions
 *
 * Interface that represents the options for configuring a `CircleMarker`.
 */
interface CircleMarkerOptions {
    /**
     * The color of the marker.
     *
     * @default "#fff"
     */
    color?: number | string;
    /**
     * The opacity of the marker.
     *
     * @default 0.4
     */
    opacity?: number;
    /**
     * The radius of the circle in meters.
     *
     * @default 1
     */
    radius?: number;
}

/**
 * @class CircleMarker
 *
 * @classdesc Non-interactive marker with a flat circle shape. The circle
 * marker can not be configured to be interactive.
 *
 * Circle marker properties can not be updated after creation.
 *
 * To create and add one `CircleMarker` with default configuration
 * and one with configuration use
 *
 * @example
 * ```js
 * var defaultMarker = new CircleMarker(
 *     "id-1",
 *     { lat: 0, lng: 0, });
 *
 * var configuredMarker = new CircleMarker(
 *     "id-2",
 *     { lat: 0, lng: 0, },
 *     {
 *         color: "#0ff",
 *         opacity: 0.3,
 *         radius: 0.7,
 *     });
 *
 * markerComponent.add([defaultMarker, configuredMarker]);
 * ```
 */
declare class CircleMarker extends Marker {
    private _color;
    private _opacity;
    private _radius;
    constructor(id: string, lngLat: LngLat, options?: CircleMarkerOptions);
    protected _createGeometry(position: number[]): void;
    protected _disposeGeometry(): void;
    protected _getInteractiveObjects(): THREE.Object3D[];
}

/**
 * @class MarkerComponent
 *
 * @classdesc Component for showing and editing 3D marker objects.
 *
 * The `add` method is used for adding new markers or replacing
 * markers already in the set.
 *
 * If a marker already in the set has the same
 * id as one of the markers added, the old marker will be removed and
 * the added marker will take its place.
 *
 * It is not possible to update markers in the set by updating any properties
 * directly on the marker object. Markers need to be replaced by
 * re-adding them for updates to geographic position or configuration
 * to be reflected.
 *
 * Markers added to the marker component can be either interactive
 * or non-interactive. Different marker types define their behavior.
 * Markers with interaction support can be configured with options
 * to respond to dragging inside the viewer and be detected when
 * retrieving markers from pixel points with the `getMarkerIdAt` method.
 *
 * To retrive and use the marker component
 *
 * @example
 * ```js
 * var viewer = new Viewer({ component: { marker: true }, ... });
 *
 * var markerComponent = viewer.getComponent("marker");
 * ```
 */
declare class MarkerComponent extends Component<MarkerConfiguration> {
    static componentName: ComponentName;
    private _graphCalculator;
    private _markerScene;
    private _markerSet;
    private _viewportCoords;
    private _relativeGroundAltitude;
    /** @ignore */
    constructor(name: string, container: Container, navigator: Navigator);
    /**
     * Add markers to the marker set or replace markers in the marker set.
     *
     * @description If a marker already in the set has the same
     * id as one of the markers added, the old marker will be removed
     * the added marker will take its place.
     *
     * Any marker inside the visible bounding bbox
     * will be initialized and placed in the viewer.
     *
     * @param {Array<Marker>} markers - Markers to add.
     *
     * @example
     * ```js
     * markerComponent.add([marker1, marker2]);
     * ```
     */
    add(markers: Marker[]): void;
    fire(type: "markerdragend" | "markerdragstart" | "markerposition", event: ComponentMarkerEvent): void;
    /** @ignore */
    fire(type: ComponentEventType, event: ComponentEvent): void;
    /**
     * Returns the marker in the marker set with the specified id, or
     * undefined if the id matches no marker.
     *
     * @param {string} markerId - Id of the marker.
     *
     * @example
     * ```js
     * var marker = markerComponent.get("markerId");
     * ```
     *
     */
    get(markerId: string): Marker;
    /**
     * Returns an array of all markers.
     *
     * @example
     * ```js
     * var markers = markerComponent.getAll();
     * ```
     */
    getAll(): Marker[];
    /**
     * Returns the id of the interactive marker closest to the current camera
     * position at the specified point.
     *
     * @description Notice that the pixelPoint argument requires x, y
     * coordinates from pixel space.
     *
     * With this function, you can use the coordinates provided by mouse
     * events to get information out of the marker component.
     *
     * If no interactive geometry of an interactive marker exist at the pixel
     * point, `null` will be returned.
     *
     * @param {Array<number>} pixelPoint - Pixel coordinates on the viewer element.
     * @returns {string} Id of the interactive marker closest to the camera. If no
     * interactive marker exist at the pixel point, `null` will be returned.
     *
     * @example
     * ```js
     * markerComponent.getMarkerIdAt([100, 100])
     *     .then((markerId) => { console.log(markerId); });
     * ```
     */
    getMarkerIdAt(pixelPoint: number[]): Promise<string>;
    /**
     * Check if a marker exist in the marker set.
     *
     * @param {string} markerId - Id of the marker.
     *
     * @example
     * ```js
     * var markerExists = markerComponent.has("markerId");
     * ```
     */
    has(markerId: string): boolean;
    off(type: "markerdragend" | "markerdragstart" | "markerposition", handler: (event: ComponentMarkerEvent) => void): void;
    /** @ignore */
    off(type: ComponentEventType, handler: (event: ComponentEvent) => void): void;
    /**
     * Fired when a marker drag interaction ends.
     *
     * @event markerdragend
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * var component = viewer.getComponent('<component-name>');
     * // Set an event listener
     * component.on('markerdragend', function() {
     *   console.log("A markerdragend event has occurred.");
     * });
     * ```
     */
    on(type: "markerdragend", handler: (event: ComponentMarkerEvent) => void): void;
    /**
     * Fired when a marker drag interaction starts.
     *
     * @event markerdragstart
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * var component = viewer.getComponent('<component-name>');
     * // Set an event listener
     * component.on('markerdragstart', function() {
     *   console.log("A markerdragstart event has occurred.");
     * });
     * ```
     */
    on(type: "markerdragstart", handler: (event: ComponentMarkerEvent) => void): void;
    /**
     * Fired when the position of a marker is changed.
     *
     * @event markerposition
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * var component = viewer.getComponent('<component-name>');
     * // Set an event listener
     * component.on('markerposition', function() {
     *   console.log("A markerposition event has occurred.");
     * });
     * ```
     */
    on(type: "markerposition", handler: (event: ComponentMarkerEvent) => void): void;
    /**
     * Remove markers with the specified ids from the marker set.
     *
     * @param {Array<string>} markerIds - Ids for markers to remove.
     *
     * @example
     * ```js
     * markerComponent.remove(["id-1", "id-2"]);
     * ```
     */
    remove(markerIds: string[]): void;
    /**
     * Remove all markers from the marker set.
     *
     * @example
     * ```js
     * markerComponent.removeAll();
     * ```
     */
    removeAll(): void;
    protected _activate(): void;
    protected _deactivate(): void;
    protected _getDefaultConfiguration(): MarkerConfiguration;
}

/**
 * @interface SimpleMarkerOptions
 *
 * Interface that represents the options for configuring a `SimpleMarker`.
 */
interface SimpleMarkerOptions {
    /**
     * The color of the ball inside the marker.
     *
     * @default "#f00"
     */
    ballColor?: number | string;
    /**
     * The opacity of the ball inside the marker.
     *
     * @default 0.8
     */
    ballOpacity?: number;
    /**
     * The color of the ice creame shape.
     *
     * @default "#f00"
     */
    color?: number | string;
    /**
     * Value indicating if the marker should be interactive or not.
     *
     * @description If the marker is configured to be interactive
     * it will be draggable in the viewer and retrievable with the
     * `getMarkerIdAt` method on the `MarkerComponent`.
     *
     * @default false
     */
    interactive?: boolean;
    /**
     * The opacity of the ice creame shape.
     *
     * @default 0.4
     */
    opacity?: number;
    /**
     * The radius of the ice cream shape in meters.
     *
     * @default 1
     */
    radius?: number;
}

/**
 * @class SimpleMarker
 *
 * @classdesc Interactive marker with ice cream shape. The sphere
 * inside the ice cream can be configured to be interactive.
 *
 * Simple marker properties can not be updated after creation.
 *
 * To create and add one `SimpleMarker` with default configuration
 * (non-interactive) and one interactive with configuration use
 *
 * @example
 * ```js
 * var defaultMarker = new SimpleMarker(
 *     "id-1",
 *     { lat: 0, lng: 0, });
 *
 * var interactiveMarker = new SimpleMarker(
 *     "id-2",
 *     { lat: 0, lng: 0, },
 *     {
 *         ballColor: "#00f",
 *         ballOpacity: 0.5,
 *         color: "#00f",
 *         interactive: true,
 *         opacity: 0.3,
 *         radius: 0.7,
 *     });
 *
 * markerComponent.add([defaultMarker, interactiveMarker]);
 * ```
 */
declare class SimpleMarker extends Marker {
    private _ballColor;
    private _ballOpacity;
    private _circleToRayAngle;
    private _color;
    private _interactive;
    private _opacity;
    private _radius;
    constructor(id: string, lngLat: LngLat, options?: SimpleMarkerOptions);
    protected _createGeometry(position: number[]): void;
    protected _disposeGeometry(): void;
    protected _getInteractiveObjects(): THREE.Object3D[];
    private _markerHeight;
    private _createMarkerGeometry;
}

/**
 * The `DragPanHandler` allows the user to pan the viewer image by clicking and dragging the cursor.
 *
 * @example
 * ```js
 * var pointerComponent = viewer.getComponent("pointer");
 *
 * pointerComponent.dragPan.disable();
 * pointerComponent.dragPan.enable();
 *
 * var isEnabled = pointerComponent.dragPan.isEnabled;
 * ```
 */
declare class DragPanHandler extends HandlerBase<PointerConfiguration> {
    private _spatial;
    private _viewportCoords;
    private _activeMouseSubscription;
    private _activeTouchSubscription;
    private _preventDefaultSubscription;
    private _rotateSubscription;
    private _rotateWithoutInertiaSubscription;
    /** @ignore */
    constructor(component: Component<PointerConfiguration>, container: Container, navigator: Navigator, viewportCoords: ViewportCoords, spatial: Spatial);
    protected _enable(): void;
    protected _disable(): void;
    protected _getConfiguration(enable: boolean): PointerConfiguration;
    private _drainBuffer;
}

declare class EarthControlHandler extends HandlerBase<PointerConfiguration> {
    private _viewportCoords;
    private _spatial;
    private _subscriptions;
    /** @ignore */
    constructor(component: Component<PointerConfiguration>, container: Container, navigator: Navigator, viewportCoords: ViewportCoords, spatial: Spatial);
    protected _enable(): void;
    protected _disable(): void;
    protected _getConfiguration(): PointerConfiguration;
    private _eventToViewport;
    private _mousePairToRotation;
    private _planeIntersection;
}

/**
 * The `ScrollZoomHandler` allows the user to zoom the viewer image by scrolling.
 *
 * @example
 * ```js
 * var pointerComponent = viewer.getComponent("pointer");
 *
 * pointerComponent.scrollZoom.disable();
 * pointerComponent.scrollZoom.enable();
 *
 * var isEnabled = pointerComponent.scrollZoom.isEnabled;
 * ```
 */
declare class ScrollZoomHandler extends HandlerBase<PointerConfiguration> {
    private _viewportCoords;
    private _preventDefaultSubscription;
    private _zoomSubscription;
    /** @ignore */
    constructor(component: Component<PointerConfiguration>, container: Container, navigator: Navigator, viewportCoords: ViewportCoords);
    protected _enable(): void;
    protected _disable(): void;
    protected _getConfiguration(enable: boolean): PointerConfiguration;
}

/**
 * The `TouchZoomHandler` allows the user to zoom the viewer image by pinching on a touchscreen.
 *
 * @example
 * ```js
 * var pointerComponent = viewer.getComponent("pointer");
 *
 * pointerComponent.touchZoom.disable();
 * pointerComponent.touchZoom.enable();
 *
 * var isEnabled = pointerComponent.touchZoom.isEnabled;
 * ```
 */
declare class TouchZoomHandler extends HandlerBase<PointerConfiguration> {
    private _viewportCoords;
    private _activeSubscription;
    private _preventDefaultSubscription;
    private _zoomSubscription;
    /** @ignore */
    constructor(component: Component<PointerConfiguration>, container: Container, navigator: Navigator, viewportCoords: ViewportCoords);
    protected _enable(): void;
    protected _disable(): void;
    protected _getConfiguration(enable: boolean): PointerConfiguration;
}

/**
 * @class PointerComponent
 *
 * @classdesc Component handling mouse, pen, and touch events for camera movement.
 *
 * To retrive and use the mouse component
 *
 * @example
 * ```js
 * var viewer = new Viewer({ ... });
 *
 * var pointerComponent = viewer.getComponent("pointer");
 * ```
 */
declare class PointerComponent extends Component<PointerConfiguration> {
    /** @inheritdoc */
    static componentName: ComponentName;
    private _bounceHandler;
    private _dragPanHandler;
    private _earthControlHandler;
    private _scrollZoomHandler;
    private _touchZoomHandler;
    /** @ignore */
    constructor(name: string, container: Container, navigator: Navigator);
    /**
     * Get drag pan.
     *
     * @returns {DragPanHandler} The drag pan handler.
     */
    get dragPan(): DragPanHandler;
    /**
     * Get earth control.
     *
     * @returns {EarthControlHandler} The earth control handler.
     */
    get earthControl(): EarthControlHandler;
    /**
     * Get scroll zoom.
     *
     * @returns {ScrollZoomHandler} The scroll zoom handler.
     */
    get scrollZoom(): ScrollZoomHandler;
    /**
     * Get touch zoom.
     *
     * @returns {TouchZoomHandler} The touch zoom handler.
     */
    get touchZoom(): TouchZoomHandler;
    protected _activate(): void;
    protected _deactivate(): void;
    protected _getDefaultConfiguration(): PointerConfiguration;
}

/**
 * Interface for the popup offset with respect to its anchor point.
 *
 * @description An object of number arrays specifying an offset for
 * each float direction. Negative offsets indicate left and up.
 *
 * @interface
 *
 * @example
 * ```js
 * var offset = = {
 *     bottom: [0, 10],
 *     bottomLeft: [-10, 10],
 *     bottomRight: [10, 10],
 *     center: [0, 0],
 *     left: [-10, 0],
 *     right: [10, 0],
 *     top: [0, -10],
 *     topLeft: [-10, -10],
 *     topRight: [10, -10],
 * }
 *
 * var popup = new Popup({ offset: offset });
 * ```
 */
interface PopupOffset {
    bottom: number[];
    bottomLeft: number[];
    bottomRight: number[];
    center: number[];
    left: number[];
    right: number[];
    top: number[];
    topLeft: number[];
    topRight: number[];
}

/**
 * Interface for the options that define behavior and
 * appearance of a popup.
 *
 * @interface
 */
interface PopupOptions {
    /**
     * Specify if the popup should capture pointer events.
     *
     * @description If the popup is specified to not capture
     * pointer events the provided content can still override
     * this behavior for the individual content HTML elements
     * by specifying the appropriate CSS.
     *
     * @default true
     */
    capturePointer?: boolean;
    /**
     * Specify that the popup should not have any tooltip
     * like visuals around the provided content.
     *
     * @default false
     */
    clean?: boolean;
    /**
     * The direction in which the popup floats with respect to the
     * anchor point or points. If no value is supplied the popup
     * will change float automatically based on the its position
     * in the viewport so that as much of its area as possible is
     * visible.
     *
     * @description For automatic floating (undefined) the popup
     * will float in eight directions around a point or a position
     * in a rect. When a rectangle is set without a position option
     * specified, the popup will float outward from the rectangle
     * center based on the side it is currently rendered in. The
     * default floating direction is to the bottom for both points
     * and rectangles.
     *
     * @default undefined
     */
    float?: Alignment;
    /**
     * A pixel offset applied to the popup's location specfied as:
     *
     * - A single number in pixels in the float direction that the popup
     * will be translated with respect to the current anchor point.
     *
     * - An object of number arrays specifying an offset for
     * each float direction. Negative offsets indicate left and up.
     *
     * @default 0
     */
    offset?: number | PopupOffset;
    /**
     * Opacity of the popup visuals.
     *
     * @default 1
     */
    opacity?: number;
    /**
     * The popup position in a rectangle (does not apply to points).
     * When not set the popup will change position automatically
     * based on the viewport so that as much of it as possible is
     * visible.
     *
     * @default undefined
     */
    position?: Alignment;
}

/**
 * @class Popup
 *
 * @classdesc Popup instance for rendering custom HTML content
 * on top of images. Popups are based on 2D basic image coordinates
 * (see the {@link Viewer} class documentation for more information about coordinate
 * systems) and a certain popup is therefore only relevant to a single image.
 * Popups related to a certain image should be removed when moving
 * to another image.
 *
 * A popup must have both its content and its point or rect set to be
 * rendered. Popup options can not be updated after creation but the
 * basic point or rect as well as its content can be changed by calling
 * the appropriate methods.
 *
 * To create and add one `Popup` with default configuration
 * (tooltip visuals and automatic float) and one with specific options
 * use
 *
 * @example
 * ```js
 * var defaultSpan = document.createElement('span');
 * defaultSpan.innerHTML = 'hello default';
 *
 * var defaultPopup = new Popup();
 * defaultPopup.setDOMContent(defaultSpan);
 * defaultPopup.setBasicPoint([0.3, 0.3]);
 *
 * var cleanSpan = document.createElement('span');
 * cleanSpan.innerHTML = 'hello clean';
 *
 * var cleanPopup = new Popup({
 *     clean: true,
 *     float: Alignment.Top,
 *     offset: 10,
 *     opacity: 0.7,
 * });
 *
 * cleanPopup.setDOMContent(cleanSpan);
 * cleanPopup.setBasicPoint([0.6, 0.6]);
 *
 * popupComponent.add([defaultPopup, cleanPopup]);
 * ```
 *
 * @description Implementation of API methods and API documentation inspired
 * by/used from https://github.com/mapbox/mapbox-gl-js/blob/v0.38.0/src/ui/popup.js
 */
declare class Popup {
    protected _notifyChanged$: Subject<Popup>;
    private _container;
    private _content;
    private _parentContainer;
    private _options;
    private _tip;
    private _point;
    private _rect;
    private _dom;
    private _viewportCoords;
    constructor(options?: PopupOptions, viewportCoords?: ViewportCoords, dom?: DOM);
    /**
     * @description Internal observable used by the component to
     * render the popup when its position or content has changed.
     * @ignore
     */
    get changed$(): Observable<Popup>;
    /**
     * @description Internal method used by the component to
     * remove all references to the popup.
     * @ignore
     */
    remove(): void;
    /**
     * Sets a 2D basic image coordinates point to the popup's anchor, and
     * moves the popup to it.
     *
     * @description Overwrites any previously set point or rect.
     *
     * @param {Array<number>} basicPoint - Point in 2D basic image coordinates.
     *
     * @example
     * ```js
     * var popup = new Popup();
     * popup.setText('hello image');
     * popup.setBasicPoint([0.3, 0.3]);
     *
     * popupComponent.add([popup]);
     * ```
     */
    setBasicPoint(basicPoint: number[]): void;
    /**
     * Sets a 2D basic image coordinates rect to the popup's anchor, and
     * moves the popup to it.
     *
     * @description Overwrites any previously set point or rect.
     *
     * @param {Array<number>} basicRect - Rect in 2D basic image
     * coordinates ([topLeftX, topLeftY, bottomRightX, bottomRightY]) .
     *
     * @example
     * ```js
     * var popup = new Popup();
     * popup.setText('hello image');
     * popup.setBasicRect([0.3, 0.3, 0.5, 0.6]);
     *
     * popupComponent.add([popup]);
     * ```
     */
    setBasicRect(basicRect: number[]): void;
    /**
     * Sets the popup's content to the element provided as a DOM node.
     *
     * @param {Node} htmlNode - A DOM node to be used as content for the popup.
     *
     * @example
     * ```js
     * var div = document.createElement('div');
     * div.innerHTML = 'hello image';
     *
     * var popup = new Popup();
     * popup.setDOMContent(div);
     * popup.setBasicPoint([0.3, 0.3]);
     *
     * popupComponent.add([popup]);
     * ```
     */
    setDOMContent(htmlNode: Node): void;
    /**
     * Sets the popup's content to the HTML provided as a string.
     *
     * @description This method does not perform HTML filtering or sanitization,
     * and must be used only with trusted content. Consider
     * {@link Popup.setText} if the
     * content is an untrusted text string.
     *
     * @param {string} html - A string representing HTML content for the popup.
     *
     * @example
     * ```js
     * var popup = new Popup();
     * popup.setHTML('<div>hello image</div>');
     * popup.setBasicPoint([0.3, 0.3]);
     *
     * popupComponent.add([popup]);
     * ```
     */
    setHTML(html: string): void;
    /**
     * Sets the popup's content to a string of text.
     *
     * @description This function creates a Text node in the DOM, so it cannot insert raw HTML.
     * Use this method for security against XSS if the popup content is user-provided.
     *
     * @param {string} text - Textual content for the popup.
     *
     * @example
     * ```js
     * var popup = new Popup();
     * popup.setText('hello image');
     * popup.setBasicPoint([0.3, 0.3]);
     *
     * popupComponent.add([popup]);
     * ```
     */
    setText(text: string): void;
    /**
     * @description Internal method for attaching the popup to
     * its parent container so that it is rendered in the DOM tree.
     * @ignore
     */
    setParentContainer(parentContainer: HTMLElement): void;
    /**
     * @description Internal method for updating the rendered
     * position of the popup called by the popup component.
     * @ignore
     */
    update(renderCamera: RenderCamera, size: ViewportSize, transform: Transform): void;
    private _rectToPixel;
    private _alignmentToPopupAligment;
    private _normalizeOffset;
    private _pixelToFloats;
    private _pointFromRectPosition;
}

/**
 * @class PopupComponent
 *
 * @classdesc Component for showing HTML popup objects.
 *
 * The `add` method is used for adding new popups. Popups are removed by reference.
 *
 * It is not possible to update popups in the set by updating any properties
 * directly on the popup object. Popups need to be replaced by
 * removing them and creating new ones with relevant changed properties and
 * adding those instead.
 *
 * Popups are only relevant to a single image because they are based on
 * 2D basic image coordinates. Popups related to a certain image should
 * be removed when the viewer is moved to another image.
 *
 * To retrive and use the popup component
 *
 * @example
 * ```js
 * var viewer = new Viewer({ component: { popup: true }, ... });
 *
 * var popupComponent = viewer.getComponent("popup");
 * ```
 */
declare class PopupComponent extends Component<ComponentConfiguration> {
    static componentName: ComponentName;
    private _dom;
    private _popupContainer;
    private _popups;
    private _added$;
    private _popups$;
    /** @ignore */
    constructor(name: string, container: Container, navigator: Navigator, dom?: DOM);
    /**
     * Add popups to the popups set.
     *
     * @description Adding a new popup never replaces an old one
     * because they are stored by reference. Adding an already
     * existing popup has no effect.
     *
     * @param {Array<Popup>} popups - Popups to add.
     *
     * @example
     * ```js
     * popupComponent.add([popup1, popup2]);
     * ```
     */
    add(popups: Popup[]): void;
    /**
     * Returns an array of all popups.
     *
     * @example
     * ```js
     * var popups = popupComponent.getAll();
     * ```
     */
    getAll(): Popup[];
    /**
     * Remove popups based on reference from the popup set.
     *
     * @param {Array<Popup>} popups - Popups to remove.
     *
     * @example
     * ```js
     * popupComponent.remove([popup1, popup2]);
     * ```
     */
    remove(popups: Popup[]): void;
    /**
     * Remove all popups from the popup set.
     *
     * @example
     * ```js
     * popupComponent.removeAll();
     * ```
     */
    removeAll(): void;
    protected _activate(): void;
    protected _deactivate(): void;
    protected _getDefaultConfiguration(): ComponentConfiguration;
    private _remove;
}

declare class SequenceDOMRenderer {
    private _container;
    private _minThresholdWidth;
    private _maxThresholdWidth;
    private _minThresholdHeight;
    private _maxThresholdHeight;
    private _stepperDefaultWidth;
    private _controlsDefaultWidth;
    private _defaultHeight;
    private _expandControls;
    private _mode;
    private _speed;
    private _changingSpeed;
    private _index;
    private _changingPosition;
    private _mouseEnterDirection$;
    private _mouseLeaveDirection$;
    private _notifyChanged$;
    private _notifyChangingPositionChanged$;
    private _notifySpeedChanged$;
    private _notifyIndexChanged$;
    private _changingSubscription;
    constructor(container: Container);
    get changed$(): Observable<SequenceDOMRenderer>;
    get changingPositionChanged$(): Observable<boolean>;
    get speed$(): Observable<number>;
    get index$(): Observable<number>;
    get mouseEnterDirection$(): Observable<NavigationDirection>;
    get mouseLeaveDirection$(): Observable<NavigationDirection>;
    activate(): void;
    deactivate(): void;
    render(edgeStatus: NavigationEdgeStatus, configuration: SequenceConfiguration, containerWidth: number, speed: number, index: number, max: number, playEnabled: boolean, component: SequenceComponent, navigator: Navigator): vd.VNode;
    getContainerWidth(size: ViewportSize, configuration: SequenceConfiguration): number;
    private _createPositionInput;
    private _createSpeedInput;
    private _createPlaybackControls;
    private _createPlayingButton;
    private _createSequenceControls;
    private _createSequenceArrows;
    private _createStepper;
    private _createTimelineControls;
    private _getStepClassName;
    private _setChangingPosition;
}

/**
 * @class SequenceComponent
 * @classdesc Component showing navigation arrows for sequence directions
 * as well as playing button. Exposes an API to start and stop play.
 */
declare class SequenceComponent extends Component<SequenceConfiguration> {
    /** @inheritdoc */
    static componentName: ComponentName;
    private _sequenceDOMRenderer;
    private _scheduler;
    private _hoveredIdSubject$;
    private _hoveredId$;
    private _containerWidth$;
    constructor(name: string, container: Container, navigator: Navigator, renderer?: SequenceDOMRenderer, scheduler?: Scheduler);
    fire(type: "hover", event: ComponentHoverEvent): void;
    fire(type: "playing", event: ComponentPlayEvent): void;
    off(type: "hover", handler: (event: ComponentHoverEvent) => void): void;
    off(type: "playing", handler: (event: ComponentPlayEvent) => void): void;
    /**
     * Fired when the hovered element of a component changes.
     *
     * @event hover
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * var component = viewer.getComponent('<component-name>');
     * // Set an event listener
     * component.on('hover', function() {
     *   console.log("A hover event has occurred.");
     * });
     * ```
     */
    on(type: "hover", handler: (event: ComponentHoverEvent) => void): void;
    /**
     * Event fired when playing starts or stops.
     *
     * @event playing
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * var component = viewer.getComponent('<component-name>');
     * // Set an event listener
     * component.on('playing', function() {
     *   console.log("A playing event has occurred.");
     * });
     * ```
     */
    on(type: "playing", handler: (event: ComponentPlayEvent) => void): void;
    /**
     * Start playing.
     *
     * @fires playing
     */
    play(): void;
    /**
     * Stop playing.
     *
     * @fires playing
     */
    stop(): void;
    protected _activate(): void;
    protected _deactivate(): void;
    protected _getDefaultConfiguration(): SequenceConfiguration;
}

/**
 * @class SliderComponent
 *
 * @classdesc Component for comparing pairs of images. Renders
 * a slider for adjusting the curtain of the first image.
 *
 * Deactivate the sequence, direction and image plane
 * components when activating the slider component to avoid
 * interfering UI elements.
 *
 * To retrive and use the slider component
 *
 * @example
 * ```js
 * var viewer = new Viewer({ ... });
 *
 * viewer.deactivateComponent("image");
 * viewer.deactivateComponent("direction");
 * viewer.deactivateComponent("sequence");
 *
 * viewer.activateComponent("slider");
 *
 * var sliderComponent = viewer.getComponent("slider");
 * ```
 */
declare class SliderComponent extends Component<SliderConfiguration> {
    static componentName: ComponentName;
    private _viewportCoords;
    private _domRenderer;
    private _imageTileLoader;
    private _roiCalculator;
    private _spatial;
    private _glRendererOperation$;
    private _glRenderer$;
    private _glRendererCreator$;
    private _glRendererDisposer$;
    private _waitSubscription;
    /** @ignore */
    constructor(name: string, container: Container, navigator: Navigator, viewportCoords?: ViewportCoords);
    protected _activate(): void;
    protected _deactivate(): void;
    protected _getDefaultConfiguration(): SliderConfiguration;
    private _catchCacheImage$;
    private _getBasicCorners;
    private _clipBoundingBox;
}

declare class SpatialComponent extends Component<SpatialConfiguration> {
    static componentName: ComponentName;
    private _cache;
    private _scene;
    private _viewportCoords;
    private _spatial;
    /** @ignore */
    constructor(name: string, container: Container, navigator: Navigator);
    /**
     * Returns the image id of the camera frame closest to the current
     * render camera position at the specified point.
     *
     * @description Notice that the pixelPoint argument requires x, y
     * coordinates from pixel space.
     *
     * With this function, you can use the coordinates provided by mouse
     * events to get information out of the spatial component.
     *
     * If no camera frame exist at the pixel
     * point, `null` will be returned.
     *
     * @param {Array<number>} pixelPoint - Pixel coordinates on
     * the viewer element.
     * @returns {string} Image id of the camera frame closest to
     * the camera. If no camera frame is intersected at the
     * pixel point, `null` will be returned.
     *
     * @example
     * ```js
     * spatialComponent.getFrameIdAt([100, 125])
     *     .then((imageId) => { console.log(imageId); });
     * ```
     */
    getFrameIdAt(pixelPoint: number[]): Promise<string>;
    protected _activate(): void;
    protected _deactivate(): void;
    protected _getDefaultConfiguration(): SpatialConfiguration;
    private _addSceneImages;
    private _cellsInFov;
    private _computeOriginalPosition;
    private _cellToTopocentric;
    private _computeTranslation;
    private _createTransform;
}

declare class GeometryTagError extends MapillaryError {
    constructor(message?: string);
}

/**
 * @class PointGeometry
 *
 * @classdesc Represents a point geometry in the 2D basic image coordinate system.
 *
 * @example
 * ```js
 * var basicPoint = [0.5, 0.7];
 * var pointGeometry = new PointGeometry(basicPoint);
 * ```
 */
declare class PointGeometry extends Geometry {
    private _point;
    /**
     * Create a point geometry.
     *
     * @constructor
     * @param {Array<number>} point - An array representing the basic coordinates of
     * the point.
     *
     * @throws {GeometryTagError} Point coordinates must be valid basic coordinates.
     */
    constructor(point: number[]);
    /**
     * Get point property.
     * @returns {Array<number>} Array representing the basic coordinates of the point.
     */
    get point(): number[];
    /**
     * Get the 2D basic coordinates for the centroid of the point, i.e. the 2D
     * basic coordinates of the point itself.
     *
     * @returns {Array<number>} 2D basic coordinates representing the centroid.
     * @ignore
     */
    getCentroid2d(): number[];
    /**
     * Get the 3D world coordinates for the centroid of the point, i.e. the 3D
     * world coordinates of the point itself.
     *
     * @param {Transform} transform - The transform of the image related to the point.
     * @returns {Array<number>} 3D world coordinates representing the centroid.
     * @ignore
     */
    getCentroid3d(transform: Transform): number[];
    /**
     * Set the centroid of the point, i.e. the point coordinates.
     *
     * @param {Array<number>} value - The new value of the centroid.
     * @param {Transform} transform - The transform of the image related to the point.
     * @ignore
     */
    setCentroid2d(value: number[], transform: Transform): void;
}

/**
 * @class PointsGeometry
 *
 * @classdesc Represents a point set in the 2D basic image coordinate system.
 *
 * @example
 * ```js
 * var points = [[0.5, 0.3], [0.7, 0.3], [0.6, 0.5]];
 * var pointsGeometry = new PointsGeometry(points);
 * ```
 */
declare class PointsGeometry extends Geometry {
    private _points;
    /**
     * Create a points geometry.
     *
     * @constructor
     * @param {Array<Array<number>>} points - Array of 2D points on the basic coordinate
     * system. The number of points must be greater than or equal to two.
     *
     * @throws {GeometryTagError} Point coordinates must be valid basic coordinates.
     */
    constructor(points: number[][]);
    /**
     * Get points property.
     * @returns {Array<Array<number>>} Array of 2d points.
     */
    get points(): number[][];
    /**
     * Add a point to the point set.
     *
     * @param {Array<number>} point - Point to add.
     * @ignore
     */
    addPoint2d(point: number[]): void;
    /**
     * Get the coordinates of a point from the point set representation of the geometry.
     *
     * @param {number} index - Point index.
     * @returns {Array<number>} Array representing the 2D basic coordinates of the point.
     * @ignore
     */
    getPoint2d(index: number): number[];
    /**
     * Remove a point from the point set.
     *
     * @param {number} index - The index of the point to remove.
     * @ignore
     */
    removePoint2d(index: number): void;
    /** @ignore */
    setVertex2d(index: number, value: number[], transform: Transform): void;
    /** @ignore */
    setPoint2d(index: number, value: number[], transform: Transform): void;
    /** @ignore */
    getPoints3d(transform: Transform): number[][];
    /** @ignore */
    getPoint3d(index: number, transform: Transform): number[];
    /** @ignore */
    getPoints2d(): number[][];
    /** @ignore */
    getCentroid2d(transform?: Transform): number[];
    /** @ignore */
    getCentroid3d(transform: Transform): number[];
    /** @ignore */
    getRect2d(transform: Transform): number[];
    /** @ignore */
    setCentroid2d(value: number[], transform: Transform): void;
    private _getPoints3d;
}

/**
 * @class VertexGeometry
 * @abstract
 * @classdesc Represents a vertex geometry.
 */
declare abstract class VertexGeometry extends Geometry {
    private _subsampleThreshold;
    /**
     * Create a vertex geometry.
     *
     * @constructor
     * @ignore
     */
    constructor();
    /**
     * Get the 3D coordinates for the vertices of the geometry with possibly
     * subsampled points along the lines.
     *
     * @param {Transform} transform - The transform of the image related to
     * the geometry.
     * @returns {Array<Array<number>>} Polygon array of 3D world coordinates
     * representing the geometry.
     * @ignore
     */
    abstract getPoints3d(transform: Transform): number[][];
    /**
     * Get the polygon pole of inaccessibility, the most
     * distant internal point from the polygon outline.
     *
     * @returns {Array<number>} 2D basic coordinates for the pole of inaccessibility.
     * @ignore
     */
    abstract getPoleOfInaccessibility2d(): number[];
    /**
     * Get the polygon pole of inaccessibility, the most
     * distant internal point from the polygon outline.
     *
     * @param transform - The transform of the image related to
     * the geometry.
     * @returns {Array<number>} 3D world coordinates for the pole of inaccessibility.
     * @ignore
     */
    abstract getPoleOfInaccessibility3d(transform: Transform): number[];
    /**
     * Get the coordinates of a vertex from the polygon representation of the geometry.
     *
     * @param {number} index - Vertex index.
     * @returns {Array<number>} Array representing the 2D basic coordinates of the vertex.
     * @ignore
     */
    abstract getVertex2d(index: number): number[];
    /**
     * Get a vertex from the polygon representation of the 3D coordinates for the
     * vertices of the geometry.
     *
     * @param {number} index - Vertex index.
     * @param {Transform} transform - The transform of the image related to the geometry.
     * @returns {Array<number>} Array representing the 3D world coordinates of the vertex.
     * @ignore
     */
    abstract getVertex3d(index: number, transform: Transform): number[];
    /**
     * Get a polygon representation of the 2D basic coordinates for the vertices of the geometry.
     *
     * @returns {Array<Array<number>>} Polygon array of 2D basic coordinates representing
     * the vertices of the geometry.
     * @ignore
     */
    abstract getVertices2d(): number[][];
    /**
     * Get a polygon representation of the 3D world coordinates for the vertices of the geometry.
     *
     * @param {Transform} transform - The transform of the image related to the geometry.
     * @returns {Array<Array<number>>} Polygon array of 3D world coordinates representing
     * the vertices of the geometry.
     * @ignore
     */
    abstract getVertices3d(transform: Transform): number[][];
    /**
     * Get a flattend array of the 3D world coordinates for the
     * triangles filling the geometry.
     *
     * @param {Transform} transform - The transform of the image related to the geometry.
     * @returns {Array<number>} Flattened array of 3D world coordinates of the triangles.
     * @ignore
     */
    abstract getTriangles3d(transform: Transform): number[];
    /**
     * Set the value of a vertex in the polygon representation of the geometry.
     *
     * @description The polygon is defined to have the first vertex at the
     * bottom-left corner with the rest of the vertices following in clockwise order.
     *
     * @param {number} index - The index of the vertex to be set.
     * @param {Array<number>} value - The new value of the vertex.
     * @param {Transform} transform - The transform of the image related to the geometry.
     * @ignore
     */
    abstract setVertex2d(index: number, value: number[], transform: Transform): void;
    /**
     * Finds the polygon pole of inaccessibility, the most distant internal
     * point from the polygon outline.
     *
     * @param {Array<Array<number>>} points2d - 2d points of outline to triangulate.
     * @returns {Array<number>} Point of inaccessibility.
     * @ignore
     */
    protected _getPoleOfInaccessibility2d(points2d: number[][]): number[];
    protected _project(points2d: number[][], transform: Transform): number[][];
    protected _subsample(points2d: number[][], threshold?: number): number[][];
    /**
     * Triangulates a 2d polygon and returns the triangle
     * representation as a flattened array of 3d points.
     *
     * @param {Array<Array<number>>} points2d - 2d points of outline to triangulate.
     * @param {Array<Array<number>>} points3d - 3d points of outline corresponding to the 2d points.
     * @param {Array<Array<Array<number>>>} [holes2d] - 2d points of holes to triangulate.
     * @param {Array<Array<Array<number>>>} [holes3d] - 3d points of holes corresponding to the 2d points.
     * @returns {Array<number>} Flattened array of 3d points ordered based on the triangles.
     * @ignore
     */
    protected _triangulate(points2d: number[][], points3d: number[][], holes2d?: number[][][], holes3d?: number[][][]): number[];
    protected _triangulateSpherical(points2d: number[][], holes2d: number[][][], transform: Transform): number[];
    protected _unproject(points2d: number[][], transform: Transform, distance?: number): number[][];
    private _createCamera;
    private _deunproject;
    private _triangulateSubarea;
}

/**
 * @class PolygonGeometry
 *
 * @classdesc Represents a polygon geometry in the 2D basic image coordinate system.
 * All polygons and holes provided to the constructor needs to be closed.
 *
 * @example
 * ```js
 * var basicPolygon = [[0.5, 0.3], [0.7, 0.3], [0.6, 0.5], [0.5, 0.3]];
 * var polygonGeometry = new PolygonGeometry(basicPolygon);
 * ```
 */
declare class PolygonGeometry extends VertexGeometry {
    private _polygon;
    private _holes;
    /**
     * Create a polygon geometry.
     *
     * @constructor
     * @param {Array<Array<number>>} polygon - Array of polygon vertices. Must be closed.
     * @param {Array<Array<Array<number>>>} [holes] - Array of arrays of hole vertices.
     * Each array of holes vertices must be closed.
     *
     * @throws {GeometryTagError} Polygon coordinates must be valid basic coordinates.
     */
    constructor(polygon: number[][], holes?: number[][][]);
    /**
     * Get polygon property.
     * @returns {Array<Array<number>>} Closed 2d polygon.
     */
    get polygon(): number[][];
    /**
     * Get holes property.
     * @returns {Array<Array<Array<number>>>} Holes of 2d polygon.
     */
    get holes(): number[][][];
    /**
     * Add a vertex to the polygon by appending it after the last vertex.
     *
     * @param {Array<number>} vertex - Vertex to add.
     * @ignore
     */
    addVertex2d(vertex: number[]): void;
    /**
     * Get the coordinates of a vertex from the polygon representation of the geometry.
     *
     * @param {number} index - Vertex index.
     * @returns {Array<number>} Array representing the 2D basic coordinates of the vertex.
     * @ignore
     */
    getVertex2d(index: number): number[];
    /**
     * Remove a vertex from the polygon.
     *
     * @param {number} index - The index of the vertex to remove.
     * @ignore
     */
    removeVertex2d(index: number): void;
    /** @ignore */
    setVertex2d(index: number, value: number[], transform: Transform): void;
    /** @ignore */
    setCentroid2d(value: number[], transform: Transform): void;
    /** @ignore */
    getPoints3d(transform: Transform): number[][];
    /** @ignore */
    getVertex3d(index: number, transform: Transform): number[];
    /** @ignore */
    getVertices2d(): number[][];
    /** @ignore */
    getVertices3d(transform: Transform): number[][];
    /**
     * Get a polygon representation of the 3D coordinates for the vertices of each hole
     * of the geometry. Line segments between vertices will possibly be subsampled
     * resulting in a larger number of points than the total number of vertices.
     *
     * @param {Transform} transform - The transform of the image related to the geometry.
     * @returns {Array<Array<Array<number>>>} Array of hole polygons in 3D world coordinates
     * representing the vertices of each hole of the geometry.
     * @ignore
     */
    getHolePoints3d(transform: Transform): number[][][];
    /**
     * Get a polygon representation of the 3D coordinates for the vertices of each hole
     * of the geometry.
     *
     * @param {Transform} transform - The transform of the image related to the geometry.
     * @returns {Array<Array<Array<number>>>} Array of hole polygons in 3D world coordinates
     * representing the vertices of each hole of the geometry.
     * @ignore
     */
    getHoleVertices3d(transform: Transform): number[][][];
    /** @ignore */
    getCentroid2d(): number[];
    /** @ignore */
    getCentroid3d(transform: Transform): number[];
    /** @ignore */
    get3dDomainTriangles3d(transform: Transform): number[];
    /** @ignore */
    getTriangles3d(transform: Transform): number[];
    /** @ignore */
    getPoleOfInaccessibility2d(): number[];
    /** @ignore */
    getPoleOfInaccessibility3d(transform: Transform): number[];
    private _getPoints3d;
}

/**
 * @class RectGeometry
 *
 * @classdesc Represents a rectangle geometry in the 2D basic image coordinate system.
 *
 * @example
 * ```js
 * var basicRect = [0.5, 0.3, 0.7, 0.4];
 * var rectGeometry = new RectGeometry(basicRect);
 * ```
 */
declare class RectGeometry extends VertexGeometry {
    private _anchorIndex;
    private _inverted;
    private _rect;
    /**
     * Create a rectangle geometry.
     *
     * @constructor
     * @param {Array<number>} rect - An array representing the top-left and bottom-right
     * corners of the rectangle in basic coordinates. Ordered according to [x0, y0, x1, y1].
     *
     * @throws {GeometryTagError} Rectangle coordinates must be valid basic coordinates.
     */
    constructor(rect: number[]);
    /**
     * Get anchor index property.
     *
     * @returns {number} Index representing the current anchor property if
     * achoring indexing has been initialized. If anchor indexing has not been
     * initialized or has been terminated undefined will be returned.
     * @ignore
     */
    get anchorIndex(): number;
    /**
     * Get inverted property.
     *
     * @returns {boolean} Boolean determining whether the rect geometry is
     * inverted. For spherical the rect geometrye may be inverted.
     * @ignore
     */
    get inverted(): boolean;
    /**
     * Get rect property.
     *
     * @returns {Array<number>} Array representing the top-left and bottom-right
     * corners of the rectangle in basic coordinates.
     */
    get rect(): number[];
    /**
     * Initialize anchor indexing to enable setting opposite vertex.
     *
     * @param {number} [index] - The index of the vertex to use as anchor.
     *
     * @throws {GeometryTagError} If anchor indexing has already been initialized.
     * @throws {GeometryTagError} If index is not valid (0 to 3).
     * @ignore
     */
    initializeAnchorIndexing(index?: number): void;
    /**
     * Terminate anchor indexing to disable setting pposite vertex.
     * @ignore
     */
    terminateAnchorIndexing(): void;
    /**
     * Set the value of the vertex opposite to the anchor in the polygon
     * representation of the rectangle.
     *
     * @description Setting the opposite vertex may change the anchor index.
     *
     * @param {Array<number>} opposite - The new value of the vertex opposite to the anchor.
     * @param {Transform} transform - The transform of the image related to the rectangle.
     *
     * @throws {GeometryTagError} When anchor indexing has not been initialized.
     * @ignore
     */
    setOppositeVertex2d(opposite: number[], transform: Transform): void;
    /**
     * Set the value of a vertex in the polygon representation of the rectangle.
     *
     * @description The polygon is defined to have the first vertex at the
     * bottom-left corner with the rest of the vertices following in clockwise order.
     *
     * @param {number} index - The index of the vertex to be set.
     * @param {Array<number>} value - The new value of the vertex.
     * @param {Transform} transform - The transform of the image related to the rectangle.
     * @ignore
     */
    setVertex2d(index: number, value: number[], transform: Transform): void;
    /** @ignore */
    setCentroid2d(value: number[], transform: Transform): void;
    /**
     * Get the 3D coordinates for the vertices of the rectangle with
     * interpolated points along the lines.
     *
     * @param {Transform} transform - The transform of the image related to
     * the rectangle.
     * @returns {Array<Array<number>>} Polygon array of 3D world coordinates
     * representing the rectangle.
     * @ignore
     */
    getPoints3d(transform: Transform): number[][];
    /**
     * Get the coordinates of a vertex from the polygon representation of the geometry.
     *
     * @description The first vertex represents the bottom-left corner with the rest of
     * the vertices following in clockwise order. The method shifts the right side
     * coordinates of the rectangle by one unit to ensure that the vertices are ordered
     * clockwise.
     *
     * @param {number} index - Vertex index.
     * @returns {Array<number>} Array representing the 2D basic coordinates of the vertex.
     * @ignore
     */
    getVertex2d(index: number): number[];
    /**
     * Get the coordinates of a vertex from the polygon representation of the geometry.
     *
     * @description The first vertex represents the bottom-left corner with the rest of
     * the vertices following in clockwise order. The coordinates will not be shifted
     * so they may not appear in clockwise order when layed out on the plane.
     *
     * @param {number} index - Vertex index.
     * @returns {Array<number>} Array representing the 2D basic coordinates of the vertex.
     * @ignore
     */
    getNonAdjustedVertex2d(index: number): number[];
    /**
     * Get a vertex from the polygon representation of the 3D coordinates for the
     * vertices of the geometry.
     *
     * @description The first vertex represents the bottom-left corner with the rest of
     * the vertices following in clockwise order.
     *
     * @param {number} index - Vertex index.
     * @param {Transform} transform - The transform of the image related to the geometry.
     * @returns {Array<Array<number>>} Polygon array of 3D world coordinates representing
     * the vertices of the geometry.
     * @ignore
     */
    getVertex3d(index: number, transform: Transform): number[];
    /**
     * Get a polygon representation of the 2D basic coordinates for the vertices of the rectangle.
     *
     * @description The first vertex represents the bottom-left corner with the rest of
     * the vertices following in clockwise order.
     *
     * @returns {Array<Array<number>>} Polygon array of 2D basic coordinates representing
     * the rectangle vertices.
     * @ignore
     */
    getVertices2d(): number[][];
    /**
     * Get a polygon representation of the 3D coordinates for the vertices of the rectangle.
     *
     * @description The first vertex represents the bottom-left corner with the rest of
     * the vertices following in clockwise order.
     *
     * @param {Transform} transform - The transform of the image related to the rectangle.
     * @returns {Array<Array<number>>} Polygon array of 3D world coordinates representing
     * the rectangle vertices.
     * @ignore
     */
    getVertices3d(transform: Transform): number[][];
    /** @ignore */
    getCentroid2d(): number[];
    /** @ignore */
    getCentroid3d(transform: Transform): number[];
    /**
     * @ignore
     */
    getPoleOfInaccessibility2d(): number[];
    /** @ignore */
    getPoleOfInaccessibility3d(transform: Transform): number[];
    /** @ignore */
    getTriangles3d(transform: Transform): number[];
    /**
     * Check if a particular bottom-right value is valid according to the current
     * rectangle coordinates.
     *
     * @param {Array<number>} bottomRight - The bottom-right coordinates to validate
     * @returns {boolean} Value indicating whether the provided bottom-right coordinates
     * are valid.
     * @ignore
     */
    validate(bottomRight: number[]): boolean;
    /**
     * Get the 2D coordinates for the vertices of the rectangle with
     * interpolated points along the lines.
     *
     * @returns {Array<Array<number>>} Polygon array of 2D basic coordinates
     * representing the rectangle.
     */
    private _getPoints2d;
    /**
     * Convert the top-left, bottom-right representation of a rectangle to a polygon
     * representation of the vertices starting at the bottom-left corner going
     * clockwise.
     *
     * @description The method shifts the right side coordinates of the rectangle
     * by one unit to ensure that the vertices are ordered clockwise.
     *
     * @param {Array<number>} rect - Top-left, bottom-right representation of a
     * rectangle.
     * @returns {Array<Array<number>>} Polygon representation of the vertices of the
     * rectangle.
     */
    private _rectToVertices2d;
    /**
     * Convert the top-left, bottom-right representation of a rectangle to a polygon
     * representation of the vertices starting at the bottom-left corner going
     * clockwise.
     *
     * @description The first vertex represents the bottom-left corner with the rest of
     * the vertices following in clockwise order. The coordinates will not be shifted
     * to ensure that the vertices are ordered clockwise when layed out on the plane.
     *
     * @param {Array<number>} rect - Top-left, bottom-right representation of a
     * rectangle.
     * @returns {Array<Array<number>>} Polygon representation of the vertices of the
     * rectangle.
     */
    private _rectToNonAdjustedVertices2d;
}

/**
 * @event
 */
declare type TagEventType = "click" | "geometry" | "tag";

/**
 * Interface for tag state events.
 *
 * @example
 * ```js
 * var tag = new OutlineTag({ // tag options });
 * // Set an event listener
 * tag.on('tag', function() {
 *   console.log("A tag event has occurred.");
 * });
 * ```
 */
interface TagStateEvent {
    /**
     * The component object that fired the event.
     */
    target: Tag;
    /**
     * The event type.
     */
    type: TagEventType;
}

/**
 * @class Tag
 * @abstract
 * @classdesc Abstract class representing the basic functionality of for a tag.
 */
declare abstract class Tag extends EventEmitter {
    protected _id: string;
    protected _geometry: Geometry;
    protected _notifyChanged$: Subject<Tag>;
    /**
     * Create a tag.
     *
     * @constructor
     * @param {string} id
     * @param {Geometry} geometry
     */
    constructor(id: string, geometry: Geometry);
    /**
     * Get id property.
     * @returns {string}
     */
    get id(): string;
    /**
     * Get geometry property.
     * @returns {Geometry} The geometry of the tag.
     */
    get geometry(): Geometry;
    /**
     * Get changed observable.
     * @returns {Observable<Tag>}
     * @ignore
     */
    get changed$(): Observable<Tag>;
    /**
     * Get geometry changed observable.
     * @returns {Observable<Tag>}
     * @ignore
     */
    get geometryChanged$(): Observable<Tag>;
    fire(type: "tag" | "geometry", event: TagStateEvent): void;
    /** @ignore */
    fire(type: TagEventType, event: TagStateEvent): void;
    off(type: "tag" | "geometry", handler: (event: TagStateEvent) => void): void;
    /** @ignore */
    off(type: TagEventType, handler: (event: TagStateEvent) => void): void;
    /**
     * Event fired when the geometry of the tag has changed.
     *
     * @event geometry
     * @example
     * ```js
     * var tag = new OutlineTag({ // tag options });
     * // Set an event listener
     * tag.on('geometry', function() {
     *   console.log("A geometry event has occurred.");
     * });
     * ```
     */
    on(type: "geometry", handler: (event: TagStateEvent) => void): void;
    /**
     * Event fired when a tag has been updated.
     *
     * @event tag
     * @example
     * ```js
     * var tag = new OutlineTag({ // tag options });
     * // Set an event listener
     * tag.on('tag', function() {
     *   console.log("A tag event has occurred.");
     * });
     * ```
     */
    on(type: "tag", handler: (event: TagStateEvent) => void): void;
    /** @ignore */
    on(type: TagEventType, handler: (event: TagStateEvent) => void): void;
}

/**
 * Interface for the options that define the behavior and
 * appearance of the outline tag.
 *
 * @interface
 */
interface ExtremePointTagOptions {
    /**
     * Indicate whether the tag geometry should be editable.
     *
     * @description Polygon tags with two dimensional domain
     * are never editable.
     *
     * @default false
     */
    editable?: boolean;
    /**
     * Color for the interior fill as a hexadecimal number.
     * @default 0xFFFFFF
     */
    fillColor?: number;
    /**
     * Opacity of the interior fill between 0 and 1.
     * @default 0.3
     */
    fillOpacity?: number;
    /**
     * Determines whether vertices should be indicated by points
     * when tag is editable.
     *
     * @default true
     */
    indicateVertices?: boolean;
    /**
     * Color for the edge lines as a hexadecimal number.
     * @default 0xFFFFFF
     */
    lineColor?: number;
    /**
     * Opacity of the edge lines on [0, 1].
     * @default 1
     */
    lineOpacity?: number;
    /**
     * Line width in pixels.
     * @default 1
     */
    lineWidth?: number;
}

/**
 * @class ExtremePointTag
 *
 * @classdesc Tag holding properties for visualizing a extreme points
 * and their outline.
 *
 * @example
 * ```js
 * var geometry = new PointsGeometry([[0.3, 0.3], [0.5, 0.4]]);
 * var tag = new ExtremePointTag(
 *     "id-1",
 *     geometry
 *     { editable: true, lineColor: 0xff0000 });
 *
 * tagComponent.add([tag]);
 * ```
 */
declare class ExtremePointTag extends Tag {
    protected _geometry: PointsGeometry;
    private _editable;
    private _indicateVertices;
    private _lineColor;
    private _lineOpacity;
    private _lineWidth;
    private _fillColor;
    private _fillOpacity;
    /**
     * Create an extreme point tag.
     *
     * @override
     * @constructor
     * @param {string} id - Unique identifier of the tag.
     * @param {PointsGeometry} geometry - Geometry defining points of tag.
     * @param {ExtremePointTagOptions} options - Options defining the visual appearance and
     * behavior of the extreme point tag.
     */
    constructor(id: string, geometry: PointsGeometry, options?: ExtremePointTagOptions);
    /**
     * Get editable property.
     * @returns {boolean} Value indicating if tag is editable.
     */
    get editable(): boolean;
    /**
     * Set editable property.
     * @param {boolean}
     *
     * @fires changed
     */
    set editable(value: boolean);
    /**
     * Get fill color property.
     * @returns {number}
     */
    get fillColor(): number;
    /**
     * Set fill color property.
     * @param {number}
     *
     * @fires changed
     */
    set fillColor(value: number);
    /**
     * Get fill opacity property.
     * @returns {number}
     */
    get fillOpacity(): number;
    /**
     * Set fill opacity property.
     * @param {number}
     *
     * @fires changed
     */
    set fillOpacity(value: number);
    /** @inheritdoc */
    get geometry(): PointsGeometry;
    /**
     * Get indicate vertices property.
     * @returns {boolean} Value indicating if vertices should be indicated
     * when tag is editable.
     */
    get indicateVertices(): boolean;
    /**
     * Set indicate vertices property.
     * @param {boolean}
     *
     * @fires changed
     */
    set indicateVertices(value: boolean);
    /**
     * Get line color property.
     * @returns {number}
     */
    get lineColor(): number;
    /**
     * Set line color property.
     * @param {number}
     *
     * @fires changed
     */
    set lineColor(value: number);
    /**
     * Get line opacity property.
     * @returns {number}
     */
    get lineOpacity(): number;
    /**
     * Set line opacity property.
     * @param {number}
     *
     * @fires changed
     */
    set lineOpacity(value: number);
    /**
     * Get line width property.
     * @returns {number}
     */
    get lineWidth(): number;
    /**
     * Set line width property.
     * @param {number}
     *
     * @fires changed
     */
    set lineWidth(value: number);
    /**
     * Set options for tag.
     *
     * @description Sets all the option properties provided and keeps
     * the rest of the values as is.
     *
     * @param {ExtremePointTagOptions} options - Extreme point tag options
     *
     * @fires changed
     */
    setOptions(options: ExtremePointTagOptions): void;
}

/**
 * Enumeration for tag domains.
 * @enum {number}
 * @readonly
 * @description Defines where lines between two vertices are treated
 * as straight.
 *
 * Only applicable for polygons. For rectangles lines between
 * vertices are always treated as straight in the distorted 2D
 * projection and bended in the undistorted 3D space.
 */
declare enum TagDomain {
    /**
     * Treats lines between two vertices as straight in the
     * distorted 2D projection, i.e. on the image. If the image
     * is distorted this will result in bended lines when rendered
     * in the undistorted 3D space.
     */
    TwoDimensional = 0,
    /**
     * Treats lines as straight in the undistorted 3D space. If the
     * image is distorted this will result in bended lines when rendered
     * on the distorted 2D projection of the image.
     */
    ThreeDimensional = 1
}

/**
 * Interface for the options that define the behavior and
 * appearance of the outline tag.
 *
 * @interface
 */
interface OutlineTagOptions {
    /**
     * The domain where lines between vertices are treated as straight.
     *
     * @description Only applicable for tags that renders polygons.
     *
     * If the domain is specified as two dimensional, editing of the
     * polygon will be disabled.
     *
     * @default {TagDomain.TwoDimensional}
     */
    domain?: TagDomain;
    /**
     * Indicate whether the tag geometry should be editable.
     *
     * @description Polygon tags with two dimensional domain
     * are never editable.
     *
     * @default false
     */
    editable?: boolean;
    /**
     * Color for the interior fill as a hexadecimal number.
     * @default 0xFFFFFF
     */
    fillColor?: number;
    /**
     * Opacity of the interior fill between 0 and 1.
     * @default 0.3
     */
    fillOpacity?: number;
    /**
     * A string referencing the sprite data property to pull from.
     *
     * @description Icon is not shown for tags with polygon
     * geometries in spherical.
     */
    icon?: string;
    /**
     * Value determining how the icon will float with respect to its anchor
     * position when rendering.
     *
     * @default {Alignment.Center}
     */
    iconFloat?: Alignment;
    /**
     * Number representing the index for where to show the icon or
     * text for a rectangle geometry.
     *
     * @description The default index corresponds to the bottom right corner.
     *
     * @default 3
     */
    iconIndex?: number;
    /**
     * Determines whether vertices should be indicated by points
     * when tag is editable.
     *
     * @default true
     */
    indicateVertices?: boolean;
    /**
     * Color for the edge lines as a hexadecimal number.
     * @default 0xFFFFFF
     */
    lineColor?: number;
    /**
     * Opacity of the edge lines on [0, 1].
     * @default 1
     */
    lineOpacity?: number;
    /**
     * Line width in pixels.
     * @default 1
     */
    lineWidth?: number;
    /**
     * Text shown as label if no icon is provided.
     *
     * @description Text is not shown for tags with
     * polygon geometries in spherical.
     */
    text?: string;
    /**
     * Text color as hexadecimal number.
     * @default 0xFFFFFF
     */
    textColor?: number;
}

/**
 * Interface for the options that define the behavior and
 * appearance of the spot tag.
 *
 * @interface
 */
interface SpotTagOptions {
    /**
     * Color for the spot specified as a hexadecimal number.
     * @default 0xFFFFFF
     */
    color?: number;
    /**
     * Indicate whether the tag geometry should be editable.
     * @default false
     */
    editable?: boolean;
    /**
     * A string referencing the sprite data property to pull from.
     */
    icon?: string;
    /**
     * Text shown as label if no icon is provided.
     */
    text?: string;
    /**
     * Text color as hexadecimal number.
     * @default 0xFFFFFF
     */
    textColor?: number;
}

/**
 * @class OutlineTag
 *
 * @classdesc Tag holding properties for visualizing a geometry outline.
 *
 * @example
 * ```js
 * var geometry = new RectGeometry([0.3, 0.3, 0.5, 0.4]);
 * var tag = new OutlineTag(
 *     "id-1",
 *     geometry
 *     { editable: true, lineColor: 0xff0000 });
 *
 * tagComponent.add([tag]);
 * ```
 */
declare class OutlineTag extends Tag {
    protected _geometry: VertexGeometry;
    private _domain;
    private _editable;
    private _icon;
    private _iconFloat;
    private _iconIndex;
    private _indicateVertices;
    private _lineColor;
    private _lineOpacity;
    private _lineWidth;
    private _fillColor;
    private _fillOpacity;
    private _text;
    private _textColor;
    private _click$;
    /**
     * Create an outline tag.
     *
     * @override
     * @constructor
     * @param {string} id - Unique identifier of the tag.
     * @param {VertexGeometry} geometry - Geometry defining vertices of tag.
     * @param {OutlineTagOptions} options - Options defining the visual appearance and
     * behavior of the outline tag.
     */
    constructor(id: string, geometry: VertexGeometry, options?: OutlineTagOptions);
    /**
     * Click observable.
     *
     * @description An observable emitting the tag when the icon of the
     * tag has been clicked.
     *
     * @returns {Observable<Tag>}
     */
    get click$(): Subject<OutlineTag>;
    /**
     * Get domain property.
     *
     * @description Readonly property that can only be set in constructor.
     *
     * @returns Value indicating the domain of the tag.
     */
    get domain(): TagDomain;
    /**
     * Get editable property.
     * @returns {boolean} Value indicating if tag is editable.
     */
    get editable(): boolean;
    /**
     * Set editable property.
     * @param {boolean}
     *
     * @fires changed
     */
    set editable(value: boolean);
    /**
     * Get fill color property.
     * @returns {number}
     */
    get fillColor(): number;
    /**
     * Set fill color property.
     * @param {number}
     *
     * @fires changed
     */
    set fillColor(value: number);
    /**
     * Get fill opacity property.
     * @returns {number}
     */
    get fillOpacity(): number;
    /**
     * Set fill opacity property.
     * @param {number}
     *
     * @fires changed
     */
    set fillOpacity(value: number);
    /** @inheritdoc */
    get geometry(): VertexGeometry;
    /**
     * Get icon property.
     * @returns {string}
     */
    get icon(): string;
    /**
     * Set icon property.
     * @param {string}
     *
     * @fires changed
     */
    set icon(value: string);
    /**
     * Get icon float property.
     * @returns {Alignment}
     */
    get iconFloat(): Alignment;
    /**
     * Set icon float property.
     * @param {Alignment}
     *
     * @fires changed
     */
    set iconFloat(value: Alignment);
    /**
     * Get icon index property.
     * @returns {number}
     */
    get iconIndex(): number;
    /**
     * Set icon index property.
     * @param {number}
     *
     * @fires changed
     */
    set iconIndex(value: number);
    /**
     * Get indicate vertices property.
     * @returns {boolean} Value indicating if vertices should be indicated
     * when tag is editable.
     */
    get indicateVertices(): boolean;
    /**
     * Set indicate vertices property.
     * @param {boolean}
     *
     * @fires changed
     */
    set indicateVertices(value: boolean);
    /**
     * Get line color property.
     * @returns {number}
     */
    get lineColor(): number;
    /**
     * Set line color property.
     * @param {number}
     *
     * @fires changed
     */
    set lineColor(value: number);
    /**
     * Get line opacity property.
     * @returns {number}
     */
    get lineOpacity(): number;
    /**
     * Set line opacity property.
     * @param {number}
     *
     * @fires changed
     */
    set lineOpacity(value: number);
    /**
     * Get line width property.
     * @returns {number}
     */
    get lineWidth(): number;
    /**
     * Set line width property.
     * @param {number}
     *
     * @fires changed
     */
    set lineWidth(value: number);
    /**
     * Get text property.
     * @returns {string}
     */
    get text(): string;
    /**
     * Set text property.
     * @param {string}
     *
     * @fires changed
     */
    set text(value: string);
    /**
     * Get text color property.
     * @returns {number}
     */
    get textColor(): number;
    /**
     * Set text color property.
     * @param {number}
     *
     * @fires changed
     */
    set textColor(value: number);
    fire(type: TagStateEvent["type"], event: TagStateEvent): void;
    /** @ignore */
    fire(type: TagEventType, event: TagStateEvent): void;
    off(type: TagStateEvent["type"], handler: (event: TagStateEvent) => void): void;
    /** @ignore */
    off(type: TagEventType, handler: (event: TagStateEvent) => void): void;
    /**
     * Event fired when the icon of the outline tag is clicked.
     *
     * @event click
     * @example
     * ```js
     * var tag = new OutlineTag({ // tag options });
     * // Set an event listener
     * tag.on('click', function() {
     *   console.log("A click event has occurred.");
     * });
     * ```
     */
    on(type: "click", handler: (event: TagStateEvent) => void): void;
    /**
     * Event fired when the geometry of the tag has changed.
     *
     * @event geometry
     * @example
     * ```js
     * var tag = new OutlineTag({ // tag options });
     * // Set an event listener
     * tag.on('geometry', function() {
     *   console.log("A geometry event has occurred.");
     * });
     * ```
     */
    on(type: "geometry", handler: (event: TagStateEvent) => void): void;
    /**
     * Event fired when a tag has been updated.
     *
     * @event tag
     * @example
     * ```js
     * var tag = new OutlineTag({ // tag options });
     * // Set an event listener
     * tag.on('tag', function() {
     *   console.log("A tag event has occurred.");
     * });
     * ```
     */
    on(type: "tag", handler: (event: TagStateEvent) => void): void;
    /**
     * Set options for tag.
     *
     * @description Sets all the option properties provided and keeps
     * the rest of the values as is.
     *
     * @param {OutlineTagOptions} options - Outline tag options
     *
     * @fires changed
     */
    setOptions(options: OutlineTagOptions): void;
    private _twoDimensionalPolygon;
}

/**
 * @class SpotTag
 *
 * @classdesc Tag holding properties for visualizing the centroid of a geometry.
 *
 * @example
 * ```js
 * var geometry = new PointGeometry([0.3, 0.3]);
 * var tag = new SpotTag(
 *     "id-1",
 *     geometry
 *     { editable: true, color: 0xff0000 });
 *
 * tagComponent.add([tag]);
 * ```
 */
declare class SpotTag extends Tag {
    protected _geometry: Geometry;
    private _color;
    private _editable;
    private _icon;
    private _text;
    private _textColor;
    /**
     * Create a spot tag.
     *
     * @override
     * @constructor
     * @param {string} id
     * @param {Geometry} geometry
     * @param {IOutlineTagOptions} options - Options defining the visual appearance and
     * behavior of the spot tag.
     */
    constructor(id: string, geometry: Geometry, options?: SpotTagOptions);
    /**
     * Get color property.
     * @returns {number} The color of the spot as a hexagonal number;
     */
    get color(): number;
    /**
     * Set color property.
     * @param {number}
     *
     * @fires changed
     */
    set color(value: number);
    /**
     * Get editable property.
     * @returns {boolean} Value indicating if tag is editable.
     */
    get editable(): boolean;
    /**
     * Set editable property.
     * @param {boolean}
     *
     * @fires changed
     */
    set editable(value: boolean);
    /**
     * Get icon property.
     * @returns {string}
     */
    get icon(): string;
    /**
     * Set icon property.
     * @param {string}
     *
     * @fires changed
     */
    set icon(value: string);
    /**
     * Get text property.
     * @returns {string}
     */
    get text(): string;
    /**
     * Set text property.
     * @param {string}
     *
     * @fires changed
     */
    set text(value: string);
    /**
     * Get text color property.
     * @returns {number}
     */
    get textColor(): number;
    /**
     * Set text color property.
     * @param {number}
     *
     * @fires changed
     */
    set textColor(value: number);
    /**
     * Set options for tag.
     *
     * @description Sets all the option properties provided and keps
     * the rest of the values as is.
     *
     * @param {SpotTagOptions} options - Spot tag options
     *
     * @fires changed
     */
    setOptions(options: SpotTagOptions): void;
}

/**
 * @class TagComponent
 *
 * @classdesc Component for showing and editing tags with different
 * geometries composed from 2D basic image coordinates (see the
 * {@link Viewer} class documentation for more information about coordinate
 * systems).
 *
 * The `add` method is used for adding new tags or replacing
 * tags already in the set. Tags are removed by id.
 *
 * If a tag already in the set has the same
 * id as one of the tags added, the old tag will be removed and
 * the added tag will take its place.
 *
 * The tag component mode can be set to either be non interactive or
 * to be in creating mode of a certain geometry type.
 *
 * The tag properties can be updated at any time and the change will
 * be visibile immediately.
 *
 * Tags are only relevant to a single image because they are based on
 * 2D basic image coordinates. Tags related to a certain image should
 * be removed when the viewer is moved to another image.
 *
 * To retrive and use the tag component
 *
 * @example
 * ```js
 * var viewer = new Viewer({ component: { tag: true } }, ...);
 *
 * var tagComponent = viewer.getComponent("tag");
 * ```
 */
declare class TagComponent extends Component<TagConfiguration> {
    /** @inheritdoc */
    static componentName: ComponentName;
    private _tagDomRenderer;
    private _tagScene;
    private _tagSet;
    private _tagCreator;
    private _viewportCoords;
    private _renderTags$;
    private _tagChanged$;
    private _renderTagGLChanged$;
    private _createGeometryChanged$;
    private _createGLObjectsChanged$;
    private _creatingConfiguration$;
    private _createHandlers;
    private _editVertexHandler;
    /** @ignore */
    constructor(name: string, container: Container, navigator: Navigator);
    /**
     * Add tags to the tag set or replace tags in the tag set.
     *
     * @description If a tag already in the set has the same
     * id as one of the tags added, the old tag will be removed
     * the added tag will take its place.
     *
     * @param {Array<Tag>} tags - Tags to add.
     *
     * @example
     * ```js
     * tagComponent.add([tag1, tag2]);
     * ```
     */
    add(tags: Tag[]): void;
    /**
     * Calculate the smallest rectangle containing all the points
     * in the points geometry.
     *
     * @description The result may be different depending on if the
     * current image is an spherical or not. If the
     * current image is an spherical the rectangle may
     * wrap the horizontal border of the image.
     *
     * @returns {Promise<Array<number>>} Promise to the rectangle
     * on the format specified for the {@link RectGeometry} in basic
     * coordinates.
     */
    calculateRect(geometry: PointsGeometry): Promise<number[]>;
    /**
     * Force the creation of a geometry programatically using its
     * current vertices.
     *
     * @description The method only has an effect when the tag
     * mode is either of the following modes:
     *
     * {@link TagMode.CreatePoints}
     * {@link TagMode.CreatePolygon}
     * {@link TagMode.CreateRect}
     * {@link TagMode.CreateRectDrag}
     *
     * In the case of points or polygon creation, only the created
     * vertices are used, i.e. the mouse position is disregarded.
     *
     * In the case of rectangle creation the position of the mouse
     * at the time of the method call is used as one of the vertices
     * defining the rectangle.
     *
     * @fires geometrycreate
     *
     * @example
     * ```js
     * tagComponent.on("geometrycreate", function(geometry) {
     *     console.log(geometry);
     * });
     *
     * tagComponent.create();
     * ```
     */
    create(): void;
    /**
     * Change the current tag mode.
     *
     * @description Change the tag mode to one of the create modes for creating new geometries.
     *
     * @param {TagMode} mode - New tag mode.
     *
     * @fires tagmode
     *
     * @example
     * ```js
     * tagComponent.changeMode(TagMode.CreateRect);
     * ```
     */
    changeMode(mode: TagMode): void;
    fire(type: "geometrycreate", event: ComponentGeometryEvent): void;
    fire(type: "tagmode", event: ComponentTagModeEvent): void;
    /** @ignore */
    fire(type: "tagcreateend" | "tagcreatestart" | "tags", event: ComponentStateEvent): void;
    /**
     * Returns the tag in the tag set with the specified id, or
     * undefined if the id matches no tag.
     *
     * @param {string} tagId - Id of the tag.
     *
     * @example
     * ```js
     * var tag = tagComponent.get("tagId");
     * ```
     */
    get(tagId: string): Tag;
    /**
     * Returns an array of all tags.
     *
     * @example
     * ```js
     * var tags = tagComponent.getAll();
     * ```
     */
    getAll(): Tag[];
    /**
     * Returns an array of tag ids for tags that contain the specified point.
     *
     * @description The pixel point must lie inside the polygon or rectangle
     * of an added tag for the tag id to be returned. Tag ids for
     * tags that do not have a fill will also be returned if the point is inside
     * the geometry of the tag. Tags with point geometries can not be retrieved.
     *
     * No tag ids will be returned for polygons rendered in cropped spherical or
     * rectangles rendered in spherical.
     *
     * Notice that the pixelPoint argument requires x, y coordinates from pixel space.
     *
     * With this function, you can use the coordinates provided by mouse
     * events to get information out of the tag component.
     *
     * If no tag at exist the pixel point, an empty array will be returned.
     *
     * @param {Array<number>} pixelPoint - Pixel coordinates on the viewer element.
     * @returns {Promise<Array<string>>} Promise to the ids of the tags that
     * contain the specified pixel point.
     *
     * @example
     * ```js
     * tagComponent.getTagIdsAt([100, 100])
     *     .then((tagIds) => { console.log(tagIds); });
     * ```
     */
    getTagIdsAt(pixelPoint: number[]): Promise<string[]>;
    /**
     * Check if a tag exist in the tag set.
     *
     * @param {string} tagId - Id of the tag.
     *
     * @example
     * ```js
     * var tagExists = tagComponent.has("tagId");
     * ```
     */
    has(tagId: string): boolean;
    off(type: "geometrycreate", handler: (event: ComponentGeometryEvent) => void): void;
    off(type: "tagmode", handler: (event: ComponentTagModeEvent) => void): void;
    off(type: "tagcreateend" | "tagcreatestart" | "tags", handler: (event: ComponentStateEvent) => void): void;
    /**
     * Event fired when a geometry has been created.
     *
     * @event geometrycreated
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * var component = viewer.getComponent('<component-name>');
     * // Set an event listener
     * component.on('geometrycreated', function() {
     *   console.log("A geometrycreated event has occurred.");
     * });
     * ```
     */
    on(type: "geometrycreate", handler: (event: ComponentGeometryEvent) => void): void;
    /**
     * Event fired when an interaction to create a geometry ends.
     *
     * @description A create interaction can by a geometry being created
     * or by the creation being aborted.
     *
     * @event tagcreateend
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * var component = viewer.getComponent('<component-name>');
     * // Set an event listener
     * component.on('tagcreateend', function() {
     *   console.log("A tagcreateend event has occurred.");
     * });
     * ```
     */
    on(type: "tagcreateend", handler: (event: ComponentStateEvent) => void): void;
    /**
     * Event fired when an interaction to create a geometry starts.
     *
     * @description A create interaction starts when the first vertex
     * is created in the geometry.
     *
     * @event tagcreatestart
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * var component = viewer.getComponent('<component-name>');
     * // Set an event listener
     * component.on('tagcreatestart', function() {
     *   console.log("A tagcreatestart event has occurred.");
     * });
     * ```
     */
    on(type: "tagcreatestart", handler: (event: ComponentStateEvent) => void): void;
    /**
     * Event fired when the create mode is changed.
     *
     * @event tagmode
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * var component = viewer.getComponent('<component-name>');
     * // Set an event listener
     * component.on('tagmode', function() {
     *   console.log("A tagmode event has occurred.");
     * });
     * ```
     */
    on(type: "tagmode", handler: (event: ComponentTagModeEvent) => void): void;
    /**
     * Event fired when the tags collection has changed.
     *
     * @event tags
     * @example
     * ```js
     * // Initialize the viewer
     * var viewer = new Viewer({ // viewer options });
     * var component = viewer.getComponent('<component-name>');
     * // Set an event listener
     * component.on('tags', function() {
     *   console.log("A tags event has occurred.");
     * });
     * ```
     */
    on(type: "tags", handler: (event: ComponentStateEvent) => void): void;
    /**
     * Remove tags with the specified ids from the tag set.
     *
     * @param {Array<string>} tagIds - Ids for tags to remove.
     *
     * @example
     * ```js
     * tagComponent.remove(["id-1", "id-2"]);
     * ```
     */
    remove(tagIds: string[]): void;
    /**
     * Remove all tags from the tag set.
     *
     * @example
     * ```js
     * tagComponent.removeAll();
     * ```
     */
    removeAll(): void;
    protected _activate(): void;
    protected _deactivate(): void;
    protected _getDefaultConfiguration(): TagConfiguration;
    private _disableCreateHandlers;
}

/**
 * @class ZoomComponent
 *
 * @classdesc Component rendering UI elements used for zooming.
 *
 * @example
 * ```js
 * var viewer = new Viewer({ ... });
 *
 * var zoomComponent = viewer.getComponent("zoom");
 * zoomComponent.configure({ size: ComponentSize.Small });
 * ```
 */
declare class ZoomComponent extends Component<ZoomConfiguration> {
    static componentName: ComponentName;
    private _viewportCoords;
    private _zoomDelta$;
    constructor(name: string, container: Container, navigator: Navigator);
    protected _activate(): void;
    protected _deactivate(): void;
    protected _getDefaultConfiguration(): ZoomConfiguration;
}

export { Alignment, ArgumentMapillaryError, BearingComponent, BearingConfiguration, CacheComponent, CacheConfiguration, CacheDepthConfiguration, CameraControls, CameraEnt, CameraVisualizationMode, CancelMapillaryError, CircleMarker, CircleMarkerOptions, ClusterContract, CombiningFilterExpression, CombiningFilterOperator, ComparisonFilterExpression, ComparisonFilterOperator, Component, ComponentEvent, ComponentEventType, ComponentGeometryEvent, ComponentHoverEvent, ComponentMarkerEvent, ComponentName, ComponentOptions, ComponentPlayEvent, ComponentSize, ComponentStateEvent, ComponentTagModeEvent, CoreImageEnt, CoreImagesContract, CreatorEnt, DataProviderBase, DirectionComponent, DirectionConfiguration, DragPanHandler, EntContract, EventEmitter, ExtremePointTag, ExtremePointTagOptions, FallbackComponentName, FallbackOptions, FilterExpression, FilterImage, FilterKey, FilterOperator, FilterValue, Geometry, GeometryProviderBase, GeometryTagError, GraphDataProvider, GraphDataProviderOptions, GraphMapillaryError, IComponent, ICustomCameraControls, ICustomRenderer, IDEnt, IDataProvider, IEventEmitter, IGeometryProvider, IViewer, Image, ImageEnt, ImageTileEnt, ImageTilesContract, ImageTilesRequestContract, ImagesContract, KeyPlayHandler, KeySequenceNavigationHandler, KeySpatialNavigationHandler, KeyZoomHandler, KeyboardComponent, KeyboardConfiguration, LngLat, LngLatAlt, MapillaryError, Marker, MarkerComponent, MarkerConfiguration, MeshContract, NavigationDirection, NavigationEdge, NavigationEdgeData, NavigationEdgeStatus, OriginalPositionMode, OutlineTag, OutlineTagOptions, PointContract, PointGeometry, PointOfView, PointVisualizationMode, PointerComponent, PointerConfiguration, PointsGeometry, PolygonGeometry, Popup, PopupComponent, PopupOffset, PopupOptions, ProviderCellEvent, ProviderEvent, ProviderEventType, RectGeometry, RenderMode, RenderPass, S2GeometryProvider, ScrollZoomHandler, SequenceComponent, SequenceConfiguration, SequenceContract, SequenceEnt, SetMembershipFilterExpression, SetMembershipFilterOperator, SimpleMarker, SimpleMarkerOptions, SliderComponent, SliderConfiguration, SliderConfigurationIds, SliderConfigurationMode, SpatialComponent, SpatialConfiguration, SpatialImageEnt, SpatialImagesContract, SpotTag, SpotTagOptions, Tag, TagComponent, TagConfiguration, TagDomain, TagEventType, TagMode, TagStateEvent, TouchZoomHandler, TransitionMode, URLEnt, UrlOptions, VertexGeometry, Viewer, ViewerBearingEvent, ViewerDataLoadingEvent, ViewerEvent, ViewerEventType, ViewerImageEvent, ViewerMouseEvent, ViewerNavigableEvent, ViewerNavigationEdgeEvent, ViewerOptions, ViewerReferenceEvent, ViewerStateEvent, ZoomComponent, ZoomConfiguration, decompress, ecefToEnu, ecefToGeodetic, enuToEcef, enuToGeodetic, fetchArrayBuffer, geodeticToEcef, geodeticToEnu, isFallbackSupported, isSupported, readMeshPbf };
