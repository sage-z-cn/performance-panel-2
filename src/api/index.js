
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