import { easeBounceOut } from 'd3-ease';
import { arc as d3Arc } from 'd3-shape';
import { adoptStyleSheets, anim, BaseHTMLElement, css, customElement, html } from 'dom-native';
import { deepClone } from 'utils-min';

const _shadowCss = css`
	:host{
		position: relative;
		box-shadow: var(--elev-3);
		display: grid;
		grid-template-rows: 1.5fr 2rem 1fr;	
		grid-template-columns: 1fr 10rem 1fr;		
	}
	canvas{
		position: absolute;
		top: 0; left: 0;		
	}
	div{
		grid-area: 2 / 2;
		color: #545454;
		display: flex;
		justify-content: center;
		align-items: center;
		text-transform: uppercase;
	}	
`;

export interface PieChartDataItem {
	color: string,
	value: number // assume percent for now
}

export type PieChartData = PieChartDataItem[];

@customElement('c-pie')
export class PieChart extends BaseHTMLElement { // extends HTMLElement
	//#region    ---------- Key Elements ---------- 
	#canvas: HTMLCanvasElement;
	#ctx: CanvasRenderingContext2D;
	//#endregion ---------- /Key Elements ----------

	//#region    ---------- Data ---------- 
	#data!: PieChartData;
	#prevData?: PieChartData;

	setData(data: PieChartData) {
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

		this.#canvas = document.createElement('canvas');
		this.#ctx = this.#canvas.getContext('2d')!;

		this.attachShadow({ mode: 'open' }).append(this.#canvas);
		this.shadowRoot!.append(html`<div>Bouncing Donut</div>`);

		adoptStyleSheets(this, _shadowCss);
	}

	// called by BaseHTMLElement, after first paint from connectedCallback
	postDisplay() {
		this.refresh();
	}

	private async refresh() {
		const { clientWidth: w, clientHeight: h } = this;

		const pxRatio = window.devicePixelRatio;
		this.#canvas.width = w * pxRatio;
		this.#canvas.height = h * pxRatio;
		this.#canvas.style.width = w + 'px';
		this.#canvas.style.height = h + 'px';

		this.#ctx.scale(pxRatio, pxRatio);

		renderPie(this.#data, this.#ctx, w, h);
	}

}

function renderPie(data: PieChartData, ctx: CanvasRenderingContext2D, w: number, h: number) {
	if (data == null) return;

	// configure the d3 arc generator
	const arcGen = d3Arc().cornerRadius(16).padAngle(.02);
	const innerRadius = h / 2 - 50;
	const outerRadius = h / 2;

	anim(drawPie, 1500, easeBounceOut);

	function drawPie(ntime: number) {
		ctx.clearRect(0, 0, w, h);
		// save the pre-drawing ctx states before doing any translate
		ctx.save();
		// d3-shape arc draws arc at 0/0, so we translate to center of canvas
		ctx.translate(w / 2, h / 2);

		let total = 0;
		let prevEndAngle = 0;
		for (const item of data) {
			const v = item.value * ntime;
			total += v;
			ctx.fillStyle = item.color;

			const startAngle = prevEndAngle;
			const endAngle = startAngle + v / 100 * Math.PI * 2;
			// d3-shape compute the SVG Path (string)
			const arcSvgPath = arcGen({
				innerRadius, outerRadius,
				startAngle, endAngle
			})!;

			// Create Canvas Path2D to prase svg path as canvas path
			const arcCanvasPath = new Path2D(arcSvgPath);
			ctx.fill(arcCanvasPath); // fill the path	

			prevEndAngle = endAngle;
		}

		// draw the text
		ctx.fillStyle = '#434343';
		ctx.font = "700 3rem 'Open Sans'";
		ctx.textAlign = 'center';
		ctx.fillText('' + Math.round(total), 0, 0);

		// restore to the pre-drawing ctx states (i.e. before the translate)
		ctx.restore();
	}
}

// Augment the global TagName space to match runtime
declare global {
	interface HTMLElementTagNameMap {
		'c-pie': PieChart;
	}
}
