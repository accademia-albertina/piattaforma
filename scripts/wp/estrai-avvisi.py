import subprocess, json
import base64
def q(sql):
    sql = sql.replace('SELECT JSON_OBJECT', 'SELECT TO_BASE64(JSON_OBJECT', 1).replace(') FROM', ')) FROM', 1)
    out = subprocess.run(['mysql','-uroot','wp','--default-character-set=utf8mb4','-N','-e',sql],capture_output=True,text=True,check=True).stdout
    return [json.loads(base64.b64decode(l.replace('\\n','')).decode('utf8')) for l in out.splitlines() if l.strip()]
posts = q("""SELECT JSON_OBJECT('id',ID,'titolo',post_title,'slug',post_name,'data',post_date,'html',post_content) FROM wpey_posts WHERE post_type='avviso' AND post_status='publish'""")
meta = {}
for r in q("""SELECT JSON_OBJECT('id',post_id,'k',meta_key,'v',meta_value) FROM wpey_postmeta m JOIN wpey_posts p ON p.ID=m.post_id WHERE p.post_type='avviso' AND p.post_status='publish' AND meta_key REGEXP '^(documento|nome_allegato|sinossi_avviso)'"""):
    meta.setdefault(r['id'],{})[r['k']]=r['v']
terms = {}
for r in q("""SELECT JSON_OBJECT('id',r.object_id,'tax',tt.taxonomy,'name',t.name) FROM wpey_term_relationships r JOIN wpey_term_taxonomy tt USING(term_taxonomy_id) JOIN wpey_terms t USING(term_id) JOIN wpey_posts p ON p.ID=r.object_id WHERE p.post_type='avviso' AND p.post_status='publish'"""):
    terms.setdefault(r['id'],[]).append((r['tax'],r['name']))
att = {r['id']:r['url'] for r in q("""SELECT JSON_OBJECT('id',ID,'url',guid) FROM wpey_posts WHERE post_type='attachment'""")}
CAT={'In evidenza':'in-evidenza','Generali':'generali','Lezioni':'lezioni','Esami':'esami','Eventi':'eventi','Bandi e concorsi':'bandi-e-concorsi','Iscrizioni A.A.':'iscrizioni','Coordinatori':'coordinatori','Tasse':'tasse'}
SC={'PAI':'pai','NTA':'nta','Grafica':'grafica','Comunicazione':'comunicazione','Pittura':'pittura','Decorazione':'decorazione','Scenografia':'scenografia','Cinema':'cinema','Didattica':'didattica','Scultura':'scultura'}
out=[]; noatt=0
for p in posts:
    m=meta.get(p['id'],{}); t=terms.get(p['id'],[])
    allegati=[]
    for i,suf in enumerate(['','_2','_3','_4','_5']):
        d=m.get('documento'+suf); n=m.get('nome_allegato'+(suf if suf else ''))
        if i==0: n=m.get('nome_allegato')
        if d and d.isdigit() and int(d) in att:
            u=att[int(d)].replace('http://','https://')
            allegati.append({'nome':(n or '').strip() or u.rsplit('/',1)[-1],'url':u})
        elif d and d.strip() and not d.isdigit(): noatt+=1
    cats=sorted({CAT[n] for tx,n in t if tx in('category','categoria_avvisi') and n in CAT})
    out.append({'wpId':p['id'],'titolo':p['titolo'].strip(),'slug':p['slug'],'data':p['data'],'html':p['html'],
        'sommario':(m.get('sinossi_avviso') or '').strip() or None,
        'categorie':cats or ['generali'],'scuole':sorted({SC[n] for tx,n in t if tx=='post_tag' and n in SC}),'allegati':allegati})
json.dump(out,open('avvisi.json','w'),ensure_ascii=False)
print(len(out),'avvisi', sum(len(o['allegati']) for o in out),'allegati', 'non risolti',noatt)
print(out[2]['titolo'], out[2]['allegati'][:2], out[2]['categorie'], out[2]['scuole'])
