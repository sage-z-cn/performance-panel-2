import React, {useEffect, useRef, useState} from 'react';
import {Row, Col} from "antd";
import {useConfig} from "../hooks/useConfig.js";
import useIntl from "../hooks/useIntl.jsx";
import {fetchLHMData} from "../api/lhm.js";
import {parseLHMData} from "./lhm-parser.js";

import ChipCard from "./cards/ChipCard/index.jsx";
import RamCard from "./cards/RamCard/index.jsx";
import NetworkCard from "./cards/NetworkCard/index.jsx";
import AudioCard from "./cards/AudioCard/index.jsx";
import GoldPriceCard from "./cards/GoldPriceCard/index.jsx";

const POLL_INTERVAL = 1000; // LHM 轮询间隔 (ms)，与原来 SSE 推送频率一致

function Main() {
    const {host, port} = useConfig();
    const intl = useIntl();
    const [readyState, setReadyState] = useState(0);
    const [performance, setPerformance] = useState({});
    const firstSuccessRef = useRef(false);

    useEffect(() => {
        let cancelled = false;

        async function poll() {
            try {
                const data = await fetchLHMData(host, port);
                const perf = parseLHMData(data);
                if (cancelled) return;

                setPerformance(perf);

                if (!firstSuccessRef.current) {
                    firstSuccessRef.current = true;
                    setReadyState(1);
                }
            } catch (err) {
                console.warn('[LHM] fetch failed:', err.message);
                if (!cancelled && !firstSuccessRef.current) {
                    setReadyState(0);
                }
            }
        }

        // 重置首次成功标记（host/port 变化时）
        firstSuccessRef.current = false;

        // 立即执行首次获取
        poll();

        // 定时轮询
        const interval = setInterval(poll, POLL_INTERVAL);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [host, port]);

    return (
        <div className="main">
            {
                readyState === 1 ? (
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <ChipCard type="CPU" data={performance.cpu}/>
                        </Col>
                        <Col span={4}>
                            <RamCard type="RAM" data={performance.ram}/>
                        </Col>
                        <Col span={4}>
                            <NetworkCard data={performance.network}/>
                        </Col>
                        <Col span={4}>
                            <GoldPriceCard/>
                        </Col>
                        <Col span={12}>
                            <ChipCard type="GPU" data={{...performance.gpu, ...performance.display}}/>
                        </Col>
                        <Col span={4}>
                            <RamCard type="VRAM" data={performance.videoRam}/>
                        </Col>
                        <Col span={8}>
                            <AudioCard volume={performance.volume}/>
                        </Col>
                    </Row>
                ) : (
                    <div className="usage-tips">
                        {intl('usage')}
                    </div>
                )
            }

        </div>
    );
}

export default Main;
