
export const getGoldPrice = () => {
    return new Promise((resolve, reject) => {
        const scriptId = 'gold-price-script';
        const oldScript = document.getElementById(scriptId);
        if (oldScript) {
            oldScript.remove();
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://www.huilvbiao.com/api/gold_indexApi?t=${Date.now()}`;

        script.onload = () => {
            const result = {
                gds_AUTD: window.hq_str_gds_AUTD,
                hf_GC: window.hq_str_hf_GC,
                hf_XAU: window.hq_str_hf_XAU
            };
            resolve({status: 200, data: result});
            script.remove();
        };

        script.onerror = (err) => {
            reject(err);
            script.remove();
        };

        document.head.appendChild(script);
    });
}

export const getUSDToCNYRate = async () => {
    // eslint-disable-next-line no-useless-catch
    try {
        const response = await fetch(`https://free.xwteam.cn/api/convert/currency?money=USD`);
        const data = await response.json();
        if (data.code === 200 && data.data && data.data.To && data.data.To.CNY) {
            return { status: 200, data: data.data.To.CNY };
        }
        throw new Error(data.msg || '查询汇率失败');
    } catch (err) {
        throw err;
    }
}