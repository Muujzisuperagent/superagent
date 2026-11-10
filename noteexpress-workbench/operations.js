import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, readFile, rm, mkdir, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
const exec = promisify(execFile);
const base = path.dirname(fileURLToPath(import.meta.url));
const noteDir = path.join(base, 'data', 'notes');
let serial = Promise.resolve();
async function processJson(program, args, request, signal) {
 const dir = await mkdtemp(path.join(tmpdir(), 'ne-workbench-'));
 try {
  const requestPath=path.join(dir,'request.json');
  await writeFile(requestPath,JSON.stringify(request),'utf8');
  const {stdout}=await exec(program,[...args,requestPath],{encoding:'utf8',timeout:45000,maxBuffer:12*1024*1024,windowsHide:true,signal,env:{...process.env,PYTHONIOENCODING:'utf-8'}});
  const result=JSON.parse(stdout.replace(/^\uFEFF/,''));
  if(result.error)throw new Error(result.error);
  return result;
 } catch(error) { throw new Error(error.stdout ? (()=>{try{return JSON.parse(error.stdout).error}catch{return error.message}})() : error.message); }
 finally {await rm(dir,{recursive:true,force:true});}
}
async function snapshot(signal) {
 return processJson('powershell.exe',['-NoProfile','-NonInteractive','-STA','-ExecutionPolicy','Bypass','-File',path.join(base,'bridge.ps1'),'-RequestPath'],{},signal);
}
function key(p){return createHash('sha256').update(p.libraryUid+'|'+p.uid).digest('hex');}
async function findPaper(r,signal) {
 const s=await snapshot(signal);
 const matches=s.papers.filter(p=>p.uid===r.uid && (!r.libraryUid||p.libraryUid===r.libraryUid));
 if(matches.length!==1)throw new Error('未找到唯一题录，请刷新后使用文献 UID 和文献库 UID。');
 return matches[0];
}
function toRisType(t){if(t==='proceedings-article')return 'CONF';if(t==='book')return 'BOOK';if(t==='report')return 'RPRT';if(t==='thesis')return 'THES';return 'JOUR';}
function risField(tag,value){const one=String(value).replace(/\s+/g,' ').trim();return one?tag+'  - '+one+'\r\n':'';}
function toRis(p){const type=toRisType(p.type);let out=risField('TY',type)+risField('TI',p.title);for(const a of (p.authors||[]).slice(0,50))out+=risField('AU',a);out+=risField('PY',p.year)+risField('AB',p.abstract)+risField('JO',p.container)+risField('DO',p.doi)+risField('UR',p.url);return out+'ER  - \r\n';}
async function fetchJson(url,timeoutMs){const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),timeoutMs);try{const r=await fetch(url,{signal:ctrl.signal,headers:{'User-Agent':'noteexpress-workbench/1.1 (local research tool)'}});if(!r.ok)throw new Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(timer)}}
function stripTags(s){return String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
async function searchWeb(r){
 const query=String(r.query||'').trim();if(!query)throw new Error('缺少检索词。');
 const limit=Math.min(25,Math.max(1,Number(r.limit)||10));
 const source=r.source==='pubmed'?'pubmed':r.source==='crossref'?'crossref':'crossref';
 const papers=[];
 if(source==='crossref'){
  const url='https://api.crossref.org/works?query='+encodeURIComponent(query)+'&rows='+limit+'&select=DOI,title,author,issued,container-title,abstract,URL,type&mailto=local@example.invalid';
  const d=await fetchJson(url,20000);
  for(const it of (d.message?.items||[])){
   papers.push({title:stripTags(it.title?.[0]),authors:(it.author||[]).map(a=>[a.given,a.family].filter(Boolean).join(', ')),year:it.issued?.['date-parts']?.[0]?.[0]??'',container:stripTags(it['container-title']?.[0]),abstract:stripTags(it.abstract),doi:it.DOI||'',url:it.URL||'',type:it.type||'journal-article',source:'crossref'});
  }
 }else{
  const s=await fetchJson('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term='+encodeURIComponent(query)+'&retmax='+limit+'&retmode=json',20000);
  const ids=(s.esearchresult?.idlist||[]).join(',');
  if(ids){
   const d=await fetchJson('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id='+ids+'&retmode=json',20000);
   for(const id of (s.esearchresult.idlist||[])){
    const it=d.result?.[id];if(!it)continue;
    papers.push({title:stripTags(it.title),authors:(it.authors||[]).map(a=>a.name).filter(Boolean),year:(it.pubdate||'').slice(0,4),container:stripTags(it.fulljournalname||it.source),abstract:'',doi:(it.articleids||[]).find(x=>x.idtype==='doi')?.value||'',url:'https://pubmed.ncbi.nlm.nih.gov/'+id+'/',type:'journal-article',source:'pubmed'});
   }
  }
 }
 return {source,papers:papers.filter(p=>p.title),total:papers.length,hint:'把需要入库的条目原样传给 export_ris 的 papers 参数，可设置 open=true 自动打开 NoteExpress 导入窗口。'};
}
async function exportRis(r){
 const list=Array.isArray(r.papers)?r.papers:[];
 if(!list.length)throw new Error('papers 参数需要包含至少一条来自 search_web 的题录。');
 if(list.length>50)throw new Error('一次最多导出 50 条题录。');
 let body='';
 for(const [i,p] of list.entries()){
  if(!p||typeof p.title!=='string'||!p.title.trim())throw new Error('第 '+(i+1)+' 条题录缺少标题。');
  body+=toRis({title:p.title,authors:Array.isArray(p.authors)?p.authors.map(a=>String(a)).slice(0,50):[],year:p.year,abstract:typeof p.abstract==='string'?p.abstract:'',container:p.container,doi:p.doi,url:p.url,type:p.type});
 }
 const dir=path.join(base,'data','imports');await mkdir(dir,{recursive:true});
 const file=path.join(dir,'ris-'+Date.now()+'.ris');
 await writeFile(file,'\uFEFF'+body,'utf8');
 let opened=false;
 if(r.open){const {spawn}=await import('node:child_process');spawn('cmd.exe',['/c','start','""',file],{detached:true,stdio:'ignore',windowsHide:true}).unref();opened=true;}
 return {file,opened,count:list.length,message:opened?'已在 NoteExpress 中打开导入窗口，请在 NoteExpress 里确认目标文件夹并完成导入。':'RIS 题录文件已生成，可双击该文件或设置 open=true 自动打开 NoteExpress 导入。'};
}
export async function operate(r,signal) {
 if(!r || typeof r.action!=='string')throw new Error('缺少 action');
 if(r.action==='ping')return {ok:true,mode:'noteexpress'};
 if(r.action==='status'||r.action==='search'){
  const s=await snapshot(signal);
  const query=String(r.query||'').toLocaleLowerCase();
  const libraryUid=r.libraryUid||s.activeLibraryUid;
  const all=s.papers.filter(p=>p.libraryUid===libraryUid&&(!r.selectedOnly||s.selectedUids.includes(p.uid))&&(!r.libraryUid||p.libraryUid===r.libraryUid)&&(!query||[p.title,p.authors,p.doi,p.abstract,p.folder].join(' ').toLocaleLowerCase().includes(query)));
  const offset=Math.max(0,Number(r.offset)||0),limit=Math.min(100,Math.max(1,Number(r.limit)||30));
  return {...s,papers:all.slice(offset,offset+limit),total:all.length,offset,nextOffset:offset+limit<all.length?offset+limit:null};
 }
 if(r.action==='read_pdf'){
  const p=await findPaper(r,signal);
  const attachments=p.attachments.split(/[\r\n]+/).map(x=>x.trim()).filter(Boolean);
  const pdf=attachments.find(x=>/\.pdf$/i.test(x));
  if(!pdf)throw new Error('这篇题录没有可识别的 PDF 附件。');
  const result=await processJson('C:\\Users\\lenovo\\AppData\\Local\\Programs\\Python\\Python314\\python.exe',[path.join(base,'pdf.py')],{path:pdf,page:r.page,count:r.count},signal);
  return {paper:p,...result};
 }
 if(r.action==='list_notes'){
  const p=await findPaper(r,signal);const dir=path.join(noteDir,key(p));
  let names;try{names=await readdir(dir)}catch(e){if(e.code==='ENOENT')return {paper:p,storage:'local-markdown',notes:[]};throw e}
  const notes=await Promise.all(names.filter(n=>n.endsWith('.json')).map(async n=>JSON.parse(await readFile(path.join(dir,n),'utf8'))));
  return {paper:p,storage:'local-markdown',notes:notes.sort((a,b)=>b.createdAt.localeCompare(a.createdAt))};
 }
 if(r.action==='save_note'){
  if(typeof r.content!=='string'||!r.content.trim()||r.content.length>150000)throw new Error('笔记正文不能为空，最多 150000 字符。');
  const p=await findPaper(r,signal);const id=randomUUID();const dir=path.join(noteDir,key(p));await mkdir(dir,{recursive:true});
  const title=String(r.title||'阅读笔记').slice(0,200);
  const note={id,title,content:r.content,paperUid:p.uid,libraryUid:p.libraryUid,paperTitle:p.title,createdAt:new Date().toISOString(),storage:'local-markdown'};
  const markdownPath=path.join(dir,id+'.md');
  await writeFile(markdownPath,`# ${title}\n\n文献：${p.title}\n\n${r.content}\n`,'utf8');
  await writeFile(path.join(dir,id+'.json'),JSON.stringify({...note,path:markdownPath},null,2),'utf8');
  return {...note,path:markdownPath,nativeNoteWritten:false,message:'已保存到工作台本地 Markdown 笔记，未写入 NoteExpress 原生笔记。'};
 }
 if(r.action==='search_web')return searchWeb(r);
 if(r.action==='export_ris')return exportRis(r);
 throw new Error('不支持的操作：'+r.action);
}
export function runOperation(r,signal){const next=serial.then(()=>operate(r,signal));serial=next.catch(()=>{});return next;}
