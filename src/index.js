import Chart from "chart.js";
import RoundedArc from "./elements/element.roundedArc";
import RadialGaugeController from "./controllers/controller.radialGauge";
import RadialGaugeChart from "./charts/Chart.RadialGauge";

console.log(RoundedArc);
RadialGaugeController(Chart);
RadialGaugeChart(Chart);

export default RadialGaugeChart;
