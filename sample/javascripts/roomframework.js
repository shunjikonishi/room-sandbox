if (typeof(room) === "undefined") room = {};

$(function() {
	var nullLogger = {
			"log" : function() {}
		}, 
		defaultSettings = {
			"maxRetry" : 5,
			"retryInterval" : 1000,
			"logger" : nullLogger
		};

	/**
	 * settings
	 * - url
	 * - maxRetry
	 * - retryInterval
	 * - logger
	 * - authToken
	 * - onOpen(event)
	 * - onClose(event)
	 * - onRequest(command, data)
	 * - onMessage(data, startTime)
	 * - onServerError(msg)
	 */
	room.Connection = function(settings) {
		function request(params) {
			logger.log("request", params);
			if (!isConnected()) {
				if (retryCount < settings.maxRetry) {
					ready(function() {
						request(params);
					});
					if (!openning) {
						socket = createWebSocket();
					}
				}
				return;
			}
			if (settings.onRequest) {
				settings.onRequest(params.command, params.data);
			}
			var startTime = new Date().getTime(),
				id = ++requestId;
			times[id] = startTime;
			if (params.success) {
				listeners[id] = params.success;
			}
			var msg = {
				"id" : id,
				"command" : params.command,
				"data" : params.data
			};
			if (params.log) {
				msg.log = params.log;
			}
			socket.send(JSON.stringify(msg));
			return self;
		}
		function addEventListener(name, func) {
			listeners[name] = func;
			return self;
		}
		function removeEventListener(name) {
			delete listeners[name];
			return self;
		}
		function onOpen(event) {
			openning = false;
			logger.log("onOpen", event);
			if (settings.onOpen) {
				settings.onOpen(event);
			}
			retryCount = 0;
			if (settings.authToken) {
				request({
					"command" : "room.auth",
					"data" : settings.authToken,
					"success" : function(data) {
						if (data.status == "OK" && data.token) {
							settings.authToken = data.token;
						}
					}
				});
			}
			for (var i=0; i<readyFuncs.length; i++) {
				readyFuncs[i]();
			}
			readyFuncs = [];
		}
		function onMessage(event) {
			logger.log("receive", event.data);
			var data = JSON.parse(event.data),
				startTime = times[data.id],
				func = null;
			if (startTime) {
				delete times[data.id];
			}
			if (settings.onMessage) {
				settings.onMessage(data, startTime);
			}
			if (data.type == "error") {
				if (settings.onServerError) {
					settings.onServerError(data.data);
				}
				return;
			}
			if (data.id && listeners[data.id]) {
				func = listeners[data.id];
				delete listeners[data.id];
			} else if (data.command && listeners[data.command]) {
				func = listeners[data.command];
			}
			if (func) {
				func(data.data);
			} else {
				logger.log("UnknownMessage", event.data);
			}
		}
		function onClose(event) {
			logger.log("close", event);
			if (settings.onClose) {
				settings.onClose(event);
			}
			if (retryCount < settings.maxRetry) {
				retryCount++;
				setTimeout(function() {
					socket = createWebSocket();
				}, retryCount * 1000);
			}
		}
		function onError(event) {
			if (settings.onSocketError) {
				settings.onSocketError(event);
			}
		}
		function polling(interval, params) {
			return setInterval(function() {
				if (isConnected()) {
					request($.extend(true, {}, params));
				}
			}, interval);
		}
		function ready(func) {
			if (isConnected()) {
				func();
			} else {
				readyFuncs.push(func);
			}
		}
		function close() {
			if (isConnected()) {
				retryCount = settings.maxRetry;
				socket.close();
			}
		}
		function isConnected() {
			return socket.readyState == 1;//OPEN
		}
		function createWebSocket() {
			openning = true;
			var socket = new WebSocket(settings.url);
			socket.onopen = onOpen;
			socket.onmessage = onMessage;
			socket.onerror = onError;
			socket.onclose = onClose;
			return socket;
		}
		if (typeof(settings) === "string") {
			settings = {
				"url" : settings
			};
		}
		settings = $.extend({}, defaultSettings, settings);
		var self = this,
			logger = settings.logger,
			requestId = 0,
			times = {},
			listeners = {},
			readyFuncs = [],
			openning = false,
			retryCount = 0;
			socket = createWebSocket();


		$.extend(this, {
			"request" : request,
			"addEventListener" : addEventListener,
			"removeEventListener" : removeEventListener,
			"polling" : polling,
			"ready" : ready,
			"close" : close,
			"isConnected" : isConnected,
			"onOpen" : function(func) { settings.onOpen = func; return this;},
			"onClose" : function(func) { settings.onClose = func; return this;},
			"onRequest" : function(func) { settings.onRequest = func; return this;},
			"onMessage" : function(func) { settings.onMessage = func; return this;},
			"onSocketError" : function(func) { settings.onSocketError = func; return this;},
			"onServerError" : function(func) { settings.onServerError = func; return this;}
		});
	};
});
if (typeof(room) === "undefined") room = {};

