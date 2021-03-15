import { BaseHTMLElement, customElement, elem, html, onEvent } from 'dom-native';
import { LineChart } from './c-line';
import { PieChart, PieChartData } from './c-pie';

@customElement('v-main') // same as customElements.define('v-main', IcoElement) 
class MainView extends BaseHTMLElement { // extends native HTMLElement

	//#region    ---------- Key Elements ---------- 
	#lineChart!: LineChart;
	#pieChart!: PieChart;
	//#endregion ---------- /Key Elements ---------- 

	//#region    ---------- DOM Events ---------- 
	@onEvent('pointerup', 'button.do-refresh')
	onDoRefreshClick() {
		this.refreshLineChart();
		this.refreshPieChart();
	}
	//#endregion ---------- /DOM Events ---------- 

	init() { // called once on the first connectedCallback
		[this.#pieChart, this.#lineChart] = elem('c-pie', 'c-line');
		this.append(html`<button class='do-refresh'>REFRESH</button>`);
		this.append(this.#pieChart, this.#lineChart);
	}

	postDisplay() { // called second RAF after connectedCallback
		this.refresh();
	}

	private refresh() {
		this.refreshPieChart();
		this.refreshLineChart();
	}

	private refreshPieChart() {
		const data: PieChartData = [{
			color: 'green',
			value: 25
		}, {
			color: 'blue',
			value: 30
		}, {
			color: 'red',
			value: 15
		}];

		this.#pieChart.setData(data);
	}

	private refreshLineChart() {
		const data: { x: number, y: number }[] = [];
		for (let x = 0; x < 300; x += 10) {
			data.push({
				x,
				y: Math.floor((Math.random() * 100) + 1)
			})
		}
		this.#lineChart.setData(data);
	}


}