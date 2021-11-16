import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import Cookies from "js-cookie";
import { CornerPlot } from "./CornerPlot";
import { HistogramPlot } from "./Histogram";
import { useResponsiveSize } from "./responsiveDiv";

var json_test = JSON.parse(document.getElementById("test_json").textContent);

export const DataManage = () => {
  // An N parameter cornerplot contains N diagonal tiles (histograms) and (N^2 - N / 2) corner tiles (contours).
  // We will fetch the appropriate outputs from Bilby, which needs to be organised in this format:
  // Histogram arrays of (len(N)) containing the vertices of the histogram plot. e.g. [[A],[B],[C],...]
  // Contour arrays of (len(N^2 - N / 2)) containing contour points. [[A],[B],[C],...]
  //  Inside [A] is [[A1],[A2],[A3]] corresponding to the default Bilby 3 layers of contours.
  // The layout for the corner will will be arranged like this: (for N = 4), H = Histogram, C = Corner
  // [H1]
  // [C1] [H2]
  // [C2] [C3] [H3]
  // [C4] [C5] [C6] [H4]

  const divRef = useRef(null);
  const dim = Math.ceil(0.99 * useResponsiveSize(divRef));
  // Math.ceil(0.99 * dim) is due to a quirk with recharts ResponsiveContainer which needs a 99% width to handle responsive window resizing!

  // const PARAM_NUMBER = histogram_arr.length;
  const PARAM_NUMBER = json_test["hist_maxmin"].length;

  const cont_test = json_test["contour_data"];
  const hist_test = json_test["hist_data"];
  const mm_test = json_test["hist_maxmin"];
  const param_test = json_test["param_error"];

  const divLayout = (rowIndex, PARAM_NUMBER) => {
    let divStr = [];
    for (let i = 0; i < PARAM_NUMBER; i++) {
      if (i < rowIndex) {
        rowIndex > 0 &&
          divStr.push(
            <CornerPlot
              key={`cor${rowIndex}_${i}`}
              inpdata={cont_test[(rowIndex * (rowIndex - 1)) / 2 + i]}
              x_maxmin={mm_test[i]}
              y_maxmin={mm_test[rowIndex]}
              size={dim}
              x_show={rowIndex == PARAM_NUMBER - 1 ? true : false}
              y_show={i == 0 ? true : false}
              levels={3 - 1}
              param_stat_x={param_test[i]}
              param_stat_y={param_test[rowIndex]}
            />
          );
      } else if (i == rowIndex) {
        divStr.push(
          <HistogramPlot
            key={`his${rowIndex}_${i}`}
            inpdata={hist_test[i]}
            maxmin={mm_test[i]}
            size={dim}
            x_show={rowIndex == PARAM_NUMBER - 1 ? true : false}
            param_stat={param_test[i]}
          />
        );
      } else {
        rowIndex == 0 && i == 1
          ? divStr.push(
              <div key={`div${rowIndex}_${i}`} ref={divRef}>
                {dim}
              </div>
            )
          : divStr.push(<div key={`div${rowIndex}_${i}`}></div>);
      }
    }
    return divStr;
  };

  useEffect(() => {
    // console.log('parame', param_test)
  }, []);

  const gridStyle = {
    gridTemplateColumns: `repeat(${PARAM_NUMBER}, 1fr)`,
  };

  return (
    <>
      <div className="height-buffer">&nbsp;</div>
      <div className="plot-container" style={gridStyle}>
        {[...Array(PARAM_NUMBER)].map((_, idx) => {
          return divLayout(idx, PARAM_NUMBER);
        })}
      </div>
      <div className="height-buffer">&nbsp;</div>
      <div className="height-buffer">&nbsp;</div>
    </>
  );
};
