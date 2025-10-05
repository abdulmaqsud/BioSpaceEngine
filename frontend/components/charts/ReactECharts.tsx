"use client";

import type { ECharts, EChartsOption, SetOptionOpts } from "echarts";
import { getInstanceByDom, init } from "echarts";
import { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

type Theme = "light" | "dark" | undefined;

export interface ReactEChartsProps {
  option: EChartsOption;
  className?: string;
  settings?: SetOptionOpts;
  loading?: boolean;
  theme?: Theme;
  onInit?: (chart: ECharts) => void;
}

export function ReactECharts({
  option,
  className,
  settings,
  loading,
  theme,
  onInit,
}: ReactEChartsProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chartRef.current === null || typeof window === "undefined") {
      return;
    }

    const existing = getInstanceByDom(chartRef.current);
    if (existing) {
      return;
    }

    const chart = init(chartRef.current, theme);
    if (onInit) {
      onInit(chart);
    }

    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [theme, onInit]);

  useEffect(() => {
    if (chartRef.current === null || typeof window === "undefined") {
      return;
    }

    const chart = getInstanceByDom(chartRef.current) ?? init(chartRef.current, theme);
    chart.setOption(option, settings);
    chart.resize();
    if (onInit) {
      onInit(chart);
    }
  }, [option, settings, theme, onInit]);

  useEffect(() => {
    if (chartRef.current === null || typeof window === "undefined") {
      return;
    }

    const chart = getInstanceByDom(chartRef.current);
    if (!chart) {
      return;
    }

    if (loading) {
      chart.showLoading("default", {
        text: "Loading",
        color: "#22d3ee",
        textColor: "#cbd5f5",
        maskColor: "rgba(15, 23, 42, 0.45)",
      });
    } else {
      chart.hideLoading();
    }
  }, [loading]);

  useEffect(() => {
    if (chartRef.current === null || typeof window === "undefined" || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      const chart = getInstanceByDom(chartRef.current!);
      chart?.resize();
    });

    observer.observe(chartRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return <div ref={chartRef} className={cn("h-full w-full min-h-0", className)} />;
}
