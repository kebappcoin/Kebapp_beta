import{g as q,S as Q,a as X,b as Y,P as Z,T as $,V as I}from"./index-nvV2Ah4Y.js";var G={exports:{}};(function(i){var t=Object.prototype.hasOwnProperty,e="~";function n(){}Object.create&&(n.prototype=Object.create(null),new n().__proto__||(e=!1));function r(v,c,s){this.fn=v,this.context=c,this.once=s||!1}function a(v,c,s,l,y){if(typeof s!="function")throw new TypeError("The listener must be a function");var h=new r(s,l||v,y),u=e?e+c:c;return v._events[u]?v._events[u].fn?v._events[u]=[v._events[u],h]:v._events[u].push(h):(v._events[u]=h,v._eventsCount++),v}function d(v,c){--v._eventsCount===0?v._events=new n:delete v._events[c]}function _(){this._events=new n,this._eventsCount=0}_.prototype.eventNames=function(){var c=[],s,l;if(this._eventsCount===0)return c;for(l in s=this._events)t.call(s,l)&&c.push(e?l.slice(1):l);return Object.getOwnPropertySymbols?c.concat(Object.getOwnPropertySymbols(s)):c},_.prototype.listeners=function(c){var s=e?e+c:c,l=this._events[s];if(!l)return[];if(l.fn)return[l.fn];for(var y=0,h=l.length,u=new Array(h);y<h;y++)u[y]=l[y].fn;return u},_.prototype.listenerCount=function(c){var s=e?e+c:c,l=this._events[s];return l?l.fn?1:l.length:0},_.prototype.emit=function(c,s,l,y,h,u){var g=e?e+c:c;if(!this._events[g])return!1;var o=this._events[g],p=arguments.length,m,f;if(o.fn){switch(o.once&&this.removeListener(c,o.fn,void 0,!0),p){case 1:return o.fn.call(o.context),!0;case 2:return o.fn.call(o.context,s),!0;case 3:return o.fn.call(o.context,s,l),!0;case 4:return o.fn.call(o.context,s,l,y),!0;case 5:return o.fn.call(o.context,s,l,y,h),!0;case 6:return o.fn.call(o.context,s,l,y,h,u),!0}for(f=1,m=new Array(p-1);f<p;f++)m[f-1]=arguments[f];o.fn.apply(o.context,m)}else{var A=o.length,b;for(f=0;f<A;f++)switch(o[f].once&&this.removeListener(c,o[f].fn,void 0,!0),p){case 1:o[f].fn.call(o[f].context);break;case 2:o[f].fn.call(o[f].context,s);break;case 3:o[f].fn.call(o[f].context,s,l);break;case 4:o[f].fn.call(o[f].context,s,l,y);break;default:if(!m)for(b=1,m=new Array(p-1);b<p;b++)m[b-1]=arguments[b];o[f].fn.apply(o[f].context,m)}}return!0},_.prototype.on=function(c,s,l){return a(this,c,s,l,!1)},_.prototype.once=function(c,s,l){return a(this,c,s,l,!0)},_.prototype.removeListener=function(c,s,l,y){var h=e?e+c:c;if(!this._events[h])return this;if(!s)return d(this,h),this;var u=this._events[h];if(u.fn)u.fn===s&&(!y||u.once)&&(!l||u.context===l)&&d(this,h);else{for(var g=0,o=[],p=u.length;g<p;g++)(u[g].fn!==s||y&&!u[g].once||l&&u[g].context!==l)&&o.push(u[g]);o.length?this._events[h]=o.length===1?o[0]:o:d(this,h)}return this},_.prototype.removeAllListeners=function(c){var s;return c?(s=e?e+c:c,this._events[s]&&d(this,s)):(this._events=new n,this._eventsCount=0),this},_.prototype.off=_.prototype.removeListener,_.prototype.addListener=_.prototype.on,_.prefixed=e,_.EventEmitter=_,i.exports=_})(G);var ee=G.exports;const te=q(ee);function ne(i){if(i.length>=255)throw new TypeError("Alphabet too long");for(var t=new Uint8Array(256),e=0;e<t.length;e++)t[e]=255;for(var n=0;n<i.length;n++){var r=i.charAt(n),a=r.charCodeAt(0);if(t[a]!==255)throw new TypeError(r+" is ambiguous");t[a]=n}var d=i.length,_=i.charAt(0),v=Math.log(d)/Math.log(256),c=Math.log(256)/Math.log(d);function s(h){if(h instanceof Uint8Array||(ArrayBuffer.isView(h)?h=new Uint8Array(h.buffer,h.byteOffset,h.byteLength):Array.isArray(h)&&(h=Uint8Array.from(h))),!(h instanceof Uint8Array))throw new TypeError("Expected Uint8Array");if(h.length===0)return"";for(var u=0,g=0,o=0,p=h.length;o!==p&&h[o]===0;)o++,u++;for(var m=(p-o)*c+1>>>0,f=new Uint8Array(m);o!==p;){for(var A=h[o],b=0,E=m-1;(A!==0||b<g)&&E!==-1;E--,b++)A+=256*f[E]>>>0,f[E]=A%d>>>0,A=A/d>>>0;if(A!==0)throw new Error("Non-zero carry");g=b,o++}for(var x=m-g;x!==m&&f[x]===0;)x++;for(var z=_.repeat(u);x<m;++x)z+=i.charAt(f[x]);return z}function l(h){if(typeof h!="string")throw new TypeError("Expected String");if(h.length===0)return new Uint8Array;for(var u=0,g=0,o=0;h[u]===_;)g++,u++;for(var p=(h.length-u)*v+1>>>0,m=new Uint8Array(p);h[u];){var f=t[h.charCodeAt(u)];if(f===255)return;for(var A=0,b=p-1;(f!==0||A<o)&&b!==-1;b--,A++)f+=d*m[b]>>>0,m[b]=f%256>>>0,f=f/256>>>0;if(f!==0)throw new Error("Non-zero carry");o=A,u++}for(var E=p-o;E!==p&&m[E]===0;)E++;for(var x=new Uint8Array(g+(p-E)),z=g;E!==p;)x[z++]=m[E++];return x}function y(h){var u=l(h);if(u)return u;throw new Error("Non-base"+d+" character")}return{encode:s,decodeUnsafe:l,decode:y}}var ie=ne;const re=ie,se="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";var oe=re(se);const M=q(oe);let U;const ae=new Uint8Array(16);function ce(){if(!U&&(U=typeof crypto<"u"&&crypto.getRandomValues&&crypto.getRandomValues.bind(crypto),!U))throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");return U(ae)}const w=[];for(let i=0;i<256;++i)w.push((i+256).toString(16).slice(1));function le(i,t=0){return w[i[t+0]]+w[i[t+1]]+w[i[t+2]]+w[i[t+3]]+"-"+w[i[t+4]]+w[i[t+5]]+"-"+w[i[t+6]]+w[i[t+7]]+"-"+w[i[t+8]]+w[i[t+9]]+"-"+w[i[t+10]]+w[i[t+11]]+w[i[t+12]]+w[i[t+13]]+w[i[t+14]]+w[i[t+15]]}const de=typeof crypto<"u"&&crypto.randomUUID&&crypto.randomUUID.bind(crypto),V={randomUUID:de};function he(i,t,e){if(V.randomUUID&&!t&&!i)return V.randomUUID();i=i||{};const n=i.random||(i.rng||ce)();return n[6]=n[6]&15|64,n[8]=n[8]&63|128,le(n)}function P(i){return i.version===void 0}function j(i){return P(i)?i.serialize({verifySignatures:!1,requireAllSignatures:!1}):i.serialize()}var B=function(i,t,e,n){function r(a){return a instanceof e?a:new e(function(d){d(a)})}return new(e||(e=Promise))(function(a,d){function _(s){try{c(n.next(s))}catch(l){d(l)}}function v(s){try{c(n.throw(s))}catch(l){d(l)}}function c(s){s.done?a(s.value):r(s.value).then(_,v)}c((n=n.apply(i,t||[])).next())})};function F(i){return B(this,void 0,void 0,function*(){try{return yield i.request({method:"wallet_getSnaps"}),!0}catch{return!1}})}function ue(){return B(this,void 0,void 0,function*(){try{const i=window.ethereum;if(!i)return null;if(i.providers&&Array.isArray(i.providers)){const t=i.providers;for(const e of t)if(yield F(e))return e}if(i.detected&&Array.isArray(i.detected)){const t=i.detected;for(const e of t)if(yield F(e))return e}return(yield F(i))?i:null}catch(i){return console.error(i),null}})}const fe="solana:mainnet",ve="solana:devnet",_e="solana:testnet",pe="solana:localnet",J=[fe,ve,_e,pe];function H(i){return J.includes(i)}var T=function(i,t,e,n){if(e==="a"&&!n)throw new TypeError("Private accessor was defined without a getter");if(typeof t=="function"?i!==t||!n:!t.has(i))throw new TypeError("Cannot read private member from an object whose class did not declare it");return e==="m"?n:e==="a"?n.call(i):n?n.value:t.get(i)},C=function(i,t,e,n,r){if(n==="m")throw new TypeError("Private method is not writable");if(n==="a"&&!r)throw new TypeError("Private accessor was defined without a setter");if(typeof t=="function"?i!==t||!r:!t.has(i))throw new TypeError("Cannot write private member to an object whose class did not declare it");return n==="a"?r.call(i,e):r?r.value=e:t.set(i,e),e},K,O,k,N,L,W;const me=J,ge=[Q,X,Y];class R{get address(){return T(this,K,"f")}get publicKey(){return T(this,O,"f").slice()}get chains(){return T(this,k,"f").slice()}get features(){return T(this,N,"f").slice()}get label(){return T(this,L,"f")}get icon(){return T(this,W,"f")}constructor({address:t,publicKey:e,label:n,icon:r}){K.set(this,void 0),O.set(this,void 0),k.set(this,void 0),N.set(this,void 0),L.set(this,void 0),W.set(this,void 0),new.target===R&&Object.freeze(this),C(this,K,t,"f"),C(this,O,e,"f"),C(this,k,me,"f"),C(this,N,ge,"f"),C(this,L,n,"f"),C(this,W,r,"f")}}K=new WeakMap,O=new WeakMap,k=new WeakMap,N=new WeakMap,L=new WeakMap,W=new WeakMap;var S=function(i,t,e,n){function r(a){return a instanceof e?a:new e(function(d){d(a)})}return new(e||(e=Promise))(function(a,d){function _(s){try{c(n.next(s))}catch(l){d(l)}}function v(s){try{c(n.throw(s))}catch(l){d(l)}}function c(s){s.done?a(s.value):r(s.value).then(_,v)}c((n=n.apply(i,t||[])).next())})};class D extends te{constructor(t){super(),this._network="mainnet-beta",this._iframeParams={},this._element=null,this._iframe=null,this._publicKey=null,this._account=null,this._isConnected=!1,this._connectHandler=null,this._messageHandlers={},this._handleEvent=e=>{var n,r;switch(e.type){case"connect":{this._collapseIframe(),!((n=e.data)===null||n===void 0)&&n.publicKey?(this._publicKey=e.data.publicKey,this._isConnected=!0,this._connectHandler&&(this._connectHandler.resolve(),this._connectHandler=null),this._connected()):(this._connectHandler&&(this._connectHandler.reject(),this._connectHandler=null),this._disconnected());return}case"disconnect":{this._connectHandler&&(this._connectHandler.reject(),this._connectHandler=null),this._disconnected();return}case"accountChanged":{!((r=e.data)===null||r===void 0)&&r.publicKey?(this._publicKey=e.data.publicKey,this.emit("accountChanged",this.publicKey),this._standardConnected()):(this.emit("accountChanged",void 0),this._standardDisconnected());return}default:return}},this._handleResize=e=>{e.resizeMode==="full"?e.params.mode==="fullscreen"?this._expandIframe():e.params.mode==="hide"&&this._collapseIframe():e.resizeMode==="coordinates"&&this._resizeIframe(e.params)},this._handleMessage=e=>{var n;if(((n=e.data)===null||n===void 0?void 0:n.channel)!=="solflareIframeToWalletAdapter")return;const r=e.data.data||{};if(r.type==="event")this._handleEvent(r.event);else if(r.type==="resize")this._handleResize(r);else if(r.type==="response"&&this._messageHandlers[r.id]){const{resolve:a,reject:d}=this._messageHandlers[r.id];delete this._messageHandlers[r.id],r.error?d(r.error):a(r.result)}},this._removeElement=()=>{this._element&&(this._element.remove(),this._element=null)},this._removeDanglingElements=()=>{const e=document.getElementsByClassName("solflare-metamask-wallet-adapter-iframe");for(const n of e)n.parentElement&&n.remove()},this._injectElement=()=>{this._removeElement(),this._removeDanglingElements();const e=Object.assign(Object.assign({},this._iframeParams),{mm:!0,v:1,cluster:this._network||"mainnet-beta",origin:window.location.origin||"",title:document.title||""}),n=Object.keys(e).map(a=>`${a}=${encodeURIComponent(e[a])}`).join("&"),r=`${D.IFRAME_URL}?${n}`;this._element=document.createElement("div"),this._element.className="solflare-metamask-wallet-adapter-iframe",this._element.innerHTML=`
      <iframe src='${r}' style='position: fixed; top: 0; bottom: 0; left: 0; right: 0; width: 100%; height: 100%; border: none; border-radius: 0; z-index: 99999; color-scheme: auto;' allowtransparency='true'></iframe>
    `,document.body.appendChild(this._element),this._iframe=this._element.querySelector("iframe"),window.addEventListener("message",this._handleMessage,!1)},this._collapseIframe=()=>{this._iframe&&(this._iframe.style.top="",this._iframe.style.right="",this._iframe.style.height="2px",this._iframe.style.width="2px")},this._expandIframe=()=>{this._iframe&&(this._iframe.style.top="0px",this._iframe.style.bottom="0px",this._iframe.style.left="0px",this._iframe.style.right="0px",this._iframe.style.width="100%",this._iframe.style.height="100%")},this._resizeIframe=e=>{this._iframe&&(this._iframe.style.top=isFinite(e.top)?`${e.top}px`:"",this._iframe.style.bottom=isFinite(e.bottom)?`${e.bottom}px`:"",this._iframe.style.left=isFinite(e.left)?`${e.left}px`:"",this._iframe.style.right=isFinite(e.right)?`${e.right}px`:"",this._iframe.style.width=isFinite(e.width)?`${e.width}px`:e.width,this._iframe.style.height=isFinite(e.height)?`${e.height}px`:e.height)},this._sendIframeMessage=e=>{if(!this.connected||!this.publicKey)throw new Error("Wallet not connected");return new Promise((n,r)=>{var a,d;const _=he();this._messageHandlers[_]={resolve:n,reject:r},(d=(a=this._iframe)===null||a===void 0?void 0:a.contentWindow)===null||d===void 0||d.postMessage({channel:"solflareWalletAdapterToIframe",data:Object.assign({id:_},e)},"*")})},this._connected=()=>{this._isConnected=!0,this.emit("connect",this.publicKey),this._standardConnected()},this._disconnected=()=>{this._publicKey=null,this._isConnected=!1,window.removeEventListener("message",this._handleMessage,!1),this._removeElement(),this.emit("disconnect"),this._standardDisconnected()},this._standardConnected=()=>{if(!this.publicKey)return;const e=this.publicKey.toString();(!this._account||this._account.address!==e)&&(this._account=new R({address:e,publicKey:this.publicKey.toBytes()}),this.emit("standard_change",{accounts:this.standardAccounts}))},this._standardDisconnected=()=>{this._account&&(this._account=null,this.emit("standard_change",{accounts:this.standardAccounts}))},t!=null&&t.network&&(this._network=t==null?void 0:t.network),window.SolflareMetaMaskParams&&(this._iframeParams=Object.assign(Object.assign({},this._iframeParams),window.SolflareMetaMaskParams)),t!=null&&t.params&&(this._iframeParams=Object.assign(Object.assign({},this._iframeParams),t==null?void 0:t.params))}get publicKey(){return this._publicKey?new Z(this._publicKey):null}get standardAccount(){return this._account}get standardAccounts(){return this._account?[this._account]:[]}get isConnected(){return this._isConnected}get connected(){return this.isConnected}get autoApprove(){return!1}connect(){return S(this,void 0,void 0,function*(){this.connected||(this._injectElement(),yield new Promise((t,e)=>{this._connectHandler={resolve:t,reject:e}}))})}disconnect(){return S(this,void 0,void 0,function*(){yield this._sendIframeMessage({method:"disconnect"}),this._disconnected()})}signTransaction(t){var e;return S(this,void 0,void 0,function*(){if(!this.connected||!this.publicKey)throw new Error("Wallet not connected");try{const n=j(t),r=yield this._sendIframeMessage({method:"signTransactionV2",params:{transaction:M.encode(n)}}),{transaction:a}=r;return P(t)?$.from(M.decode(a)):I.deserialize(M.decode(a))}catch(n){throw new Error(((e=n==null?void 0:n.toString)===null||e===void 0?void 0:e.call(n))||"Failed to sign transaction")}})}signAllTransactions(t){var e;return S(this,void 0,void 0,function*(){if(!this.connected||!this.publicKey)throw new Error("Wallet not connected");try{const n=t.map(a=>j(a)),{transactions:r}=yield this._sendIframeMessage({method:"signAllTransactionsV2",params:{transactions:n.map(a=>M.encode(a))}});return r.map((a,d)=>P(t[d])?$.from(M.decode(a)):I.deserialize(M.decode(a)))}catch(n){throw new Error(((e=n==null?void 0:n.toString)===null||e===void 0?void 0:e.call(n))||"Failed to sign transactions")}})}signAndSendTransaction(t,e){var n;return S(this,void 0,void 0,function*(){if(!this.connected||!this.publicKey)throw new Error("Wallet not connected");try{const r=j(t),{signature:a}=yield this._sendIframeMessage({method:"signAndSendTransaction",params:{transaction:M.encode(r),options:e}});return a}catch(r){throw new Error(((n=r==null?void 0:r.toString)===null||n===void 0?void 0:n.call(r))||"Failed to sign and send transaction")}})}signMessage(t,e="utf8"){var n;return S(this,void 0,void 0,function*(){if(!this.connected||!this.publicKey)throw new Error("Wallet not connected");try{const{signature:r}=yield this._sendIframeMessage({method:"signMessage",params:{data:M.encode(t),display:e}});return Uint8Array.from(M.decode(r))}catch(r){throw new Error(((n=r==null?void 0:r.toString)===null||n===void 0?void 0:n.call(r))||"Failed to sign message")}})}sign(t,e="utf8"){return S(this,void 0,void 0,function*(){return yield this.signMessage(t,e)})}static isSupported(){return S(this,void 0,void 0,function*(){return!!(yield ue())})}standardSignAndSendTransaction(...t){return S(this,void 0,void 0,function*(){if(!this.connected)throw new Error("not connected");const e=[];if(t.length===1){const{transaction:n,account:r,chain:a,options:d}=t[0],{minContextSlot:_,preflightCommitment:v,skipPreflight:c,maxRetries:s}=d||{};if(r!==this._account)throw new Error("invalid account");if(!H(a))throw new Error("invalid chain");const l=yield this.signAndSendTransaction(I.deserialize(n),{preflightCommitment:v,minContextSlot:_,maxRetries:s,skipPreflight:c});e.push({signature:M.decode(l)})}else if(t.length>1)for(const n of t)e.push(...yield this.standardSignAndSendTransaction(n));return e})}standardSignTransaction(...t){return S(this,void 0,void 0,function*(){if(!this.connected)throw new Error("not connected");const e=[];if(t.length===1){const{transaction:n,account:r,chain:a}=t[0];if(r!==this._account)throw new Error("invalid account");if(a&&!H(a))throw new Error("invalid chain");const d=yield this.signTransaction(I.deserialize(n));e.push({signedTransaction:d.serialize()})}else if(t.length>1){let n;for(const d of t){if(d.account!==this._account)throw new Error("invalid account");if(d.chain){if(!H(d.chain))throw new Error("invalid chain");if(n){if(d.chain!==n)throw new Error("conflicting chain")}else n=d.chain}}const r=t.map(({transaction:d})=>I.deserialize(d)),a=yield this.signAllTransactions(r);e.push(...a.map(d=>({signedTransaction:d.serialize()})))}return e})}standardSignMessage(...t){return S(this,void 0,void 0,function*(){if(!this.connected)throw new Error("not connected");const e=[];if(t.length===1){const{message:n,account:r}=t[0];if(r!==this._account)throw new Error("invalid account");const a=yield this.signMessage(n);e.push({signedMessage:n,signature:a})}else if(t.length>1)for(const n of t)e.push(...yield this.standardSignMessage(n));return e})}}D.IFRAME_URL="https://widget.solflare.com/";export{R as StandardSolflareMetaMaskWalletAccount,D as default};
//# sourceMappingURL=index-CC3O3c7I.js.map
