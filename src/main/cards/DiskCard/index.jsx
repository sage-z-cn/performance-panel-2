import React from 'react';
import { DiskIcon } from "../../../icon/index.jsx";
import useIntl from "../../../hooks/useIntl.jsx";

function DiskCard({ data = {} }) {
  const {
    name = '',
    readSpeed = '0 KB/s',
    writeSpeed = '0 KB/s',
    temperature = 0,
    used = 0,
    total = 0,
  } = data;
  const intl = useIntl();

  const hasData = total > 0 || temperature > 0;

  return (
    <div className="card card-disk">
      <div className="card-header">
        <div className="card-icon"><DiskIcon /></div>
        <div className="card-title">{intl('disk')}</div>
        {name && (
          <div className="card-extra" style={{ fontSize: '0.9rem', opacity: 0.6, maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right', marginLeft: 'auto' }}>{name}</div>
        )}
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
              <span>{temperature > 0 ? `${temperature}℃` : '--'}</span>
            </div>
            <div className="small-item">
              <span>{intl('data')}</span>
              <span>{Math.round(used)} / {Math.round(total)} GB</span>
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
