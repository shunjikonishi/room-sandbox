if (typeof(flect) == "undefined") flect = {};

if (typeof(flect.html) == "undefined") flect.html = {};

flect.html.DrawCanvas = function(target, wsUrl, options) {
	function draw(sx, sy, ex, ey, color, width, penCap) {
		canvasContext.lineWidth = width;
		canvasContext.strokeStyle = color;
		canvasContext.lineCap = penCap;
		canvasContext.beginPath();
		canvasContext.moveTo(sx, sy);
		canvasContext.lineTo(ex, ey);
		canvasContext.stroke();
		canvasContext.closePath();
	}
	function drawLine(e) {
		if (!settings.enabled) {
			return;
		}
		if (!drawInfo.drawing) {
			return;
		}
		if (touchable) {
			e.preventDefault();
		} else {
			clearTimeout(mouseLeaveTimeout);
			mouseLeaveTimeout = false;
		}
		var offset = canvas.offset();
		var x, y;
		if (touchable) {
			x = e.changedTouches[0].pageX - offset.left;
			y = e.changedTouches[0].pageY - offset.top;
		} else {
			x = e.pageX - offset.left;
			y = e.pageY - offset.top;
		}
		if (drawInfo.spos == null) {
			drawInfo.spos = { "x" : x, "y" : y};
			return;
		}
		
		if (drawInfo.spos.x == x && drawInfo.spos.y == y) {
			return;
		}
		var p = { "x" : x, "y" : y};
		if (settings.eraser) {
			canvasContext.clearRect(x-10, y-10, 20, 20);
		} else {
			draw(drawInfo.spos.x, drawInfo.spos.y, p.x, p.y,
				settings.penColor,
				settings.penWidth,
				settings.penCap);
			ws.request({
				"command" : "draw",
				"data" : {
					"id" : wsId,
					"p" : [drawInfo.spos.x, drawInfo.spos.y, p.x, p.y],
					"c" : settings.penColor,
					"w" : settings.penWidth
				}
			})
			drawInfo.spos = p;
		}
	}
	function startDrawing(e) {
		drawInfo.drawing = true;
		drawLine(e);
		if (touchable) {
			canvas.each(function () {
				this.ontouchmove = drawLine;
			});
		} else {
			canvas.mousemove(drawLine);
		}
	}
	function stopDrawing(e) {
		if (touchable) {
			canvas.each(function () {
				this.ontouchmove = null;
			});
		} else {
			canvas.unbind('mousemove');
		}
		drawInfo.drawing = false;
		drawInfo.spos = null;
	}
	function clear() {
		stopDrawing();
		canvasContext.clearRect(0, 0, element.width, element.height);
		canvasContext.fillStyle = settings.bgColor;
		canvasContext.fillRect(0, 0, element.width, element.height);
		return self;
	}
	function release() {
		canvas.each(function () {
			this.ontouchstart = null;
			this.ontouchend = null;
			this.ontouchmove = null;
			this.ontouchcancel = null;
		});
		canvas.unbind('mousedown')
			.unbind('mouseup')
			.unbind('mousemove')
			.unbind('mouseleave');
		return self;
	}
	var self = this,
		settings = {
			"bgColor" : "#ffffff",
			"penColor" : "#000000",
			"penWidth" : 2,
			"penCap" : "round",
			"enabled" : true,
			"eraser" : false
		},
		canvas = $(target),
		element = canvas.get(0),
		mouseLeaveTimeout = false,
		touchable = false,
		drawInfo = {
			"drawing" : false,
			"spos" : null
		};
	if (options) {
		$.extend(settings, options);
	}
	if (!element.getContext && FlashCanvas) {
		FlashCanvas.initElement(element);
	}
	var canvasContext = element.getContext("2d");
	
	//Initialize
	// Fixes the jQuery.fn.offset() function for Mobile Safari Browsers i.e. iPod Touch, iPad and iPhone
	if (parseFloat(((/CPU.+OS ([0-9_]{3}).*AppleWebkit.*Mobile/i.exec(navigator.userAgent)) || [0,'4_2'])[1].replace('_','.')) < 4.1) {
		$.fn.Oldoffset = $.fn.offset;
		$.fn.offset = function () {
			var result = $(this).Oldoffset();
			result.top -= window.scrollY;
			result.left -= window.scrollX;
			return result;
		};
	}
	canvas.each(function () {
		this.ontouchstart = function (e) {
			touchable = true;
			e.preventDefault();
			startDrawing(e, this);
		}
		this.ontouchend = stopDrawing;
		this.ontouchcancel = stopDrawing;
	});
	canvas.mousedown(startDrawing)
		.mouseup(stopDrawing)
		.mouseleave(function (e) {
			if (!mouseLeaveTimeout) {
				mouseLeaveTimeout = setTimeout(function () {
					stopDrawing();
					clearTimeout(mouseLeaveTimeout);
					mouseLeaveTimeout = false;
				}, 500);
			}
		});
	//WebSocket
	var wsId = new Date().getTime() + Math.random()
		ws = new room.Connection(wsUrl);
	ws.addEventListener("draw", function(data) {
		if (data.id != wsId) {
			draw(data.p[0], data.p[1], data.p[2], data.p[3], data.c, data.w, settings.penCap);
		}
	})
	$.extend(this, {
		"clear" : clear,
		"release" : release,
		"getDataURL" : function() {
			return element.toDataURL();
		},
		"bgColor" : function(v) {
			if (v === undefined) {
				return settings.bgColor;
			} else {
				settings.bgColor = v;
				return self;
			}
		},
		"penColor" : function(v) {
			if (v === undefined) {
				return settings.penColor;
			} else {
				settings.penColor = v;
				return self;
			}
		},
		"penWidth" : function(v) {
			if (v === undefined) {
				return settings.penWidth;
			} else {
				settings.penWidth = v;
				return self;
			}
		},
		"penCap" : function(v) {
			if (v === undefined) {
				return settings.penCap;
			} else {
				settings.penCap = v;
				return self;
			}
		},
		"enabled" : function(v) {
			if (v === undefined) {
				return settings.enabled;
			} else {
				settings.enabled = v;
				return self;
			}
		},
		"eraser" : function(v) {
			if (v === undefined) {
				return settings.eraser;
			} else {
				settings.eraser = v;
				return self;
			}
		},
	});
}