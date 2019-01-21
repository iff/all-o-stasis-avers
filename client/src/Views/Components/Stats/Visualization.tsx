import * as React from "react";
import Measure, { BoundingRect } from "react-measure";
import { Motion, spring } from "react-motion";
import styled from "styled-components";
import Computation from "computation";

import { scaleTime, scaleLinear, scaleOrdinal, ScaleLinear } from "d3-scale";
import { stack, area, line, curveLinear } from "d3-shape";
import { select } from "d3-selection";
import { axisBottom } from "d3-axis";

import { BoulderStat, grades } from "../../../storage";

import { yellow100, green100, orange100, blue100, red100 } from "../../../Materials/Colors";
import { useTypeface, copy14, copy14Bold } from "../../../Materials/Typefaces";

const curve = curveLinear;

const matchSector = (sectors: string[]) =>
  sectors.length === 0 ? () => true : (bs: BoulderStat) => sectors.indexOf(bs.sector) !== -1;

const matchSetter = (selectedSetters: string[]) =>
  selectedSetters.length === 0
    ? () => true
    : (bs: BoulderStat) => bs.setters.some(setterId => selectedSetters.indexOf(setterId) !== -1);

export interface VisualizationProps {
  events: any[];
  sectors: string[];
  selectedSetters: string[];
}

export const Visualization = ({ events, sectors, selectedSetters }: VisualizationProps) => (
  <Measure bounds>
    {({ measureRef, contentRect }) => (
      <div ref={measureRef} style={{ position: "relative", flex: 1 }}>
        {contentRect.bounds && (
          <div style={{ position: "absolute" }}>
            <VisualizationRenderer
              events={events}
              bounds={contentRect.bounds}
              sectors={sectors}
              selectedSetters={selectedSetters}
            />
          </div>
        )}
      </div>
    )}
  </Measure>
);

interface VisualizationRendererProps {
  events: any[];
  sectors: string[];
  selectedSetters: string[];
  bounds: BoundingRect;
}

const VisualizationRenderer = ({ events, sectors, selectedSetters, bounds }: VisualizationRendererProps) => {
  if (!bounds.height) {
    return <div />;
  }

  const padding = {
    top: 24,
    left: 24,
    right: 24,
    bottom: 48
  };

  const values = (() => {
    const res = events.reduce(
      (acc, ev) => {
        if (matchSector(sectors)(ev.bs) && matchSetter(selectedSetters)(ev.bs)) {
          if (ev.grade in acc.acc) {
            acc.acc[ev.grade] += (ev.type === "set" ? 1 : -1);
          } else if (ev.type === "set") {
            acc.acc[ev.grade] = 1;
          }
        }

        if (+acc.date === +ev.date) {
          return acc;
        } else {
          return {
            values: acc.values.concat([
              {
                date: acc.date,
                ...Object.keys(acc.acc).reduce((o, k) => ({ ...o, [k]: Math.max(0, acc.acc[k]) }), {})
              }
            ]),
            date: ev.date,
            acc: acc.acc
          };
        }
      },
      {
        values: [] as any,
        date: undefined as any,
        acc: grades.reduce((o, grade) => ({ ...o, [grade]: 0 }), {})
      }
    );

    return res.values
      .concat([
        {
          date: res.date,
          ...Object.keys(res.acc).reduce((o, k) => ({ ...o, [k]: res.acc[k] }), {})
        }
      ])
      .filter(x => x.date !== undefined);
  })();

  const xScale = scaleTime().range([0, bounds.width - padding.left - padding.right]);
  const yScale = scaleLinear().range([bounds.height - padding.top - padding.bottom, 0]);
  const colorScale = scaleOrdinal([yellow100, green100, orange100, blue100, red100, "#FFFFFF", '#000000']);

  const skeys = grades;
  const s = stack()
    .keys(skeys)
    .value((d, key) => d[key] || 0);

  colorScale.domain(skeys);

  const areaGenerator = area<any>()
    .curve(curve)
    .x(d => xScale(d.data.date))
    .y0(d => yScale(d[0]))
    .y1(d => yScale(d[1]));

  const lineGenerator = line<any>()
    .curve(curve)
    .x(d => xScale(d.data.date))
    .y(d => yScale(d[1]));

  const data = s(values);

  const last = (xs: any[]) => xs[xs.length - 1];

  xScale.domain([new Date(Date.now() - 4 * 30 * 24 * 60 * 60 * 1000), new Date(Date.now())]);
  yScale.domain([0, Math.ceil(Math.max(...last(data).map(series => series[1])) * 1.2)]);

  data.forEach(d => {
    const l = last(d);
    if (l && l.data) {
      l.data.date = new Date(Date.now());
    }
  });

  return (
    <svg width={bounds.width} height={bounds.height} style={{ display: "block" }}>
      <g transform={`translate(${padding.left},${padding.top})`}>
        {data.map((d, i) => (
          <Area key={i} index={i} colorScale={colorScale} data={d} a={areaGenerator} />
        ))}
        {data.map((d, i) => (
          <path key={i} fill="none" stroke={colorScale(d as any)} strokeWidth={2} d={lineGenerator(d) || undefined} />
        ))}

        <TotalLine xScale={xScale} yScale={yScale} data={data} />

        {false && data.map((d, i) => (
          <g key={i}>
            {d.map((v, j) => (
              <circle
                key={j}
                r={2.5}
                cx={xScale(v.data.date)}
                cy={yScale(v[1])}
                strokeWidth={2}
                stroke={i === data.length - 1 ? "#222222" : colorScale(d as any)}
                fill={"#F6F6F6"}
              />
            ))}
          </g>
        ))}

        <GridLines width={bounds.width - padding.left - padding.right} yScale={yScale} />
        <GridLabels width={bounds.width - padding.left - padding.right} yScale={yScale} />

        <g
          transform={`translate(0,${bounds.height - padding.bottom - padding.top + 12})`}
          ref={el => {
            if (el) {
              select(el).call(axisBottom(xScale));
            }
          }}
        />
      </g>
    </svg>
  );
};

