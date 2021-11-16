import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { scaleLinear } from "d3-scale";
import { format } from "d3-format";
import { range } from "d3-array";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

export const CornerPlot = ({
  inpdata,
  x_maxmin,
  y_maxmin,
  size,
  x_show,
  y_show,
  levels,
  param_stat_x,
  param_stat_y,
}) => {
  // For this we're going to take advantage of the fill function in <polygon> to define a custom shape in ReferenceArea to fill in our contours.
  // The standard Line function does not create filled closed shapes and neither does the Area function. You can probably hack the Area function
  // by decomposing any arbitary contours into convex polygons, but that is too hacky.

  // As a result, we're going to input empty dummy data into a LineChart Box and draw our referenceAreas over it.
  // May switch to a Scatterchart later to include sync with Histograms.

  // Extra inputs would be RowIndex, ColumnIndex. If RowIndex = 0, then display x-axis. If ColIndex = 0, then display y-axis. (Unless it's a Hisotogram)
  // Extra inputs would be MaxMin. This would be computed in the backend, or in the component directly above. We would feed Maxmin into both the corner
  // and histogram components to ensure that axes are flush.

  const margin = 5;
  const axis_margin = 1;

  const plot_min_x = x_maxmin[0];
  const plot_max_x = x_maxmin[1];
  const plot_min_y = y_maxmin[0];
  const plot_max_y = y_maxmin[1];

  const NUM_TICKS = 3;

  const plotCoordsConvert_x = scaleLinear(
    [plot_min_x, plot_max_x],
    [margin + axis_margin, size - margin - axis_margin]
  );
  const plotCoordsConvert_y = scaleLinear(
    [plot_max_y, plot_min_y],
    [margin + axis_margin, size - margin - axis_margin]
  );

  const col = scaleLinear([0, levels], ["#aabbdd", "#115588"]);

  const formatAxis = (value) => {
    return format(".2f")(value);
  };

  const createTicks = (min, max, num_ticks) => {
    const diffRange = Math.abs(max - min);
    return range(num_ticks).map(
      (d) => min + diffRange * 0.16 + (d * diffRange) / num_ticks
    );
  };

  const ticks_x = createTicks(plot_min_x, plot_max_x, NUM_TICKS);
  const ticks_y = createTicks(plot_min_y, plot_max_y, NUM_TICKS);

  const CustomReferenceArea = (props) => {
    let pointsString = "";

    props.data1.forEach((points) => {
      pointsString += `${plotCoordsConvert_x(points[0])},${plotCoordsConvert_y(
        points[1]
      )} `;
    });

    return (
      <polygon
        points={pointsString}
        fill={col(props.color)}
        fillOpacity={0.8}
        stroke={"#115588"}
        strokeWidth={1.5}
      />
    );
  };

  useEffect(() => {
    // console.log(inpdata);
    // console.log(ticks_x);
  }, []);

  return (
    <div>
      <ResponsiveContainer width="99%" aspect={1}>
        <ScatterChart
          width={500}
          height={300}
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
            allowDataOverflow="true"
            tick={x_show && { opacity: 0.9, dy: 10, fontSize: 13 }}
            angle={-45}
            ticks={ticks_x}
            tickFormatter={formatAxis}
            interval={0}
            domain={[plot_min_x, plot_max_x]}
            label={
              x_show && {
                value: param_stat_x[0],
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
            dataKey="y"
            type="number"
            width={axis_margin}
            allowDataOverflow="true"
            tick={y_show && { opacity: 0.9, dy: -8, dx: -5, fontSize: 13 }}
            angle={-45}
            ticks={ticks_y}
            tickFormatter={formatAxis}
            interval={0}
            domain={[plot_min_y, plot_max_y]}
            label={
              y_show && {
                value: param_stat_y[0],
                position: "left",
                stroke: "#606E78",
                dx: -55,
                dy: 0,
                opacity: 0.8,
                fontSize: 14,
                angle: -90,
                style: { textAnchor: "middle" },
              }
            }
          />
          <XAxis
            xAxisId="topborder"
            orientation="top"
            height={axis_margin}
            tick={false}
          />
          <YAxis
            yAxisId="rightborder"
            orientation="right"
            width={axis_margin}
            tick={false}
          />

          {inpdata.map((contourSet, baseindex) => {
            return contourSet.map((contour, index) => {
              return (
                <ReferenceArea
                  key={`hist${baseindex}_${index}`}
                  x1={plot_min_x}
                  x2={plot_max_x}
                  y1={plot_min_y}
                  y2={plot_max_y}
                  fillOpacity={0.5}
                  stroke="#dadada"
                  strokeOpacity={0.3}
                  ifOverflow="visible"
                  shape={
                    <CustomReferenceArea data1={contour} color={baseindex} />
                  }
                />
              );
            });
          })}
          <Scatter
            data={[{ x: param_stat_x[1], y: param_stat_y[1] }]}
            fill="#ffcc5c"
            opacity={0.9}
          />
          <ReferenceLine
            x={param_stat_x[1]}
            stroke="#ffcc5c"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
          <ReferenceLine
            y={param_stat_y[1]}
            stroke="#ffcc5c"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
