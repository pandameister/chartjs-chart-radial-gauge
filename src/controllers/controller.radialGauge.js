import Chart from 'chart.js';

const { helpers } = Chart;

Chart.defaults._set('radialGauge', {
  animation: {
    // Boolean - Whether we animate the rotation of the radialGauge
    animateRotate: true,
    // Boolean - Whether we animate scaling the radialGauge from the centre
    animateScale: true
  },
  hover: {
    mode: 'single'
  },

  // The percentage of the chart that we cut out of the middle.
  cutoutPercentage: 80,

  // The rotation of the chart, ie where the first data arc begins.
  rotation: -Math.PI / 2,

  // Whether to show the metric's value in the middle
  showValue: true,

  // the color of the radial gauge's track
  trackColor: 'rgb(204, 221, 238)',

  // whether the gauge value should have rounded corners
  roundedCorners: true,

  // center value options
  centerValue: {
    displayText: true,
    fontFamily: 'Verdana',
    color: '#000',
    padding: 4,
    image: null,
    backgroundColor: null
  },
  legend: {
    display: false
  },

  // the domain of the metric
  domain: [0, 100],

  tooltips: {
    callbacks: {
      title() {
        return '';
      },
      label(tooltipItem, data) {
        let dataLabel = data.labels[tooltipItem.index];
        const value = `: ${data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]}`;

        dataLabel += value;

        return dataLabel;
      }
    }
  }
});

