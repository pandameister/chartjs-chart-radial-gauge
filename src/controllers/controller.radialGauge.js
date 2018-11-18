import Chart from "chart.js";

const helpers = Chart.helpers;

Chart.defaults._set("radialGauge", {
  animation: {
    // Boolean - Whether we animate the rotation of the radialGauge
    animateRotate: true,
    // Boolean - Whether we animate scaling the radialGauge from the centre
    animateScale: false
  },
  hover: {
    mode: "single"
  },
  legendCallback: function(chart) {
    var text = [];
    text.push('<ul class="' + chart.id + '-legend">');

    var data = chart.data;
    var datasets = data.datasets;
    var labels = data.labels;

    if (datasets.length) {
      for (var i = 0; i < datasets[0].data.length; ++i) {
        text.push(
          '<li><span style="background-color:' + datasets[0].backgroundColor[i] + '"></span>'
        );
        if (labels[i]) {
          text.push(labels[i]);
        }
        text.push("</li>");
      }
    }

    text.push("</ul>");
    return text.join("");
  },
  legend: {
    labels: {
      generateLabels: function(chart) {
        var data = chart.data;
        if (data.labels.length && data.datasets.length) {
          return data.labels.map(function(label, i) {
            var meta = chart.getDatasetMeta(0);
            var ds = data.datasets[0];
            var arc = meta.data[i];
            var custom = (arc && arc.custom) || {};
            var valueAtIndexOrDefault = helpers.valueAtIndexOrDefault;
            var arcOpts = chart.options.elements.arc;
            var fill = custom.backgroundColor
              ? custom.backgroundColor
              : valueAtIndexOrDefault(ds.backgroundColor, i, arcOpts.backgroundColor);
            var stroke = custom.borderColor
              ? custom.borderColor
              : valueAtIndexOrDefault(ds.borderColor, i, arcOpts.borderColor);
            var bw = custom.borderWidth
              ? custom.borderWidth
              : valueAtIndexOrDefault(ds.borderWidth, i, arcOpts.borderWidth);

            return {
              text: label,
              fillStyle: fill,
              strokeStyle: stroke,
              lineWidth: bw,
              hidden: isNaN(ds.data[i]) || meta.data[i].hidden,

              // Extra data used for toggling the correct item
              index: i
            };
          });
        }
        return [];
      }
    },

    onClick: function(e, legendItem) {
      var index = legendItem.index;
      var chart = this.chart;
      var i, ilen, meta;

      for (i = 0, ilen = (chart.data.datasets || []).length; i < ilen; ++i) {
        meta = chart.getDatasetMeta(i);
        // toggle visibility of index if exists
        if (meta.data[index]) {
          meta.data[index].hidden = !meta.data[index].hidden;
        }
      }

      chart.update();
    }
  },

  // The percentage of the chart that we cut out of the middle.
  cutoutPercentage: 80,

  // The rotation of the chart, where the first data arc begins.
  rotation: -Math.PI / 2,

  // Whether to show the metric's value in the middle
  showValue: true,

  // the color of the radial gauge's track
  trackColor: "rgb(204, 221, 238)",

  // whether the gauge value should have rounded corners
  roundedCorners: true,

  centerValue: {
    fontFamily: "Verdana",
    color: "#000",
    borderWidth: 4,
    image: null,
    backgroundColor: null
  },

  // the domain of the metric
  domain: [0, 100],

  // Need to override these to give a nice default
  tooltips: {
    callbacks: {
      title: function() {
        return "";
      },
      label: function(tooltipItem, data) {
        var dataLabel = data.labels[tooltipItem.index];
        var value = ": " + data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];

        if (helpers.isArray(dataLabel)) {
          // show value on first line of multiline label
          // need to clone because we are changing the value
          dataLabel = dataLabel.slice();
          dataLabel[0] += value;
        } else {
          dataLabel += value;
        }

        return dataLabel;
      }
    }
  }
});

