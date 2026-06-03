import{r,j as h}from"./react-vendor-DAV-XMxS.js";import{e as x}from"./index-BVv7lm38.js";function T({quizName:a,score:l,total:c,percentage:t,bestStreak:s,xpEarned:e}){const[i,u]=r.useState(!1),n=r.useRef(null);r.useEffect(()=>()=>clearTimeout(n.current),[]);const m=r.useCallback(()=>{const f=t>=90?"⭐⭐⭐":t>=70?"⭐⭐":t>=50?"⭐":"",p=Array.from({length:10},(d,b)=>b<Math.round(t/10)?"█":"░").join("");let o=`🌸 nihongo app — ${a}
`;o+=`${p} ${t}% (${l}/${c})
`,f&&(o+=`${f}
`),s>=3&&(o+=`🔥 best streak: ${s}x
`),e>0&&(o+=`⚡ +${e} XP
`),o+=`
日本語の勉強、がんばってます!`,x(o).then(d=>{d&&(u(!0),clearTimeout(n.current),n.current=setTimeout(()=>u(!1),2e3))})},[a,l,c,t,s,e]);return h.jsxs("button",{onClick:m,style:$.btn,className:"glass-sm btn-hover","aria-label":i?"result copied to clipboard":"copy result to clipboard",children:[i?"copied!":"share"," ",i?"✅":"📋"]})}const $={btn:{padding:"8px 18px",borderRadius:50,border:"1.5px solid rgba(192,132,252,0.5)",background:"var(--tint)",color:"var(--text-secondary)",fontSize:"0.85rem",fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s",minHeight:44}};export{T as S};
