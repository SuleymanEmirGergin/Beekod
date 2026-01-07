import{r as ft,a as s,R as H,b as je,c as ht,d as pt}from"./react-vendor-mH5NDKV-.js";var oe={exports:{}},V={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var xe;function yt(){if(xe)return V;xe=1;var e=ft(),t=Symbol.for("react.element"),n=Symbol.for("react.fragment"),a=Object.prototype.hasOwnProperty,o=e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,r={key:!0,ref:!0,__self:!0,__source:!0};function l(i,u,d){var h,f={},y=null,v=null;d!==void 0&&(y=""+d),u.key!==void 0&&(y=""+u.key),u.ref!==void 0&&(v=u.ref);for(h in u)a.call(u,h)&&!r.hasOwnProperty(h)&&(f[h]=u[h]);if(i&&i.defaultProps)for(h in u=i.defaultProps,u)f[h]===void 0&&(f[h]=u[h]);return{$$typeof:t,type:i,key:y,ref:v,props:f,_owner:o.current}}return V.Fragment=n,V.jsx=l,V.jsxs=l,V}var we;function vt(){return we||(we=1,oe.exports=yt()),oe.exports}var g=vt();/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mt=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),gt=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(t,n,a)=>a?a.toUpperCase():n.toLowerCase()),_e=e=>{const t=gt(e);return t.charAt(0).toUpperCase()+t.slice(1)},Ie=(...e)=>e.filter((t,n,a)=>!!t&&t.trim()!==""&&a.indexOf(t)===n).join(" ").trim();/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var bt={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const kt=s.forwardRef(({color:e="currentColor",size:t=24,strokeWidth:n=2,absoluteStrokeWidth:a,className:o="",children:r,iconNode:l,...i},u)=>s.createElement("svg",{ref:u,...bt,width:t,height:t,stroke:e,strokeWidth:a?Number(n)*24/Number(t):n,className:Ie("lucide",o),...i},[...l.map(([d,h])=>s.createElement(d,h)),...Array.isArray(r)?r:[r]]));/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=(e,t)=>{const n=s.forwardRef(({className:a,...o},r)=>s.createElement(kt,{ref:r,iconNode:t,className:Ie(`lucide-${mt(_e(e))}`,`lucide-${e}`,a),...o}));return n.displayName=_e(e),n};/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xt=[["path",{d:"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",key:"169zse"}]],Rr=c("activity",xt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wt=[["path",{d:"m7 7 10 10",key:"1fmybs"}],["path",{d:"M17 7v10H7",key:"6fjiku"}]],Ar=c("arrow-down-right",wt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _t=[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]],Pr=c("arrow-left",_t);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Mt=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]],$r=c("arrow-right",Mt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Et=[["path",{d:"M7 7h10v10",key:"1tivn9"}],["path",{d:"M7 17 17 7",key:"1vkiza"}]],Or=c("arrow-up-right",Et);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nt=[["path",{d:"m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526",key:"1yiouv"}],["circle",{cx:"12",cy:"8",r:"6",key:"1vp47v"}]],Dr=c("award",Nt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ct=[["path",{d:"M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z",key:"3c2336"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]],Tr=c("badge-alert",Ct);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const St=[["path",{d:"M10.268 21a2 2 0 0 0 3.464 0",key:"vwvbt9"}],["path",{d:"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",key:"11g9vi"}]],Lr=c("bell",St);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rt=[["path",{d:"M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20",key:"k3hazp"}]],jr=c("book",Rt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const At=[["path",{d:"M12 8V4H8",key:"hb8ula"}],["rect",{width:"16",height:"12",x:"4",y:"8",rx:"2",key:"enze0r"}],["path",{d:"M2 14h2",key:"vft8re"}],["path",{d:"M20 14h2",key:"4cs60a"}],["path",{d:"M15 13v2",key:"1xurst"}],["path",{d:"M9 13v2",key:"rq6x2g"}]],Ir=c("bot",At);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pt=[["path",{d:"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",key:"hh9hay"}],["path",{d:"m3.3 7 8.7 5 8.7-5",key:"g66t2b"}],["path",{d:"M12 22V12",key:"d0xqtd"}]],zr=c("box",Pt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $t=[["path",{d:"M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",key:"l5xja"}],["path",{d:"M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z",key:"ep3f8r"}],["path",{d:"M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4",key:"1p4c4q"}],["path",{d:"M17.599 6.5a3 3 0 0 0 .399-1.375",key:"tmeiqw"}],["path",{d:"M6.003 5.125A3 3 0 0 0 6.401 6.5",key:"105sqy"}],["path",{d:"M3.477 10.896a4 4 0 0 1 .585-.396",key:"ql3yin"}],["path",{d:"M19.938 10.5a4 4 0 0 1 .585.396",key:"1qfode"}],["path",{d:"M6 18a4 4 0 0 1-1.967-.516",key:"2e4loj"}],["path",{d:"M19.967 17.484A4 4 0 0 1 18 18",key:"159ez6"}]],Fr=c("brain",$t);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ot=[["path",{d:"M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",key:"jecpp"}],["rect",{width:"20",height:"14",x:"2",y:"6",rx:"2",key:"i6l2r4"}]],qr=c("briefcase",Ot);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Dt=[["path",{d:"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z",key:"1b4qmf"}],["path",{d:"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2",key:"i71pzd"}],["path",{d:"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2",key:"10jefs"}],["path",{d:"M10 6h4",key:"1itunk"}],["path",{d:"M10 10h4",key:"tcdvrf"}],["path",{d:"M10 14h4",key:"kelpxr"}],["path",{d:"M10 18h4",key:"1ulq68"}]],Hr=c("building-2",Dt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tt=[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]],Vr=c("calendar",Tt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Lt=[["path",{d:"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",key:"1tc9qg"}],["circle",{cx:"12",cy:"13",r:"3",key:"1vg3eu"}]],Wr=c("camera",Lt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const jt=[["path",{d:"M3 3v16a2 2 0 0 0 2 2h16",key:"c24i48"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]],Br=c("chart-column",jt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const It=[["line",{x1:"12",x2:"12",y1:"20",y2:"10",key:"1vz5eb"}],["line",{x1:"18",x2:"18",y1:"20",y2:"4",key:"cun8e5"}],["line",{x1:"6",x2:"6",y1:"20",y2:"16",key:"hq0ia6"}]],Ur=c("chart-no-axes-column-increasing",It);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zt=[["line",{x1:"18",x2:"18",y1:"20",y2:"10",key:"1xfpm4"}],["line",{x1:"12",x2:"12",y1:"20",y2:"4",key:"be30l9"}],["line",{x1:"6",x2:"6",y1:"20",y2:"14",key:"1r4le6"}]],Yr=c("chart-no-axes-column",zt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ft=[["path",{d:"M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z",key:"pzmjnu"}],["path",{d:"M21.21 15.89A10 10 0 1 1 8 2.83",key:"k2fpak"}]],Zr=c("chart-pie",Ft);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qt=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],Kr=c("check",qt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ht=[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]],Xr=c("chevron-down",Ht);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vt=[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]],Gr=c("chevron-left",Vt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wt=[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]],Jr=c("chevron-right",Wt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bt=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]],Qr=c("circle-alert",Bt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ut=[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]],es=c("circle-check-big",Ut);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yt=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],ts=c("circle-check",Yt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zt=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]],ns=c("circle-help",Zt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Kt=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]],as=c("circle-x",Kt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xt=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]],os=c("clock",Xt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Gt=[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]],rs=c("copy",Gt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Jt=[["path",{d:"M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z",key:"1vdc57"}],["path",{d:"M5 21h14",key:"11awu3"}]],ss=c("crown",Jt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qt=[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]],is=c("database",Qt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const en=[["line",{x1:"12",x2:"12",y1:"2",y2:"22",key:"7eqyqh"}],["path",{d:"M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",key:"1b0p4s"}]],cs=c("dollar-sign",en);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const tn=[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]],ls=c("download",tn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const nn=[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"12",cy:"5",r:"1",key:"gxeob9"}],["circle",{cx:"12",cy:"19",r:"1",key:"lyex9k"}]],ds=c("ellipsis-vertical",nn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const an=[["path",{d:"M4 10h12",key:"1y6xl8"}],["path",{d:"M4 14h9",key:"1loblj"}],["path",{d:"M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2",key:"1j6lzo"}]],us=c("euro",an);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const on=[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]],fs=c("external-link",on);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rn=[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]],hs=c("eye-off",rn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const sn=[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],ps=c("eye",sn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cn=[["path",{d:"M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",key:"1jg4f8"}]],ys=c("facebook",cn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ln=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]],vs=c("file-text",ln);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const dn=[["path",{d:"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",key:"96xj49"}]],ms=c("flame",dn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const un=[["path",{d:"M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z",key:"sc7q7i"}]],gs=c("funnel",un);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fn=[["rect",{x:"3",y:"8",width:"18",height:"4",rx:"1",key:"bkv52"}],["path",{d:"M12 8v13",key:"1c76mn"}],["path",{d:"M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7",key:"6wjy6b"}],["path",{d:"M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5",key:"1ihvrl"}]],bs=c("gift",fn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hn=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]],ks=c("globe",hn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pn=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M3 9h18",key:"1pudct"}],["path",{d:"M3 15h18",key:"5xshup"}],["path",{d:"M9 3v18",key:"fh3hqa"}],["path",{d:"M15 3v18",key:"14nvp0"}]],xs=c("grid-3x3",pn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const yn=[["path",{d:"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",key:"c3ymky"}]],ws=c("heart",yn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vn=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]],_s=c("history",vn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mn=[["path",{d:"M16 5h6",key:"1vod17"}],["path",{d:"M19 2v6",key:"4bpg5p"}],["path",{d:"M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5",key:"1ue2ih"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}]],Ms=c("image-plus",mn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gn=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]],Es=c("image",gn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bn=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]],Ns=c("info",bn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const kn=[["rect",{width:"20",height:"20",x:"2",y:"2",rx:"5",ry:"5",key:"2e1cvw"}],["path",{d:"M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z",key:"9exkf1"}],["line",{x1:"17.5",x2:"17.51",y1:"6.5",y2:"6.5",key:"r4j83e"}]],Cs=c("instagram",kn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xn=[["path",{d:"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",key:"zw3jo"}],["path",{d:"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",key:"1wduqc"}],["path",{d:"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",key:"kqbvx6"}]],Ss=c("layers",xn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wn=[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]],Rs=c("layout-dashboard",wn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _n=[["rect",{width:"7",height:"7",x:"3",y:"3",rx:"1",key:"1g98yp"}],["rect",{width:"7",height:"7",x:"14",y:"3",rx:"1",key:"6d4xhi"}],["rect",{width:"7",height:"7",x:"14",y:"14",rx:"1",key:"nxv5o0"}],["rect",{width:"7",height:"7",x:"3",y:"14",rx:"1",key:"1bb6yr"}]],As=c("layout-grid",_n);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Mn=[["path",{d:"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",key:"1gvzjb"}],["path",{d:"M9 18h6",key:"x1upvd"}],["path",{d:"M10 22h4",key:"ceow96"}]],Ps=c("lightbulb",Mn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const En=[["path",{d:"M9 17H7A5 5 0 0 1 7 7h2",key:"8i5ue5"}],["path",{d:"M15 7h2a5 5 0 1 1 0 10h-2",key:"1b9ql8"}],["line",{x1:"8",x2:"16",y1:"12",y2:"12",key:"1jonct"}]],$s=c("link-2",En);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nn=[["path",{d:"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",key:"1cjeqo"}],["path",{d:"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",key:"19qd67"}]],Os=c("link",Nn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Cn=[["path",{d:"M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z",key:"c2jq9f"}],["rect",{width:"4",height:"12",x:"2",y:"9",key:"mk3on5"}],["circle",{cx:"4",cy:"4",r:"2",key:"bt5ra8"}]],Ds=c("linkedin",Cn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Sn=[["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M3 18h.01",key:"1tta3j"}],["path",{d:"M3 6h.01",key:"1rqtza"}],["path",{d:"M8 12h13",key:"1za7za"}],["path",{d:"M8 18h13",key:"1lx6n3"}],["path",{d:"M8 6h13",key:"ik3vkj"}]],Ts=c("list",Sn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rn=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]],Ls=c("loader-circle",Rn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const An=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]],js=c("lock",An);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pn=[["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}],["path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",key:"1ocrg3"}]],Is=c("mail",Pn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $n=[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",key:"1r0f0z"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]],zs=c("map-pin",$n);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const On=[["path",{d:"M7.9 20A9 9 0 1 0 4 16.1L2 22Z",key:"vv11sd"}]],Fs=c("message-circle",On);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Dn=[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}]],qs=c("message-square",Dn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tn=[["path",{d:"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z",key:"131961"}],["path",{d:"M19 10v2a7 7 0 0 1-14 0v-2",key:"1vc78b"}],["line",{x1:"12",x2:"12",y1:"19",y2:"22",key:"x3vr5v"}]],Hs=c("mic",Tn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ln=[["path",{d:"M5 12h14",key:"1ays0h"}]],Vs=c("minus",Ln);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const jn=[["path",{d:"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",key:"1a0edw"}],["path",{d:"M12 22V12",key:"d0xqtd"}],["polyline",{points:"3.29 7 12 12 20.71 7",key:"ousv84"}],["path",{d:"m7.5 4.27 9 5.15",key:"1c824w"}]],Ws=c("package",jn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const In=[["circle",{cx:"13.5",cy:"6.5",r:".5",fill:"currentColor",key:"1okk4w"}],["circle",{cx:"17.5",cy:"10.5",r:".5",fill:"currentColor",key:"f64h9f"}],["circle",{cx:"8.5",cy:"7.5",r:".5",fill:"currentColor",key:"fotxhn"}],["circle",{cx:"6.5",cy:"12.5",r:".5",fill:"currentColor",key:"qy21gx"}],["path",{d:"M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z",key:"12rzf8"}]],Bs=c("palette",In);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zn=[["path",{d:"M12 20h9",key:"t2du7b"}],["path",{d:"M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z",key:"1ykcvy"}]],Us=c("pen-line",zn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fn=[["path",{d:"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",key:"foiqr5"}]],Ys=c("phone",Fn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qn=[["polygon",{points:"6 3 20 12 6 21 6 3",key:"1oa8hb"}]],Zs=c("play",qn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Hn=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]],Ks=c("plus",Hn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vn=[["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["path",{d:"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6",key:"1itne7"}],["rect",{x:"6",y:"14",width:"12",height:"8",rx:"1",key:"1ue0tg"}]],Xs=c("printer",Vn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wn=[["rect",{width:"5",height:"5",x:"3",y:"3",rx:"1",key:"1tu5fj"}],["rect",{width:"5",height:"5",x:"16",y:"3",rx:"1",key:"1v8r4q"}],["rect",{width:"5",height:"5",x:"3",y:"16",rx:"1",key:"1x03jg"}],["path",{d:"M21 16h-3a2 2 0 0 0-2 2v3",key:"177gqh"}],["path",{d:"M21 21v.01",key:"ents32"}],["path",{d:"M12 7v3a2 2 0 0 1-2 2H7",key:"8crl2c"}],["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M12 3h.01",key:"n36tog"}],["path",{d:"M12 16v.01",key:"133mhm"}],["path",{d:"M16 12h1",key:"1slzba"}],["path",{d:"M21 12v.01",key:"1lwtk9"}],["path",{d:"M12 21v-1",key:"1880an"}]],Gs=c("qr-code",Wn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bn=[["path",{d:"M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"14sxne"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16",key:"1hlbsb"}],["path",{d:"M16 16h5v5",key:"ccwih5"}]],Js=c("refresh-ccw",Bn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Un=[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]],Qs=c("refresh-cw",Un);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yn=[["path",{d:"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z",key:"m3kijz"}],["path",{d:"m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z",key:"1fmvmk"}],["path",{d:"M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0",key:"1f8sc4"}],["path",{d:"M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5",key:"qeys4"}]],ei=c("rocket",Yn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zn=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]],ti=c("rotate-ccw",Zn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Kn=[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]],ni=c("save",Kn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xn=[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]],ai=c("search",Xn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Gn=[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",key:"1ffxy3"}],["path",{d:"m21.854 2.147-10.94 10.939",key:"12cjpa"}]],oi=c("send",Gn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Jn=[["path",{d:"M20 7h-9",key:"3s1dr2"}],["path",{d:"M14 17H5",key:"gfn3mx"}],["circle",{cx:"17",cy:"17",r:"3",key:"18b49y"}],["circle",{cx:"7",cy:"7",r:"3",key:"dfmy0x"}]],ri=c("settings-2",Jn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qn=[["path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",key:"1qme2f"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],si=c("settings",Qn);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ea=[["circle",{cx:"18",cy:"5",r:"3",key:"gq8acd"}],["circle",{cx:"6",cy:"12",r:"3",key:"w7nqdw"}],["circle",{cx:"18",cy:"19",r:"3",key:"1xt0gg"}],["line",{x1:"8.59",x2:"15.42",y1:"13.51",y2:"17.49",key:"47mynk"}],["line",{x1:"15.41",x2:"8.59",y1:"6.51",y2:"10.49",key:"1n3mei"}]],ii=c("share-2",ea);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ta=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"M12 8v4",key:"1got3b"}],["path",{d:"M12 16h.01",key:"1drbdi"}]],ci=c("shield-alert",ta);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const na=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],li=c("shield-check",na);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const aa=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]],di=c("shield",aa);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oa=[["path",{d:"M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z",key:"1wgbhj"}]],ui=c("shirt",oa);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ra=[["path",{d:"M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z",key:"hou9p0"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M16 10a4 4 0 0 1-8 0",key:"1ltviw"}]],fi=c("shopping-bag",ra);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const sa=[["circle",{cx:"8",cy:"21",r:"1",key:"jimo8o"}],["circle",{cx:"19",cy:"21",r:"1",key:"13723u"}],["path",{d:"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12",key:"9zh506"}]],hi=c("shopping-cart",sa);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ia=[["rect",{width:"14",height:"20",x:"5",y:"2",rx:"2",ry:"2",key:"1yt0o3"}],["path",{d:"M12 18h.01",key:"mhygvu"}]],pi=c("smartphone",ia);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ca=[["path",{d:"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",key:"4pj2yx"}],["path",{d:"M20 3v4",key:"1olli1"}],["path",{d:"M22 5h-4",key:"1gvqau"}],["path",{d:"M4 17v2",key:"vumght"}],["path",{d:"M5 18H3",key:"zchphs"}]],yi=c("sparkles",ca);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const la=[["path",{d:"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",key:"1m0v6g"}],["path",{d:"M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",key:"ohrbg2"}]],vi=c("square-pen",la);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const da=[["path",{d:"m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7",key:"ztvudi"}],["path",{d:"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8",key:"1b2hhj"}],["path",{d:"M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4",key:"2ebpfo"}],["path",{d:"M2 7h20",key:"1fcdvo"}],["path",{d:"M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7",key:"6c3vgh"}]],mi=c("store",da);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ua=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"6",key:"1vlfrh"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]],gi=c("target",ua);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fa=[["path",{d:"M17 14V2",key:"8ymqnk"}],["path",{d:"M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z",key:"m61m77"}]],bi=c("thumbs-down",fa);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ha=[["path",{d:"M7 10v12",key:"1qc93n"}],["path",{d:"M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z",key:"emmmcr"}]],ki=c("thumbs-up",ha);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pa=[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]],xi=c("trash-2",pa);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ya=[["polyline",{points:"22 17 13.5 8.5 8.5 13.5 2 7",key:"1r2t7k"}],["polyline",{points:"16 17 22 17 22 11",key:"11uiuu"}]],wi=c("trending-down",ya);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const va=[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]],_i=c("trending-up",va);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ma=[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]],Mi=c("triangle-alert",ma);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ga=[["path",{d:"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2",key:"wrbu53"}],["path",{d:"M15 18H9",key:"1lyqi6"}],["path",{d:"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14",key:"lysw3i"}],["circle",{cx:"17",cy:"18",r:"2",key:"332jqn"}],["circle",{cx:"7",cy:"18",r:"2",key:"19iecd"}]],Ei=c("truck",ga);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ba=[["path",{d:"M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z",key:"pff0z6"}]],Ni=c("twitter",ba);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ka=[["polyline",{points:"4 7 4 4 20 4 20 7",key:"1nosan"}],["line",{x1:"9",x2:"15",y1:"20",y2:"20",key:"swin9y"}],["line",{x1:"12",x2:"12",y1:"4",y2:"20",key:"1tx1rr"}]],Ci=c("type",ka);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xa=[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"17 8 12 3 7 8",key:"t8dd8p"}],["line",{x1:"12",x2:"12",y1:"3",y2:"15",key:"widbto"}]],Si=c("upload",xa);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wa=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"19",x2:"19",y1:"8",y2:"14",key:"1bvyxn"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]],Ri=c("user-plus",wa);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _a=[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]],Ai=c("user",_a);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ma=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]],Pi=c("users",Ma);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ea=[["path",{d:"m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5",key:"ftymec"}],["rect",{x:"2",y:"6",width:"14",height:"12",rx:"2",key:"158x01"}]],$i=c("video",Ea);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Na=[["path",{d:"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z",key:"uqj9uw"}],["path",{d:"M16 9a5 5 0 0 1 0 6",key:"1q6k2b"}],["path",{d:"M19.364 18.364a9 9 0 0 0 0-12.728",key:"ijwkga"}]],Oi=c("volume-2",Na);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ca=[["path",{d:"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z",key:"uqj9uw"}],["line",{x1:"22",x2:"16",y1:"9",y2:"15",key:"1ewh16"}],["line",{x1:"16",x2:"22",y1:"9",y2:"15",key:"5ykzw1"}]],Di=c("volume-x",Ca);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Sa=[["path",{d:"m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72",key:"ul74o6"}],["path",{d:"m14 7 3 3",key:"1r5n42"}],["path",{d:"M5 6v4",key:"ilb8ba"}],["path",{d:"M19 14v4",key:"blhpug"}],["path",{d:"M10 2v2",key:"7u0qdc"}],["path",{d:"M7 8H3",key:"zfb6yr"}],["path",{d:"M21 16h-4",key:"1cnmox"}],["path",{d:"M11 3H9",key:"1obp7u"}]],Ti=c("wand-sparkles",Sa);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ra=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],Li=c("x",Ra);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Aa=[["path",{d:"M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17",key:"1q2vi4"}],["path",{d:"m10 15 5-3-5-3z",key:"1jp15x"}]],ji=c("youtube",Aa);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pa=[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]],Ii=c("zap",Pa);function $a(e){if(typeof document>"u")return;let t=document.head||document.getElementsByTagName("head")[0],n=document.createElement("style");n.type="text/css",t.appendChild(n),n.styleSheet?n.styleSheet.cssText=e:n.appendChild(document.createTextNode(e))}Array(12).fill(0);let he=1;class Oa{constructor(){this.subscribe=t=>(this.subscribers.push(t),()=>{const n=this.subscribers.indexOf(t);this.subscribers.splice(n,1)}),this.publish=t=>{this.subscribers.forEach(n=>n(t))},this.addToast=t=>{this.publish(t),this.toasts=[...this.toasts,t]},this.create=t=>{var n;const{message:a,...o}=t,r=typeof t?.id=="number"||((n=t.id)==null?void 0:n.length)>0?t.id:he++,l=this.toasts.find(u=>u.id===r),i=t.dismissible===void 0?!0:t.dismissible;return this.dismissedToasts.has(r)&&this.dismissedToasts.delete(r),l?this.toasts=this.toasts.map(u=>u.id===r?(this.publish({...u,...t,id:r,title:a}),{...u,...t,id:r,dismissible:i,title:a}):u):this.addToast({title:a,...o,dismissible:i,id:r}),r},this.dismiss=t=>(t?(this.dismissedToasts.add(t),requestAnimationFrame(()=>this.subscribers.forEach(n=>n({id:t,dismiss:!0})))):this.toasts.forEach(n=>{this.subscribers.forEach(a=>a({id:n.id,dismiss:!0}))}),t),this.message=(t,n)=>this.create({...n,message:t}),this.error=(t,n)=>this.create({...n,message:t,type:"error"}),this.success=(t,n)=>this.create({...n,type:"success",message:t}),this.info=(t,n)=>this.create({...n,type:"info",message:t}),this.warning=(t,n)=>this.create({...n,type:"warning",message:t}),this.loading=(t,n)=>this.create({...n,type:"loading",message:t}),this.promise=(t,n)=>{if(!n)return;let a;n.loading!==void 0&&(a=this.create({...n,promise:t,type:"loading",message:n.loading,description:typeof n.description!="function"?n.description:void 0}));const o=Promise.resolve(t instanceof Function?t():t);let r=a!==void 0,l;const i=o.then(async d=>{if(l=["resolve",d],H.isValidElement(d))r=!1,this.create({id:a,type:"default",message:d});else if(Ta(d)&&!d.ok){r=!1;const f=typeof n.error=="function"?await n.error(`HTTP error! status: ${d.status}`):n.error,y=typeof n.description=="function"?await n.description(`HTTP error! status: ${d.status}`):n.description,k=typeof f=="object"&&!H.isValidElement(f)?f:{message:f};this.create({id:a,type:"error",description:y,...k})}else if(d instanceof Error){r=!1;const f=typeof n.error=="function"?await n.error(d):n.error,y=typeof n.description=="function"?await n.description(d):n.description,k=typeof f=="object"&&!H.isValidElement(f)?f:{message:f};this.create({id:a,type:"error",description:y,...k})}else if(n.success!==void 0){r=!1;const f=typeof n.success=="function"?await n.success(d):n.success,y=typeof n.description=="function"?await n.description(d):n.description,k=typeof f=="object"&&!H.isValidElement(f)?f:{message:f};this.create({id:a,type:"success",description:y,...k})}}).catch(async d=>{if(l=["reject",d],n.error!==void 0){r=!1;const h=typeof n.error=="function"?await n.error(d):n.error,f=typeof n.description=="function"?await n.description(d):n.description,v=typeof h=="object"&&!H.isValidElement(h)?h:{message:h};this.create({id:a,type:"error",description:f,...v})}}).finally(()=>{r&&(this.dismiss(a),a=void 0),n.finally==null||n.finally.call(n)}),u=()=>new Promise((d,h)=>i.then(()=>l[0]==="reject"?h(l[1]):d(l[1])).catch(h));return typeof a!="string"&&typeof a!="number"?{unwrap:u}:Object.assign(a,{unwrap:u})},this.custom=(t,n)=>{const a=n?.id||he++;return this.create({jsx:t(a),id:a,...n}),a},this.getActiveToasts=()=>this.toasts.filter(t=>!this.dismissedToasts.has(t.id)),this.subscribers=[],this.toasts=[],this.dismissedToasts=new Set}}const N=new Oa,Da=(e,t)=>{const n=t?.id||he++;return N.addToast({title:e,...t,id:n}),n},Ta=e=>e&&typeof e=="object"&&"ok"in e&&typeof e.ok=="boolean"&&"status"in e&&typeof e.status=="number",La=Da,ja=()=>N.toasts,Ia=()=>N.getActiveToasts(),zi=Object.assign(La,{success:N.success,info:N.info,warning:N.warning,error:N.error,custom:N.custom,message:N.message,promise:N.promise,dismiss:N.dismiss,loading:N.loading},{getHistory:ja,getToasts:Ia});$a("[data-sonner-toaster][dir=ltr],html[dir=ltr]{--toast-icon-margin-start:-3px;--toast-icon-margin-end:4px;--toast-svg-margin-start:-1px;--toast-svg-margin-end:0px;--toast-button-margin-start:auto;--toast-button-margin-end:0;--toast-close-button-start:0;--toast-close-button-end:unset;--toast-close-button-transform:translate(-35%, -35%)}[data-sonner-toaster][dir=rtl],html[dir=rtl]{--toast-icon-margin-start:4px;--toast-icon-margin-end:-3px;--toast-svg-margin-start:0px;--toast-svg-margin-end:-1px;--toast-button-margin-start:0;--toast-button-margin-end:auto;--toast-close-button-start:unset;--toast-close-button-end:0;--toast-close-button-transform:translate(35%, -35%)}[data-sonner-toaster]{position:fixed;width:var(--width);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;--gray1:hsl(0, 0%, 99%);--gray2:hsl(0, 0%, 97.3%);--gray3:hsl(0, 0%, 95.1%);--gray4:hsl(0, 0%, 93%);--gray5:hsl(0, 0%, 90.9%);--gray6:hsl(0, 0%, 88.7%);--gray7:hsl(0, 0%, 85.8%);--gray8:hsl(0, 0%, 78%);--gray9:hsl(0, 0%, 56.1%);--gray10:hsl(0, 0%, 52.3%);--gray11:hsl(0, 0%, 43.5%);--gray12:hsl(0, 0%, 9%);--border-radius:8px;box-sizing:border-box;padding:0;margin:0;list-style:none;outline:0;z-index:999999999;transition:transform .4s ease}@media (hover:none) and (pointer:coarse){[data-sonner-toaster][data-lifted=true]{transform:none}}[data-sonner-toaster][data-x-position=right]{right:var(--offset-right)}[data-sonner-toaster][data-x-position=left]{left:var(--offset-left)}[data-sonner-toaster][data-x-position=center]{left:50%;transform:translateX(-50%)}[data-sonner-toaster][data-y-position=top]{top:var(--offset-top)}[data-sonner-toaster][data-y-position=bottom]{bottom:var(--offset-bottom)}[data-sonner-toast]{--y:translateY(100%);--lift-amount:calc(var(--lift) * var(--gap));z-index:var(--z-index);position:absolute;opacity:0;transform:var(--y);touch-action:none;transition:transform .4s,opacity .4s,height .4s,box-shadow .2s;box-sizing:border-box;outline:0;overflow-wrap:anywhere}[data-sonner-toast][data-styled=true]{padding:16px;background:var(--normal-bg);border:1px solid var(--normal-border);color:var(--normal-text);border-radius:var(--border-radius);box-shadow:0 4px 12px rgba(0,0,0,.1);width:var(--width);font-size:13px;display:flex;align-items:center;gap:6px}[data-sonner-toast]:focus-visible{box-shadow:0 4px 12px rgba(0,0,0,.1),0 0 0 2px rgba(0,0,0,.2)}[data-sonner-toast][data-y-position=top]{top:0;--y:translateY(-100%);--lift:1;--lift-amount:calc(1 * var(--gap))}[data-sonner-toast][data-y-position=bottom]{bottom:0;--y:translateY(100%);--lift:-1;--lift-amount:calc(var(--lift) * var(--gap))}[data-sonner-toast][data-styled=true] [data-description]{font-weight:400;line-height:1.4;color:#3f3f3f}[data-rich-colors=true][data-sonner-toast][data-styled=true] [data-description]{color:inherit}[data-sonner-toaster][data-sonner-theme=dark] [data-description]{color:#e8e8e8}[data-sonner-toast][data-styled=true] [data-title]{font-weight:500;line-height:1.5;color:inherit}[data-sonner-toast][data-styled=true] [data-icon]{display:flex;height:16px;width:16px;position:relative;justify-content:flex-start;align-items:center;flex-shrink:0;margin-left:var(--toast-icon-margin-start);margin-right:var(--toast-icon-margin-end)}[data-sonner-toast][data-promise=true] [data-icon]>svg{opacity:0;transform:scale(.8);transform-origin:center;animation:sonner-fade-in .3s ease forwards}[data-sonner-toast][data-styled=true] [data-icon]>*{flex-shrink:0}[data-sonner-toast][data-styled=true] [data-icon] svg{margin-left:var(--toast-svg-margin-start);margin-right:var(--toast-svg-margin-end)}[data-sonner-toast][data-styled=true] [data-content]{display:flex;flex-direction:column;gap:2px}[data-sonner-toast][data-styled=true] [data-button]{border-radius:4px;padding-left:8px;padding-right:8px;height:24px;font-size:12px;color:var(--normal-bg);background:var(--normal-text);margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end);border:none;font-weight:500;cursor:pointer;outline:0;display:flex;align-items:center;flex-shrink:0;transition:opacity .4s,box-shadow .2s}[data-sonner-toast][data-styled=true] [data-button]:focus-visible{box-shadow:0 0 0 2px rgba(0,0,0,.4)}[data-sonner-toast][data-styled=true] [data-button]:first-of-type{margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end)}[data-sonner-toast][data-styled=true] [data-cancel]{color:var(--normal-text);background:rgba(0,0,0,.08)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast][data-styled=true] [data-cancel]{background:rgba(255,255,255,.3)}[data-sonner-toast][data-styled=true] [data-close-button]{position:absolute;left:var(--toast-close-button-start);right:var(--toast-close-button-end);top:0;height:20px;width:20px;display:flex;justify-content:center;align-items:center;padding:0;color:var(--gray12);background:var(--normal-bg);border:1px solid var(--gray4);transform:var(--toast-close-button-transform);border-radius:50%;cursor:pointer;z-index:1;transition:opacity .1s,background .2s,border-color .2s}[data-sonner-toast][data-styled=true] [data-close-button]:focus-visible{box-shadow:0 4px 12px rgba(0,0,0,.1),0 0 0 2px rgba(0,0,0,.2)}[data-sonner-toast][data-styled=true] [data-disabled=true]{cursor:not-allowed}[data-sonner-toast][data-styled=true]:hover [data-close-button]:hover{background:var(--gray2);border-color:var(--gray5)}[data-sonner-toast][data-swiping=true]::before{content:'';position:absolute;left:-100%;right:-100%;height:100%;z-index:-1}[data-sonner-toast][data-y-position=top][data-swiping=true]::before{bottom:50%;transform:scaleY(3) translateY(50%)}[data-sonner-toast][data-y-position=bottom][data-swiping=true]::before{top:50%;transform:scaleY(3) translateY(-50%)}[data-sonner-toast][data-swiping=false][data-removed=true]::before{content:'';position:absolute;inset:0;transform:scaleY(2)}[data-sonner-toast][data-expanded=true]::after{content:'';position:absolute;left:0;height:calc(var(--gap) + 1px);bottom:100%;width:100%}[data-sonner-toast][data-mounted=true]{--y:translateY(0);opacity:1}[data-sonner-toast][data-expanded=false][data-front=false]{--scale:var(--toasts-before) * 0.05 + 1;--y:translateY(calc(var(--lift-amount) * var(--toasts-before))) scale(calc(-1 * var(--scale)));height:var(--front-toast-height)}[data-sonner-toast]>*{transition:opacity .4s}[data-sonner-toast][data-x-position=right]{right:0}[data-sonner-toast][data-x-position=left]{left:0}[data-sonner-toast][data-expanded=false][data-front=false][data-styled=true]>*{opacity:0}[data-sonner-toast][data-visible=false]{opacity:0;pointer-events:none}[data-sonner-toast][data-mounted=true][data-expanded=true]{--y:translateY(calc(var(--lift) * var(--offset)));height:var(--initial-height)}[data-sonner-toast][data-removed=true][data-front=true][data-swipe-out=false]{--y:translateY(calc(var(--lift) * -100%));opacity:0}[data-sonner-toast][data-removed=true][data-front=false][data-swipe-out=false][data-expanded=true]{--y:translateY(calc(var(--lift) * var(--offset) + var(--lift) * -100%));opacity:0}[data-sonner-toast][data-removed=true][data-front=false][data-swipe-out=false][data-expanded=false]{--y:translateY(40%);opacity:0;transition:transform .5s,opacity .2s}[data-sonner-toast][data-removed=true][data-front=false]::before{height:calc(var(--initial-height) + 20%)}[data-sonner-toast][data-swiping=true]{transform:var(--y) translateY(var(--swipe-amount-y,0)) translateX(var(--swipe-amount-x,0));transition:none}[data-sonner-toast][data-swiped=true]{user-select:none}[data-sonner-toast][data-swipe-out=true][data-y-position=bottom],[data-sonner-toast][data-swipe-out=true][data-y-position=top]{animation-duration:.2s;animation-timing-function:ease-out;animation-fill-mode:forwards}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=left]{animation-name:swipe-out-left}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=right]{animation-name:swipe-out-right}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=up]{animation-name:swipe-out-up}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=down]{animation-name:swipe-out-down}@keyframes swipe-out-left{from{transform:var(--y) translateX(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translateX(calc(var(--swipe-amount-x) - 100%));opacity:0}}@keyframes swipe-out-right{from{transform:var(--y) translateX(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translateX(calc(var(--swipe-amount-x) + 100%));opacity:0}}@keyframes swipe-out-up{from{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) - 100%));opacity:0}}@keyframes swipe-out-down{from{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) + 100%));opacity:0}}@media (max-width:600px){[data-sonner-toaster]{position:fixed;right:var(--mobile-offset-right);left:var(--mobile-offset-left);width:100%}[data-sonner-toaster][dir=rtl]{left:calc(var(--mobile-offset-left) * -1)}[data-sonner-toaster] [data-sonner-toast]{left:0;right:0;width:calc(100% - var(--mobile-offset-left) * 2)}[data-sonner-toaster][data-x-position=left]{left:var(--mobile-offset-left)}[data-sonner-toaster][data-y-position=bottom]{bottom:var(--mobile-offset-bottom)}[data-sonner-toaster][data-y-position=top]{top:var(--mobile-offset-top)}[data-sonner-toaster][data-x-position=center]{left:var(--mobile-offset-left);right:var(--mobile-offset-right);transform:none}}[data-sonner-toaster][data-sonner-theme=light]{--normal-bg:#fff;--normal-border:var(--gray4);--normal-text:var(--gray12);--success-bg:hsl(143, 85%, 96%);--success-border:hsl(145, 92%, 87%);--success-text:hsl(140, 100%, 27%);--info-bg:hsl(208, 100%, 97%);--info-border:hsl(221, 91%, 93%);--info-text:hsl(210, 92%, 45%);--warning-bg:hsl(49, 100%, 97%);--warning-border:hsl(49, 91%, 84%);--warning-text:hsl(31, 92%, 45%);--error-bg:hsl(359, 100%, 97%);--error-border:hsl(359, 100%, 94%);--error-text:hsl(360, 100%, 45%)}[data-sonner-toaster][data-sonner-theme=light] [data-sonner-toast][data-invert=true]{--normal-bg:#000;--normal-border:hsl(0, 0%, 20%);--normal-text:var(--gray1)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast][data-invert=true]{--normal-bg:#fff;--normal-border:var(--gray3);--normal-text:var(--gray12)}[data-sonner-toaster][data-sonner-theme=dark]{--normal-bg:#000;--normal-bg-hover:hsl(0, 0%, 12%);--normal-border:hsl(0, 0%, 20%);--normal-border-hover:hsl(0, 0%, 25%);--normal-text:var(--gray1);--success-bg:hsl(150, 100%, 6%);--success-border:hsl(147, 100%, 12%);--success-text:hsl(150, 86%, 65%);--info-bg:hsl(215, 100%, 6%);--info-border:hsl(223, 43%, 17%);--info-text:hsl(216, 87%, 65%);--warning-bg:hsl(64, 100%, 6%);--warning-border:hsl(60, 100%, 9%);--warning-text:hsl(46, 87%, 65%);--error-bg:hsl(358, 76%, 10%);--error-border:hsl(357, 89%, 16%);--error-text:hsl(358, 100%, 81%)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast] [data-close-button]{background:var(--normal-bg);border-color:var(--normal-border);color:var(--normal-text)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast] [data-close-button]:hover{background:var(--normal-bg-hover);border-color:var(--normal-border-hover)}[data-rich-colors=true][data-sonner-toast][data-type=success]{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text)}[data-rich-colors=true][data-sonner-toast][data-type=success] [data-close-button]{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text)}[data-rich-colors=true][data-sonner-toast][data-type=info]{background:var(--info-bg);border-color:var(--info-border);color:var(--info-text)}[data-rich-colors=true][data-sonner-toast][data-type=info] [data-close-button]{background:var(--info-bg);border-color:var(--info-border);color:var(--info-text)}[data-rich-colors=true][data-sonner-toast][data-type=warning]{background:var(--warning-bg);border-color:var(--warning-border);color:var(--warning-text)}[data-rich-colors=true][data-sonner-toast][data-type=warning] [data-close-button]{background:var(--warning-bg);border-color:var(--warning-border);color:var(--warning-text)}[data-rich-colors=true][data-sonner-toast][data-type=error]{background:var(--error-bg);border-color:var(--error-border);color:var(--error-text)}[data-rich-colors=true][data-sonner-toast][data-type=error] [data-close-button]{background:var(--error-bg);border-color:var(--error-border);color:var(--error-text)}.sonner-loading-wrapper{--size:16px;height:var(--size);width:var(--size);position:absolute;inset:0;z-index:10}.sonner-loading-wrapper[data-visible=false]{transform-origin:center;animation:sonner-fade-out .2s ease forwards}.sonner-spinner{position:relative;top:50%;left:50%;height:var(--size);width:var(--size)}.sonner-loading-bar{animation:sonner-spin 1.2s linear infinite;background:var(--gray11);border-radius:6px;height:8%;left:-10%;position:absolute;top:-3.9%;width:24%}.sonner-loading-bar:first-child{animation-delay:-1.2s;transform:rotate(.0001deg) translate(146%)}.sonner-loading-bar:nth-child(2){animation-delay:-1.1s;transform:rotate(30deg) translate(146%)}.sonner-loading-bar:nth-child(3){animation-delay:-1s;transform:rotate(60deg) translate(146%)}.sonner-loading-bar:nth-child(4){animation-delay:-.9s;transform:rotate(90deg) translate(146%)}.sonner-loading-bar:nth-child(5){animation-delay:-.8s;transform:rotate(120deg) translate(146%)}.sonner-loading-bar:nth-child(6){animation-delay:-.7s;transform:rotate(150deg) translate(146%)}.sonner-loading-bar:nth-child(7){animation-delay:-.6s;transform:rotate(180deg) translate(146%)}.sonner-loading-bar:nth-child(8){animation-delay:-.5s;transform:rotate(210deg) translate(146%)}.sonner-loading-bar:nth-child(9){animation-delay:-.4s;transform:rotate(240deg) translate(146%)}.sonner-loading-bar:nth-child(10){animation-delay:-.3s;transform:rotate(270deg) translate(146%)}.sonner-loading-bar:nth-child(11){animation-delay:-.2s;transform:rotate(300deg) translate(146%)}.sonner-loading-bar:nth-child(12){animation-delay:-.1s;transform:rotate(330deg) translate(146%)}@keyframes sonner-fade-in{0%{opacity:0;transform:scale(.8)}100%{opacity:1;transform:scale(1)}}@keyframes sonner-fade-out{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.8)}}@keyframes sonner-spin{0%{opacity:1}100%{opacity:.15}}@media (prefers-reduced-motion){.sonner-loading-bar,[data-sonner-toast],[data-sonner-toast]>*{transition:none!important;animation:none!important}}.sonner-loader{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);transform-origin:center;transition:opacity .2s,transform .2s}.sonner-loader[data-visible=false]{opacity:0;transform:scale(.8) translate(-50%,-50%)}");function $(e,t,{checkForDefaultPrevented:n=!0}={}){return function(o){if(e?.(o),n===!1||!o.defaultPrevented)return t?.(o)}}function Me(e,t){if(typeof e=="function")return e(t);e!=null&&(e.current=t)}function ve(...e){return t=>{let n=!1;const a=e.map(o=>{const r=Me(o,t);return!n&&typeof r=="function"&&(n=!0),r});if(n)return()=>{for(let o=0;o<a.length;o++){const r=a[o];typeof r=="function"?r():Me(e[o],null)}}}}function T(...e){return s.useCallback(ve(...e),e)}function za(e,t){const n=s.createContext(t),a=r=>{const{children:l,...i}=r,u=s.useMemo(()=>i,Object.values(i));return g.jsx(n.Provider,{value:u,children:l})};a.displayName=e+"Provider";function o(r){const l=s.useContext(n);if(l)return l;if(t!==void 0)return t;throw new Error(`\`${r}\` must be used within \`${e}\``)}return[a,o]}function Fa(e,t=[]){let n=[];function a(r,l){const i=s.createContext(l),u=n.length;n=[...n,l];const d=f=>{const{scope:y,children:v,...k}=f,p=y?.[e]?.[u]||i,m=s.useMemo(()=>k,Object.values(k));return g.jsx(p.Provider,{value:m,children:v})};d.displayName=r+"Provider";function h(f,y){const v=y?.[e]?.[u]||i,k=s.useContext(v);if(k)return k;if(l!==void 0)return l;throw new Error(`\`${f}\` must be used within \`${r}\``)}return[d,h]}const o=()=>{const r=n.map(l=>s.createContext(l));return function(i){const u=i?.[e]||r;return s.useMemo(()=>({[`__scope${e}`]:{...i,[e]:u}}),[i,u])}};return o.scopeName=e,[a,qa(o,...t)]}function qa(...e){const t=e[0];if(e.length===1)return t;const n=()=>{const a=e.map(o=>({useScope:o(),scopeName:o.scopeName}));return function(r){const l=a.reduce((i,{useScope:u,scopeName:d})=>{const f=u(r)[`__scope${d}`];return{...i,...f}},{});return s.useMemo(()=>({[`__scope${t.scopeName}`]:l}),[l])}};return n.scopeName=t.scopeName,n}var W=globalThis?.document?s.useLayoutEffect:()=>{},Ha=je[" useId ".trim().toString()]||(()=>{}),Va=0;function re(e){const[t,n]=s.useState(Ha());return W(()=>{n(a=>a??String(Va++))},[e]),t?`radix-${t}`:""}var Wa=je[" useInsertionEffect ".trim().toString()]||W;function Ba({prop:e,defaultProp:t,onChange:n=()=>{},caller:a}){const[o,r,l]=Ua({defaultProp:t,onChange:n}),i=e!==void 0,u=i?e:o;{const h=s.useRef(e!==void 0);s.useEffect(()=>{const f=h.current;f!==i&&console.warn(`${a} is changing from ${f?"controlled":"uncontrolled"} to ${i?"controlled":"uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`),h.current=i},[i,a])}const d=s.useCallback(h=>{if(i){const f=Ya(h)?h(e):h;f!==e&&l.current?.(f)}else r(h)},[i,e,r,l]);return[u,d]}function Ua({defaultProp:e,onChange:t}){const[n,a]=s.useState(e),o=s.useRef(n),r=s.useRef(t);return Wa(()=>{r.current=t},[t]),s.useEffect(()=>{o.current!==n&&(r.current?.(n),o.current=n)},[n,o]),[n,a,r]}function Ya(e){return typeof e=="function"}function Za(e){const t=Ka(e),n=s.forwardRef((a,o)=>{const{children:r,...l}=a,i=s.Children.toArray(r),u=i.find(Ga);if(u){const d=u.props.children,h=i.map(f=>f===u?s.Children.count(d)>1?s.Children.only(null):s.isValidElement(d)?d.props.children:null:f);return g.jsx(t,{...l,ref:o,children:s.isValidElement(d)?s.cloneElement(d,void 0,h):null})}return g.jsx(t,{...l,ref:o,children:r})});return n.displayName=`${e}.Slot`,n}function Ka(e){const t=s.forwardRef((n,a)=>{const{children:o,...r}=n;if(s.isValidElement(o)){const l=Qa(o),i=Ja(r,o.props);return o.type!==s.Fragment&&(i.ref=a?ve(a,l):l),s.cloneElement(o,i)}return s.Children.count(o)>1?s.Children.only(null):null});return t.displayName=`${e}.SlotClone`,t}var Xa=Symbol("radix.slottable");function Ga(e){return s.isValidElement(e)&&typeof e.type=="function"&&"__radixId"in e.type&&e.type.__radixId===Xa}function Ja(e,t){const n={...t};for(const a in t){const o=e[a],r=t[a];/^on[A-Z]/.test(a)?o&&r?n[a]=(...i)=>{const u=r(...i);return o(...i),u}:o&&(n[a]=o):a==="style"?n[a]={...o,...r}:a==="className"&&(n[a]=[o,r].filter(Boolean).join(" "))}return{...e,...n}}function Qa(e){let t=Object.getOwnPropertyDescriptor(e.props,"ref")?.get,n=t&&"isReactWarning"in t&&t.isReactWarning;return n?e.ref:(t=Object.getOwnPropertyDescriptor(e,"ref")?.get,n=t&&"isReactWarning"in t&&t.isReactWarning,n?e.props.ref:e.props.ref||e.ref)}var eo=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"],A=eo.reduce((e,t)=>{const n=Za(`Primitive.${t}`),a=s.forwardRef((o,r)=>{const{asChild:l,...i}=o,u=l?n:t;return typeof window<"u"&&(window[Symbol.for("radix-ui")]=!0),g.jsx(u,{...i,ref:r})});return a.displayName=`Primitive.${t}`,{...e,[t]:a}},{});function to(e,t){e&&ht.flushSync(()=>e.dispatchEvent(t))}function B(e){const t=s.useRef(e);return s.useEffect(()=>{t.current=e}),s.useMemo(()=>(...n)=>t.current?.(...n),[])}function no(e,t=globalThis?.document){const n=B(e);s.useEffect(()=>{const a=o=>{o.key==="Escape"&&n(o)};return t.addEventListener("keydown",a,{capture:!0}),()=>t.removeEventListener("keydown",a,{capture:!0})},[n,t])}var ao="DismissableLayer",pe="dismissableLayer.update",oo="dismissableLayer.pointerDownOutside",ro="dismissableLayer.focusOutside",Ee,ze=s.createContext({layers:new Set,layersWithOutsidePointerEventsDisabled:new Set,branches:new Set}),Fe=s.forwardRef((e,t)=>{const{disableOutsidePointerEvents:n=!1,onEscapeKeyDown:a,onPointerDownOutside:o,onFocusOutside:r,onInteractOutside:l,onDismiss:i,...u}=e,d=s.useContext(ze),[h,f]=s.useState(null),y=h?.ownerDocument??globalThis?.document,[,v]=s.useState({}),k=T(t,x=>f(x)),p=Array.from(d.layers),[m]=[...d.layersWithOutsidePointerEventsDisabled].slice(-1),b=p.indexOf(m),w=h?p.indexOf(h):-1,_=d.layersWithOutsidePointerEventsDisabled.size>0,M=w>=b,E=co(x=>{const O=x.target,L=[...d.branches].some(q=>q.contains(O));!M||L||(o?.(x),l?.(x),x.defaultPrevented||i?.())},y),C=lo(x=>{const O=x.target;[...d.branches].some(q=>q.contains(O))||(r?.(x),l?.(x),x.defaultPrevented||i?.())},y);return no(x=>{w===d.layers.size-1&&(a?.(x),!x.defaultPrevented&&i&&(x.preventDefault(),i()))},y),s.useEffect(()=>{if(h)return n&&(d.layersWithOutsidePointerEventsDisabled.size===0&&(Ee=y.body.style.pointerEvents,y.body.style.pointerEvents="none"),d.layersWithOutsidePointerEventsDisabled.add(h)),d.layers.add(h),Ne(),()=>{n&&d.layersWithOutsidePointerEventsDisabled.size===1&&(y.body.style.pointerEvents=Ee)}},[h,y,n,d]),s.useEffect(()=>()=>{h&&(d.layers.delete(h),d.layersWithOutsidePointerEventsDisabled.delete(h),Ne())},[h,d]),s.useEffect(()=>{const x=()=>v({});return document.addEventListener(pe,x),()=>document.removeEventListener(pe,x)},[]),g.jsx(A.div,{...u,ref:k,style:{pointerEvents:_?M?"auto":"none":void 0,...e.style},onFocusCapture:$(e.onFocusCapture,C.onFocusCapture),onBlurCapture:$(e.onBlurCapture,C.onBlurCapture),onPointerDownCapture:$(e.onPointerDownCapture,E.onPointerDownCapture)})});Fe.displayName=ao;var so="DismissableLayerBranch",io=s.forwardRef((e,t)=>{const n=s.useContext(ze),a=s.useRef(null),o=T(t,a);return s.useEffect(()=>{const r=a.current;if(r)return n.branches.add(r),()=>{n.branches.delete(r)}},[n.branches]),g.jsx(A.div,{...e,ref:o})});io.displayName=so;function co(e,t=globalThis?.document){const n=B(e),a=s.useRef(!1),o=s.useRef(()=>{});return s.useEffect(()=>{const r=i=>{if(i.target&&!a.current){let u=function(){qe(oo,n,d,{discrete:!0})};const d={originalEvent:i};i.pointerType==="touch"?(t.removeEventListener("click",o.current),o.current=u,t.addEventListener("click",o.current,{once:!0})):u()}else t.removeEventListener("click",o.current);a.current=!1},l=window.setTimeout(()=>{t.addEventListener("pointerdown",r)},0);return()=>{window.clearTimeout(l),t.removeEventListener("pointerdown",r),t.removeEventListener("click",o.current)}},[t,n]),{onPointerDownCapture:()=>a.current=!0}}function lo(e,t=globalThis?.document){const n=B(e),a=s.useRef(!1);return s.useEffect(()=>{const o=r=>{r.target&&!a.current&&qe(ro,n,{originalEvent:r},{discrete:!1})};return t.addEventListener("focusin",o),()=>t.removeEventListener("focusin",o)},[t,n]),{onFocusCapture:()=>a.current=!0,onBlurCapture:()=>a.current=!1}}function Ne(){const e=new CustomEvent(pe);document.dispatchEvent(e)}function qe(e,t,n,{discrete:a}){const o=n.originalEvent.target,r=new CustomEvent(e,{bubbles:!1,cancelable:!0,detail:n});t&&o.addEventListener(e,t,{once:!0}),a?to(o,r):o.dispatchEvent(r)}var se="focusScope.autoFocusOnMount",ie="focusScope.autoFocusOnUnmount",Ce={bubbles:!1,cancelable:!0},uo="FocusScope",He=s.forwardRef((e,t)=>{const{loop:n=!1,trapped:a=!1,onMountAutoFocus:o,onUnmountAutoFocus:r,...l}=e,[i,u]=s.useState(null),d=B(o),h=B(r),f=s.useRef(null),y=T(t,p=>u(p)),v=s.useRef({paused:!1,pause(){this.paused=!0},resume(){this.paused=!1}}).current;s.useEffect(()=>{if(a){let p=function(_){if(v.paused||!i)return;const M=_.target;i.contains(M)?f.current=M:P(f.current,{select:!0})},m=function(_){if(v.paused||!i)return;const M=_.relatedTarget;M!==null&&(i.contains(M)||P(f.current,{select:!0}))},b=function(_){if(document.activeElement===document.body)for(const E of _)E.removedNodes.length>0&&P(i)};document.addEventListener("focusin",p),document.addEventListener("focusout",m);const w=new MutationObserver(b);return i&&w.observe(i,{childList:!0,subtree:!0}),()=>{document.removeEventListener("focusin",p),document.removeEventListener("focusout",m),w.disconnect()}}},[a,i,v.paused]),s.useEffect(()=>{if(i){Re.add(v);const p=document.activeElement;if(!i.contains(p)){const b=new CustomEvent(se,Ce);i.addEventListener(se,d),i.dispatchEvent(b),b.defaultPrevented||(fo(mo(Ve(i)),{select:!0}),document.activeElement===p&&P(i))}return()=>{i.removeEventListener(se,d),setTimeout(()=>{const b=new CustomEvent(ie,Ce);i.addEventListener(ie,h),i.dispatchEvent(b),b.defaultPrevented||P(p??document.body,{select:!0}),i.removeEventListener(ie,h),Re.remove(v)},0)}}},[i,d,h,v]);const k=s.useCallback(p=>{if(!n&&!a||v.paused)return;const m=p.key==="Tab"&&!p.altKey&&!p.ctrlKey&&!p.metaKey,b=document.activeElement;if(m&&b){const w=p.currentTarget,[_,M]=ho(w);_&&M?!p.shiftKey&&b===M?(p.preventDefault(),n&&P(_,{select:!0})):p.shiftKey&&b===_&&(p.preventDefault(),n&&P(M,{select:!0})):b===w&&p.preventDefault()}},[n,a,v.paused]);return g.jsx(A.div,{tabIndex:-1,...l,ref:y,onKeyDown:k})});He.displayName=uo;function fo(e,{select:t=!1}={}){const n=document.activeElement;for(const a of e)if(P(a,{select:t}),document.activeElement!==n)return}function ho(e){const t=Ve(e),n=Se(t,e),a=Se(t.reverse(),e);return[n,a]}function Ve(e){const t=[],n=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,{acceptNode:a=>{const o=a.tagName==="INPUT"&&a.type==="hidden";return a.disabled||a.hidden||o?NodeFilter.FILTER_SKIP:a.tabIndex>=0?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP}});for(;n.nextNode();)t.push(n.currentNode);return t}function Se(e,t){for(const n of e)if(!po(n,{upTo:t}))return n}function po(e,{upTo:t}){if(getComputedStyle(e).visibility==="hidden")return!0;for(;e;){if(t!==void 0&&e===t)return!1;if(getComputedStyle(e).display==="none")return!0;e=e.parentElement}return!1}function yo(e){return e instanceof HTMLInputElement&&"select"in e}function P(e,{select:t=!1}={}){if(e&&e.focus){const n=document.activeElement;e.focus({preventScroll:!0}),e!==n&&yo(e)&&t&&e.select()}}var Re=vo();function vo(){let e=[];return{add(t){const n=e[0];t!==n&&n?.pause(),e=Ae(e,t),e.unshift(t)},remove(t){e=Ae(e,t),e[0]?.resume()}}}function Ae(e,t){const n=[...e],a=n.indexOf(t);return a!==-1&&n.splice(a,1),n}function mo(e){return e.filter(t=>t.tagName!=="A")}var go="Portal",We=s.forwardRef((e,t)=>{const{container:n,...a}=e,[o,r]=s.useState(!1);W(()=>r(!0),[]);const l=n||o&&globalThis?.document?.body;return l?pt.createPortal(g.jsx(A.div,{...a,ref:t}),l):null});We.displayName=go;function bo(e,t){return s.useReducer((n,a)=>t[n][a]??n,e)}var te=e=>{const{present:t,children:n}=e,a=ko(t),o=typeof n=="function"?n({present:a.isPresent}):s.Children.only(n),r=T(a.ref,xo(o));return typeof n=="function"||a.isPresent?s.cloneElement(o,{ref:r}):null};te.displayName="Presence";function ko(e){const[t,n]=s.useState(),a=s.useRef(null),o=s.useRef(e),r=s.useRef("none"),l=e?"mounted":"unmounted",[i,u]=bo(l,{mounted:{UNMOUNT:"unmounted",ANIMATION_OUT:"unmountSuspended"},unmountSuspended:{MOUNT:"mounted",ANIMATION_END:"unmounted"},unmounted:{MOUNT:"mounted"}});return s.useEffect(()=>{const d=Y(a.current);r.current=i==="mounted"?d:"none"},[i]),W(()=>{const d=a.current,h=o.current;if(h!==e){const y=r.current,v=Y(d);e?u("MOUNT"):v==="none"||d?.display==="none"?u("UNMOUNT"):u(h&&y!==v?"ANIMATION_OUT":"UNMOUNT"),o.current=e}},[e,u]),W(()=>{if(t){let d;const h=t.ownerDocument.defaultView??window,f=v=>{const p=Y(a.current).includes(CSS.escape(v.animationName));if(v.target===t&&p&&(u("ANIMATION_END"),!o.current)){const m=t.style.animationFillMode;t.style.animationFillMode="forwards",d=h.setTimeout(()=>{t.style.animationFillMode==="forwards"&&(t.style.animationFillMode=m)})}},y=v=>{v.target===t&&(r.current=Y(a.current))};return t.addEventListener("animationstart",y),t.addEventListener("animationcancel",f),t.addEventListener("animationend",f),()=>{h.clearTimeout(d),t.removeEventListener("animationstart",y),t.removeEventListener("animationcancel",f),t.removeEventListener("animationend",f)}}else u("ANIMATION_END")},[t,u]),{isPresent:["mounted","unmountSuspended"].includes(i),ref:s.useCallback(d=>{a.current=d?getComputedStyle(d):null,n(d)},[])}}function Y(e){return e?.animationName||"none"}function xo(e){let t=Object.getOwnPropertyDescriptor(e.props,"ref")?.get,n=t&&"isReactWarning"in t&&t.isReactWarning;return n?e.ref:(t=Object.getOwnPropertyDescriptor(e,"ref")?.get,n=t&&"isReactWarning"in t&&t.isReactWarning,n?e.props.ref:e.props.ref||e.ref)}var ce=0;function wo(){s.useEffect(()=>{const e=document.querySelectorAll("[data-radix-focus-guard]");return document.body.insertAdjacentElement("afterbegin",e[0]??Pe()),document.body.insertAdjacentElement("beforeend",e[1]??Pe()),ce++,()=>{ce===1&&document.querySelectorAll("[data-radix-focus-guard]").forEach(t=>t.remove()),ce--}},[])}function Pe(){const e=document.createElement("span");return e.setAttribute("data-radix-focus-guard",""),e.tabIndex=0,e.style.outline="none",e.style.opacity="0",e.style.position="fixed",e.style.pointerEvents="none",e}var R=function(){return R=Object.assign||function(t){for(var n,a=1,o=arguments.length;a<o;a++){n=arguments[a];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(t[r]=n[r])}return t},R.apply(this,arguments)};function Be(e,t){var n={};for(var a in e)Object.prototype.hasOwnProperty.call(e,a)&&t.indexOf(a)<0&&(n[a]=e[a]);if(e!=null&&typeof Object.getOwnPropertySymbols=="function")for(var o=0,a=Object.getOwnPropertySymbols(e);o<a.length;o++)t.indexOf(a[o])<0&&Object.prototype.propertyIsEnumerable.call(e,a[o])&&(n[a[o]]=e[a[o]]);return n}function _o(e,t,n){if(n||arguments.length===2)for(var a=0,o=t.length,r;a<o;a++)(r||!(a in t))&&(r||(r=Array.prototype.slice.call(t,0,a)),r[a]=t[a]);return e.concat(r||Array.prototype.slice.call(t))}var J="right-scroll-bar-position",Q="width-before-scroll-bar",Mo="with-scroll-bars-hidden",Eo="--removed-body-scroll-bar-size";function le(e,t){return typeof e=="function"?e(t):e&&(e.current=t),e}function No(e,t){var n=s.useState(function(){return{value:e,callback:t,facade:{get current(){return n.value},set current(a){var o=n.value;o!==a&&(n.value=a,n.callback(a,o))}}}})[0];return n.callback=t,n.facade}var Co=typeof window<"u"?s.useLayoutEffect:s.useEffect,$e=new WeakMap;function So(e,t){var n=No(null,function(a){return e.forEach(function(o){return le(o,a)})});return Co(function(){var a=$e.get(n);if(a){var o=new Set(a),r=new Set(e),l=n.current;o.forEach(function(i){r.has(i)||le(i,null)}),r.forEach(function(i){o.has(i)||le(i,l)})}$e.set(n,e)},[e]),n}function Ro(e){return e}function Ao(e,t){t===void 0&&(t=Ro);var n=[],a=!1,o={read:function(){if(a)throw new Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");return n.length?n[n.length-1]:e},useMedium:function(r){var l=t(r,a);return n.push(l),function(){n=n.filter(function(i){return i!==l})}},assignSyncMedium:function(r){for(a=!0;n.length;){var l=n;n=[],l.forEach(r)}n={push:function(i){return r(i)},filter:function(){return n}}},assignMedium:function(r){a=!0;var l=[];if(n.length){var i=n;n=[],i.forEach(r),l=n}var u=function(){var h=l;l=[],h.forEach(r)},d=function(){return Promise.resolve().then(u)};d(),n={push:function(h){l.push(h),d()},filter:function(h){return l=l.filter(h),n}}}};return o}function Po(e){e===void 0&&(e={});var t=Ao(null);return t.options=R({async:!0,ssr:!1},e),t}var Ue=function(e){var t=e.sideCar,n=Be(e,["sideCar"]);if(!t)throw new Error("Sidecar: please provide `sideCar` property to import the right car");var a=t.read();if(!a)throw new Error("Sidecar medium not found");return s.createElement(a,R({},n))};Ue.isSideCarExport=!0;function $o(e,t){return e.useMedium(t),Ue}var Ye=Po(),de=function(){},ne=s.forwardRef(function(e,t){var n=s.useRef(null),a=s.useState({onScrollCapture:de,onWheelCapture:de,onTouchMoveCapture:de}),o=a[0],r=a[1],l=e.forwardProps,i=e.children,u=e.className,d=e.removeScrollBar,h=e.enabled,f=e.shards,y=e.sideCar,v=e.noRelative,k=e.noIsolation,p=e.inert,m=e.allowPinchZoom,b=e.as,w=b===void 0?"div":b,_=e.gapMode,M=Be(e,["forwardProps","children","className","removeScrollBar","enabled","shards","sideCar","noRelative","noIsolation","inert","allowPinchZoom","as","gapMode"]),E=y,C=So([n,t]),x=R(R({},M),o);return s.createElement(s.Fragment,null,h&&s.createElement(E,{sideCar:Ye,removeScrollBar:d,shards:f,noRelative:v,noIsolation:k,inert:p,setCallbacks:r,allowPinchZoom:!!m,lockRef:n,gapMode:_}),l?s.cloneElement(s.Children.only(i),R(R({},x),{ref:C})):s.createElement(w,R({},x,{className:u,ref:C}),i))});ne.defaultProps={enabled:!0,removeScrollBar:!0,inert:!1};ne.classNames={fullWidth:Q,zeroRight:J};var Oo=function(){if(typeof __webpack_nonce__<"u")return __webpack_nonce__};function Do(){if(!document)return null;var e=document.createElement("style");e.type="text/css";var t=Oo();return t&&e.setAttribute("nonce",t),e}function To(e,t){e.styleSheet?e.styleSheet.cssText=t:e.appendChild(document.createTextNode(t))}function Lo(e){var t=document.head||document.getElementsByTagName("head")[0];t.appendChild(e)}var jo=function(){var e=0,t=null;return{add:function(n){e==0&&(t=Do())&&(To(t,n),Lo(t)),e++},remove:function(){e--,!e&&t&&(t.parentNode&&t.parentNode.removeChild(t),t=null)}}},Io=function(){var e=jo();return function(t,n){s.useEffect(function(){return e.add(t),function(){e.remove()}},[t&&n])}},Ze=function(){var e=Io(),t=function(n){var a=n.styles,o=n.dynamic;return e(a,o),null};return t},zo={left:0,top:0,right:0,gap:0},ue=function(e){return parseInt(e||"",10)||0},Fo=function(e){var t=window.getComputedStyle(document.body),n=t[e==="padding"?"paddingLeft":"marginLeft"],a=t[e==="padding"?"paddingTop":"marginTop"],o=t[e==="padding"?"paddingRight":"marginRight"];return[ue(n),ue(a),ue(o)]},qo=function(e){if(e===void 0&&(e="margin"),typeof window>"u")return zo;var t=Fo(e),n=document.documentElement.clientWidth,a=window.innerWidth;return{left:t[0],top:t[1],right:t[2],gap:Math.max(0,a-n+t[2]-t[0])}},Ho=Ze(),F="data-scroll-locked",Vo=function(e,t,n,a){var o=e.left,r=e.top,l=e.right,i=e.gap;return n===void 0&&(n="margin"),`
  .`.concat(Mo,` {
   overflow: hidden `).concat(a,`;
   padding-right: `).concat(i,"px ").concat(a,`;
  }
  body[`).concat(F,`] {
    overflow: hidden `).concat(a,`;
    overscroll-behavior: contain;
    `).concat([t&&"position: relative ".concat(a,";"),n==="margin"&&`
    padding-left: `.concat(o,`px;
    padding-top: `).concat(r,`px;
    padding-right: `).concat(l,`px;
    margin-left:0;
    margin-top:0;
    margin-right: `).concat(i,"px ").concat(a,`;
    `),n==="padding"&&"padding-right: ".concat(i,"px ").concat(a,";")].filter(Boolean).join(""),`
  }
  
  .`).concat(J,` {
    right: `).concat(i,"px ").concat(a,`;
  }
  
  .`).concat(Q,` {
    margin-right: `).concat(i,"px ").concat(a,`;
  }
  
  .`).concat(J," .").concat(J,` {
    right: 0 `).concat(a,`;
  }
  
  .`).concat(Q," .").concat(Q,` {
    margin-right: 0 `).concat(a,`;
  }
  
  body[`).concat(F,`] {
    `).concat(Eo,": ").concat(i,`px;
  }
`)},Oe=function(){var e=parseInt(document.body.getAttribute(F)||"0",10);return isFinite(e)?e:0},Wo=function(){s.useEffect(function(){return document.body.setAttribute(F,(Oe()+1).toString()),function(){var e=Oe()-1;e<=0?document.body.removeAttribute(F):document.body.setAttribute(F,e.toString())}},[])},Bo=function(e){var t=e.noRelative,n=e.noImportant,a=e.gapMode,o=a===void 0?"margin":a;Wo();var r=s.useMemo(function(){return qo(o)},[o]);return s.createElement(Ho,{styles:Vo(r,!t,o,n?"":"!important")})},ye=!1;if(typeof window<"u")try{var Z=Object.defineProperty({},"passive",{get:function(){return ye=!0,!0}});window.addEventListener("test",Z,Z),window.removeEventListener("test",Z,Z)}catch{ye=!1}var j=ye?{passive:!1}:!1,Uo=function(e){return e.tagName==="TEXTAREA"},Ke=function(e,t){if(!(e instanceof Element))return!1;var n=window.getComputedStyle(e);return n[t]!=="hidden"&&!(n.overflowY===n.overflowX&&!Uo(e)&&n[t]==="visible")},Yo=function(e){return Ke(e,"overflowY")},Zo=function(e){return Ke(e,"overflowX")},De=function(e,t){var n=t.ownerDocument,a=t;do{typeof ShadowRoot<"u"&&a instanceof ShadowRoot&&(a=a.host);var o=Xe(e,a);if(o){var r=Ge(e,a),l=r[1],i=r[2];if(l>i)return!0}a=a.parentNode}while(a&&a!==n.body);return!1},Ko=function(e){var t=e.scrollTop,n=e.scrollHeight,a=e.clientHeight;return[t,n,a]},Xo=function(e){var t=e.scrollLeft,n=e.scrollWidth,a=e.clientWidth;return[t,n,a]},Xe=function(e,t){return e==="v"?Yo(t):Zo(t)},Ge=function(e,t){return e==="v"?Ko(t):Xo(t)},Go=function(e,t){return e==="h"&&t==="rtl"?-1:1},Jo=function(e,t,n,a,o){var r=Go(e,window.getComputedStyle(t).direction),l=r*a,i=n.target,u=t.contains(i),d=!1,h=l>0,f=0,y=0;do{if(!i)break;var v=Ge(e,i),k=v[0],p=v[1],m=v[2],b=p-m-r*k;(k||b)&&Xe(e,i)&&(f+=b,y+=k);var w=i.parentNode;i=w&&w.nodeType===Node.DOCUMENT_FRAGMENT_NODE?w.host:w}while(!u&&i!==document.body||u&&(t.contains(i)||t===i));return(h&&Math.abs(f)<1||!h&&Math.abs(y)<1)&&(d=!0),d},K=function(e){return"changedTouches"in e?[e.changedTouches[0].clientX,e.changedTouches[0].clientY]:[0,0]},Te=function(e){return[e.deltaX,e.deltaY]},Le=function(e){return e&&"current"in e?e.current:e},Qo=function(e,t){return e[0]===t[0]&&e[1]===t[1]},er=function(e){return`
  .block-interactivity-`.concat(e,` {pointer-events: none;}
  .allow-interactivity-`).concat(e,` {pointer-events: all;}
`)},tr=0,I=[];function nr(e){var t=s.useRef([]),n=s.useRef([0,0]),a=s.useRef(),o=s.useState(tr++)[0],r=s.useState(Ze)[0],l=s.useRef(e);s.useEffect(function(){l.current=e},[e]),s.useEffect(function(){if(e.inert){document.body.classList.add("block-interactivity-".concat(o));var p=_o([e.lockRef.current],(e.shards||[]).map(Le),!0).filter(Boolean);return p.forEach(function(m){return m.classList.add("allow-interactivity-".concat(o))}),function(){document.body.classList.remove("block-interactivity-".concat(o)),p.forEach(function(m){return m.classList.remove("allow-interactivity-".concat(o))})}}},[e.inert,e.lockRef.current,e.shards]);var i=s.useCallback(function(p,m){if("touches"in p&&p.touches.length===2||p.type==="wheel"&&p.ctrlKey)return!l.current.allowPinchZoom;var b=K(p),w=n.current,_="deltaX"in p?p.deltaX:w[0]-b[0],M="deltaY"in p?p.deltaY:w[1]-b[1],E,C=p.target,x=Math.abs(_)>Math.abs(M)?"h":"v";if("touches"in p&&x==="h"&&C.type==="range")return!1;var O=window.getSelection(),L=O&&O.anchorNode,q=L?L===C||L.contains(C):!1;if(q)return!1;var U=De(x,C);if(!U)return!0;if(U?E=x:(E=x==="v"?"h":"v",U=De(x,C)),!U)return!1;if(!a.current&&"changedTouches"in p&&(_||M)&&(a.current=E),!E)return!0;var ke=a.current||E;return Jo(ke,m,p,ke==="h"?_:M)},[]),u=s.useCallback(function(p){var m=p;if(!(!I.length||I[I.length-1]!==r)){var b="deltaY"in m?Te(m):K(m),w=t.current.filter(function(E){return E.name===m.type&&(E.target===m.target||m.target===E.shadowParent)&&Qo(E.delta,b)})[0];if(w&&w.should){m.cancelable&&m.preventDefault();return}if(!w){var _=(l.current.shards||[]).map(Le).filter(Boolean).filter(function(E){return E.contains(m.target)}),M=_.length>0?i(m,_[0]):!l.current.noIsolation;M&&m.cancelable&&m.preventDefault()}}},[]),d=s.useCallback(function(p,m,b,w){var _={name:p,delta:m,target:b,should:w,shadowParent:ar(b)};t.current.push(_),setTimeout(function(){t.current=t.current.filter(function(M){return M!==_})},1)},[]),h=s.useCallback(function(p){n.current=K(p),a.current=void 0},[]),f=s.useCallback(function(p){d(p.type,Te(p),p.target,i(p,e.lockRef.current))},[]),y=s.useCallback(function(p){d(p.type,K(p),p.target,i(p,e.lockRef.current))},[]);s.useEffect(function(){return I.push(r),e.setCallbacks({onScrollCapture:f,onWheelCapture:f,onTouchMoveCapture:y}),document.addEventListener("wheel",u,j),document.addEventListener("touchmove",u,j),document.addEventListener("touchstart",h,j),function(){I=I.filter(function(p){return p!==r}),document.removeEventListener("wheel",u,j),document.removeEventListener("touchmove",u,j),document.removeEventListener("touchstart",h,j)}},[]);var v=e.removeScrollBar,k=e.inert;return s.createElement(s.Fragment,null,k?s.createElement(r,{styles:er(o)}):null,v?s.createElement(Bo,{noRelative:e.noRelative,gapMode:e.gapMode}):null)}function ar(e){for(var t=null;e!==null;)e instanceof ShadowRoot&&(t=e.host,e=e.host),e=e.parentNode;return t}const or=$o(Ye,nr);var Je=s.forwardRef(function(e,t){return s.createElement(ne,R({},e,{ref:t,sideCar:or}))});Je.classNames=ne.classNames;var rr=function(e){if(typeof document>"u")return null;var t=Array.isArray(e)?e[0]:e;return t.ownerDocument.body},z=new WeakMap,X=new WeakMap,G={},fe=0,Qe=function(e){return e&&(e.host||Qe(e.parentNode))},sr=function(e,t){return t.map(function(n){if(e.contains(n))return n;var a=Qe(n);return a&&e.contains(a)?a:(console.error("aria-hidden",n,"in not contained inside",e,". Doing nothing"),null)}).filter(function(n){return!!n})},ir=function(e,t,n,a){var o=sr(t,Array.isArray(e)?e:[e]);G[n]||(G[n]=new WeakMap);var r=G[n],l=[],i=new Set,u=new Set(o),d=function(f){!f||i.has(f)||(i.add(f),d(f.parentNode))};o.forEach(d);var h=function(f){!f||u.has(f)||Array.prototype.forEach.call(f.children,function(y){if(i.has(y))h(y);else try{var v=y.getAttribute(a),k=v!==null&&v!=="false",p=(z.get(y)||0)+1,m=(r.get(y)||0)+1;z.set(y,p),r.set(y,m),l.push(y),p===1&&k&&X.set(y,!0),m===1&&y.setAttribute(n,"true"),k||y.setAttribute(a,"true")}catch(b){console.error("aria-hidden: cannot operate on ",y,b)}})};return h(t),i.clear(),fe++,function(){l.forEach(function(f){var y=z.get(f)-1,v=r.get(f)-1;z.set(f,y),r.set(f,v),y||(X.has(f)||f.removeAttribute(a),X.delete(f)),v||f.removeAttribute(n)}),fe--,fe||(z=new WeakMap,z=new WeakMap,X=new WeakMap,G={})}},cr=function(e,t,n){n===void 0&&(n="data-aria-hidden");var a=Array.from(Array.isArray(e)?e:[e]),o=rr(e);return o?(a.push.apply(a,Array.from(o.querySelectorAll("[aria-live], script"))),ir(a,o,n,"aria-hidden")):function(){return null}};function lr(e){const t=dr(e),n=s.forwardRef((a,o)=>{const{children:r,...l}=a,i=s.Children.toArray(r),u=i.find(fr);if(u){const d=u.props.children,h=i.map(f=>f===u?s.Children.count(d)>1?s.Children.only(null):s.isValidElement(d)?d.props.children:null:f);return g.jsx(t,{...l,ref:o,children:s.isValidElement(d)?s.cloneElement(d,void 0,h):null})}return g.jsx(t,{...l,ref:o,children:r})});return n.displayName=`${e}.Slot`,n}function dr(e){const t=s.forwardRef((n,a)=>{const{children:o,...r}=n;if(s.isValidElement(o)){const l=pr(o),i=hr(r,o.props);return o.type!==s.Fragment&&(i.ref=a?ve(a,l):l),s.cloneElement(o,i)}return s.Children.count(o)>1?s.Children.only(null):null});return t.displayName=`${e}.SlotClone`,t}var ur=Symbol("radix.slottable");function fr(e){return s.isValidElement(e)&&typeof e.type=="function"&&"__radixId"in e.type&&e.type.__radixId===ur}function hr(e,t){const n={...t};for(const a in t){const o=e[a],r=t[a];/^on[A-Z]/.test(a)?o&&r?n[a]=(...i)=>{const u=r(...i);return o(...i),u}:o&&(n[a]=o):a==="style"?n[a]={...o,...r}:a==="className"&&(n[a]=[o,r].filter(Boolean).join(" "))}return{...e,...n}}function pr(e){let t=Object.getOwnPropertyDescriptor(e.props,"ref")?.get,n=t&&"isReactWarning"in t&&t.isReactWarning;return n?e.ref:(t=Object.getOwnPropertyDescriptor(e,"ref")?.get,n=t&&"isReactWarning"in t&&t.isReactWarning,n?e.props.ref:e.props.ref||e.ref)}var ae="Dialog",[et]=Fa(ae),[yr,S]=et(ae),tt=e=>{const{__scopeDialog:t,children:n,open:a,defaultOpen:o,onOpenChange:r,modal:l=!0}=e,i=s.useRef(null),u=s.useRef(null),[d,h]=Ba({prop:a,defaultProp:o??!1,onChange:r,caller:ae});return g.jsx(yr,{scope:t,triggerRef:i,contentRef:u,contentId:re(),titleId:re(),descriptionId:re(),open:d,onOpenChange:h,onOpenToggle:s.useCallback(()=>h(f=>!f),[h]),modal:l,children:n})};tt.displayName=ae;var nt="DialogTrigger",vr=s.forwardRef((e,t)=>{const{__scopeDialog:n,...a}=e,o=S(nt,n),r=T(t,o.triggerRef);return g.jsx(A.button,{type:"button","aria-haspopup":"dialog","aria-expanded":o.open,"aria-controls":o.contentId,"data-state":be(o.open),...a,ref:r,onClick:$(e.onClick,o.onOpenToggle)})});vr.displayName=nt;var me="DialogPortal",[mr,at]=et(me,{forceMount:void 0}),ot=e=>{const{__scopeDialog:t,forceMount:n,children:a,container:o}=e,r=S(me,t);return g.jsx(mr,{scope:t,forceMount:n,children:s.Children.map(a,l=>g.jsx(te,{present:n||r.open,children:g.jsx(We,{asChild:!0,container:o,children:l})}))})};ot.displayName=me;var ee="DialogOverlay",rt=s.forwardRef((e,t)=>{const n=at(ee,e.__scopeDialog),{forceMount:a=n.forceMount,...o}=e,r=S(ee,e.__scopeDialog);return r.modal?g.jsx(te,{present:a||r.open,children:g.jsx(br,{...o,ref:t})}):null});rt.displayName=ee;var gr=lr("DialogOverlay.RemoveScroll"),br=s.forwardRef((e,t)=>{const{__scopeDialog:n,...a}=e,o=S(ee,n);return g.jsx(Je,{as:gr,allowPinchZoom:!0,shards:[o.contentRef],children:g.jsx(A.div,{"data-state":be(o.open),...a,ref:t,style:{pointerEvents:"auto",...a.style}})})}),D="DialogContent",st=s.forwardRef((e,t)=>{const n=at(D,e.__scopeDialog),{forceMount:a=n.forceMount,...o}=e,r=S(D,e.__scopeDialog);return g.jsx(te,{present:a||r.open,children:r.modal?g.jsx(kr,{...o,ref:t}):g.jsx(xr,{...o,ref:t})})});st.displayName=D;var kr=s.forwardRef((e,t)=>{const n=S(D,e.__scopeDialog),a=s.useRef(null),o=T(t,n.contentRef,a);return s.useEffect(()=>{const r=a.current;if(r)return cr(r)},[]),g.jsx(it,{...e,ref:o,trapFocus:n.open,disableOutsidePointerEvents:!0,onCloseAutoFocus:$(e.onCloseAutoFocus,r=>{r.preventDefault(),n.triggerRef.current?.focus()}),onPointerDownOutside:$(e.onPointerDownOutside,r=>{const l=r.detail.originalEvent,i=l.button===0&&l.ctrlKey===!0;(l.button===2||i)&&r.preventDefault()}),onFocusOutside:$(e.onFocusOutside,r=>r.preventDefault())})}),xr=s.forwardRef((e,t)=>{const n=S(D,e.__scopeDialog),a=s.useRef(!1),o=s.useRef(!1);return g.jsx(it,{...e,ref:t,trapFocus:!1,disableOutsidePointerEvents:!1,onCloseAutoFocus:r=>{e.onCloseAutoFocus?.(r),r.defaultPrevented||(a.current||n.triggerRef.current?.focus(),r.preventDefault()),a.current=!1,o.current=!1},onInteractOutside:r=>{e.onInteractOutside?.(r),r.defaultPrevented||(a.current=!0,r.detail.originalEvent.type==="pointerdown"&&(o.current=!0));const l=r.target;n.triggerRef.current?.contains(l)&&r.preventDefault(),r.detail.originalEvent.type==="focusin"&&o.current&&r.preventDefault()}})}),it=s.forwardRef((e,t)=>{const{__scopeDialog:n,trapFocus:a,onOpenAutoFocus:o,onCloseAutoFocus:r,...l}=e,i=S(D,n),u=s.useRef(null),d=T(t,u);return wo(),g.jsxs(g.Fragment,{children:[g.jsx(He,{asChild:!0,loop:!0,trapped:a,onMountAutoFocus:o,onUnmountAutoFocus:r,children:g.jsx(Fe,{role:"dialog",id:i.contentId,"aria-describedby":i.descriptionId,"aria-labelledby":i.titleId,"data-state":be(i.open),...l,ref:d,onDismiss:()=>i.onOpenChange(!1)})}),g.jsxs(g.Fragment,{children:[g.jsx(Er,{titleId:i.titleId}),g.jsx(Cr,{contentRef:u,descriptionId:i.descriptionId})]})]})}),ge="DialogTitle",wr=s.forwardRef((e,t)=>{const{__scopeDialog:n,...a}=e,o=S(ge,n);return g.jsx(A.h2,{id:o.titleId,...a,ref:t})});wr.displayName=ge;var ct="DialogDescription",_r=s.forwardRef((e,t)=>{const{__scopeDialog:n,...a}=e,o=S(ct,n);return g.jsx(A.p,{id:o.descriptionId,...a,ref:t})});_r.displayName=ct;var lt="DialogClose",Mr=s.forwardRef((e,t)=>{const{__scopeDialog:n,...a}=e,o=S(lt,n);return g.jsx(A.button,{type:"button",...a,ref:t,onClick:$(e.onClick,()=>o.onOpenChange(!1))})});Mr.displayName=lt;function be(e){return e?"open":"closed"}var dt="DialogTitleWarning",[Fi,ut]=za(dt,{contentName:D,titleName:ge,docsSlug:"dialog"}),Er=({titleId:e})=>{const t=ut(dt),n=`\`${t.contentName}\` requires a \`${t.titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${t.titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/${t.docsSlug}`;return s.useEffect(()=>{e&&(document.getElementById(e)||console.error(n))},[n,e]),null},Nr="DialogDescriptionWarning",Cr=({contentRef:e,descriptionId:t})=>{const a=`Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${ut(Nr).contentName}}.`;return s.useEffect(()=>{const o=e.current?.getAttribute("aria-describedby");t&&o&&(document.getElementById(t)||console.warn(a))},[a,e,t]),null},qi=tt,Hi=ot,Vi=rt,Wi=st;export{Hs as $,Rr as A,Lr as B,ts as C,ls as D,us as E,vs as F,xs as G,fs as H,Ns as I,Ks as J,Di as K,Rs as L,qs as M,Oi as N,xi as O,Ws as P,Ai as Q,ti as R,ai as S,Mi as T,Pi as U,$i as V,ki as W,Li as X,bi as Y,Ii as Z,Es as _,yi as a,pi as a$,oi as a0,Qs as a1,hs as a2,$s as a3,Ls as a4,zi as a5,es as a6,os as a7,gs as a8,_s as a9,zr as aA,Xr as aB,Ms as aC,ni as aD,Ri as aE,ss as aF,ds as aG,di as aH,Bs as aI,is as aJ,bs as aK,Si as aL,Ti as aM,jr as aN,Wr as aO,Xs as aP,gi as aQ,ms as aR,Ps as aS,Tr as aT,ws as aU,Dr as aV,Ur as aW,ii as aX,Ss as aY,Zs as aZ,Cs as a_,Os as aa,Ts as ab,ri as ac,Br as ad,Js as ae,Pr as af,Is as ag,Hr as ah,js as ai,li as aj,Ys as ak,zs as al,qr as am,Fs as an,re as ao,A as ap,qi as aq,Hi as ar,Vi as as,Wi as at,ve as au,Yr as av,Vs as aw,Gs as ax,vi as ay,Ei as az,hi as b,ji as b0,Ci as b1,Gr as b2,ys as b3,Ni as b4,Ds as b5,ei as b6,as as b7,ci as b8,mi as c,Ir as d,ui as e,ks as f,_i as g,Vr as h,si as i,g as j,ns as k,fi as l,wi as m,Fr as n,cs as o,Or as p,Zr as q,Ar as r,Qr as s,$r as t,As as u,Jr as v,Kr as w,rs as x,ps as y,Us as z};
