import React, { useState } from "react";
import { Group } from "@visx/group";
import { AreaClosed } from "@visx/shape";
import { AxisLeft, AxisBottom, AxisScale } from "@visx/axis";
import { LinearGradient } from "@visx/gradient";
import { curveMonotoneX } from "@visx/curve";
import { AppleStock } from "@visx/mock-data/lib/mocks/appleStock";
import Drag, { HandlerArgs as DragArgs } from "@visx/drag/lib/Drag";
import { getDomainFromExtent, getPageCoordinates } from "./utils";
import { Bounds } from "@visx/brush/lib/types";
// Initialize some variables
const axisColor = "#fff";
const axisBottomTickLabelProps = {
  textAnchor: "middle" as const,
  fontFamily: "Arial",
  fontSize: 10,
  fill: axisColor
};
const axisLeftTickLabelProps = {
  dx: "-0.25em",
  dy: "0.25em",
  fontFamily: "Arial",
  fontSize: 10,
  textAnchor: "end" as const,
  fill: axisColor
};

// accessors
const getDate = (d: AppleStock) => new Date(d.date);
const getStockValue = (d: AppleStock) => d.close;

type PointerHandlerEvent = React.PointerEvent<SVGRectElement>;
export default function AreaChart({
  data,
  gradientColor,
  width,
  yMax,
  margin,
  xScale,
  yScale,
  hideBottomAxis = false,
  hideLeftAxis = false,
  top,
  left,
  children,
  height,
  onDragChange,
  allData
}: {
  data: AppleStock[];
  allData?: any;
  gradientColor: string;
  xScale: AxisScale<number>;
  yScale: AxisScale<number>;
  width: number;
  yMax: number;
  margin: { top: number; right: number; bottom: number; left: number };
  hideBottomAxis?: boolean;
  hideLeftAxis?: boolean;
  top?: number;
  left?: number;
  children?: React.ReactNode;
  height?: number;
  onDragChange?: (domain: { newMin: number; newMax: number }) => void;
}) {
  const [dragStart, setDragStart] = useState(null);
  const [extent, setExtent] = useState(null);
  if (width < 10) {
    return null;
  }

  function handleDragStart(drag: DragArgs) {
    const marginLeft = margin?.left ? margin.left : 0;
    const marginTop = margin?.top ? margin.top : 0;
    const start = {
      x: (drag.x || 0) + drag.dx - (left || 0) - marginLeft,
      y: (drag.y || 0) + drag.dy - (top || 0) - marginTop
    };
    const end = { ...start };

    const coord = getPageCoordinates(drag.event);
    setDragStart(start);
    console.log("drag start", { drag, coord, start, end, left, top, margin });
  }
  function getExtent(start, end) {
    const x0 = Math.min(start.x || 0, end.x || 0);
    const x1 = Math.max(start.x || 0, end.x || 0);
    const y0 = 0;
    const y1 = yMax;

    return {
      x0,
      x1,
      y0,
      y1
    };
  }
  function handleDragMove(drag: DragArgs) {
    const x0 = (dragStart.x || 0) - (left || 0) - margin.left;
    // const newStart = {
    //   x: (drag.x || 0) + drag.dx - (left || 0) - margin.left,
    //   y: (drag.y || 0) + drag.dy - (top || 0) - margin.top
    // };
    // setDragStart(newStart);
    const end = {
      x: (drag.x || 0) + drag.dx - (left || 0) - margin.left,
      y: (drag.y || 0) + drag.dy - (top || 0) - margin.top
    };
    const newExtent = getExtent(dragStart, end);
    const domain = getDomainFromExtent(xScale, newExtent.x0, newExtent.x1, 2);
    console.log({ domain, newExtent });
    const x1 = (drag.x || 0) + drag.dx - (left || 0) - margin.left;
    const firstX = new Date(data[0].date).getTime();
    const lastX = new Date(data[data.length - 1].date).getTime();
    const timeRange = lastX - firstX;
    const pixelRange = x1 - x0;
    const scaleModification = (pixelRange / width) * timeRange;
    const newBounds = {
      newMin: firstX + scaleModification,
      newMax: lastX + scaleModification
    };
    const minValueAllData = new Date(allData[0].date).getTime();
    const maxValueAllData = new Date(
      allData[allData.length - 1].date
    ).getTime();
    const avoidDrag =
      newBounds.newMin < minValueAllData || newBounds.newMax > maxValueAllData;
    if (onDragChange && !avoidDrag) {
      onDragChange(newBounds);
    }
    // console.log("drag move", { drag, x0, x1, scaleModification });
  }

  function handleDragEnd(drag) {
    const x0 = (dragStart.x || 0) - (left || 0) - margin.left;
    const x1 = (drag.x || 0) + drag.dx - (left || 0) - margin.left;
    const firstX = new Date(data[0].date).getTime();
    const lastX = new Date(data[data.length - 1].date).getTime();
    const timeRange = lastX - firstX;
    const pixelRange = x1 - x0;
    const scaleModification = (pixelRange / width) * timeRange;
    const newBounds = {
      newMin: firstX + scaleModification,
      newMax: lastX + scaleModification
    };
    const minValueAllData = new Date(allData[0].date).getTime();
    const maxValueAllData = new Date(
      allData[allData.length - 1].date
    ).getTime();
    const avoidDrag =
      newBounds.newMin < minValueAllData || newBounds.newMax > maxValueAllData;
    if (onDragChange && !avoidDrag) {
      onDragChange(newBounds);
    }
    // console.log("drag end", { drag, x0, x1, scaleModification });
  }

  return (
    <Group left={left || margin.left} top={top || margin.top}>
      <LinearGradient
        id="gradient"
        from={gradientColor}
        fromOpacity={1}
        to={gradientColor}
        toOpacity={0.2}
      />
      <Drag
        width={width}
        height={height}
        resetOnStart
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        {({ dragStart, isDragging, dragMove, dragEnd }) => (
          <AreaClosed<AppleStock>
            data={data}
            x={(d) => xScale(getDate(d)) || 0}
            y={(d) => yScale(getStockValue(d)) || 0}
            yScale={yScale}
            strokeWidth={1}
            stroke="url(#gradient)"
            fill="url(#gradient)"
            curve={curveMonotoneX}
            onClick={(event: PointerHandlerEvent) => {}}
            onPointerDown={(event: PointerHandlerEvent) => {
              dragStart(event);
            }}
            onPointerLeave={(event: PointerHandlerEvent) => {
              // dragEnd(event);
            }}
            onPointerMove={(event: PointerHandlerEvent) => {
              if (isDragging) dragMove(event);
            }}
            onPointerUp={(event: PointerHandlerEvent) => {
              dragEnd(event);
            }}
          />
        )}
      </Drag>
      {!hideBottomAxis && (
        <AxisBottom
          top={yMax}
          scale={xScale}
          numTicks={width > 520 ? 10 : 5}
          stroke={axisColor}
          tickStroke={axisColor}
          tickLabelProps={axisBottomTickLabelProps}
        />
      )}
      {!hideLeftAxis && (
        <AxisLeft
          scale={yScale}
          numTicks={5}
          stroke={axisColor}
          tickStroke={axisColor}
          tickLabelProps={axisLeftTickLabelProps}
        />
      )}
      {children}
    </Group>
  );
}
