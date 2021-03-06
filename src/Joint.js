import Base from './core/Base';

/**
 * @constructor clay.Joint
 * @extends clay.core.Base
 */
var Joint = Base.extend(
/** @lends clay.Joint# */
{
    // https://github.com/KhronosGroup/glTF/issues/193#issuecomment-29216576
    /**
     * Joint name
     * @type {string}
     */
    name: '',
    /**
     * Index of joint in the skeleton
     * @type {number}
     */
    index: -1,

    /**
     * Scene node attached to
     * @type {clay.Node}
     */
    node: null,

    /**
     * Root scene node of the skeleton, which parent node is null or don't have a joint
     * @type {clay.Node}
     */
    rootNode: null
});

export default Joint;
