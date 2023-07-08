export default {};
//
// import { IDictionary } from ":types";
// import { isArray, isString } from "../utils/typeUtils";
//
// /**
//  * @class TeWebWorkerManager
//  */
//
// export class TeWebWorkerManager
// {
//
// 	private wwList: IDictionary<any> = {};
//
//
// 	/**
// 	 * @method register
// 	 * Registers one or more Ext.ux.WebWorker
// 	 */
// 	 register = (webworkers: any | any[]) =>
// 	 {
// 		if (!isArray(webworkers)) webworkers = [ webworkers ];
// 		webworkers.forEach((webworker: { id: any }) =>
// 		{
// 			this.wwList[webworker.id] = webworker;
// 		});
// 	};
//
//
// 	/**
// 	 * @method unregister
// 	 * Un-registers one or more Ext.ux.WebWorker
// 	 */
// 	 unregister = (webworkers: any | any[]) =>
// 	 {
// 		if (!isArray(webworkers)) webworkers = [ webworkers ];
// 		webworkers.forEach((webworker: { id: any }) =>
// 		{
// 			if (this.wwList[webworker.id]) delete this.wwList[webworker.id];
// 		});
// 	};
//
// 	/**
// 	 * @method contains
// 	 * Checks if a webworker is already registered or not
// 	 */
// 	contains = (webworker: { id: any }) => !!this.wwList[webworker.id];
//
//
// 	/**
// 	 * @method get
// 	 * Retrieves a registered webworker by its id
// 	 */
// 	get = (id: any) => this.wwList[id];
//
//
// 	/**
// 	 * @method getExcept
// 	 * Retrieves registered webworkers except the input
// 	 * @private
// 	 */
// 	getExcept = (webworkers: any | any[]) =>
// 	{
// 		if (!isArray(webworkers)) webworkers = [ webworkers ];
// 		const list = this.wwList.clone ();
// 		webworkers.forEach((webworker: { id: any }) =>
// 		{
// 			delete this.wwList[webworker.id];
// 		});
// 		return list;
// 	};
//
//
// 	/**
// 	 * @method each
// 	 * Executes a function for each registered webwork
// 	 */
// 	each = (fn: (arg0: any) => void) =>
// 	{
// 		this.wwList.each((_id: any, webworker: any, _len: any) =>
// 		{
// 			fn (webworker);
// 		});
// 	};
//
//
// 	/**
// 	 * @method stopAll
// 	 * Stops any registered webworker
// 	 */
// 	stopAll = () =>
// 	{
// 		const me = this;
// 		me.wwList.each ((_id: any, webworker: { stop: () => void }, _len: any) =>
// 		{
// 			webworker.stop ();
// 			me.unregister(webworker);
// 		});
// 	};
//
//
// 	/**
// 	 * @method listen
// 	 * Adds an handler for events given to each registered webworker
// 	 */
// 	listen = (events: any[], handler: any) =>
// 	{
// 		if (isString (events)) events = [ events ];
//
// 		this.wwList.each ((_id: any, webworker: { on: (arg0: any, arg1: any) => void }, _len: any) =>
// 		{
// 			events.forEach((event: any) => {
// 				webworker.on (event, handler);
// 			});
// 		});
// 	};
//
//
// 	/**
// 	 * @method listenExcept
// 	 * Adds an handler for events given to each registered webworker, except webworkers given
// 	 */
// 	listenExcept = (events: any[], webworkers: any, handler: any) =>
// 	{
// 		if (isString (events)) events = [ events ];
//
// 		this.getExcept(webworkers).each((_id: any, webworker: { on: (arg0: any, arg1: any) => void }, _len: any) =>
// 		{
// 			events.forEach((event: any) => {
// 				webworker.on (event, handler);
// 			});
// 		});
// 	};
//
//
// 	/**
// 	 * @method multicast
// 	 * Sends a message to each webworker, except those specified
// 	 */
// 	multicast = (webworkers: never[], event: any, data: any) =>
// 	{
// 		this.getExcept(webworkers).each((_id: any, webworker: { send: (arg0: any, arg1?: any) => void }, _len: any) =>
// 		{
// 			if (isEmpty(data)) {
// 				webworker.send(event);
// 			}
// 			else {
// 				webworker.send (event, data);
// 			}
// 		});
// 	};
//
//
// 	/**
// 	 * @method broadcast
// 	 * Sends a message to each webworker
// 	 */
// 	broadcast = (event: any, data: any) => this.multicast ([], event, data);
//
// }
//