const Area = ({ index, colorScale, data, a }) => {
  if (data.length === 0) {
    return <g />;
  }

  const defaultStyle = {};
  data.forEach((d, i) => {
    defaultStyle[`v0_${i}`] = d[0];
    defaultStyle[`v1_${i}`] = d[1];
  });

  const style = {};
  data.forEach((d, i) => {
    style[`v0_${i}`] = spring(d[0]);
    style[`v1_${i}`] = spring(d[1]);
  });

  return (
    <Motion defaultStyle={defaultStyle} style={style}>
      {() => {
        const dt = data.map((d, i) => {
          const x: any = [defaultStyle[`v0_${i}`], defaultStyle[`v1_${i}`]];
          x.data = d.data;
          return x;
        });

        return <path fill={colorScale(grades[index])} fillOpacity={0.15} d={a(dt)} />;
      }}
    </Motion>
  );
};

const TotalLine = ({ xScale, yScale, data }) => {
  const lineGenerator = line()
    .curve(curve)
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]));

  const total = data[data.length - 1];
  if (total.length === 0) {
    return <g />;
  }

  const defaultStyle = {};
  total.forEach((d, i) => {
    defaultStyle[`v${i}`] = d[1];
  });

  const style = {};
  total.forEach((d, i) => {
    style[`v${i}`] = spring(d[1]);
  });

  return (
    <Motion defaultStyle={defaultStyle} style={style}>
      {() => {
        const dt = total.map((d, i) => [d.data.date, defaultStyle[`v${i}`]]);

        return <path fill="none" stroke="#222222" strokeWidth={2} d={lineGenerator(dt) || undefined} />;
      }}
    </Motion>
  );
};

interface GridProps {
  width: number;
  yScale: ScaleLinear<number, number>;
}

export class GridLines extends React.PureComponent<GridProps> {
  render() {
    const { width, yScale } = this.props;
    const ticks = yScale.ticks(5);

    return (
      <g data-n="grid-lines">
        {ticks.map(
          (tick, i) =>
            Math.round(tick) === tick && (
              <g data-n="grid-line" transform={`translate(0, ${yScale(tick)})`} key={i}>
                <line
                  x1={0}
                  x2={width}
                  strokeWidth={tick === 0 ? 2 : 1}
                  stroke={tick === 0 ? "#666" : "#666"}
                  strokeOpacity={tick === 0 ? 1 : 0.2}
                />
              </g>
            )
        )}
      </g>
    );
  }
}

export class GridLabels extends React.PureComponent<GridProps> {
  render() {
    const { width, yScale } = this.props;
    const ticks = yScale.ticks(5);

    return (
      <g data-n="grid-labels">
        {ticks.map((tick, i) => {
          if (Math.round(tick) !== tick) {
            return null;
          }

          const text = "" + tick;

          return (
            <g data-n="grid-label" transform={`translate(${width}, ${yScale(tick)})`} key={i}>
              {React.createElement(
                tick === 0 ? ZeroGridLabel : GridLabel,
                {
                  dy: -4,
                  dx: -5,
                  textAnchor: "end",
                  fill: "none",
                  stroke: "#F6F6F6",
                  strokeWidth: 3
                },
                text
              )}
              {React.createElement(
                tick === 0 ? ZeroGridLabel : GridLabel,
                {
                  dy: -4,
                  dx: -5,
                  textAnchor: "end"
                },
                text
              )}
            </g>
          );
        })}
      </g>
    );
  }
}

const GridLabel = styled.text`
  ${useTypeface(copy14)};
  fill: #666;
`;

const ZeroGridLabel = styled.text`
  ${useTypeface(copy14Bold)};
  fill: #666;
`;