export default Chart => {
  Chart.controllers.radialGauge = Chart.DatasetController.extend({
    dataElementType: Chart.elements.RoundedArc,

    linkScales: helpers.noop,

    draw: function() {
      this.drawTrack();

      if (this.chart.options.showValue) {
        this.drawCenterValue();
      }

      Chart.DatasetController.prototype.draw.apply(this, arguments);
    },

    drawTrack: function() {
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

    drawCenterValue: function() {
      const drawInfo = {
        ctx: this.chart.ctx,
        value: this.getMeta().total,
        radius: this.innerRadius,
        options: this.chart.options.centerValue
      };

      ctx.save();

      try {
        ctx.translate(this.centerX, this.centerY);
        if (drawInfo.options.draw) {
          drawInfo.options.draw(drawInfo);
          ctx.translate(-this.centerX, -this.centerY);
          ctx.restore();
          return;
        }

        if (drawInfo.options.image) {
          this.drawCenterImage(drawInfo);
        } else {
          if (drawInfo.options.backgroundColor) {
            this.drawCenterBackground(drawInfo);
          }
          this.drawCenterText(drawInfo);
        }
      } finally {
        ctx.restore();
      }
    },

    drawCenterBackground: function({ options, radius, ctx }) {
      const bgRadius = radius - options.borderWidth;
      ctx.beginPath();
      ctx.arc(0, 0, bgRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = options.backgroundColor;
      ctx.fill();
    },

    drawCenterImage: function({ radius, options, ctx }) {
      const imageRadius = radius - options.borderWidth;
      ctx.beginPath();
      ctx.arc(0, 0, imageRadius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(options.image, -imageRadius, -imageRadius, 2 * imageRadius, 2 * imageRadius);
    },

    drawCenterText: function({ options, value }) {
      const fontSize = options.fontSize || `${(this.innerRadius / 50).toFixed(2)}em`;
      const fontFamily = options.fontFamily;
      const color = options.color;

      let text = typeof options.text === "function" ? options.text(centerValueInfo) : options.text;
      text = options.text || `${value}`;
      this.chart.ctx.font = `${fontSize} ${fontFamily}`;
      this.chart.ctx.fillStyle = color;
      this.chart.ctx.textBaseline = "middle";
      var textWidth = this.chart.ctx.measureText(text).width;
      var textX = Math.round(-textWidth / 2);
      if (textWidth < 2 * this.innerRadius * 0.8) {
        this.chart.ctx.fillText(text, textX, 0);
      }
    },

    update: function(reset) {
      var chart = this.chart;
      var chartArea = chart.chartArea;
      var opts = chart.options;
      var arcOpts = opts.elements.arc;
      var availableWidth = chartArea.right - chartArea.left - arcOpts.borderWidth;
      var availableHeight = chartArea.bottom - chartArea.top - arcOpts.borderWidth;
      var minSize = Math.min(availableWidth, availableHeight);

      var meta = this.getMeta();
      var cutoutPercentage = opts.cutoutPercentage;

      chart.borderWidth = this.getMaxBorderWidth(meta.data);
      chart.outerRadius = Math.max((minSize - chart.borderWidth) / 2, 0);
      chart.innerRadius = Math.max(
        cutoutPercentage ? (chart.outerRadius / 100) * cutoutPercentage : 0,
        0
      );

      meta.total = this.getMetricValue();
      this.outerRadius = chart.outerRadius;
      this.innerRadius = chart.innerRadius;

      this.centerX = (chartArea.left + chartArea.right) / 2;
      this.centerY = (chartArea.top + chartArea.bottom) / 2;
      this.borderWidth = chart.borderWidth;

      helpers.each(meta.data, (arc, index) => {
        this.updateElement(arc, index, reset);
      });
    },

    updateElement: function(arc, index, reset) {
      const me = this;
      const chart = me.chart;
      const chartArea = chart.chartArea;
      const opts = chart.options;
      const animationOpts = opts.animation;
      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;
      const startAngle = opts.rotation; // non reset case handled later
      const dataset = me.getDataset();
      const circumference =
        reset && animationOpts.animateRotate ? 0 : me.calculateCircumference(dataset.data[index]);
      const endAngle = startAngle + circumference;
      const innerRadius = me.innerRadius;
      const outerRadius = me.outerRadius;
      const valueAtIndexOrDefault = helpers.valueAtIndexOrDefault;

      helpers.extend(arc, {
        // Utility
        _datasetIndex: me.index,
        _index: index,

        // Desired view properties
        _model: {
          x: centerX,
          y: centerY,
          startAngle: startAngle,
          endAngle: endAngle,
          outerRadius: outerRadius,
          innerRadius: innerRadius,
          label: valueAtIndexOrDefault(dataset.label, index, chart.data.labels[index]),
          roundedCorners: opts.roundedCorners
        }
      });

      var model = arc._model;

      // Resets the visual styles
      var custom = arc.custom || {};
      var valueOrDefault = helpers.valueAtIndexOrDefault;
      var elementOpts = this.chart.options.elements.arc;
      model.backgroundColor = custom.backgroundColor
        ? custom.backgroundColor
        : valueOrDefault(dataset.backgroundColor, index, elementOpts.backgroundColor);
      model.borderColor = custom.borderColor
        ? custom.borderColor
        : valueOrDefault(dataset.borderColor, index, elementOpts.borderColor);
      model.borderWidth = custom.borderWidth
        ? custom.borderWidth
        : valueOrDefault(dataset.borderWidth, index, elementOpts.borderWidth);

      // Set correct angles if not resetting
      if (!reset || !animationOpts.animateRotate) {
        if (index === 0) {
          model.startAngle = opts.rotation;
        } else {
          model.startAngle = me.getMeta().data[index - 1]._model.endAngle;
        }

        model.endAngle = model.startAngle + circumference;
      }

      arc.pivot();
    },

    getMetricValue: function() {
      var value = this.getDataset().data[0];
      if (!value || isNaN(value)) {
        value = 0;
      }

      return value;
    },

    getDomain() {
      return this.chart.options.domain;
    },

    calculateCircumference: function() {
      const [domainStart, domainEnd] = this.getDomain();
      const value = this.getMetricValue();
      const domainSize = domainEnd - domainStart;

      return domainSize > 0 ? Math.PI * 2.0 * (Math.abs(value - domainStart) / domainSize) : 0;
    },

    // gets the max border or hover width to properly scale pie charts
    getMaxBorderWidth: function(arcs) {
      var max = 0;
      var index = this.index;
      var length = arcs.length;
      var borderWidth;
      var hoverWidth;

      for (var i = 0; i < length; i++) {
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
