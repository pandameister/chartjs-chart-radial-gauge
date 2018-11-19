#!/bin/bash

cp -R samples docs
cp node_modules/chart.js/dist/Chart.bundle.js docs/js
cp build/Chart.RadialGauge.umd.js docs/js

for file in `ls -1 docs/samples/*html`; do
  sed -i '' 's/node_modules\/chart\.js\/dist/js/' $file
  sed -i '' 's/build/js/' $file
done
