export default Chart => {
  Chart.RadialGauge = (context, config) => {
    config.type = 'radialGauge';

    return new Chart(context, config);
  };
};
