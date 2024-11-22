// good.js: hw3 good vis
// Copyright (C)  2024 University of Chicago. All rights reserved.
/*
This is only for students and instructors in the 2024 CMSC 23900 ("DataVis") class, for use in
that class. It is not licensed for open-source or any other kind of re-distribution. Do not
allow this file to be copied or downloaded by anyone outside the 2024 DataVis class.
*/

/* eslint-disable no-unused-vars */
import * as d3 from './d3.js';
import { glkrng } from './glkrng.js';
import * as util from './util.js';
/* eslint-enable no-unused-vars */
/* now, with "export function foo" in util.js, you can use it below as util.foo()
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export */

// v.v.v.v.v.v.v.v.v.v.v.v.v.v.v  begin student code (good-specific helpers)

function getRange(procdata, field) {
  const vals = procdata.map((d) => d[field]);
  return [d3.min(vals), d3.max(vals)];
}

// setting up colormap for intensity of injuries in each zone

const cmapColors = [
  '#000080',
  '#4444aa',
  '#8888ff',
  '#ccccff', // ^ blues
  '#193317',
  '#569436',
  '#7bd44d',
  '#94ff5d', // ^ greens
  '#666200',
  '#999200',
  '#ccc300',
  '#fff400', // ^ yellows
  '#66360d',
  '#995213',
  '#cc6e1a',
  '#ff8920', // ^ oranges
  '#660c10',
  '#991217',
  '#cc181f',
  '#ff1e27', // ^ reds
  '#662a29',
  '#993f3e',
  '#cc5553',
  '#ff6a68', // ^ pinks
  '#ffc8c2',
  '#ff18e2',
];

function color(x) {
  const cmap = d3
    .scaleLinear()
    .domain([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
    ])
    .range(cmapColors);
  return d3.color(cmap(x));
}

// scale the length of each zone's bar
function getBarLength(x, maxVal, maxLength) {
  return d3.scaleLinear().domain([0, maxVal]).range([0, maxLength])(x);
}

// get the center of each SVG element to position bars
function getCenterCoords(zone) {
  const bb = zone.getBBox();
  return {
    x: bb.x + bb.width / 2,
    y: bb.y + bb.height / 2,
  };
}

// ^'^'^'^'^'^'^'^'^'^'^'^'^'^'^  end student code