$(function() {
	room.Cache = function(storage, logErrors) {
		function get(key) {
			if (storage) {
				try {
					return storage.getItem(key);
				} catch (e) {
					//Ignore. Happened when cookie is disabled. 
					if (logErrors && console) {
						console.log(e);
					}
				}
			}
			return null;
		}
		function getAsJson(key) {
			var ret = get(key);
			if (ret) {
				ret = JSON.parse(ret);
			}
			return ret;
		}
		function put(key, value) {
			if (storage) {
				if (typeof(value) === "object") {
					value = JSON.stringify(value);
				}
				try {
					storage.setItem(key, value);
				} catch (e) {
					//Ignore. Happened when cookie is disabled, or quota exceeded.
					if (logErrors && console) {
						console.log(e);
					}
				}
			}
		}
		function remove(key) {
			if (storage) {
				try {
					storage.removeItem(key);
				} catch (e) {
					//Ignore. Happened when cookie is disabled, or quota exceeded.
					if (logErrors && console) {
						console.log(e);
					}
				}
			}
		}
		function keys() {
			var ret = [];
			if (storage) {
				try {
					for (var i=0; i<storage.length; i++) {
						ret.push(storage.key(i));
					}
				} catch (e) {
					//Ignore. Happened when cookie is disabled. 
					if (logErrors && console) {
						console.log(e);
					}
				}
			}
			return ret;
		}
		function size() {
			try {
				return sotrage ? storage.length : 0;
			} catch (e) {
				if (logErrors && console) {
					console.log(e);
				}
			}
		}
		function clear() {
			if (storage) {
				try {
					storage.clear();
				} catch (e) {
					//Ignore. Happened when cookie is disabled. 
					if (logErrors && console) {
						console.log(e);
					}
				}
			}
		}
		$.extend(this, {
			"get" : get,
			"getAsJson" : getAsJson,
			"put" : put,
			"remove" : remove,
			"size" : size,
			"clear" : clear,
			"keys" : keys
		});
	};
});
if (typeof(room) === "undefined") room = {};
if (typeof(room.logger) === "undefined") room.logger = {};

$(function() {
	function normalizeFunc(obj) {
		var type;
console.log("normalize: " + obj + ", " + $.isArray(obj));
		if ($.isArray(obj)) {
			var newArray = [];
			for (var i=0; i<obj.length; i++) {
				type = typeof(obj[i]);
				if (type === "function") {
					newArray.push("(function)");
				} else if (type === "object") {
					newArray.push(normalizeFunc(obj[i]));
				} else {
					newArray.push(obj[i]);
				}
			}
			return newArray;
		} else {
			var newObj = {};
			for (var key in obj) {
				type = typeof(key);
				if (type === "function") {
					newObj[key] = "(function)";
				} else if (type === "object") {
					newObj[key] = normalizeFunc(obj[key]);
				} else {
					newObj[key] = obj[key];
				}
			}
			return newObj;
		}
	}
	room.logger.DivLogger = function($div) {
		this.log = function() {
			var msgs = [];
			for (var i=0; i<arguments.length; i++) {
				if (typeof(arguments[i]) == "object") {
					msgs.push(normalizeFunc(arguments[i]));
				} else {
					msgs.push(arguments[i]);
				}
			}
			$("<p/>").text(JSON.stringify(msgs)).prependTo($div);
		};
	};
	room.logger.WsLogger = function(wsUrl, commandName) {
		var ws = new room.Connection(wsUrl);
		commandName = commandName || "log";
		this.log = function() {
			ws.request({
				"command": commandName,
				"data": normalizeFunc(arguments)
			});
		};
	};
	room.logger.nullLogger = {
		"log" : function() {}
	};
});