import React, {useEffect, useState} from 'react';
import useIntl from "../../../hooks/useIntl.jsx";
import {GoldIcon} from "../../../icon/index.jsx";
import {useRequest} from "ahooks";
import {getGoldPrice, getUSDToCNYRate} from "../../../api/index.js";

function GoldPriceCard() {
    const intl = useIntl();
    const [prices, setPrices] = useState([]);
    const [updateTime, setUpdateTime] = useState('--');
    const [showConverted, setShowConverted] = useState(() => {
        return localStorage.getItem('goldPriceDisplayMode') !== 'USD/oz';
    });

    const {data: goldPriceData} = useRequest(getGoldPrice, {
        pollingInterval: 60 * 1000,
        pollingWhenHidden: true,
    });

    const {data: exchangeRateData} = useRequest(getUSDToCNYRate, {
        pollingInterval: 60 * 60 * 1000,
        pollingWhenHidden: true,
    });

    useEffect(() => {
        if (goldPriceData && goldPriceData.status === 200 && goldPriceData.data) {
            const rawData = goldPriceData.data;
            const result = [];
            let timeStr = '--';
            const usdToCnyRate = exchangeRateData && exchangeRateData.status === 200 ? exchangeRateData.data : null;
            const ounceToGram = 31.1035;

            const keys = [
                {key: 'gds_AUTD', name: 'domesticGold', isDomestic: true},
                {key: 'hf_GC', name: 'nyGold', isDomestic: false},
                {key: 'hf_XAU', name: 'londonGold', isDomestic: false},
            ];

            keys.forEach(({key, name, isDomestic}) => {
                const line = rawData[key];
                if (line) {
                    const values = line.split(',');
                    if (values.length >= 8) {
                        const originalCurrent = parseFloat(values[0]);
                        const originalYesterday = parseFloat(values[7]);
                        let current = originalCurrent;
                        let yesterday = originalYesterday;

                        if (!isDomestic && usdToCnyRate) {
                            current = (current * usdToCnyRate) / ounceToGram;
                            yesterday = (yesterday * usdToCnyRate) / ounceToGram;
                        }

                        if (!isNaN(current) && !isNaN(yesterday) && yesterday !== 0) {
                            const change = current - yesterday;
                            const changePercent = (change / yesterday) * 100;

                            result.push({
                                label: intl(name),
                                originalCurrent: originalCurrent.toFixed(2),
                                originalYesterday: originalYesterday.toFixed(2),
                                current: current.toFixed(2),
                                change: (change >= 0 ? '+' : '') + change.toFixed(2),
                                changePercent: (change >= 0 ? '+' : '') + changePercent.toFixed(2) + '%',
                                up: change >= 0,
                                isDomestic: isDomestic
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
    }, [goldPriceData, exchangeRateData, intl]);

    useEffect(() => {
        localStorage.setItem('goldPriceDisplayMode', showConverted ? 'CNY/g' : 'USD/oz');
    }, [showConverted]);

    const handleToggleDisplay = () => {
        setShowConverted(prev => !prev);
    };

    return (
        <div className="card card-gold">
            <div className="card-header">
                <div className="card-icon"><GoldIcon/></div>
                <div className="card-title">
                    {intl('goldPrice')}
                </div>
                <div 
                    style={{fontSize: '16px', color: '#666', marginLeft: '10px', cursor: 'pointer', userSelect: 'none'}}
                    onClick={handleToggleDisplay}
                >
                    {showConverted ? 'CNY/g' : 'USD/oz'}
                </div>
            </div>
            <div className="card-body">
                {prices.map((item, index) => {
                    const displayCurrent = item.isDomestic || showConverted ? item.current : item.originalCurrent;
                    return (
                        <div className="small-item" key={index}>
                            <span>{item.label}</span>
                            <span style={{color: item.up ? '#ff4d4f' : '#52c41a'}}>
                                {displayCurrent} / {item.change} / {item.changePercent}
                            </span>
                        </div>
                    );
                })}
                <div className="small-item">
                    <span>{intl('updateTime')}</span>
                    <span>{updateTime}</span>
                </div>
            </div>
        </div>
    );
}

export default GoldPriceCard;