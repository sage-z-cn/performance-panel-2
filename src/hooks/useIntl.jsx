import {useConfig} from "./useConfig.js";
import React, {useMemo} from "react";

const translators = {
    english: {
        usage: (<span>LibreHardwareMonitor Remote Web Server is not available.
            Please visit&nbsp;
            <a href="https://github.com/sage9731/performance-panel-2" target="_blank">
                https://github.com/sage9731/performance-panel-2
            </a>&nbsp;
            and see how to set it up.
        </span>),
        temperature: 'Temperature',
        clock: 'Clock',
        voltage: 'Voltage',
        power: 'Power',
        fan: 'Fan',
        load: 'Load',
        used: 'Used',
        free: 'Free',
        total: 'Total',
        upload: 'Upload',
        download: 'Download',
        ram: 'RAM',
        vram: 'VRAM',
        network: 'Network',
        audio: 'Audio',
        volume: 'Volume',
        readSpeed: 'Read',
        writeSpeed: 'Write',
        disk: 'Disk',
        data: 'Data',
    },
    chinese: {
        usage: (<span>LibreHardwareMonitor 的 Remote Web Server 不可用。
            请访问&nbsp;
            <a href="https://github.com/sage9731/performance-panel-2" target="_blank">
                https://github.com/sage9731/performance-panel-2
            </a>&nbsp;
            并查看安装使用说明。
        </span>),
        temperature: '温度',
        clock: '频率',
        voltage: '电压',
        power: '功耗',
        fan: '风扇',
        load: '负载',
        used: '已使用',
        free: '空闲',
        total: '总容量',
        upload: '上传',
        download: '下载',
        ram: '内存',
        vram: '显存',
        network: '网络',
        audio: '音频',
        volume: '音量',
        readSpeed: '读取',
        writeSpeed: '写入',
        disk: '磁盘',
        data: '数据',
    }
};

const useIntl = () => {
    const {language} = useConfig();
    return useMemo(() => (fragment) => {
        return translators[language][fragment] || '*';
    }, [language]);
}

export default useIntl;
