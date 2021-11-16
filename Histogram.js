import React, { useEffect } from "react";
import { format } from "d3-format";
import { range } from "d3-array";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const dataMap = (arr) =>
  arr.map((d) => {
    return {
      x: d[0],
      y: d[1],
    };
  });

export const HistogramPlot = ({
  inpdata,
  maxmin,
  size,
  x_show,
  param_stat,
}) => {
  const margin = 5;
  const axis_margin = 1;

  const plot_min_x = maxmin[0];
  const plot_max_x = maxmin[1];

  const data = dataMap(inpdata);

  const NUM_TICKS = 3;

  const createTicks = (min, max, num_ticks) => {
    const diffRange = Math.abs(max - min);
    return range(num_ticks).map(
      (d) => min + diffRange * 0.16 + (d * diffRange) / num_ticks
    );
  };

  const ticks_x = createTicks(plot_min_x, plot_max_x, NUM_TICKS);

  const formatAxis = (value) => {
    return format(".2f")(value);
  };

  const formatTitle = (value) => {
    return format(".3f")(value);
  };

  useEffect(() => {
    // console.log(maxmin);
  }, []);

  const CustomLabel = ({ median, minus, plus }) => {
    return (
      <>
        <text
          stroke={"#606E78"}
          textAnchor={"middle"}
          x={size / 2}
          y={-8}
          opacity={0.8}
          fontSize={16}
        >
          {median}
          <tspan fontSize={10} dy={2}>
            {" "}
            -{minus}
          </tspan>
        </text>
        <text
          stroke={"#606E78"}
          textAnchor={"middle"}
          x={size / 2}
          y={-8}
          visibility={"hidden"}
          opacity={0.8}
          fontSize={16}
        >
          {median}
          <tspan fontSize={10} visibility={"visible"} dy={-8}>
            {" "}
            +{plus}
          </tspan>
        </text>
      </>
    );
  };

  return (
    <div>
      <ResponsiveContainer width="99%" aspect={1}>
        <LineChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: margin,
            right: margin,
            left: margin,
            bottom: margin,
          }}
        >
          <XAxis
            dataKey="x"
            type="number"
            height={axis_margin}
            angle={-45}
            tick={x_show && { opacity: 0.9, dy: 10, fontSize: 13 }}
            ticks={ticks_x}
            interval={0}
            allowDataOverflow="true"
            tickFormatter={formatAxis}
            domain={[plot_min_x, plot_max_x]}
            label={
              x_show && {
                value: param_stat[0],
                position: "bottom",
                stroke: "#606E78",
                dx: 0,
                dy: 45,
                opacity: 0.8,
                fontSize: 14,
              }
            }
          />
          <YAxis
            type="number"
            tick={false}
            width={axis_margin}
            allowDataOverflow="true"
          />
          <XAxis
            xAxisId="topborder"
            orientation="top"
            height={axis_margin}
            tick={false}
            label={
              <CustomLabel
                median={formatTitle(param_stat[1])}
                minus={formatTitle(param_stat[2])}
                plus={formatTitle(param_stat[3])}
              />
            }
          />
          <YAxis
            yAxisId="rightborder"
            orientation="right"
            width={axis_margin}
            tick={false}
          />
          <Line
            dataKey="y"
            type="linear"
            stroke="#115588"
            strokeWidth={1.5}
            animationDuration={500}
            dot={false}
          />

          <ReferenceLine x={param_stat[1]} stroke="#ffcc5c" strokeWidth={2} />

          <ReferenceLine
            x={param_stat[1] - param_stat[2]}
            stroke="#606E78"
            strokeWidth={2}
            strokeDasharray="5 5"
          />

          <ReferenceLine
            x={param_stat[1] + param_stat[3]}
            stroke="#606E78"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
