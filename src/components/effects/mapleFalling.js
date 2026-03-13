class MapleParticle {
	constructor(x, y, s, r, fn, bounds, char) {
		this.x = x;
		this.y = y;
		this.s = s;
		this.r = r;
		this.fn = fn;
		this.bounds = bounds;
		this.char = char;
	}

	draw(ctx) {
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.rotate(this.r);
		ctx.font = `${40 * this.s}px serif`;
		ctx.textAlign = "left";
		ctx.textBaseline = "top";
		ctx.fillText(this.char, 0, 0);
		ctx.restore();
	}

	update() {
		this.x = this.fn.x(this.x, this.y);
		this.y = this.fn.y(this.x, this.y);
		this.r = this.fn.r(this.r);

		if (this.x > this.bounds.width || this.x < 0 || this.y > this.bounds.height || this.y < 0) {
			this.r = getRandom("fnr");
			if (Math.random() > 0.4) {
				this.x = getRandom("x", this.bounds);
				this.y = 0;
				this.s = getRandom("s");
				this.r = getRandom("r");
			} else {
				this.x = this.bounds.width;
				this.y = getRandom("y", this.bounds);
				this.s = getRandom("s");
				this.r = getRandom("r");
			}
		}
	}
}

class MapleParticleList {
	constructor() {
		this.list = [];
	}

	push(maple) {
		this.list.push(maple);
	}

	update() {
		this.list.forEach(maple => maple.update());
	}

	draw(ctx) {
		this.list.forEach(maple => maple.draw(ctx));
	}
}

function getRandom(option, bounds = { width: 0, height: 0 }) {
	switch (option) {
		case "x":
			return Math.random() * bounds.width;
		case "y":
			return Math.random() * bounds.height;
		case "s":
			return Math.random();
		case "r":
			return Math.random() * 6;
		case "fnx": {
			const randomX = -0.33 + Math.random() * 1;
			return x => x + 0.3 * randomX - 0.6;
		}
		case "fny": {
			const randomY = 0.23 + Math.random() * 1;
			return (x, y) => y + randomY;
		}
		case "fnr": {
			const randomR = Math.random() * 0.01;
			return r => r + randomR;
		}
		default:
			return null;
	}
}

export class MapleFallingEffect {
	constructor(container, options = {}) {
		this.container = container;
		this.options = {
			particleCount: 30,
			chars: ["🍁", "🍂"],
			layerClassName: "maple-layer",
			canvasClassName: "maple-canvas",
			...options,
		};

		this.frame = null;
		this.observer = null;
		this.particles = [];
		this.bounds = { width: 1, height: 1 };
		this.layer = null;
		this.canvas = null;
		this.ctx = null;
		this.paused = false;
		this._autoPaused = false; // 标记是否由自动失焦导致的暂停
		// 绑定的事件处理器（用于添加/移除监听器）
		this._onVisibilityChange = () => {
			if (document.hidden || !document.hasFocus()) {
				if (!this.paused) {
					this.pause();
					this._autoPaused = true;
				}
			} else {
				if (this._autoPaused) {
					this.resume();
					this._autoPaused = false;
				}
			}
		};
		this._onWindowBlur = () => {
			if (!this.paused) {
				this.pause();
				this._autoPaused = true;
			}
		};
		this._onWindowFocus = () => {
			if (this._autoPaused) {
				this.resume();
				this._autoPaused = false;
			}
		};
		// loop function bound to instance so pause/resume can reuse it
		this._loop = () => {
			if (!this.ctx || !this.canvas) return;
			const w = this.canvas.width;
			const h = this.canvas.height;
			this.ctx.clearRect(0, 0, w, h);
			if (this.particles && typeof this.particles.update === "function") this.particles.update();
			if (this.particles && typeof this.particles.draw === "function") this.particles.draw(this.ctx);
			this.frame = requestAnimationFrame(this._loop);
		};
	}

	createLayerIfNeeded() {
		if (this.layer && this.canvas) return;

		const layer = document.createElement("div");
		layer.className = this.options.layerClassName;

		const canvas = document.createElement("canvas");
		canvas.className = this.options.canvasClassName;
		layer.appendChild(canvas);

		this.container.appendChild(layer);
		this.layer = layer;
		this.canvas = canvas;
	}

	resizeCanvas() {
		if (!this.canvas || !this.ctx) return;

		const rect = this.container.getBoundingClientRect();
		const width = Math.max(1, Math.floor(rect.width));
		const height = Math.max(1, Math.floor(rect.height));

		if (this.canvas.width !== width || this.canvas.height !== height) {
			this.canvas.width = width;
			this.canvas.height = height;
		}

		this.bounds.width = this.canvas.width;
		this.bounds.height = this.canvas.height;
	}

	createParticles() {
		const particles = new MapleParticleList();
		for (let i = 0; i < this.options.particleCount; i++) {
			const char = this.options.chars[i % this.options.chars.length] || "🍁";
			particles.push(
				new MapleParticle(
					getRandom("x", this.bounds),
					getRandom("y", this.bounds),
					getRandom("s"),
					getRandom("r"),
					{
						x: getRandom("fnx"),
						y: getRandom("fny"),
						r: getRandom("fnr"),
					},
					this.bounds,
					char
				)
			);
		}
		this.particles = particles;
	}

	start() {
		this.createLayerIfNeeded();
		if (!this.canvas) return;

		this.ctx = this.canvas.getContext("2d");
		if (!this.ctx) return;

		this.resizeCanvas();
		// only create particles if not existing, so resume doesn't recreate them
		if (!this.particles || !this.particles.list || this.particles.list.length === 0) {
			this.createParticles();
		}

		if (this.frame) cancelAnimationFrame(this.frame);
		this.paused = false;
		this.frame = requestAnimationFrame(this._loop);

		if (typeof ResizeObserver !== "undefined") {
			this.observer = new ResizeObserver(() => this.resizeCanvas());
			this.observer.observe(this.container);
		}

		// 监听页面可见性与窗口焦点，失焦时自动暂停，恢复焦点时如果是自动暂停则恢复
		if (typeof document !== "undefined") {
			document.addEventListener("visibilitychange", this._onVisibilityChange);
		}
		if (typeof window !== "undefined") {
			window.addEventListener("blur", this._onWindowBlur);
			window.addEventListener("focus", this._onWindowFocus);
		}
	}

	/**
	 * Pause the animation loop without destroying particles or canvas.
	 */
	pause() {
		if (this.frame) {
			cancelAnimationFrame(this.frame);
			this.frame = null;
		}
		this.paused = true;
	}

	/**
	 * Resume animation loop (particles preserved).
	 */
	resume() {
		if (!this.paused) return;
		this.paused = false;
		if (!this.frame) this.frame = requestAnimationFrame(this._loop);
	}

	stop() {
		if (this.frame) {
			cancelAnimationFrame(this.frame);
			this.frame = null;
		}

		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}

		this.particles = [];
		this.bounds = { width: 1, height: 1 };
		this.ctx = null;
		this.canvas = null;
		// 移除自动暂停的事件监听
		try {
			if (typeof document !== "undefined") document.removeEventListener("visibilitychange", this._onVisibilityChange);
			if (typeof window !== "undefined") {
				window.removeEventListener("blur", this._onWindowBlur);
				window.removeEventListener("focus", this._onWindowFocus);
			}
		} catch (e) {}
	}

	destroy() {
		this.stop();
		if (this.layer) {
			this.layer.remove();
			this.layer = null;
		}
	}
}
