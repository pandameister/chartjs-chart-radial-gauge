import * as Chart from "chart.js";

/**
 * An arc element that supports rounded corners
 */
Chart.elements.RoundedArc = Chart.elements.Arc.extend({
  draw: function() {
    const ctx = this._chart.ctx;
    const vm = this._view;
    let { startAngle, endAngle } = vm;
    const cornerRadius = (vm.outerRadius - vm.innerRadius) / 2;
    const cornerX = (vm.outerRadius + vm.innerRadius) / 2;

    // translate + rotate to make drawing the corners simpler
    ctx.translate(vm.x, vm.y);
    ctx.rotate(startAngle);
    endAngle -= startAngle;
    ctx.beginPath();
    if (vm.roundedCorners) {
      ctx.arc(cornerX, 0, cornerRadius, Math.PI, 0);
    }
    ctx.arc(0, 0, vm.outerRadius, 0, endAngle);

    const x = cornerX * Math.cos(endAngle);
    const y = cornerX * Math.sin(endAngle);

    if (vm.roundedCorners) {
      ctx.arc(x, y, cornerRadius, endAngle, endAngle + Math.PI);
    }

    ctx.arc(0, 0, vm.innerRadius, endAngle, 0, true);
    ctx.closePath();
    ctx.rotate(-startAngle);
    ctx.translate(-vm.x, -vm.y);

    ctx.strokeStyle = vm.borderColor;
    ctx.lineWidth = vm.borderWidth;
    ctx.fillStyle = vm.backgroundColor;

    ctx.fill();
    ctx.lineJoin = "bevel";

    if (vm.borderWidth) {
      ctx.stroke();
    }
  }
});

export default Chart.elements.RoundedArc;
