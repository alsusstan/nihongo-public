function n(r,t){return[...new Set(r.map(e=>Number(t(e))).filter(e=>Number.isFinite(e)&&e>0))].sort((e,i)=>e-i)}export{n as g};
