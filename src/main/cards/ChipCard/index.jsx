import React, { useEffect, useMemo, useState } from 'react';
import { CpuIcon, GpuIcon } from "../../../icon/index.jsx";
import useIntl from "../../../hooks/useIntl.jsx";
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { DatasetComponent, GridComponent } from 'echarts/components';
import {
  CanvasRenderer,
} from 'echarts/renderers';
import { useConfig } from "../../../hooks/useConfig.js";

echarts.use(
  [LineChart, CanvasRenderer, DatasetComponent, GridComponent],
);

const n = 30;

function ChipCard(
  {
    type,
    data = {}
  }
) {
  const { themeColor } = useConfig();
    const {
    load,
    temperature,
    clock,
    fan,
    voltage,
    name,
  } = data;
  const intl = useIntl();
  const [dataSource, setDataSource] = useState(Array.from({ length: n }, (_, i) => [i, 0]));
  
  useEffect(() => {
    const { load = 0, timestamp = Date.now() } = data;
    setDataSource(prev => {
      const dataSource = prev.slice(1);
      dataSource.push([timestamp, load]);
      return dataSource;
    })
  }, [type, data]);
  
  const option = useMemo(() => ({
    grid: {
      show: false,
      left: 0,
      right: 0,
      bottom: 0,
      top: 0,
    },
    dataset: {
      source: [
        ['time', 'load'],
        ...dataSource
      ]
    },
    xAxis: {
      type: 'category',
      axisLabel: { show: false },
      splitLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      max: 110,
      min: 0,
      axisLabel: { show: false },
      splitLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'line',
        name: 'load',
        itemStyle: {
          color: themeColor
        },
        lineStyle: {
          shadowColor: 'rgba(0,0,0,0.3)',
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowOffsetY: 8
        },
        smooth: 0.5,
        symbol: 'none',
      },
    ],
    animation: false
  }), [dataSource, themeColor]);
  
  return (
    <div className="card card-chip">
      <div className="card-header">
        <div className="card-icon">{type === 'CPU' ? <CpuIcon/> : <GpuIcon/>}</div>
        <div className="card-title">{name || type}</div>
      </div>
      <div className="card-body">
        <div>
          <div className="small-item">
            <span>{intl('clock')}</span>
            <span>{clock > 1000 ? `${(clock / 1000).toFixed(2)} Ghz` : `${clock} Mhz`}</span>
          </div>
          <div className="small-item">
            <span>{intl('fan')}</span>
            <span>{fan} RPM</span>
          </div>
          <div className="small-item">
            <span>{intl('temperature')}</span>
            <span>{temperature}℃</span>
          </div>
          <div className="small-item">
            <span>{intl('voltage')}</span>
            <span>{voltage > 0 ? `${voltage} V` : '--'}</span>
          </div>
        </div>
        <div className="big-item">
          <span>{Math.round(load)}<span className="theme-color">%</span></span>
        </div>
        <ReactEChartsCore
          echarts={echarts}
          option={option}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>
    </div>
  );
}

export default ChipCard;
