// bad.js: hw3 bad vis
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

// v.v.v.v.v.v.v.v.v.v.v.v.v.v.v  begin student code (bad-specific helpers)
// ^'^'^'^'^'^'^'^'^'^'^'^'^'^'^  end student code

export function draw(svg, data, _width, _height) {
  // v.v.v.v.v.v.v.v.v.v.v.v.v.v.v  begin student code (bad draw)

  // basic setup
  svg.attr('width', _width).attr('height', _height);
  let badBlack = '#000';
  let badRed = '#ff0000';
  let badGrey = '#bbb';

  // browser detection to make less accessible
  const browser = navigator.userAgent;
  const isChrome = browser.indexOf('Chrome') !== -1;
  const browserMatch = browser.match(/(Chrome|Firefox|Safari|Opera|Edge|MSIE)\/?\s*(\d+(\.\d+)*)/);

  if (!isChrome) {
    badBlack = '#f9f9f9';
    badGrey = '#f9f9f9';
    badRed = '#f9f9f9';
    svg
      .append('text')
      .attr('x', _width / 2)
      .attr('y', _height / 2)
      .attr('text-anchor', 'middle')
      .text(`This visualization does not support ${browserMatch[1]}. Download Chrome.`)
      .style('font-size', 25)
      .style('fill', '#000');
  }

  // data setup
  const margin = 200;
  const procData = util.dataProc(data);
  const maxTime = d3.max(procData, (d) => d.time);
  const minTime = d3.min(procData, (d) => d.time);

  const maxPct = d3.max(procData, (d) => d.percentage);
  const minPct = d3.min(procData, (d) => d.percentage);

  // spread out text
  const xScale = d3
    .scaleLinear()
    .domain([0, procData.length])
    .range([0, _width - 2 * margin]);
  const yScale = d3
    .scaleLinear()
    .domain([0, procData.length])
    .range([0, _height - 2 * margin]);

  //scales to encode the data with text rotation, text size, and letter spacing
  const rotScale = d3.scaleLinear().domain([minPct, maxPct]).range([0, 270]);
  const szScale = d3.scaleLinear().domain([minTime, maxTime]).range([75, 10]);
  const spScale = d3.scaleLinear().domain([minTime, maxTime]).range([0, 60]);
  const radScale = d3.scaleLinear().domain([minPct, maxPct]).range([0, 300]);

  // make group for bad vis
  const content = svg.append('g');

  // drawing circles where radius shows injury % of body part to its right
  content
    .selectAll('circle')
    .data(procData)
    .enter()
    .append('circle')
    .attr('cx', (_, i) => xScale(i))
    .attr('cy', (_, i) => yScale(i))
    .attr('r', function (d, i, nodes) {
      const nextIndex = i + 1;
      if (nextIndex < nodes.length) {
        return radScale(nodes[nextIndex].__data__.percentage);
      } else {
        return radScale(nodes[0].__data__.percentage);
      }
    })
    .style('fill', 'none')
    .style('stroke', badRed)
    .style('stroke-width', 1);

  // drawing a random angle from center to edge of circles at angle of next body part

  const rng = new glkrng(37); // seed random number

  content
    .selectAll('line')
    .data(procData)
    .enter()
    .append('line')
    // start at center of circle
    .attr('x1', (_, i) => xScale(i))
    .attr('y1', (_, i) => yScale(i))
    // end at perimeter with a random angle
    .each(function (d, i, nodes) {
      const nextIndex = i + 1 < nodes.length ? i + 1 : 0;
      const cx = xScale(i);
      const cy = yScale(i);
      const r = radScale(nodes[nextIndex].__data__.percentage);
      // get random angle. DESIGN VARIATION > DATA VARIATION!
      const randAng = rng.float() * 360;
      const x2 = cx + r * Math.cos((randAng * Math.PI) / 180);
      const y2 = cy + r * Math.sin((randAng * Math.PI) / 180);
      d3.select(this).attr('x2', x2).attr('y2', y2);
    })
    .style('stroke', badRed)
    .style('stroke-width', 1);

  // draw text labels in that group
  content
    .selectAll('text')
    .data(procData)
    .enter()
    .append('text')
    .attr('x', (_, i) => xScale(i))
    .attr('y', (_, i) => yScale(i))
    .attr('transform', (d, i) => `rotate(${rotScale(d.percentage)}, ${xScale(i)}, ${yScale(i)})`)
    .text((d) => d.part)
    .style('font-size', (d) => szScale(d.time))
    .style('letter-spacing', (d) => spScale(d.time))
    .style('stroke', '#fff')
    .style('stroke-width', (d) => 0.01 * szScale(d.time))
    .style('fill', badBlack);

  // recenter g element
  const bb = content.node().getBBox();
  const dx = _width / 2 - (bb.x + bb.width / 2);
  const dy = _height / 2 - (bb.y + bb.height / 2);
  content.attr('transform', `translate(${dx}, ${dy})`);

  // draw legends
  const legMargin = 80;

  // text rotation legend shows text rotation from 0 to 270 degrees
  const rotLegend = svg.append('g');
  const rotLegendSize = 100;
  const rotLegendArrowhead = 10;
  rotLegend
    .append('path')
    .attr(
      'd',
      `M ${_width - legMargin} ${legMargin + rotLegendSize / 2}
        L ${_width - legMargin - rotLegendSize / 2} ${legMargin + rotLegendSize / 2}
        L ${_width - legMargin - rotLegendSize / 2} ${legMargin}`
    )
    .style('stroke', badGrey)
    .style('stroke-width', 0.5)
    .style('fill', 'none');

  // draw arc for angle
  const arcGenerator = d3
    .arc()
    .innerRadius(rotLegendSize / 2)
    .outerRadius(rotLegendSize / 2)
    .startAngle(Math.PI * 0.5)
    .endAngle(Math.PI * 1.99999999);

  rotLegend
    .append('path')
    .attr('d', arcGenerator)
    .attr(
      'transform',
      `translate(${_width - legMargin - rotLegendSize / 2}, ${legMargin + rotLegendSize / 2})`
    )
    .style('stroke', badGrey)
    .style('stroke-width', 2)
    .style('fill', 'none');

  rotLegend
    .append('path')
    .attr(
      'd',
      `M ${_width - legMargin - rotLegendSize / 2 - rotLegendArrowhead} ${
        legMargin + rotLegendArrowhead
      }
      L ${_width - legMargin - rotLegendSize / 2} ${legMargin}
      L ${_width - legMargin - rotLegendSize / 2 - rotLegendArrowhead} ${
        legMargin - rotLegendArrowhead
      }`
    )
    .style('stroke', badGrey)
    .style('stroke-width', 2)
    .style('fill', 'none');

  // labeling the text rotation legend

  // title
  rotLegend
    .append('text')
    .attr('x', _width - legMargin - rotLegendSize / 2)
    .attr('y', legMargin + rotLegendSize)
    .attr('dy', 25)
    .attr('text-anchor', 'middle')
    .text('Customers Reporting Injury')
    .style('fill', badGrey)
    .style('font-size', 16);

  // max label
  rotLegend
    .append('text')
    .attr('x', _width - legMargin - rotLegendSize / 2)
    .attr('y', legMargin - rotLegendArrowhead)
    .attr('dy', -7)
    .attr('text-anchor', 'middle')
    .text(`${maxPct} %`)
    .style('fill', badGrey)
    .style('font-size', 12);

  // min label
  rotLegend
    .append('text')
    .attr('x', _width - legMargin)
    .attr('y', rotLegendSize / 2 + legMargin)
    .attr('dy', 5)
    .attr('dx', 22)
    .attr('text-anchor', 'middle')
    .text(`${minPct} %`)
    .style('fill', badGrey)
    .style('font-size', 12);

  // drawing the text size and spacing legend
  const ssLegend = svg.append('g');

  ssLegend.attr('transform', `translate(${_width - 675}, ${legMargin - 35})`);

  const sizeAndSpacingLegendData = [6, 8, 10];

  ssLegend
    .selectAll('text')
    .data(sizeAndSpacingLegendData)
    .enter()
    .append('text')
    .text((d) => `${d} days`)
    .attr('y', (_, i) => i * 30 + legMargin)
    .attr('x', (_, i) => i * 5)
    .style('font-size', (d) => szScale(d))
    .style('letter-spacing', (d) => spScale(d))
    .style('fill', badGrey);
  ssLegend
    .append('text')
    .attr('x', 120)
    .attr('y', 160)
    .attr('dy', 0)
    .attr('text-anchor', 'middle')
    .text('Injury Recovery Time')
    .style('fill', badGrey)
    .style('font-size', 16);

  // drawing the circle size legend
  const circleLegend = svg.append('g');

  circleLegend.attr('transform', `translate(${_width - 2 * legMargin}, ${legMargin + 200})`);

  // Define the data for the legend (circle radii)
  const circleLegendData = [25, 5, 3];

  // Append circles for each radius value
  circleLegend
    .selectAll('circle')
    .data(circleLegendData)
    .enter()
    .append('circle')
    .attr('cx', 50)
    .attr('cy', (d) => 100-radScale(d))
    .attr('r', (d) => radScale(d))
    .style('fill', 'none')
    .style('stroke', badGrey)
    .style('stroke-width', 1);

  // Append text labels for each radius value
  circleLegend
    .selectAll('text')
    .data(circleLegendData)
    .enter()
    .append('text')
    .attr('x', 40)
    .attr('y', (_, i) => i * 40)
    .text((d) => `${d} %`)
    .style('fill', badGrey)
    .style('font-size', 12);

  // Title for the legend
  circleLegend
    .append('text')
    .attr('x', 40)
    .attr('y', 120)
    .attr('text-anchor', 'middle')
    .text('the radius illustrates')
    .style('fill', badGrey)
    .style('font-size', 14);
  circleLegend
    .append('text')
    .attr('x', 40)
    .attr('y', 135)
    .attr('text-anchor', 'middle')
    .text('the customer injury rate')
    .style('fill', badGrey)
    .style('font-size', 14);
  circleLegend
    .append('text')
    .attr('x', 40)
    .attr('y', 150)
    .attr('text-anchor', 'middle')
    .text('of the body part to its right')
    .style('fill', badGrey)
    .style('font-size', 14);
  // ^'^'^'^'^'^'^'^'^'^'^'^'^'^'^  end student code
}
