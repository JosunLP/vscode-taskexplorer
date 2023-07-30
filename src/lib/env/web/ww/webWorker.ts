export default {};
// /**
//  * @class TeWebWorker
//  */
//
// import { isObject, isString } from "../utils/typeUtils";
//
//
// export class TeWebWorker
// {
//
// 	private config = {
// 		blob: "" ,
// 		file: "" ,
// 		itemId: ""
// 	};
//
//
// 	resetBlob(v)
// 	{
// 		this.stop();
// 		this.setBlob(v);
// 		this.init({ blob: v });
// 	};
//
//
// 	constructor(cfg)
// 	{
// 		return this.init(cfg, true);
// 	};
//
//
// 	init(cfg, construct)
// 	{
// 		if (construct) {
// 			this.initConfig(cfg);
// 			this.id = id();
// 		}
// 		else {
// 			this.initConfig(merge(this.initialConfig, cfg));
// 		}
// 		this.mixins.observable.constructor.call(me, cfg);
// 		/*
// 		this.addEvents (
// 			'error' ,
// 			'message'
// 		);
// 		*/
// 		try {
// 			// Makes inline worker
// 			if (isEmpty(this.getFile()))
// 			{
// 				const winURL = window.URL || window.webkitURL ,
// 					blob = new Blob([this.getBlob()], { type: "text/plain" }) ,
// 					inlineFile = winURL.createObjectURL(blob);
//
// 				this.worker = new Worker(inlineFile);
// 			}
// 			// Uses file
// 			else {
// 				this.worker = new Worker(this.getFile());
// 			}
//
// 			this.worker.onmessage = function(message)
// 			{
// 				// Message event is always sent
// 				this.fireEvent("message", me, message.data);
// 				/*
// 					message.data : object
// 					msg.event : event to raise
// 					msg.data : data to handle
// 				*/
// 				if (isObject(message.data)) this.fireEvent(message.data.event, me, message.data.data);
// 			};
//
// 			this.worker.onerror = function(message) {
// 				this.fireEvent("error", me, message);
// 			};
// 		}
// 		catch(err) {
// 			Error.raise(err);
//
// 			return null;
// 		}
//
// 		return me;
// 	};
//
//
// 	send(events, data)
// 	{
//
//
// 		if (!this.worker) {
// 			return;
// 		}
//
// 		// Treats it as a normal message
// 		if (arguments.length === 1) {
// 			if (isString(events)) this.worker.postMessage(events);
// 			else Error.raise("String expected!");
// 		}
// 		// Treats it as an event-driven message
// 		else if (arguments.length >= 2) {
// 			if (isString(events)) events = [events];
//
// 			each(events, function (event) {
// 				const msg = {
// 					event ,
// 					data
// 				};
//
// 				this.worker.postMessage(msg);
// 			});
// 		}
// 	};
//
//
// 	stop ()
// 	{
// 		if (this.worker) {
// 			this.worker.terminate();
// 		}
// 	}
//
// }
//