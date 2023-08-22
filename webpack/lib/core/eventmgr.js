/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/loghooks.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const WpBuildPlugin = require("../../plugins/base"),
	  typedefs = require("../../types/typedefs");


/**
 * @implements {typedefs.IDisposable}
 */
class WpBuildEventManager
{
	/**
	 * @class WpBuildLogHookStagesPlugin
	 */
	constructor()
	{
	}

	dispose = () => {};

}


module.exports = WpBuildEventManager;