// eslint-disable-next-line no-shadow
export default Chart => {
  Chart.controllers.radialGauge = Chart.DatasetController.extend({
    dataElementType: Chart.elements.RoundedArc,

    linkScales: helpers.noop,

    draw(...args) {
      this.drawTrack();

      if (this.chart.options.showValue) {
        this.drawCenterValue();
      }

      Chart.DatasetController.prototype.draw.apply(this, args);
    },

    drawTrack() {
      new Chart.elements.Arc({
        _view: {
          backgroundColor: this.chart.options.trackColor,
          borderColor: this.chart.options.trackColor,
          startAngle: 0,
          endAngle: Math.PI * 2,
          x: this.centerX,
          y: this.centerY,
          innerRadius: this.innerRadius,
          outerRadius: this.outerRadius,
          borderWidth: this.borderWidth
        },
        _chart: this.chart
      }).draw();
    },

    drawCenterValue() {
      const ctx = this.chart.ctx;
      const drawInfo = {
        ctx,
        value: Math.ceil(this.getMeta().data[0]._view.value),
        radius: this.innerRadius,
        options: this.chart.options.centerValue
      };

      ctx.save();

      try {
        ctx.translate(this.centerX, this.centerY);
        if (drawInfo.options.draw) {
          drawInfo.options.draw(drawInfo);
          return;
        }

        if (drawInfo.options.image) {
          this.drawCenterImage(drawInfo);
        } else if (drawInfo.options.backgroundColor) {
          this.drawCenterBackground(drawInfo);
        }
        if (drawInfo.options.displayText) {
          this.drawCenterText(drawInfo);
        }
      } finally {
        ctx.restore();
      }
    },

    drawCenterBackground({ options, radius, ctx }) {
      const bgRadius = radius - options.padding;
      ctx.beginPath();
      ctx.arc(0, 0, bgRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = options.backgroundColor;
      ctx.fill();
    },

    drawCenterImage({ radius, options, ctx }) {
      const imageRadius = radius - options.padding;
      ctx.beginPath();
      ctx.arc(0, 0, imageRadius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(options.image, -imageRadius, -imageRadius, 2 * imageRadius, 2 * imageRadius);
    },

    drawCenterText({ options, value }) {
      const fontSize = options.fontSize || `${(this.innerRadius / 50).toFixed(2)}em`;
      const fontFamily = options.fontFamily;
      const color = options.color;

      let text = typeof options.text === 'function' ? options.text(value, options) : options.text;
      text = text || `${value}`;
      this.chart.ctx.font = `${fontSize} ${fontFamily}`;
      this.chart.ctx.fillStyle = color;
      this.chart.ctx.textBaseline = 'middle';
      const textWidth = this.chart.ctx.measureText(text).width;
      const textX = Math.round(-textWidth / 2);

      // only display the text if it fits
      if (textWidth < 2 * this.innerRadius * 0.8) {
        this.chart.ctx.fillText(text, textX, 0);
      }
    },

    update(reset) {
      const chart = this.chart;
      const chartArea = chart.chartArea;
      const opts = chart.options;
      const arcOpts = opts.elements.arc;
      const availableWidth = chartArea.right - chartArea.left - arcOpts.borderWidth;
      const availableHeight = chartArea.bottom - chartArea.top - arcOpts.borderWidth;
      const availableSize = Math.min(availableWidth, availableHeight);

      const meta = this.getMeta();
      const cutoutPercentage = opts.cutoutPercentage;

      this.borderWidth = this.getMaxBorderWidth(meta.data);
      this.outerRadius = Math.max((availableSize - this.borderWidth) / 2, 0);
      this.innerRadius = Math.max(
        cutoutPercentage ? (this.outerRadius / 100) * cutoutPercentage : 0,
        0
      );

      meta.total = this.getMetricValue();
      this.centerX = (chartArea.left + chartArea.right) / 2;
      this.centerY = (chartArea.top + chartArea.bottom) / 2;

      helpers.each(meta.data, (arc, index) => {
        this.updateElement(arc, index, reset);
      });
    },

    updateElement(arc, index, reset) {
      const chart = this.chart;
      const chartArea = chart.chartArea;
      const opts = chart.options;
      const animationOpts = opts.animation;
      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;
      const startAngle = opts.rotation; // non reset case handled later
      const dataset = this.getDataset();
      const circumference =
        reset && animationOpts.animateRotate ? 0 : this.calculateCircumference(dataset.data[index]);
      const value = reset && animationOpts.animateScale ? 0 : this.getMetricValue();
      const endAngle = startAngle + circumference;
      const innerRadius = this.innerRadius;
      const outerRadius = this.outerRadius;
      const valueAtIndexOrDefault = helpers.valueAtIndexOrDefault;

      helpers.extend(arc, {
        // Utility
        _datasetIndex: this.index,
        _index: index,

        // Desired view properties
        _model: {
          x: centerX,
          y: centerY,
          startAngle,
          endAngle,
          outerRadius,
          innerRadius,
          label: valueAtIndexOrDefault(dataset.label, index, chart.data.labels[index]),
          roundedCorners: opts.roundedCorners,
          value
        }
      });

      const model = arc._model;

      // Resets the visual styles
      const custom = arc.custom || {};
      const valueOrDefault = helpers.valueAtIndexOrDefault;
      const elementOpts = this.chart.options.elements.arc;
      model.backgroundColor = custom.backgroundColor
        ? custom.backgroundColor
        : valueOrDefault(dataset.backgroundColor, index, elementOpts.backgroundColor);
      model.borderColor = custom.borderColor
        ? custom.borderColor
        : valueOrDefault(dataset.borderColor, index, elementOpts.borderColor);
      model.borderWidth = custom.borderWidth
        ? custom.borderWidth
        : valueOrDefault(dataset.borderWidth, index, elementOpts.borderWidth);

      arc.pivot();
    },

    getMetricValue() {
      let value = this.getDataset().data[0];
      if (value == null) {
        value = 0;
      }

      return value;
    },

    getDomain() {
      return this.chart.options.domain;
    },

    calculateCircumference() {
      const [domainStart, domainEnd] = this.getDomain();
      const value = this.getMetricValue();
      const domainSize = domainEnd - domainStart;

      return domainSize > 0 ? Math.PI * 2.0 * (Math.abs(value - domainStart) / domainSize) : 0;
    },

    // gets the max border or hover width to properly scale pie charts
    getMaxBorderWidth(arcs) {
      let max = 0;
      const index = this.index;
      const length = arcs.length;
      let borderWidth;
      let hoverWidth;

      for (let i = 0; i < length; i++) {
        borderWidth = arcs[i]._model ? arcs[i]._model.borderWidth : 0;
        hoverWidth = arcs[i]._chart
          ? arcs[i]._chart.config.data.datasets[index].hoverBorderWidth
          : 0;

        max = borderWidth > max ? borderWidth : max;
        max = hoverWidth > max ? hoverWidth : max;
      }
      return max;
    }
  });
};
