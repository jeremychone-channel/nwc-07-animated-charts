import { easeBounce, easeExp } from 'd3-ease';
import { curveCatmullRom, line as d3Line } from 'd3-shape';
import { adoptStyleSheets, anim, BaseHTMLElement, css, customElement, elem } from 'dom-native';
import { deepClone } from 'utils-min';

const PAD = 8;

const _shadowCss = css`
	:host{
		height: 200px;
		width: 500px;
		box-shadow: var(--elev-3);
		padding: ${PAD}px;
	}
	canvas{
		margin: 0;
		/* top, right, bottom, ;left */
		/* clip-path: inset(0 80% 0 0); */
	}
`;

export interface LineDataItem { x: number, y: number };

@customElement('c-line')
export class LineChart extends BaseHTMLElement {

	//#region    ---------- Key Elements ---------- 
	#canvasEl: HTMLCanvasElement;
	#ctx: CanvasRenderingContext2D;
	//#endregion ---------- /Key Elements ---------- 

	//#region    ---------- Data ---------- 
	#data!: LineDataItem[];
	#prevData?: LineDataItem[];

	setData(data: any) {
		if (this.#data) {
			this.#prevData = this.#data;
		}
		this.#data = deepClone(data);

		this.refresh();
		return this; // allows chaining
	}
	//#endregion ---------- /Data ----------


	constructor() {
		super();
		this.#canvasEl = elem('canvas');
		this.#ctx = this.#canvasEl.getContext('2d')!;
		this.attachShadow({ mode: 'open' }).append(this.#canvasEl);

		adoptStyleSheets(this, _shadowCss);
	}

	postDisplay() {
		this.refresh();
	}

	refresh() {
		if (!this.#data) return;

		const ctx = this.#ctx;
		const cvsEl = this.#canvasEl;
		const data = this.#data;

		const pxRatio = window.devicePixelRatio;
		const h = this.clientHeight - PAD * 2;
		const w = this.clientWidth - PAD * 2;
		cvsEl.width = w * pxRatio;
		cvsEl.height = h * pxRatio;
		cvsEl.style.width = w + 'px';
		cvsEl.style.height = h + 'px';
		const canvasInfo = { w, h, ctx };

		ctx.scale(pxRatio, pxRatio);

		const { maxX, maxY } = this.#data.reduce((max, p) => {
			max.maxX = p.x > max.maxX ? p.x : max.maxX;
			max.maxY = p.y > max.maxY ? p.y : max.maxY;
			return max;
		}, { maxX: 0, maxY: 0 });

		// calculate the relative X and Y on the canvas frame of reference
		const rX = w / maxX;
		const rY = (h - 8) / maxY; // add some padding to the top

		// precompute the startRY
		const startRYs = this.#prevData?.map(p => p.y * rY) ?? Array(this.#data.length).fill(0);

		// draw the line
		anim(drawChart, 1500, easeBounce);

		function drawChart(ntime: number) {
			ctx.clearRect(0, 0, w, h);

			//// draw the grid lines
			ctx.save();
			ctx.beginPath();
			ctx.strokeStyle = '#ddd';
			ctx.lineWidth = 1;
			let lY = h - 2; // bottom
			while (lY > rY) {
				ctx.moveTo(0, lY); ctx.lineTo(w, lY); ctx.stroke();
				lY -= h / 4;
			}
			ctx.moveTo(0, 5); ctx.lineTo(w, 5); ctx.stroke();
			ctx.restore();

			//// draw the line content
			ctx.save();
			// compute lineData
			const lineData = data.map((p, idx) => {
				const startRY = startRYs[idx];
				return { x: p.x * rX, y: startRY + (p.y * rY - startRY) * ntime }
			});
			// transform the data to d3 line format
			const d3LineData: [number, number][] = lineData.map(({ x, y }) => [x, h - y]);
			// compute and draw line path
			let line = d3Line().curve(curveCatmullRom.alpha(0.5))(d3LineData)!;
			const linePath2D = new Path2D(line);
			ctx.strokeStyle = '#3366ff';
			ctx.lineWidth = 3;
			ctx.stroke(linePath2D);
			ctx.restore();
		}

	}

}

// Augment the global TagName space to match runtime
declare global {
	interface HTMLElementTagNameMap {
		'c-line': LineChart;
	}
}




