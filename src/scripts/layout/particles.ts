// ── Custom Canvas Particles (Light Mode) ────────────────────────────────
let particleAnimId: number;
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D | null;

const particleState = {
	max: 50,
	particles: [] as any[],
	colors: ['#a78bfa', '#60a5fa', '#38bdf8', '#f472b6'],
	isPaused: false
};

class Particle {
	x: number;
	y: number;
	r: number;
	vx: number;
	vy: number;
	color: string;
	type: 'bubble' | 'line';
	angle: number;
	va: number; // velocity of angle
	alpha: number;

	constructor(w: number, h: number) {
		const sp = parseFloat((document.documentElement as HTMLElement).dataset.particleSpeed || '1');
		this.x = Math.random() * w;
		this.y = Math.random() * h;
		this.r = Math.random() * 4 + 1;
		this.vx = (Math.random() - 0.5) * 1.5 * sp;
		this.vy = (Math.random() - 0.5) * 1.5 * sp;
		this.color = particleState.colors[Math.floor(Math.random() * particleState.colors.length)];
		this.type = Math.random() > 0.5 ? 'bubble' : 'line';
		this.angle = Math.random() * Math.PI * 2;
		this.va = (Math.random() - 0.5) * 0.15 * sp;
		this.alpha = 0;
	}

	update(w: number, h: number, context: CanvasRenderingContext2D) {
		this.x += this.vx;
		this.y += this.vy;
		this.angle += this.va;
		if (this.alpha < 1) this.alpha += 0.02;

		this.draw(context);

		// Return true to keep, false to remove
		return !(this.x < -20 || this.x > w + 20 || this.y < -20 || this.y > h + 20);
	}

	draw(context: CanvasRenderingContext2D) {
		context.save();
		context.globalAlpha = this.alpha;
		context.translate(this.x, this.y);
		context.rotate(this.angle);
		context.strokeStyle = this.color;
		context.fillStyle = this.color;

		if (this.type === 'bubble') {
			context.beginPath();
			context.arc(0, 0, this.r, 0, Math.PI * 2);
			context.stroke();
		} else {
			context.beginPath();
			context.moveTo(-this.r * 2, 0);
			context.lineTo(this.r * 2, 0);
			context.lineWidth = 1.5;
			context.stroke();
		}
		context.restore();
	}
}

let canvasResizeRegistered = false;
const onCanvasResize = () => {
	if (canvas) {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}
};

export const initCanvasParticles = () => {
	if (particleAnimId) cancelAnimationFrame(particleAnimId);
	canvas = document.getElementById('canvas-bg') as HTMLCanvasElement;
	if (!canvas) return;
	ctx = canvas.getContext('2d');
	if (!ctx) return;

	if (!canvasResizeRegistered) {
		window.addEventListener('resize', onCanvasResize, { passive: true });
		canvasResizeRegistered = true;
	}
	onCanvasResize();

	const generate = () => {
		while (particleState.particles.length < particleState.max) {
			particleState.particles.push(new Particle(canvas.width, canvas.height));
		}
	};
	generate();

	let lastParticleFrame = 0;
	const PARTICLE_FPS_INTERVAL = 1000 / 60; // cap at 60fps
	const loop = (now: number) => {
		if (!ctx || particleState.isPaused) return;
		particleAnimId = requestAnimationFrame(loop);
		if (now - lastParticleFrame < PARTICLE_FPS_INTERVAL) return;
		lastParticleFrame = now;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		particleState.particles = particleState.particles.filter((p: any) => p.update(canvas.width, canvas.height, ctx!));
		if (particleState.particles.length < particleState.max - 5) generate();
	};
	particleState.isPaused = false;
	lastParticleFrame = 0;
	requestAnimationFrame(loop);
};

export const resumeCanvasParticles = () => {
	if (particleState.isPaused) {
		particleState.isPaused = false;
		initCanvasParticles();
	}
};

export const pauseCanvasParticles = () => {
	particleState.isPaused = true;
	if (particleAnimId) cancelAnimationFrame(particleAnimId);
};

export const stopCanvasParticles = () => {
	if (particleAnimId) cancelAnimationFrame(particleAnimId);
	if (ctx && canvas) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}
	particleState.particles = [];
};
