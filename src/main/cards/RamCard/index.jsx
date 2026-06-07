import React from 'react';
import {MemoryFillIcon, MemoryLightIcon} from "../../../icon/index.jsx";
import useIntl from "../../../hooks/useIntl.jsx";

function RamCard(
    {
        type,
        data = {},
    }
) {
    const { load = 0, free = 0, used = 0, total = 0 } = data;
    const intl = useIntl();

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-icon">{type === 'RAM' ? <MemoryLightIcon/> : <MemoryFillIcon/>}</div>
                <div className="card-title">{intl(type.toLowerCase())}</div>
            </div>
            <div className="card-body">
                <div className="small-item">
                    <span>{intl('load')}</span>
                    <span>{load.toFixed(1)}%</span>
                </div>
                <div className="small-item">
                    <span>{intl('used')}</span>
                    <span>{used.toFixed(1)} GB</span>
                </div>
                <div className="small-item">
                    <span>{intl('free')}</span>
                    <span>{free.toFixed(1)} GB</span>
                </div>
                <div className="small-item">
                    <span>{intl('total')}</span>
                    <span>{total.toFixed(1)} GB</span>
                </div>
            </div>
        </div>
    );
}

export default RamCard;