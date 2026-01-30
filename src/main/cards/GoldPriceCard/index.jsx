import React, {useEffect, useState} from 'react';
import useIntl from "../../../hooks/useIntl.jsx";
import {GoldIcon} from "../../../icon/index.jsx";
import {useRequest} from "ahooks";
import {getGoldPrice} from "../../../api/index.js";

function GoldPriceCard() {
    const intl = useIntl();
    const [prices, setPrices] = useState([]);
    const [updateTime, setUpdateTime] = useState('--');

    const {data} = useRequest(getGoldPrice, {
        pollingInterval: 60 * 1000,
        pollingWhenHidden: true,
    });

    useEffect(() => {
        if (data && data.status === 200 && data.data) {
            const rawData = data.data;
            const result = [];
            let timeStr = '--';

            const keys = [
                {key: 'gds_AUTD', name: 'domesticGold'},
                {key: 'hf_GC', name: 'nyGold'},
                {key: 'hf_XAU', name: 'londonGold'},
            ];

            keys.forEach(({key, name}) => {
                const line = rawData[key];
                if (line) {
                    const values = line.split(',');
                    if (values.length >= 8) {
                        const current = parseFloat(values[0]);
                        const yesterday = parseFloat(values[7]);

                        if (!isNaN(current) && !isNaN(yesterday) && yesterday !== 0) {
                            const change = current - yesterday;
                            const changePercent = (change / yesterday) * 100;

                            result.push({
                                label: intl(name),
                                current: current.toFixed(2),
                                change: (change >= 0 ? '+' : '') + change.toFixed(2),
                                changePercent: (change >= 0 ? '+' : '') + changePercent.toFixed(2) + '%',
                                up: change >= 0
                            });
                        }

                        if (key === 'gds_AUTD' && values[12] && values[6]) {
                            timeStr = `${values[12]} ${values[6]}`;
                        }
                    }
                }
            });

            setPrices(result);
            setUpdateTime(timeStr);
        }
    }, [data, intl]);

    return (
        <div className="card card-gold">
            <div className="card-header">
                <div className="card-icon"><GoldIcon/></div>
                <div className="card-title">
                    {intl('goldPrice')}
                </div>
            </div>
            <div className="card-body">
                {prices.map((item, index) => (
                    <div className="small-item" key={index}>
                        <span>{item.label}</span>
                        <span style={{color: item.up ? '#ff4d4f' : '#52c41a'}}>
                            {item.current} / {item.change} / {item.changePercent}
                        </span>
                    </div>
                ))}
                <div className="small-item">
                    <span>{intl('updateTime')}</span>
                    <span>{updateTime}</span>
                </div>
            </div>
        </div>
    );
}

export default GoldPriceCard;