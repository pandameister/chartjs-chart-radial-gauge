import Chart from 'chart.js';
// eslint-disable-next-line no-unused-vars
import RoundedArc from './elements/element.roundedArc';
import RadialGaugeController from './controllers/controller.radialGauge';
import RadialGaugeChart from './charts/Chart.RadialGauge';

RadialGaugeController(Chart);
RadialGaugeChart(Chart);

export default RadialGaugeChart;
