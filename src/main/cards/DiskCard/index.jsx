import React from 'react';
import { DiskIcon } from "../../../icon/index.jsx";
import useIntl from "../../../hooks/useIntl.jsx";

function DiskCard({ data = {} }) {
  const {
    readSpeed = '0 KB/s',
    writeSpeed = '0 KB/s',
    temperature = '--',
    used = '--',
  } = data;
  const intl = useIntl();

  const hasData = temperature !== '--' || used !== '--';

  return (
    <div className="card card-disk">
      <div className="card-header">
        <div className="card-icon"><DiskIcon /></div>
        <div className="card-title">{intl('disk')}</div>
      </div>
      <div className="card-body">
        {hasData ? (
          <>
            <div className="small-item">
              <span>{intl('readSpeed')}</span>
              <span>{readSpeed}</span>
            </div>
            <div className="small-item">
              <span>{intl('writeSpeed')}</span>
              <span>{writeSpeed}</span>
            </div>
            <div className="small-item">
              <span>{intl('temperature')}</span>
              <span>{temperature}</span>
            </div>
            <div className="small-item">
              <span>{intl('used')}</span>
              <span>{used}</span>
            </div>
          </>
        ) : (
          <div className="small-item">
            <span>--</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiskCard;
