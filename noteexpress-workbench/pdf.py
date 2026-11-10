import json,sys
import pymupdf
sys.stdout.reconfigure(encoding='utf-8')
r=json.load(open(sys.argv[1],encoding='utf-8-sig'))
with pymupdf.open(r['path']) as doc:
    start=max(1,int(r.get('page',1)))
    count=min(10,max(1,int(r.get('count',3))))
    if start>len(doc): raise ValueError('页码超过 PDF 页数')
    pages=[{'page':i+1,'text':doc[i].get_text()[:20000]} for i in range(start-1,min(start-1+count,len(doc)))]
    print(json.dumps({'totalPages':len(doc),'pages':pages,'nextPage':start+len(pages) if start+len(pages)<=len(doc) else None},ensure_ascii=False))
