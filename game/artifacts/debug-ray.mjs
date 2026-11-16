import { chromium } from 'playwright'
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true})
const page=await browser.newPage({viewport:{width:1440,height:900}})
await page.goto('http://127.0.0.1:5173/?view=palace&clean=1&shots=1',{waitUntil:'networkidle'})
console.log(await page.evaluate(async()=>{const T=await import('/node_modules/.vite/deps/three.js');const d=window.__gameDebug;const out=[];for(const x of [0.5,0.48,0.52]){const r=new T.Raycaster();r.setFromCamera(new T.Vector2(x*2-1,0.32),d.camera);out.push({x,hits:r.intersectObject(d.world.root,true).slice(0,4).map(h=>({name:h.object.name,type:h.object.geometry?.type,point:h.point.toArray(),material:h.object.material?.color?.getHexString(),parent:h.object.parent?.name}))})}return out}))
await browser.close()