export function draw(svg, data, _width, _height) {
  // v.v.v.v.v.v.v.v.v.v.v.v.v.v.v  begin student code (good draw)

  // getting initial values for proper display
  svg.attr('width', _width).attr('height', _height);
  const heightScaleFactor = _height / 582.7; // using raw size of body map

  // make data numeric
  const procData = util.dataProc(data);

  // get range for colormapping
  const pctRange = getRange(procData, 'percentage');
  const timeRange = getRange(procData, 'time');

  // begin async promise chaining to reference elements of body map SVG
  function loadMySVG() {
    return d3.xml('./body.svg').then((xml) => xml.documentElement);
  }

  // color each zone according to the Asics data (injury %)
  // eslint-disable-next-line no-restricted-syntax
  function colorZones(zones, dataPass) {
    for (let i = 0; i < zones.length; i++) {
      const currZone = zones[i];
      const currDatum = dataPass[i];
      const zoneColor = color(currDatum.percentage);

      // color each zone
      d3.select(currZone).style('fill', zoneColor);

      if (currDatum.percentage === pctRange[1]) {
        // outline max value
        d3.select(currZone).style('stroke-width', 3).style('stroke', '#000');
      }
      if (currDatum.percentage === pctRange[0]) {
        // dashed line around min value
        d3.select(currZone)
          .style('stroke-width', 1.5)
          .style('stroke', '#000')
          .style('stroke-dasharray', '3 3');
      }
    }
  }

  // draw bars to visualize recovery time
  function barZones(svgPass, zones, dataPass) {
    for (let i = 0; i < zones.length; i++) {
      const barLength = getBarLength(dataPass[i].time, timeRange[1], _height * 0.45);
      const zoneCtr = getCenterCoords(zones[i]);
      // scaling rectangle coordinates to match scaled external SVG
      const x = (_width - barLength) / 2;
      const y = zoneCtr.y * heightScaleFactor;
      const zid = zones[i].id;
      svg
        .append('rect')
        .attr('id', zid)
        .attr('x', x)
        .attr('y', y)
        .attr('width', barLength)
        .attr('height', 4)
        .style('fill', color(dataPass[i].percentage));

      // left line
      svg
        .append('line')
        .attr('x1', x)
        .attr('y1', y - 6)
        .attr('x2', x)
        .attr('y2', y + 10)
        .style('stroke', 'black')
        .style('stroke-width', 2);

      // right line
      svg
        .append('line')
        .attr('x1', x + barLength)
        .attr('y1', y - 6)
        .attr('x2', x + barLength)
        .attr('y2', y + 10)
        .style('stroke', 'black')
        .style('stroke-width', 2);

      // label recovery time
      svg
        .append('text')
        .attr('text-anchor', 'end')
        .attr('x', _width / 2 - 250)
        .attr('y', y + 6)
        .text(`${zones[i].id}  —  ${dataPass[i].time}`);
    }
  }

  // create a legend

  const legendTopOffset = 75;
  const colorItemSize = (_height - legendTopOffset - 30) / cmapColors.length;

  const legendGroup = svg
    .append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${_width / 2 + 250}, ${legendTopOffset})`);

  // Add color legend
  const colorLegend = legendGroup.append('g').attr('class', 'color-legend');

  // title the color legend
  colorLegend
    .append('text')
    .attr('x', 0)
    .attr('y', 0)
    .style('font-size', 20)
    .style('font-weight', 800)
    .text('Customers Reporting Injury');

  // draw colored marks
  const colorItems = colorLegend
    .selectAll('.color-item')
    .data(cmapColors)
    .enter()
    .append('g')
    .attr('class', 'color-item')
    .attr('transform', (d, i) => `translate(0, ${15 + i * colorItemSize})`);

  colorItems
    .append('rect')
    .attr('width', colorItemSize / 2)
    .attr('height', colorItemSize)
    .attr('fill', (d) => d);

  // set specific numbers for the legend
  const legendNums = [0, 4, 8, 12, 16, 20, 24, 25];

  colorItems
    .append('text')
    .attr('x', 25)
    .attr('y', 5)
    .text((d, i) => {
      if (legendNums.includes(i)) {
        return `${i}%`;
      } else {
        return null;
      }
    });

  // function to draw indicators along legend for each body part
  function markLegend(svgPass, zones, dataPass) {
    // initialize resource to stop labels from overlapping
    const dupAcc = [];
    const dupOffset = 16;
    const labelOffset = 5;
    for (let i = 0; i < zones.length; i++) {
      const pct = dataPass[i].percentage;

      // set flag if value is a duplicate
      let dupFlag = 0;
      dupAcc.includes(pct) ? (dupFlag = 1) : dupAcc.push(pct);

      // set flag if value is min or max
      let minFlag = 0;
      let maxFlag = 0;
      (pct === pctRange[0]) ? minFlag = 1 : minFlag = 0;
      (pct === pctRange[1]) ? maxFlag = 1 : maxFlag = 0;

      const rawY = d3
        .scaleLinear()
        .domain([0, 25])
        .range([0, 25 * colorItemSize])(pct);
      const legendX = _width / 2 + 265;
      const legendY = rawY + 90;
      const labelX = legendX + 150;
      const labelY = legendY + (dupFlag ? dupOffset + labelOffset : labelOffset);
      const lineOffset = 5;
      const lineLength = 60;
      svgPass.append('text').attr('x', labelX).attr('y', labelY).text(`${zones[i].id}`);
      // connecting labels to legend with line
      svgPass
        .append('line')
        .attr('x1', labelX - lineOffset)
        .attr('y1', labelY - 5)
        .attr('x2', labelX - lineOffset - lineLength)
        .attr('y2', labelY - 5)
        .style('stroke', 'black')
        .style('stroke-dasharray', (minFlag ? '3 3' : 'null'))
        .style('stroke-width', ((maxFlag || minFlag)? 3 : 1));
      svgPass
        .append('line')
        .attr('x1', labelX - lineOffset - lineLength)
        .attr('y1', labelY - 5)
        .attr('x2', legendX + lineOffset + lineLength)
        .attr('y2', legendY)
        .style('stroke', 'black')
        .style('stroke-dasharray', (minFlag ? '3 3' : 'null'))
        .style('stroke-width', ((maxFlag || minFlag)? 3 : 1));
      svgPass
        .append('line')
        .attr('x1', legendX + lineOffset)
        .attr('y1', legendY)
        .attr('x2', legendX + lineOffset + lineLength)
        .attr('y2', legendY)
        .style('stroke', 'black')
        .style('stroke-dasharray', (minFlag ? '3 3' : 'null'))
        .style('stroke-width', ((maxFlag || minFlag)? 3 : 1));
    }
  };

  // labeling body front and back
  svg
    .append('text')
    .attr('x', _width / 2 - 130)
    .attr('y', 100)
    .attr('text-anchor', 'middle')
    .style('fill', '#bbb')
    .text('Front');
  svg
    .append('text')
    .attr('x', _width / 2 + 130)
    .attr('y', 100)
    .attr('text-anchor', 'middle')
    .style('fill', '#bbb')
    .text('Back');

  // labeling recovery time bars
  svg
    .append('text')
    .attr('x', _width / 2 - 250)
    .attr('y', legendTopOffset)
    .attr('text-anchor', 'end')
    .style('font-weight', 800)
    .style('font-size', 20)
    .text('Recovery Time (days)');
  svg
    .append('text')
    .attr('x', _width / 2 - 250)
    .attr('y', legendTopOffset + 22)
    .attr('text-anchor', 'end')
    .text('marked from center');

  // titling the visualization
  svg
    .append('text')
    .attr('x', 20)
    .attr('y', _height - 20)
    .style('font-weight', 100)
    .style('font-size', 16)
    .style('font-style', 'italic')
    .text('Re-visualizing "Running & Injuries: My Asics"');

  // *** a 'main' function that uses the external SVG asynchronously

  loadMySVG()
    .then((e) => svg.node().appendChild(e)) // copy body.svg elements to goodSvg
    .then(() => d3.select('#zones').node()) // select the 'zones' group
    .then(() => d3.selectAll('path.cls-1')) // select each individual zones within the 'zone' group
    .then((zs) => {
      colorZones(zs._groups[0], procData); // fill zones with appropriate color
      barZones(svg, zs._groups[0], procData); // draw recovery time bars
      markLegend(svg, zs._groups[0], procData); // indicate zones on the legend
    });

  // ^'^'^'^'^'^'^'^'^'^'^'^'^'^'^  end student code
}
