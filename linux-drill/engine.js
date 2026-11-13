/* Linux 基本操作ドリルと Linux 完走コースで共有する、疑似 Linux 環境（シェル・ファイルシステム・コマンド・シミュレーター）。
   linux-drill/index.html と linux-course/index.html から読み込む。 */
"use strict";
/* ================= 疑似 Linux 環境 =================
   RHEL 系のディストリビューションを想定する。LANG=C.UTF-8 なので、メッセージは英語、並べ替えはバイト順。
   ファイルシステム、ユーザー、プロセス、サービスをすべてメモリ上に持ち、シェルの解析と展開も自前で行う。
   メッセージの文言は GNU coreutils / findutils / grep / sed / tar の実物の出力に合わせている。 */
const HOST='server1';
const DAY=86400000;
const JST=9*3600000;              // 表示はすべて日本時間
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WDAY=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const pad2=n=>String(n).padStart(2,'0');
const byteLen=s=>new TextEncoder().encode(s).length;
const jst=t=>new Date(t+JST);     // UTC の getter で日本時間の値を取り出す
function fmtStamp(t){ const d=jst(t); return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth()+1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`; }

/* 練習用のエラー。シェルが受け取ってメッセージを表示する */
class Unsup extends Error{}                       // 実機では動くが、このドリルでは扱わないもの
class ShErr extends Error{ constructor(msg,code){ super(msg); this.code=code==null?1:code; } }
class Usage extends Error{ constructor(msg,code){ super(msg); this.code=code==null?1:code; } }
const usage=(cmd,m,code)=>new Usage(`${cmd}: ${m}\nTry '${cmd} --help' for more information.`,code);

/* ================= 仮想ファイルシステム ================= */
const ERRS={ENOENT:'No such file or directory',ENOTDIR:'Not a directory',EACCES:'Permission denied',EISDIR:'Is a directory',EEXIST:'File exists',
  ELOOP:'Too many levels of symbolic links',ENOTEMPTY:'Directory not empty',EPERM:'Operation not permitted',EINVAL:'Invalid argument'};
class FsErr extends Error{ constructor(code){ super(ERRS[code]); this.code=code; } }
let inoSeq=33554500;
/* type: f=ファイル d=ディレクトリ l=シンボリックリンク c/b=デバイス
   ファイルの中身は data（文字列）。圧縮ファイルやアーカイブ、実行ファイルは bin に構造のまま持つ */
class Node{
  constructor(type,mode,uid,gid,t){ this.type=type; this.mode=mode; this.uid=uid; this.gid=gid; this.mtime=t; this.ino=inoSeq++; this.nlink=type==='d'?2:1;
    if(type==='d') this.kids=new Map(); else if(type==='l') this.target=''; else { this.data=''; this.bin=null; } }
}
/* bin の形： {kind:'elf',cmd} / {kind:'tar',entries} / {kind:'gz'|'bz2'|'xz', name, inner}。inner は {kind:'text',data} かアーカイブ */
const COMP={gz:{ext:'.gz',rate:.35,head:40},bz2:{ext:'.bz2',rate:.33,head:50},xz:{ext:'.xz',rate:.3,head:60}};
function binSize(b){
  if(b.kind==='elf') return 30000+((b.cmd.length*7919)%90000);
  if(b.kind==='text') return byteLen(b.data);
  if(b.kind==='tar'){ const raw=b.entries.reduce((s,e)=>s+512+(e.type==='f'?Math.ceil(e.size/512)*512:0),0)+1024; return Math.ceil(raw/10240)*10240; }
  return Math.max(COMP[b.kind].head,Math.round(binSize(b.inner)*COMP[b.kind].rate)+COMP[b.kind].head);
}
/* fake は中身を持たずに大きさだけを見せるファイル（コースの「ディスクがいっぱい」で使う） */
function sizeOf(n){ if(n.fake!=null) return n.fake; if(n.type==='d') return 4096; if(n.type==='l') return byteLen(n.target); if(n.type==='c'||n.type==='b') return 0; return n.bin?binSize(n.bin):byteLen(n.data); }
/* 中身を文字列として読む。バイナリは文字化けした列を返す */
function textOf(n){ if(n.type==='c'||n.type==='b') return ''; if(!n.bin) return n.data;
  const seed=binSize(n.bin); let s=n.bin.kind==='elf'?'\u007fELF\u0002\u0001\u0001':n.bin.kind==='gz'?'\u001f�\b\u0000':n.bin.kind==='bz2'?'BZh91AY&SY':n.bin.kind==='xz'?'�7zXZ\u0000':'';
  if(n.bin.kind==='tar') s=(n.bin.entries[0]||{name:''}).name+'\u0000'.repeat(4)+'0000644\u00000001750\u0000';
  for(let i=0;i<48;i++) s+=((seed*(i+3))%7<3)?'�':String.fromCharCode(33+((seed>>(i%13))+i*31)%90);
  return s; }

class FS{
  constructor(now){ this.now=now; this.root=new Node('d',0o555,0,0,now()); }
  /* 権限の判定。b は 4=読み 2=書き 1=実行。root は実行ビットが 1 つもないファイルだけ実行できない */
  can(n,c,b){
    if(c.uid===0){ if(b!==1) return true; return n.type==='d'||(n.mode&0o111)!==0; }
    const m=n.uid===c.uid?(n.mode>>6):c.gids.includes(n.gid)?(n.mode>>3):n.mode; return (m&b)!==0; }
  /* 削除・名前変更の可否。スティッキービットのあるディレクトリでは、所有者か root だけが消せる */
  canUnlink(dir,n,c){ return !this.unlinkErr(dir,n,c); }
  /* 消せない理由。ディレクトリの権限不足は EACCES、スティッキービットによる拒否は EPERM になる */
  unlinkErr(dir,n,c){ if(!this.can(dir,c,2)||!this.can(dir,c,1)) return ERRS.EACCES;
    if((dir.mode&0o1000)&&c.uid!==0&&n.uid!==c.uid&&dir.uid!==c.uid) return ERRS.EPERM; return null; }
  /* カレントディレクトリは物理パス（リンクを含まない絶対パス）で持つ。たどるときは権限を見ない */
  walkRaw(abs){ const st=[{n:this.root,name:''}]; for(const c of abs.split('/').filter(Boolean)){ const top=st[st.length-1].n; const ch=top.type==='d'&&top.kids.get(c); if(!ch) return null; st.push({n:ch,name:c}); } return st; }
  /* パスの解決。最後の要素が無いときは node=null で、作成先の dir と name を返す */
  resolve(path,cwd,cred,follow=true){
    if(path==='') throw new FsErr('ENOENT');
    let st=path[0]==='/'?[{n:this.root,name:''}]:this.walkRaw(cwd);
    if(!st) throw new FsErr('ENOENT');
    const trail=path.length>1&&path.endsWith('/');
    let q=path.split('/').filter(Boolean), hops=0;
    for(let i=0;i<q.length;i++){
      const c=q[i], last=i===q.length-1, cur=st[st.length-1].n;
      if(cur.type!=='d') throw new FsErr('ENOTDIR');
      if(!this.can(cur,cred,1)) throw new FsErr('EACCES');
      if(c==='.') continue;
      if(c==='..'){ if(st.length>1) st.pop(); continue; }
      const ch=cur.kids.get(c);
      if(!ch){ if(last){ const base=st.slice(1).map(x=>x.name).join('/'); return {node:null,dir:cur,name:c,abs:'/'+(base?base+'/':'')+c,st}; } throw new FsErr('ENOENT'); }
      if(ch.type==='l'&&(!last||follow||trail)){
        if(++hops>40) throw new FsErr('ELOOP');
        if(ch.target[0]==='/') st=[{n:this.root,name:''}];
        q=[...ch.target.split('/').filter(Boolean),...q.slice(i+1)]; i=-1; continue;
      }
      st.push({n:ch,name:c});
    }
    const top=st[st.length-1];
    if(trail&&top.n.type!=='d') throw new FsErr('ENOTDIR');
    return {node:top.n,dir:st.length>1?st[st.length-2].n:this.root,name:top.name,abs:'/'+st.slice(1).map(x=>x.name).join('/'),st};
  }
  /* 権限を見ずに取得する（採点と準備用） */
  get(abs,follow=true){ try{ const r=this.resolve(abs,'/',ROOT,follow); return r.node; }catch(e){ if(e instanceof FsErr) return null; throw e; } }
  add(dir,name,n){ dir.kids.set(name,n); if(n.type==='d') dir.nlink++; dir.mtime=this.now(); }
  drop(dir,name){ const n=dir.kids.get(name); dir.kids.delete(name); if(n.type==='d') dir.nlink--; n.nlink--; dir.mtime=this.now(); return n; }
}
const ROOT={uid:0,gid:0,gids:[0],name:'root'};

/* ================= シェルの字句解析と構文解析 =================
   語は引用符を含んだ元の文字列のまま持ち、実行の直前に展開する（bash と同じ順序で展開するため） */
function matchParen(s,i){ let d=0, q=null;
  for(;i<s.length;i++){ const c=s[i];
    if(q){ if(c===q) q=null; else if(c==='\\'&&q==='"') i++; continue; }
    if(c==='\\'){ i++; continue; } if(c==="'"||c==='"'){ q=c; continue; }
    if(c==='(') d++; else if(c===')'){ d--; if(d===0) return i; } }
  return -1; }
function lexShell(src){
  const toks=[]; let cur=null, i=0; const n=src.length;
  const flush=()=>{ if(cur!==null){ toks.push({t:'w',raw:cur}); cur=null; } };
  const add=s=>{ cur=(cur??'')+s; };
  while(i<n){
    const c=src[i];
    if(cur===null&&c==='#'){ while(i<n&&src[i]!=='\n') i++; continue; }
    if(c===' '||c==='\t'){ flush(); i++; continue; }
    if(c==='\n'){ flush(); toks.push({t:'op',v:'\n'}); i++; continue; }
    if(c==='>'||c==='<'||(c==='&'&&src[i+1]==='>')){
      let fd=null; if(cur!==null){ if(/^\d+$/.test(cur)){ fd=+cur; cur=null; } else flush(); }
      const m=/^(&>>|&>|>>|>&|<&|>\||<<<|<<|>|<)/.exec(src.slice(i))[0]; i+=m.length;
      if(m==='>&'||m==='<&'){ const d=/^(\d+|-)/.exec(src.slice(i));
        if(d){ toks.push({t:'r',op:'dup',fd:fd??(m==='>&'?1:0),to:d[1]}); i+=d[0].length; continue; }
        toks.push({t:'r',op:'&>',fd:null}); continue; }
      toks.push({t:'r',op:m==='>|'?'>':m,fd}); continue;
    }
    if('|&;()'.includes(c)){ flush(); const two=src.slice(i,i+2);
      if(two==='||'||two==='&&'||two===';;'){ toks.push({t:'op',v:two}); i+=2; } else { toks.push({t:'op',v:c}); i++; } continue; }
    if(c==="'"){ const j=src.indexOf("'",i+1); if(j<0) return {incomplete:"'"}; add(src.slice(i,j+1)); i=j+1; continue; }
    if(c==='"'){ let j=i+1;
      while(j<n&&src[j]!=='"'){ if(src[j]==='\\') j++; else if(src[j]==='$'&&src[j+1]==='('){ const e=matchParen(src,j+1); if(e<0) return {incomplete:')'}; j=e; }
        else if(src[j]==='`'){ const e=src.indexOf('`',j+1); if(e<0) return {incomplete:'`'}; j=e; } j++; }
      if(j>=n) return {incomplete:'"'}; add(src.slice(i,j+1)); i=j+1; continue; }
    if(c==='\\'){ if(i+1>=n) return {incomplete:'\\'}; if(src[i+1]==='\n'){ i+=2; continue; } add(src.slice(i,i+2)); i+=2; continue; }
    if(c==='$'&&src[i+1]==='('){ const e=matchParen(src,i+1); if(e<0) return {incomplete:')'}; add(src.slice(i,e+1)); i=e+1; continue; }
    if(c==='$'&&src[i+1]==='{'){ const e=src.indexOf('}',i); if(e<0) return {incomplete:'}'}; add(src.slice(i,e+1)); i=e+1; continue; }
    if(c==='`'){ const e=src.indexOf('`',i+1); if(e<0) return {incomplete:'`'}; add(src.slice(i,e+1)); i=e+1; continue; }
    add(c); i++;
  }
  flush();
  const last=toks[toks.length-1];
  if(last&&last.t==='op'&&['|','&&','||'].includes(last.v)) return {incomplete:last.v};
  return {toks};
}
/* 構文木： [{op:';'|'&&'|'||', cmds:[{words:[生の語], redirs:[…]}]}] */
function parseShell(toks){
  let i=0; const items=[];
  const syn=t=>{ throw new ShErr(`bash: syntax error near unexpected token \`${t==='\n'||t==null?'newline':t}'`,2); };
  const tokText=t=>t?(t.t==='op'?t.v:t.t==='r'?(t.op==='dup'?'>&':t.op):t.raw):null;
  function cmd(){ const c={words:[],redirs:[]};
    while(i<toks.length){ const t=toks[i];
      if(t.t==='w'){ c.words.push(t.raw); i++; continue; }
      if(t.t==='r'){
        if(t.op==='<<'||t.op==='<<<') throw new Unsup('ヒアドキュメント（<< と <<<）');
        if(t.op==='dup'){ c.redirs.push(t); i++; continue; }
        const nx=toks[i+1]; if(!nx||nx.t!=='w') syn(tokText(nx));
        c.redirs.push({op:t.op,fd:t.fd,target:nx.raw}); i+=2; continue; }
      break; }
    return c; }
  let op=';';
  while(i<toks.length){
    const t=toks[i];
    if(t.t==='op'&&t.v==='\n'){ i++; continue; }
    if(t.t==='op'&&(t.v==='('||t.v===')')) throw new Unsup('( ) によるサブシェル');
    if(t.t==='op') syn(t.v);
    const cmds=[];
    for(;;){ const c=cmd(); if(!c.words.length&&!c.redirs.length) syn(tokText(toks[i])); cmds.push(c);
      const p=toks[i]; if(p&&p.t==='op'&&p.v==='|'){ i++; while(toks[i]&&toks[i].t==='op'&&toks[i].v==='\n') i++; continue; }
      if(p&&p.t==='op'&&(p.v==='('||p.v===')')) throw new Unsup('( ) によるサブシェル');
      break; }
    items.push({op,cmds});
    const s=toks[i]; if(!s) break;
    if(s.t==='op'&&s.v==='&') throw new Unsup('& によるバックグラウンド実行');
    if(s.t==='op'&&['&&','||',';','\n'].includes(s.v)){ op=s.v==='\n'?';':s.v; i++;
      if(op!==';'){ while(toks[i]&&toks[i].t==='op'&&toks[i].v==='\n') i++; } continue; }
    syn(tokText(s));
  }
  return items;
}

/* ================= 語の展開 =================
   順序は bash と同じ：ブレース展開 → チルダ・変数・コマンド置換 → 単語分割 → パス名展開（グロブ） → 引用符の除去 */
function splitTopComma(s){ const out=[]; let d=0, q=null, last=0;
  for(let i=0;i<s.length;i++){ const c=s[i];
    if(q){ if(c===q) q=null; continue; } if(c==='\\'){ i++; continue; } if(c==="'"||c==='"'){ q=c; continue; }
    if(c==='{') d++; else if(c==='}') d--; else if(c===','&&d===0){ out.push(s.slice(last,i)); last=i+1; } }
  out.push(s.slice(last)); return out; }
function braceExpand(raw){
  let depth=0, start=-1, q=null;
  for(let i=0;i<raw.length;i++){ const c=raw[i];
    if(q){ if(c===q) q=null; else if(c==='\\'&&q==='"') i++; continue; }
    if(c==='\\'){ i++; continue; }
    if(c==="'"||c==='"'){ q=c; continue; }
    if(c==='$'&&raw[i+1]==='{'){ const e=raw.indexOf('}',i); if(e>0){ i=e; continue; } }
    if(c==='{'){ if(depth===0) start=i; depth++; }
    else if(c==='}'&&depth>0){ depth--; if(depth!==0) continue;
      const inner=raw.slice(start+1,i), pre=raw.slice(0,start), post=raw.slice(i+1);
      let alts=null; const parts=splitTopComma(inner);
      if(parts.length>1) alts=parts;
      else { let m=/^(-?\d+)\.\.(-?\d+)$/.exec(inner);
        if(m){ const a=+m[1], b=+m[2], w=(/^-?0\d/.test(m[1])||/^-?0\d/.test(m[2]))?Math.max(m[1].length,m[2].length):0; alts=[];
          for(let k=a;a<=b?k<=b:k>=b;k+=a<=b?1:-1) alts.push(w?String(k).padStart(w,'0'):String(k)); }
        else if((m=/^([A-Za-z])\.\.([A-Za-z])$/.exec(inner))){ const a=m[1].charCodeAt(0), b=m[2].charCodeAt(0); alts=[]; for(let k=a;a<=b?k<=b:k>=b;k+=a<=b?1:-1) alts.push(String.fromCharCode(k)); } }
      if(alts) return alts.flatMap(a=>braceExpand(pre+a+post));
      return braceExpand(post).map(r=>raw.slice(0,i+1)+r);
    }
  }
  return [raw];
}
/* $(( )) の整数の計算。+ - * / % と括弧、変数名に対応する */
function arith(src,env){
  const t=src.match(/\d+|[A-Za-z_][A-Za-z0-9_]*|\$?[A-Za-z_][A-Za-z0-9_]*|[-+*/%()]|\S/g)||[]; let i=0;
  const bad=()=>{ throw new ShErr(`bash: ${src.trim()}: syntax error in expression (error token is "${t.slice(i).join(' ')}")`); };
  const atom=()=>{ const x=t[i++]; if(x==null) bad();
    if(x==='('){ const v=sum(); if(t[i++]!==')') bad(); return v; }
    if(x==='-') return -atom(); if(x==='+') return atom();
    if(/^\d+$/.test(x)) return parseInt(x,10);
    if(/^\$?[A-Za-z_]/.test(x)){ const v=env.get(x.replace(/^\$/,'')); return /^\s*-?\d+\s*$/.test(v)?parseInt(v,10):0; }
    i--; bad(); };
  const prod=()=>{ let v=atom(); while(['*','/','%'].includes(t[i])){ const op=t[i++], r=atom();
    if((op==='/'||op==='%')&&r===0) throw new ShErr(`bash: ${src.trim()}: division by 0 (error token is "${String(r)}")`);
    v=op==='*'?v*r:op==='/'?Math.trunc(v/r):v%r; } return v; };
  const sum=()=>{ let v=prod(); while(t[i]==='+'||t[i]==='-'){ const op=t[i++], r=prod(); v=op==='+'?v+r:v-r; } return v; };
  const v=sum(); if(i<t.length) bad(); return v;
}
/* $… の読み取り。戻り値 {v:値, end:次の位置}。$ の後が変数でなければ null（$ をそのまま文字として扱う） */
function readDollar(raw,i,env){
  const nx=raw[i+1];
  if(nx==='('){ const e=matchParen(raw,i+1); const inner=raw.slice(i+2,e);
    if(inner.startsWith('(')&&inner.endsWith(')')) return {v:String(arith(inner.slice(1,-1),env)),end:e+1};
    return {v:env.subst(inner),end:e+1}; }
  if(nx==='{'){ const e=raw.indexOf('}',i); const body=raw.slice(i+2,e);
    if(/^#[A-Za-z_][A-Za-z0-9_]*$/.test(body)) return {v:String([...env.get(body.slice(1))].length),end:e+1};
    if(/^([A-Za-z_][A-Za-z0-9_]*|\d+|[?$#@*])$/.test(body)) return {v:env.get(body),end:e+1};
    throw new ShErr(`bash: \${${body}}: bad substitution`); }
  let m=/^[A-Za-z_][A-Za-z0-9_]*/.exec(raw.slice(i+1));
  if(m) return {v:env.get(m[0]),end:i+1+m[0].length};
  if(nx&&/[0-9?$#@*!-]/.test(nx)) return {v:env.get(nx),end:i+2};
  return null;
}
/* 1 語を展開して「欄」の配列を返す。欄は文字ごとに、グロブとして働くか（引用符の外か）を持つ */
function expandWord(raw,env,nosplit){
  if(raw==='"$@"') return env.pos().map(s=>({c:[...s],a:[...s].map(()=>false)}));
  const fields=[]; let cur=null;
  const touch=()=>{ if(!cur) cur={c:[],a:[]}; };
  const push=(ch,act)=>{ touch(); cur.c.push(ch); cur.a.push(act); };
  const end=()=>{ if(cur){ fields.push(cur); cur=null; } };
  const addExp=(val,quoted)=>{ if(quoted||nosplit){ touch(); for(const ch of val) push(ch,false); return; }
    for(const p of val.split(/([ \t\n]+)/)){ if(/^[ \t\n]+$/.test(p)) end(); else for(const ch of p) push(ch,true); } };
  let i=0; const n=raw.length;
  const tm=/^~([A-Za-z0-9_.-]*)(?=\/|$)/.exec(raw);
  if(tm){ const h=tm[1]?env.homeOf(tm[1]):env.get('HOME'); if(h!=null){ touch(); for(const ch of h) push(ch,false); i=tm[0].length; } }
  while(i<n){ const c=raw[i];
    if(c==="'"){ const j=raw.indexOf("'",i+1); touch(); for(const ch of raw.slice(i+1,j)) push(ch,false); i=j+1; continue; }
    if(c==='"'){ touch(); i++;
      while(i<n&&raw[i]!=='"'){ const d=raw[i];
        if(d==='\\'&&'$`"\\'.includes(raw[i+1])){ push(raw[i+1],false); i+=2; continue; }
        if(d==='$'){ const r=readDollar(raw,i,env); if(r){ addExp(r.v,true); i=r.end; continue; } }
        if(d==='`'){ const e=raw.indexOf('`',i+1); addExp(env.subst(raw.slice(i+1,e)),true); i=e+1; continue; }
        push(d,false); i++; }
      i++; continue; }
    if(c==='\\'){ push(raw[i+1],false); i+=2; continue; }
    if(c==='$'){ const r=readDollar(raw,i,env); if(r){ addExp(r.v,false); i=r.end; continue; } }
    if(c==='`'){ const e=raw.indexOf('`',i+1); addExp(env.subst(raw.slice(i+1,e)),false); i=e+1; continue; }
    push(c,!nosplit); i++;
  }
  end();
  return fields;
}
const expandOne=(raw,env)=>expandWord(raw,env,true).map(f=>f.c.join('')).join(' ');
/* グロブのパターンを正規表現にする。act=false の文字（引用符の中）は普通の文字として扱う */
const POSIX_CLASS={alpha:'A-Za-z',digit:'0-9',alnum:'A-Za-z0-9',upper:'A-Z',lower:'a-z',space:' \\t\\n\\r\\f\\v',blank:' \\t',punct:'!-\\/:-@\\[-`{-~',xdigit:'0-9A-Fa-f'};
const reEsc=s=>s.replace(/[.*+?^${}()|[\]\\\/]/g,'\\$&');
function globRe(cs,as){
  let re='^';
  for(let k=0;k<cs.length;k++){ const ch=cs[k], act=as?as[k]:true;
    if(act&&ch==='*'){ re+='[^/]*'; continue; }
    if(act&&ch==='?'){ re+='[^/]'; continue; }
    if(act&&ch==='['){ let j=k+1; if(cs[j]==='!'||cs[j]==='^') j++; if(cs[j]===']') j++;
      while(j<cs.length&&cs[j]!==']'){ if(cs[j]==='['&&cs[j+1]===':'){ const e=cs.indexOf(']',j+2); if(e>0) j=e; } j++; }
      if(j<cs.length){ let body=cs.slice(k+1,j).join(''), neg=false; if(body[0]==='!'||body[0]==='^'){ neg=true; body=body.slice(1); }
        body=body.replace(/\\/g,'\\\\').replace(/\[:(\w+):\]/g,(m,n)=>POSIX_CLASS[n]||'').replace(/^\]/,'\\]');
        re+='['+(neg?'^':'')+body+']'; k=j; continue; } }
    re+=reEsc(ch); }
  return new RegExp(re+'$');
}
const hasGlob=(cs,as)=>cs.some((ch,k)=>(as?as[k]:true)&&(ch==='*'||ch==='?'||ch==='['));
function globField(f,ctx){
  const s=f.c.join('');
  if(!hasGlob(f.c,f.a)) return [s];
  const comps=[]; let cc=[], ca=[];
  f.c.forEach((ch,k)=>{ if(ch==='/'){ comps.push([cc,ca]); cc=[]; ca=[]; } else { cc.push(ch); ca.push(f.a[k]); } });
  comps.push([cc,ca]);
  const abs=s[0]==='/';
  let paths=[abs?'/':''];
  const join=(p,n)=>p===''?n:p==='/'?'/'+n:p+'/'+n;
  comps.forEach(([cs,as],k)=>{ if(k===0&&abs) return; if(!cs.length) return;
    if(!hasGlob(cs,as)){ const lit=cs.join(''); paths=paths.map(p=>join(p,lit)); return; }
    const re=globRe(cs,as), dot=cs[0]==='.'; const next=[];
    for(const p of paths){ let r; try{ r=ctx.res(p===''?'.':p); }catch(e){ continue; }
      if(!r.node||r.node.type!=='d'||!ctx.fs.can(r.node,ctx.cred,4)) continue;
      for(const name of [...r.node.kids.keys()].sort(byteCmp)){ if(name[0]==='.'&&!dot) continue; if(re.test(name)) next.push(join(p,name)); } }
    paths=next; });
  const hits=paths.filter(p=>{ try{ const r=ctx.res(p,false); return !!r.node; }catch(e){ return false; } });
  return hits.length?hits:[s];
}
const byteCmp=(a,b)=>a<b?-1:a>b?1:0;

/* ================= 出力先（標準出力・標準エラー・パイプ・ファイル） ================= */
const bufSink=()=>{ const o={tty:false,buf:'',write(s){ o.buf+=s; }}; return o; };
const nullSink={tty:false,write(){}};
function fileSink(fs,node){ return {tty:false,node,write(s){ if(!s) return; node.data+=s; node.bin=null; node.mtime=fs.now(); }}; }

/* ================= シェル ================= */
class Shell{
  fork(){ const s=Object.assign(new Shell(),this); s.vars=new Map([...this.vars].map(([k,v])=>[k,{...v}])); s.aliases=new Map(this.aliases); return s; }
  get(k){ const e=this.vars.get(k); return e?e.v:''; }
  set(k,v,x){ const e=this.vars.get(k); this.vars.set(k,{v,x:x??(e?e.x:false)}); }
}
/* コマンドに渡す実行時の情報 */
class Ctx{
  constructor(sim,sh,argv,io,av,cnode,name){ this.sim=sim; this.sh=sh; this.argv=argv; this.io=io; this.av=av||[]; this.cnode=cnode; this.name=name; this.fs=sim.fs; this.cred=sh.cred; }
  out(s){ this.io.stdout.write(s); }
  err(s){ this.io.stderr.write(s); }
  get tty(){ return !!this.io.stdout.tty; }
  res(p,follow=true){ return this.fs.resolve(p,this.sh.cwd,this.cred,follow); }
  /* 見つからないときも例外にせず {err} を返す */
  look(p,follow=true){ try{ const r=this.res(p,follow); if(!r.node) return {err:new FsErr('ENOENT'),r}; return r; }catch(e){ if(e instanceof FsErr) return {err:e}; throw e; } }
  stdin(){ const s=this.io.stdin; if(s==null){ this.sim.ttyWait(this.name); return ''; } return s; }
  read(p){ if(p==='-') return this.stdin(); const r=this.res(p); if(!r.node) throw new FsErr('ENOENT'); if(r.node.type==='d') throw new FsErr('EISDIR'); if(!this.can(r.node,4)) throw new FsErr('EACCES'); return textOf(r.node); }
  create(r,type,mode){ return this.sim.create(r,type,this.sh,mode); }
  can(n,b){ return this.fs.can(n,this.cred,b); }
  owner(n){ return this.cred.uid===0||n.uid===this.cred.uid; }
}
/* GNU 形式のオプション解析。オプションは引数の途中に置いてもよい（-- 以降は除く） */
function getopt(cmd,args,spec,long={},code=1){
  const o={}, rest=[];
  for(let i=0;i<args.length;i++){ const a=args[i];
    if(a==='--'){ rest.push(...args.slice(i+1)); break; }
    if(a.startsWith('--')){ const eq=a.indexOf('='), k=eq<0?a.slice(2):a.slice(2,eq); const m=long[k];
      if(m==null) throw usage(cmd,`unrecognized option '${a}'`,code);
      if(m.endsWith(':')){ const key=m.slice(0,-1); const v=eq<0?args[++i]:a.slice(eq+1); if(v==null) throw usage(cmd,`option '--${k}' requires an argument`,code); o[key]=v; (o['@'+key]=o['@'+key]||[]).push(v); }
      else o[m]=(o[m]||0)+1;
      continue; }
    if(a[0]==='-'&&a.length>1){
      for(let j=1;j<a.length;j++){ const ch=a[j], p=spec.indexOf(ch);
        if(p<0||ch===':') throw usage(cmd,`invalid option -- '${ch}'`,code);
        if(spec[p+1]===':'){ const v=j+1<a.length?a.slice(j+1):args[++i]; if(v==null) throw usage(cmd,`option requires an argument -- '${ch}'`,code); o[ch]=v; (o['@'+ch]=o['@'+ch]||[]).push(v); break; }
        o[ch]=(o[ch]||0)+1; }
      continue; }
    rest.push(a); }
  return {o,args:rest};
}
const basename=p=>{ const s=p.replace(/\/+$/,''); return s===''?'/':s.slice(s.lastIndexOf('/')+1); };
const dirname=p=>{ const s=p.replace(/\/+$/,''); const i=s.lastIndexOf('/'); return i<0?'.':i===0?'/':s.slice(0,i); };
const joinP=(a,b)=>a.endsWith('/')?a+b:a+'/'+b;
const oct4=m=>(m&0o7777).toString(8).padStart(4,'0');
function linesOf(t){ if(t==='') return {ls:[],nl:true}; const nl=t.endsWith('\n'); const ls=(nl?t.slice(0,-1):t).split('\n'); return {ls,nl}; }
const unlines=(ls,nl=true)=>ls.length?ls.join('\n')+(nl?'\n':''):'';
function modeStr(n){ let s={f:'-',d:'d',l:'l',c:'c',b:'b'}[n.type]; const m=n.mode;
  for(const [sh,bit,ch] of [[6,0o4000,'s'],[3,0o2000,'s'],[0,0o1000,'t']]){ const b=(m>>sh)&7; s+=(b&4?'r':'-')+(b&2?'w':'-'); const x=b&1; s+=(m&bit)?(x?ch:ch.toUpperCase()):(x?'x':'-'); }
  return s; }
/* ls の日時。半年以内なら時刻、それより前なら年を出す */
function lsDate(t,now){ const d=jst(t); const recent=now-t<182*DAY&&t<=now+3600000;
  return `${MON[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2)} `+(recent?`${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`:` ${d.getUTCFullYear()}`); }
function human(n){ if(n<1024) return String(n); const u='KMGT'; let v=n, k=-1; do{ v/=1024; k++; }while(v>=1024&&k<3);
  const r=Math.ceil(v*10)/10; return r<10?r.toFixed(1)+u[k]:Math.ceil(v)+u[k]; }
/* 端末に出すときの複数列表示（GNU ls と同じく、縦に並べてから横へ） */
function columns(names,width=80){
  const n=names.length; if(!n) return ''; const L=names.map(s=>[...s].length);
  for(let cols=Math.min(n,Math.max(1,Math.floor(width/3)));cols>=1;cols--){
    const rows=Math.ceil(n/cols), rc=Math.ceil(n/rows), w=[];
    for(let ci=0;ci<rc;ci++){ let m=0; for(let r=0;r<rows;r++){ const k=ci*rows+r; if(k<n) m=Math.max(m,L[k]); } w.push(m); }
    if(w.reduce((a,b)=>a+b,0)+2*(rc-1)<=width||cols===1){
      const out=[]; for(let r=0;r<rows;r++){ let line=''; for(let ci=0;ci<rc;ci++){ const k=ci*rows+r; if(k>=n) continue; const last=(ci+1)*rows+r>=n; line+=last?names[k]:names[k]+' '.repeat(w[ci]-L[k]+2); } out.push(line); }
      return out.join('\n')+'\n'; } }
}
/* chmod の権限指定を適用する。数値（640）と記号（u+x,g-w,o=r,+t など）の両方。不正なら null */
function applyMode(spec,cur,isDir,umask){
  if(/^[0-7]{1,5}$/.test(spec)){ let m=parseInt(spec,8)&0o7777;
    /* GNU chmod は、ディレクトリの SUID/SGID を 4 桁以下の数値指定では消さない */
    if(isDir&&spec.length<5) m|=cur&0o6000; return m; }
  let m=cur;
  for(const cl of spec.split(',')){
    const mm=/^([ugoa]*)((?:[-+=][rwxXst]*)+)$/.exec(cl); if(!mm) return null;
    const noWho=!mm[1]; const W=new Set((mm[1]||'a').replace(/a/g,'ugo').split(''));
    for(const [,op,perms] of mm[2].matchAll(/([-+=])([rwxXst]*)/g)){
      let bits=0;
      for(const p of perms){
        const x=p==='x'||(p==='X'&&(isDir||(cur&0o111)));
        if(p==='r'||p==='w'||x){ const b=p==='r'?4:p==='w'?2:1; if(W.has('u')) bits|=b<<6; if(W.has('g')) bits|=b<<3; if(W.has('o')) bits|=b; }
        else if(p==='s'){ if(W.has('u')) bits|=0o4000; if(W.has('g')) bits|=0o2000; }
        else if(p==='t'){ if(W.has('o')) bits|=0o1000; } }
      if(noWho) bits&=~umask;   // 対象を書かないと umask で隠したビットは変えない
      const mask=(W.has('u')?0o4700:0)|(W.has('g')?0o2070:0)|(W.has('o')?0o1007:0);
      if(op==='+') m|=bits; else if(op==='-') m&=~bits; else m=(m&~mask)|bits;
    } }
  return m;
}
/* POSIX の正規表現（BRE / ERE）を JavaScript の正規表現の文字列にする */
function posixRe(p,ere){
  let out='', i=0;
  while(i<p.length){ const ch=p[i];
    if(ch==='\\'){ const nx=p[i+1]; if(nx==null) throw new ShErr('Trailing backslash');
      if('(){}|+?'.includes(nx)){ out+=ere?'\\'+nx:nx; i+=2; continue; }
      if(nx==='<'||nx==='>'){ out+='\\b'; i+=2; continue; }
      if(/[0-9wWsSbB]/.test(nx)){ out+='\\'+nx; i+=2; continue; }
      out+=reEsc(nx); i+=2; continue; }
    if(ch==='['){ let j=i+1; if(p[j]==='^') j++; if(p[j]===']') j++;
      while(j<p.length&&p[j]!==']'){ if(p[j]==='['&&p[j+1]===':'){ const e=p.indexOf(':]',j+2); if(e>0){ j=e+2; continue; } } j++; }
      if(j>=p.length) throw new ShErr('Unmatched [, [^, [:, [., or [=');
      let body=p.slice(i+1,j), neg=''; if(body[0]==='^'){ neg='^'; body=body.slice(1); }
      body=body.replace(/\\/g,'\\\\').replace(/\[:(\w+):\]/g,(m,n)=>POSIX_CLASS[n]||'').replace(/^\]/,'\\]').replace(/\[(?!:)/g,'\\[');
      out+='['+neg+body+']'; i=j+1; continue; }
    if(!ere&&'(){}|+?'.includes(ch)){ out+='\\'+ch; i++; continue; }
    if(ch==='*'&&(out===''||out==='^'||(ere&&/[(|]$/.test(out)))){ out+='\\*'; i++; continue; }
    if(ch==='/'){ out+='\\/'; i++; continue; }
    out+=ch; i++; }
  return out;
}
function makeRe(c,p,ere,flags){ try{ return new RegExp(posixRe(p,ere),flags); }catch(e){ if(e instanceof ShErr) throw new ShErr(`${c}: ${e.message}`,2); throw new ShErr(`${c}: Invalid regular expression`,2); } }

const CMDS={}, BUILTIN={};
const def=(names,dir,fn)=>names.split(' ').forEach(n=>{ CMDS[n]={dir,fn}; });
const B=(names,fn)=>names.split(' ').forEach(n=>{ BUILTIN[n]=fn; });

/* ---- 場所の移動と確認 ---- */
B('cd',c=>{
  const a=c.argv.slice(1).filter(x=>x!=='-P'&&x!=='-L'); const sh=c.sh;
  if(a.length>1){ c.err('bash: cd: too many arguments\n'); return 1; }
  let p=a[0], show=false;
  if(p==null||p===''){ p=sh.get('HOME'); if(!p){ c.err('bash: cd: HOME not set\n'); return 1; } }
  if(p==='-'){ p=sh.get('OLDPWD'); if(!p){ c.err('bash: cd: OLDPWD not set\n'); return 1; } show=true; }
  const r=c.look(p);
  if(r.err){ c.err(`bash: cd: ${p}: ${r.err.message}\n`); return 1; }
  if(r.node.type!=='d'){ c.err(`bash: cd: ${p}: Not a directory\n`); return 1; }
  if(!c.can(r.node,1)){ c.err(`bash: cd: ${p}: Permission denied\n`); return 1; }
  sh.set('OLDPWD',sh.cwd); sh.cwd=r.abs; sh.set('PWD',r.abs); if(show) c.out(r.abs+'\n');
});
B('pwd',c=>{ c.out(c.sh.cwd+'\n'); });
def('pwd','/usr/bin',c=>{ c.out(c.sh.cwd+'\n'); });

def('ls','/usr/bin',c=>{
  const {o,args}=getopt('ls',c.argv.slice(1),'aAldihRrtS1F',{all:'a','almost-all':'A',directory:'d',inode:'i','human-readable':'h',recursive:'R',reverse:'r',classify:'F'},2);
  const sim=c.sim, now=c.fs.now(); let st=0;
  const ops=args.length?args:['.'], files=[], dirs=[];
  for(const p of ops){ const r=c.look(p,!(o.l||o.d||o.F));
    if(r.err){ c.err(`ls: cannot access '${p}': ${r.err.message}\n`); st=2; continue; }
    (r.node.type==='d'&&!o.d?dirs:files).push({name:p,n:r.node}); }
  const sortE=a=>{ a.sort((x,y)=>o.t?(y.n.mtime-x.n.mtime)||byteCmp(x.name,y.name):o.S?(sizeOf(y.n)-sizeOf(x.n))||byteCmp(x.name,y.name):byteCmp(x.name,y.name)); if(o.r) a.reverse(); return a; };
  const suffix=n=>!o.F?'':n.type==='d'?'/':n.type==='l'?'@':(n.mode&0o111)?'*':'';
  const show=list=>{
    if(!list.length) return;
    if(o.l){
      const rows=list.map(({name,n})=>({ino:String(n.ino),mode:modeStr(n),nl:String(n.nlink),own:sim.uname(n.uid),grp:sim.gname(n.gid),
        size:(n.type==='c'||n.type==='b')?`${n.dev[0]}, ${n.dev[1]}`:o.h?human(sizeOf(n)):String(sizeOf(n)),date:lsDate(n.mtime,now),
        name:name+(n.type==='l'?' -> '+n.target:suffix(n))}));
      const w=k=>Math.max(...rows.map(r=>r[k].length));
      const W={ino:w('ino'),nl:w('nl'),own:w('own'),grp:w('grp'),size:w('size')};
      c.out(rows.map(r=>(o.i?r.ino.padStart(W.ino)+' ':'')+`${r.mode} ${r.nl.padStart(W.nl)} ${r.own.padEnd(W.own)} ${r.grp.padEnd(W.grp)} ${r.size.padStart(W.size)} ${r.date} ${r.name}`).join('\n')+'\n');
      return; }
    const names=list.map(({name,n})=>(o.i?n.ino+' ':'')+name+suffix(n));
    c.out(c.tty&&!o['1']?columns(names):names.join('\n')+'\n');
  };
  const listDir=(p,n)=>{
    if(!c.can(n,4)){ c.err(`ls: cannot open directory '${p}': Permission denied\n`); st=2; return; }
    const list=[...n.kids].filter(([k])=>o.a||o.A||k[0]!=='.').map(([k,v])=>({name:k,n:v}));
    if(o.a){ const up=c.look(joinP(p,'..')); list.push({name:'.',n},{name:'..',n:up.err?n:up.node}); }
    sortE(list);
    if(o.l){ const tot=list.reduce((s,{n:x})=>s+(x.type==='f'?Math.ceil(sizeOf(x)/4096)*4:x.type==='d'?4:0),0); c.out(`total ${o.h?human(tot*1024):tot}\n`); }
    show(list);
    if(o.R) for(const e of list){ if(e.n.type!=='d'||e.name==='.'||e.name==='..') continue; const sub=joinP(p,e.name); c.out(`\n${sub}:\n`); listDir(sub,e.n); }
  };
  show(sortE(files));
  const many=ops.length>1||o.R;
  sortE(dirs).forEach((d,k)=>{ if(files.length||k>0) c.out('\n'); if(many) c.out(`${d.name}:\n`); listDir(d.name,d.n); });
  return st;
});

/* ---- ファイルとディレクトリの操作 ---- */
def('mkdir','/usr/bin',c=>{
  const {o,args}=getopt('mkdir',c.argv.slice(1),'pvm:',{parents:'p',verbose:'v','mode:':'m'});
  if(!args.length) throw usage('mkdir','missing operand');
  let mode=null; if(o.m!=null){ mode=applyMode(o.m,0o777,true,0); if(mode==null){ c.err(`mkdir: invalid mode ‘${o.m}’\n`); return 1; } }
  let st=0; const made=[];
  const mk=(r,m)=>{ const n=c.create(r,'d',m); made.push(r.abs); if(o.v) c.out(`mkdir: created directory '${r.shown}'\n`); return n; };
  for(const p of args){
    try{
      if(o.p){
        const comps=p.split('/').filter(Boolean); let cur=p[0]==='/'?'/':'';
        comps.forEach((comp,k)=>{ cur=cur===''?comp:cur==='/'?'/'+comp:cur+'/'+comp;
          let r; try{ r=c.res(cur); }catch(e){ if(e instanceof FsErr) throw Object.assign(e,{at:cur}); throw e; }
          if(r.node){ if(r.node.type!=='d') throw Object.assign(new FsErr('ENOTDIR'),{at:cur}); return; }
          r.shown=cur; try{ mk(r,k===comps.length-1?mode:null); }catch(e){ throw Object.assign(e,{at:cur}); } });
      } else {
        const r=c.res(p,false); if(r.node) throw new FsErr('EEXIST'); r.shown=p; mk(r,mode);
      }
    }catch(e){ if(!(e instanceof FsErr)) throw e; c.err(`mkdir: cannot create directory ‘${e.at||p}’: ${e.message}\n`); st=1; }
  }
  c.sim.flags.mkdirs.push(made);
  return st;
});
def('rmdir','/usr/bin',c=>{
  const {o,args}=getopt('rmdir',c.argv.slice(1),'pv',{parents:'p',verbose:'v'});
  if(!args.length) throw usage('rmdir','missing operand');
  let st=0;
  const rm1=p=>{ const b=basename(p); if(b==='.'||b==='..') throw new FsErr('EINVAL');
    const r=c.res(p,false); if(!r.node) throw new FsErr('ENOENT'); if(r.node.type!=='d') throw new FsErr('ENOTDIR');
    if(r.node.kids.size) throw new FsErr('ENOTEMPTY'); if(!c.fs.canUnlink(r.dir,r.node,c.cred)) throw new FsErr('EACCES');
    c.fs.drop(r.dir,r.name); if(o.v) c.out(`rmdir: removing directory, '${p}'\n`); };
  for(const p of args){ try{ rm1(p); if(o.p){ let q=dirname(p); while(q!=='.'&&q!=='/'){ rm1(q); q=dirname(q); } } }
    catch(e){ if(!(e instanceof FsErr)) throw e; c.err(`rmdir: failed to remove '${p}': ${e.message}\n`); st=1; } }
  return st;
});
def('touch','/usr/bin',c=>{
  const {args}=getopt('touch',c.argv.slice(1),'acm',{});
  if(!args.length) throw usage('touch','missing file operand');
  let st=0;
  for(const p of args){ try{ const r=c.res(p);
      if(r.node){ if(!c.owner(r.node)&&!c.can(r.node,2)) throw new FsErr('EACCES'); r.node.mtime=c.fs.now(); }
      else c.create(r,'f');
    }catch(e){ if(!(e instanceof FsErr)) throw e; c.err(`touch: cannot touch '${p}': ${e.message}\n`); st=1; } }
  return st;
});
def('rm','/usr/bin',c=>{
  const {o,args}=getopt('rm',c.argv.slice(1),'rRfivd',{recursive:'r',force:'f',verbose:'v',dir:'d','no-preserve-root':'P'});
  const rec=o.r||o.R;
  if(!args.length){ if(o.f) return 0; throw usage('rm','missing operand'); }
  if(o.i) throw new Unsup('rm の -i（1 件ずつの確認）');
  let st=0;
  const kind=n=>n.type==='d'?'directory':n.type==='l'?'symbolic link':sizeOf(n)?'regular file':'regular empty file';
  const del=(p,dir,name,n)=>{
    if(n.type==='d'){
      if(!rec&&!o.d){ c.err(`rm: cannot remove '${p}': Is a directory\n`); st=1; return false; }
      if(rec){ if(!c.can(n,4)||!c.can(n,1)){ c.err(`rm: cannot remove '${p}': Permission denied\n`); st=1; return false; }
        let ok=true; for(const [k,v] of [...n.kids]) ok=del(joinP(p,k),n,k,v)&&ok; if(!ok) return false; }
      else if(n.kids.size){ c.err(`rm: cannot remove '${p}': Directory not empty\n`); st=1; return false; }
    }
    const ue=c.fs.unlinkErr(dir,n,c.cred);
    if(n.type!=='d'&&!o.f&&n.type!=='l'&&!c.can(n,2)&&c.io.stdin==null){
      /* 実機は書き込み禁止のファイルを消す前に確認を求める。このドリルでは答えられないので消さない */
      c.err(`rm: remove write-protected ${kind(n)} '${p}'? `);
      c.sim.note(ue===ERRS.EPERM?'% このドリルでは確認に答えられないため、削除しませんでした。なお、このディレクトリにはスティッキービットがあり、y と答えても他人のファイルは消せません（Operation not permitted）'
        :'% このドリルでは確認に答えられないため、削除しませんでした。確認なしで消すなら -f を付けます');
      st=1; return false; }
    if(ue){ c.err(`rm: cannot remove '${p}': ${ue}\n`); st=1; return false; }
    c.fs.drop(dir,name); if(o.v) c.out(n.type==='d'?`removed directory '${p}'\n`:`removed '${p}'\n`); return true; };
  for(const p of args){
    const b=basename(p);
    if(b==='.'||b==='..'){ c.err(`rm: refusing to remove '.' or '..' directory: skipping '${p}'\n`); st=1; continue; }
    const r=c.look(p,false);
    if(r.err){ if(!o.f){ c.err(`rm: cannot remove '${p}': ${r.err.message}\n`); st=1; } continue; }
    if(r.abs==='/'){ if(rec&&!o.P){ c.err("rm: it is dangerous to operate recursively on '/'\nrm: use --no-preserve-root to override this failsafe\n"); st=1; continue; } }
    del(p,r.dir,r.name,r.node);
  }
  return st;
});
/* 中身ごと複製する（ハードリンクは複製しない） */
function cloneTree(c,src,dst,preserve,links){
  const n=new Node(src.type,src.mode,c.cred.uid,c.cred.gid,c.fs.now());
  if(!preserve) n.mode=src.type==='l'?0o777:src.mode&~c.sh.umask&0o7777;
  if(preserve){ n.mtime=src.mtime; if(c.cred.uid===0){ n.uid=src.uid; n.gid=src.gid; } }
  if(src.type==='f'){ n.data=src.data; n.bin=src.bin?structuredClone(src.bin):null; }
  if(src.type==='l') n.target=src.target;
  if(src.dev) n.dev=src.dev;
  return n;
}
function copyInto(c,o,sp,sn,dp,rDest){
  /* rDest: 作成先の resolve 結果（node があれば上書き） */
  const rec=o.r||o.R||o.a, pres=o.p||o.a;
  if(sn.type==='d'){
    if(!rec){ c.err(`cp: -r not specified; omitting directory '${sp}'\n`); return false; }
    if(!c.can(sn,4)||!c.can(sn,1)){ c.err(`cp: cannot access '${sp}': Permission denied\n`); return false; }
    let dn=rDest.node;
    if(dn&&dn.type!=='d'){ c.err(`cp: cannot overwrite non-directory '${dp}' with directory '${sp}'\n`); return false; }
    if(!dn){ dn=cloneTree(c,sn,null,pres); if(!c.can(rDest.dir,2)){ c.err(`cp: cannot create directory '${dp}': Permission denied\n`); return false; }
      if(!pres&&(rDest.dir.mode&0o2000)){ dn.gid=rDest.dir.gid; dn.mode|=0o2000; }
      c.fs.add(rDest.dir,rDest.name,dn); }
    let ok=true;
    for(const [k,v] of [...sn.kids]){ const sub=v; const rr={node:dn.kids.get(k)||null,dir:dn,name:k};
      ok=copyInto(c,{...o,deref:false},joinP(sp,k),sub.type==='l'&&!o.a&&o.deref?sub:sub,joinP(dp,k),rr)&&ok; }
    if(o.v) c.out(`'${sp}' -> '${dp}'\n`);
    return ok;
  }
  if(sn.type!=='l'||!rec){ if(!c.can(sn,4)){ c.err(`cp: cannot open '${sp}' for reading: Permission denied\n`); return false; } }
  if(rDest.node){
    if(rDest.node===sn){ c.err(`cp: '${sp}' and '${dp}' are the same file\n`); return false; }
    if(rDest.node.type==='d'){ c.err(`cp: cannot overwrite directory '${dp}' with non-directory\n`); return false; }
    if(!c.can(rDest.node,2)){ if(!o.f){ c.err(`cp: cannot create regular file '${dp}': Permission denied\n`); return false; }
      if(!c.fs.canUnlink(rDest.dir,rDest.node,c.cred)){ c.err(`cp: cannot remove '${dp}': Permission denied\n`); return false; }
      c.fs.drop(rDest.dir,rDest.name); rDest.node=null; }
  }
  if(rDest.node){ const d=rDest.node; d.data=sn.data; d.bin=sn.bin?structuredClone(sn.bin):null; d.mtime=pres?sn.mtime:c.fs.now(); if(pres) d.mode=sn.mode; }
  else { if(!c.can(rDest.dir,2)){ c.err(`cp: cannot create regular file '${dp}': Permission denied\n`); return false; }
    const n=cloneTree(c,sn,null,pres); if(!pres&&(rDest.dir.mode&0o2000)) n.gid=rDest.dir.gid; c.fs.add(rDest.dir,rDest.name,n); }
  if(o.v) c.out(`'${sp}' -> '${dp}'\n`);
  return true;
}
def('cp','/usr/bin',c=>{
  const {o,args}=getopt('cp',c.argv.slice(1),'rRapfviP',{recursive:'r',archive:'a',force:'f',verbose:'v',preserve:'p'});
  if(o.i) throw new Unsup('cp の -i（上書きの確認）');
  if(!args.length) throw usage('cp','missing file operand');
  if(args.length===1) throw usage('cp',`missing destination file operand after '${args[0]}'`);
  const dest=args[args.length-1], srcs=args.slice(0,-1);
  const dr=c.look(dest);
  const intoDir=!dr.err&&dr.node.type==='d';
  if(srcs.length>1&&!intoDir){ c.err(`cp: target '${dest}' is not a directory\n`); return 1; }
  let st=0;
  for(const sp of srcs){
    const sr=c.look(sp,!(o.a||o.P)&&!((o.r||o.R)&&false));
    if(sr.err){ c.err(`cp: cannot stat '${sp}': ${sr.err.message}\n`); st=1; continue; }
    let dp=dest, rd;
    if(!intoDir&&dest.endsWith('/')&&dr.err){ c.err(`cp: cannot create regular file '${dest}': Not a directory\n`); st=1; continue; }
    try{ if(intoDir){ dp=joinP(dest,basename(sp)); } rd=c.res(dp,true); }catch(e){ if(!(e instanceof FsErr)) throw e; c.err(`cp: cannot create regular file '${dp}': ${e.message}\n`); st=1; continue; }
    if(sr.node.type==='d'&&rd.st&&rd.st.some(x=>x.n===sr.node)){ c.err(`cp: cannot copy a directory, '${sp}', into itself, '${dp}'\n`); st=1; continue; }
    if(!copyInto(c,o,sp,sr.node,dp,rd)) st=1;
  }
  return st;
});
def('mv','/usr/bin',c=>{
  const {o,args}=getopt('mv',c.argv.slice(1),'fvin',{force:'f',verbose:'v'});
  if(o.i) throw new Unsup('mv の -i（上書きの確認）');
  if(!args.length) throw usage('mv','missing file operand');
  if(args.length===1) throw usage('mv',`missing destination file operand after '${args[0]}'`);
  const dest=args[args.length-1], srcs=args.slice(0,-1);
  const dr=c.look(dest);
  const intoDir=!dr.err&&dr.node.type==='d';
  if(srcs.length>1&&!intoDir){ c.err(`mv: target '${dest}' is not a directory\n`); return 1; }
  let st=0;
  for(const sp of srcs){
    const sr=c.look(sp,false);
    if(sr.err){ c.err(`mv: cannot stat '${sp}': ${sr.err.message}\n`); st=1; continue; }
    const dp=intoDir?joinP(dest,basename(sp)):dest;
    let rd; try{ rd=c.res(dp,false); }catch(e){ if(!(e instanceof FsErr)) throw e; c.err(`mv: cannot move '${sp}' to '${dp}': ${e.message}\n`); st=1; continue; }
    if(rd.node===sr.node){ c.err(`mv: '${sp}' and '${dp}' are the same file\n`); st=1; continue; }
    if(sr.node.type==='d'&&rd.st.some(x=>x.n===sr.node)){ c.err(`mv: cannot move '${sp}' to a subdirectory of itself, '${dp}'\n`); st=1; continue; }
    const ue=c.fs.unlinkErr(sr.dir,sr.node,c.cred)||(c.can(rd.dir,2)?null:ERRS.EACCES);
    if(ue){ c.err(`mv: cannot move '${sp}' to '${dp}': ${ue}\n`); st=1; continue; }
    if(rd.node){
      if(rd.node.type==='d'&&sr.node.type!=='d'){ c.err(`mv: cannot overwrite directory '${dp}' with non-directory\n`); st=1; continue; }
      if(rd.node.type!=='d'&&sr.node.type==='d'){ c.err(`mv: cannot overwrite non-directory '${dp}' with directory '${sp}'\n`); st=1; continue; }
      if(rd.node.type==='d'&&rd.node.kids.size){ c.err(`mv: cannot move '${sp}' to '${dp}': Directory not empty\n`); st=1; continue; }
      if(!c.fs.canUnlink(rd.dir,rd.node,c.cred)){ c.err(`mv: cannot move '${sp}' to '${dp}': Permission denied\n`); st=1; continue; }
      c.fs.drop(rd.dir,rd.name);
    }
    /* 同じファイルシステム内の移動なので、i ノードは変わらない */
    const n=sr.node; sr.dir.kids.delete(sr.name); if(n.type==='d') sr.dir.nlink--; sr.dir.mtime=c.fs.now();
    c.fs.add(rd.dir,rd.name,n);
    if(o.v) c.out(`renamed '${sp}' -> '${dp}'\n`);
  }
  return st;
});
def('ln','/usr/bin',c=>{
  const {o,args}=getopt('ln',c.argv.slice(1),'sfvn',{symbolic:'s',force:'f',verbose:'v'});
  if(!args.length) throw usage('ln','missing file operand');
  const targets=args.length===1?args:args.slice(0,-1);
  let dest=args.length===1?'.':args[args.length-1];
  const dr=c.look(dest);
  const intoDir=!dr.err&&dr.node.type==='d'&&!(o.n&&dr.node);
  if(targets.length>1&&!intoDir){ c.err(`ln: target '${dest}' is not a directory\n`); return 1; }
  let st=0; const what=o.s?'symbolic link':'hard link';
  for(const t of targets){
    const lp=intoDir?joinP(dest,basename(t)):dest;
    let src=null;
    if(!o.s){ const sr=c.look(t); if(sr.err){ c.err(`ln: failed to access '${t}': ${sr.err.message}\n`); st=1; continue; }
      if(sr.node.type==='d'){ c.err(`ln: ${t}: hard link not allowed for directory\n`); st=1; continue; } src=sr.node; }
    let r; try{ r=c.res(lp,false); }catch(e){ if(!(e instanceof FsErr)) throw e; c.err(`ln: failed to create ${what} '${lp}': ${e.message}\n`); st=1; continue; }
    if(r.node){ if(!o.f){ c.err(`ln: failed to create ${what} '${lp}': File exists\n`); st=1; continue; }
      if(r.node.type==='d'){ c.err(`ln: ${lp}: cannot overwrite directory\n`); st=1; continue; }
      if(!c.fs.canUnlink(r.dir,r.node,c.cred)){ c.err(`ln: cannot remove '${lp}': Permission denied\n`); st=1; continue; }
      c.fs.drop(r.dir,r.name); }
    if(!c.can(r.dir,2)){ c.err(`ln: failed to create ${what} '${lp}': Permission denied\n`); st=1; continue; }
    if(o.s){ const n=c.create(r,'l'); n.target=t; }
    else { c.fs.add(r.dir,r.name,src); src.nlink++; }
    if(o.v) c.out(`'${lp}' ${o.s?'->':'=>'} '${t}'\n`);
  }
  return st;
});
def('readlink','/usr/bin',c=>{
  const {o,args}=getopt('readlink',c.argv.slice(1),'fe',{});
  if(!args.length) throw usage('readlink','missing operand'); let st=0;
  for(const p of args){ if(o.f||o.e){ const r=c.look(p); if(r.err){ st=1; continue; } c.out(r.abs+'\n'); continue; }
    const r=c.look(p,false); if(r.err||r.node.type!=='l'){ st=1; continue; } c.out(r.node.target+'\n'); }
  return st;
});

/* ---- 中身を見る ---- */
/* ファイル（なければ標準入力）を順に読む。読めないときは fmt でメッセージを作って続ける */
function eachInput(c,files,fmt,fn){
  let st=0; const list=files.length?files:['-'];
  for(const f of list){ let t;
    try{ t=c.read(f); }catch(e){ if(!(e instanceof FsErr)) throw e; c.err(fmt(f,e)+'\n'); st=1; continue; }
    fn(t,f); }
  return st;
}
def('cat','/usr/bin',c=>{
  const {o,args}=getopt('cat',c.argv.slice(1),'nbEAsv',{number:'n','number-nonblank':'b','show-ends':'E','show-all':'A'});
  let k=0; const outNode=c.io.stdout.node;
  return eachInput(c,args,(f,e)=>`cat: ${f}: ${e.message}`,(t,f)=>{
    if(outNode&&f!=='-'){ const r=c.look(f); if(!r.err&&r.node===outNode&&t!==''){ c.err(`cat: ${f}: input file is output file\n`); return; } }
    if(!o.n&&!o.b&&!o.E&&!o.A){ c.out(t); return; }
    const {ls,nl}=linesOf(t);
    c.out(unlines(ls.map(l=>{ let s=(o.E||o.A)?l+'$':l; if(o.b?l!=='':o.n){ k++; s=String(k).padStart(6)+'\t'+s; } return s; }),nl));
  });
});
for(const nm of ['less','more']) def(nm,'/usr/bin',c=>{
  c.sim.note(`% ${nm} は 1 画面ずつ表示するコマンドです（実機ではスペースで次へ、q で終了）。このドリルでは全体を一度に表示します`);
  return eachInput(c,c.argv.slice(1).filter(x=>!x.startsWith('-')),(f,e)=>`${f}: ${e.message}`,t=>c.out(t)); });
function headTail(c,tail){
  const nm=tail?'tail':'head';
  const a=c.argv.slice(1).map(x=>/^-\d+$/.test(x)?'-n'+x.slice(1):x);
  const {o,args}=getopt(nm,a,'n:c:qvf',{'lines:':'n','bytes:':'c',quiet:'q',verbose:'v',follow:'f'});
  let n=10, from=false, allBut=false;
  if(o.n!=null){ const m=/^([+-]?)(\d+)$/.exec(o.n); if(!m){ c.err(`${nm}: invalid number of lines: ‘${o.n}’\n`); return 1; } n=+m[2]; from=tail&&m[1]==='+'; allBut=!tail&&m[1]==='-'; }
  const files=args.length?args:['-']; const hdr=(files.length>1&&!o.q)||o.v; let first=true, st=0;
  for(const f of files){ let t;
    try{ t=c.read(f); }catch(e){ if(!(e instanceof FsErr)) throw e;
      c.err(e.code==='EISDIR'?`${nm}: error reading '${f}': Is a directory\n`:`${nm}: cannot open '${f}' for reading: ${e.message}\n`); st=1; continue; }
    if(hdr){ c.out((first?'':'\n')+`==> ${f==='-'?'standard input':f} <==\n`); } first=false;
    if(o.c!=null){ const b=+o.c; c.out(tail?t.slice(-b):t.slice(0,b)); continue; }
    const {ls,nl}=linesOf(t);
    let sel; if(tail) sel=from?ls.slice(Math.max(0,n-1)):ls.slice(Math.max(0,ls.length-n)); else sel=allBut?ls.slice(0,Math.max(0,ls.length-n)):ls.slice(0,n);
    const endsAtLast=sel.length&&(tail||sel.length===ls.length);
    c.out(unlines(sel,endsAtLast?nl:true));
  }
  if(tail&&o.f) c.sim.note('% tail -f は追記を待ち続けるコマンドです（実機では Ctrl+C で止めます）。このドリルでは今ある分だけを表示しました');
  return st;
}
def('head','/usr/bin',c=>headTail(c,false));
def('tail','/usr/bin',c=>headTail(c,true));
def('wc','/usr/bin',c=>{
  const {o,args}=getopt('wc',c.argv.slice(1),'lwcm',{lines:'l',words:'w',bytes:'c',chars:'m'});
  const sel=(o.l||o.w||o.c||o.m)?['l','w','m','c'].filter(k=>o[k]):['l','w','c'];
  const rows=[], tot={l:0,w:0,c:0,m:0}; let st=0, stdinUsed=false, fileBytes=0;
  const files=args.length?args:['-'];
  for(const f of files){ let t;
    try{ t=c.read(f); }catch(e){ if(!(e instanceof FsErr)) throw e; c.err(`wc: ${f}: ${e.message}\n`); st=1; if(e.code==='EISDIR') rows.push({l:0,w:0,c:0,m:0,name:f}); continue; }
    if(f==='-') stdinUsed=true; else fileBytes+=byteLen(t);
    const r={l:(t.match(/\n/g)||[]).length,w:(t.match(/\S+/g)||[]).length,c:byteLen(t),m:[...t].length,name:args.length?f:''};
    for(const k in tot) tot[k]+=r[k]; rows.push(r); }
  if(rows.length>1) rows.push({...tot,name:'total'});
  /* 桁幅の決め方は GNU wc に合わせる。標準入力があると 7 桁、数える項目が 1 つでファイルも 1 つなら幅なし */
  let w=stdinUsed?7:String(fileBytes).length;
  if(sel.length===1&&rows.length===1) w=1;
  c.out(rows.map(r=>sel.map(k=>String(r[k]).padStart(w)).join(' ')+(r.name?' '+r.name:'')).join('\n')+(rows.length?'\n':''));
  return st;
});
def('sort','/usr/bin',c=>{
  const {o,args}=getopt('sort',c.argv.slice(1),'nrufbsk:t:o:hM',{reverse:'r',unique:'u','numeric-sort':'n','ignore-case':'f','key:':'k','field-separator:':'t','output:':'o'},2);
  if(o.t!=null&&o.t.length!==1){ c.err(`sort: multi-character tab ‘${o.t}’\n`); return 2; }
  const keys=(o['@k']||[]).map(s=>{ const m=/^(\d+)(?:\.(\d+))?([bfnr]*)(?:,(\d+)(?:\.(\d+))?([bfnr]*))?$/.exec(s); if(!m) throw new Usage(`sort: invalid number at field start: invalid count at start of ‘${s}’`,2);
    const fl=(m[3]||'')+(m[6]||''); return {f1:+m[1],c1:+(m[2]||1),f2:m[4]?+m[4]:null,fl:fl||null}; });
  let text=''; const st=eachInput(c,args,(f,e)=>`sort: cannot read: ${f}: ${e.message}`,t=>{ text+=t&&!t.endsWith('\n')?t+'\n':t; });
  if(st) return 2;
  const lines=linesOf(text).ls;
  const starts=l=>{ if(o.t!=null){ const r=[0]; for(let i=0;i<l.length;i++) if(l[i]===o.t) r.push(i+1); return r; } const r=[]; const re=/[ \t]*[^ \t]+/g; let m; while((m=re.exec(l))) r.push(m.index); return r.length?r:[0]; };
  const keyOf=(l,k)=>{ const s=starts(l); if(k.f1>s.length) return ''; const a=s[k.f1-1]+(k.c1-1);
    let b=l.length; if(k.f2!=null&&k.f2<s.length) b=o.t!=null?s[k.f2]-1:s[k.f2]; return l.slice(a,Math.max(a,b)); };
  const num=s=>{ const m=/^\s*([-+]?\d*\.?\d+)/.exec(s); return m?parseFloat(m[1]):0; };
  const cmpKey=(x,y,fl)=>{ const n=fl.includes('n'), f=fl.includes('f'), b=fl.includes('b');
    let r; if(n) r=num(x)-num(y); else { if(b){ x=x.replace(/^\s+/,''); y=y.replace(/^\s+/,''); } if(f||o.f){ x=x.toUpperCase(); y=y.toUpperCase(); } r=byteCmp(x,y); }
    return fl.includes('r')?-r:r; };
  const gfl=(o.n?'n':'')+(o.r?'r':'')+(o.b?'b':'');
  const ks=keys.length?keys:[{f1:1,c1:1,f2:null,fl:null,whole:true}];
  const cmp=(x,y)=>{ for(const k of ks){ const r=k.whole?cmpKey(x,y,gfl):cmpKey(keyOf(x,k),keyOf(y,k),k.fl||gfl); if(r) return r; }
    if(o.u||o.s) return 0; const r=byteCmp(x,y); return o.r?-r:r; };
  let out=lines.slice().sort(cmp);
  if(o.u) out=out.filter((l,i)=>i===0||cmp(out[i-1],l)!==0);
  const res=unlines(out);
  if(o.o!=null){ try{ c.sim.openWrite(o.o,c.sh,false).write(res); }catch(e){ if(!(e instanceof FsErr)) throw e; c.err(`sort: open failed: ${o.o}: ${e.message}\n`); return 2; } return 0; }
  c.out(res);
});
def('uniq','/usr/bin',c=>{
  const {o,args}=getopt('uniq',c.argv.slice(1),'cdui',{count:'c','repeated':'d',unique:'u','ignore-case':'i'});
  let text=''; const st=eachInput(c,args.slice(0,1),(f,e)=>`uniq: ${f}: ${e.message}`,t=>{ text=t; }); if(st) return 1;
  const ls=linesOf(text).ls, groups=[];
  for(const l of ls){ const g=groups[groups.length-1]; if(g&&(o.i?g.l.toLowerCase()===l.toLowerCase():g.l===l)) g.n++; else groups.push({l,n:1}); }
  c.out(unlines(groups.filter(g=>o.d?g.n>1:o.u?g.n===1:true).map(g=>o.c?String(g.n).padStart(7)+' '+g.l:g.l)));
});
/* 1,3-5,7- のような範囲指定 */
function rangeList(s){ const rs=s.split(',').map(p=>{ const m=/^(\d*)(-?)(\d*)$/.exec(p); if(!m||(!m[1]&&!m[3])) return null; const a=m[1]?+m[1]:1, b=m[2]?(m[3]?+m[3]:Infinity):a; return [a,b]; });
  if(rs.some(r=>!r||r[0]<1)) return null; return k=>rs.some(([a,b])=>k>=a&&k<=b); }
def('cut','/usr/bin',c=>{
  const {o,args}=getopt('cut',c.argv.slice(1),'d:f:c:b:s',{'delimiter:':'d','fields:':'f','characters:':'c','bytes:':'b','only-delimited':'s','output-delimiter:':'O'});
  const list=o.f??o.c??o.b;
  if(list==null) throw usage('cut','you must specify a list of bytes, characters, or fields');
  if(o.d!=null&&o.d.length!==1){ c.err('cut: the delimiter must be a single character\nTry \'cut --help\' for more information.\n'); return 1; }
  const inR=rangeList(list); if(!inR){ c.err(`cut: invalid field range\nTry 'cut --help' for more information.\n`); return 1; }
  const d=o.d??'\t', od=o.O??d;
  return eachInput(c,args,(f,e)=>`cut: ${f}: ${e.message}`,t=>{
    const {ls,nl}=linesOf(t); const out=[];
    for(const l of ls){
      if(o.f!=null){ if(!l.includes(d)){ if(!o.s) out.push(l); continue; } out.push(l.split(d).filter((x,k)=>inR(k+1)).join(od)); }
      else out.push([...l].filter((x,k)=>inR(k+1)).join(''));
    }
    c.out(unlines(out,nl||true)); });
});
/* tr の文字集合。a-z の範囲、[:lower:] などのクラス、\n などのエスケープ */
function trSet(s){ const out=[]; let i=0;
  const esc=ch=>({n:'\n',t:'\t',r:'\r','\\':'\\'})[ch]??ch;
  while(i<s.length){
    const cm=/^\[:(\w+):\]/.exec(s.slice(i));
    if(cm){ const r={lower:'a-z',upper:'A-Z',digit:'0-9',alpha:'A-Za-z',alnum:'0-9A-Za-z',space:' \t\n\r\f\v',blank:' \t'}[cm[1]]; if(r==null) return null; out.push(...trSet(r)); i+=cm[0].length; continue; }
    let ch=s[i]; if(ch==='\\'&&i+1<s.length){ ch=esc(s[i+1]); i+=2; } else i++;
    if(s[i]==='-'&&i+1<s.length){ let e=s[i+1]; i+=2; if(e==='\\'&&i<s.length){ e=esc(s[i]); i++; } for(let k=ch.charCodeAt(0);k<=e.charCodeAt(0);k++) out.push(String.fromCharCode(k)); continue; }
    out.push(ch); }
  return out; }
def('tr','/usr/bin',c=>{
  const {o,args}=getopt('tr',c.argv.slice(1),'dsc',{delete:'d','squeeze-repeats':'s'});
  if(!args.length) throw usage('tr','missing operand');
  const need=o.d&&!o.s?1:o.s&&!o.d&&args.length===1?1:2;
  if(args.length<need) throw usage('tr',`missing operand after ‘${args[args.length-1]}’`);
  if(args.length>need) throw usage('tr',`extra operand ‘${args[need]}’`);
  const s1=trSet(args[0]), s2=args[1]!=null?trSet(args[1]):null;
  if(!s1||(args[1]!=null&&!s2)){ c.err('tr: invalid character class\n'); return 1; }
  let t=c.stdin(), out='';
  if(o.d){ const del=new Set(s1); for(const ch of t) if(!del.has(ch)) out+=ch; }
  else if(s2){ const map=new Map(); s1.forEach((ch,k)=>map.set(ch,s2[Math.min(k,s2.length-1)])); for(const ch of t) out+=map.has(ch)?map.get(ch):ch; }
  else out=t;
  if(o.s){ const sq=new Set(s2&&!o.d?s2:s1); let r='', prev=null; for(const ch of out){ if(ch===prev&&sq.has(ch)) continue; r+=ch; prev=ch; } out=r; }
  c.out(out);
});
def('nl','/usr/bin',c=>{
  const {o,args}=getopt('nl',c.argv.slice(1),'b:',{});
  let k=0;
  return eachInput(c,args,(f,e)=>`nl: ${f}: ${e.message}`,t=>{ const {ls,nl}=linesOf(t);
    c.out(unlines(ls.map(l=>(l===''&&o.b!=='a')?'       ':String(++k).padStart(6)+'\t'+l),nl)); });
});
def('grep egrep fgrep','/usr/bin',c=>{
  const {o,args}=getopt('grep',c.argv.slice(1),'ivnclLhHrRwxoqsEFe:',{'ignore-case':'i','invert-match':'v','line-number':'n',count:'c','files-with-matches':'l',recursive:'r','extended-regexp':'E','fixed-strings':'F','word-regexp':'w','line-regexp':'x','only-matching':'o',quiet:'q','regexp:':'e',color:'K','color=auto':'K'},2);
  if(c.name==='egrep') o.E=1; if(c.name==='fgrep') o.F=1;
  let pats=o['@e']; const files=args.slice();
  if(!pats){ if(!files.length){ c.err("Usage: grep [OPTION]... PATTERNS [FILE]...\nTry 'grep --help' for more information.\n"); return 2; } pats=[files.shift()]; }
  pats=pats.flatMap(p=>p.split('\n'));
  let body=pats.map(p=>o.F?reEsc(p):posixRe(p,!!o.E)).map(s=>o.x?`^(?:${s})$`:o.w?`(?<![A-Za-z0-9_])(?:${s})(?![A-Za-z0-9_])`:`(?:${s})`).join('|');
  let re; try{ re=new RegExp(body,(o.i?'i':'')+'g'); }catch(e){ c.err('grep: Invalid regular expression\n'); return 2; }
  const rec=o.r||o.R;
  const list=[]; let st=2, any=false, errs=false;
  const addPath=(p,top)=>{ const r=c.look(p,top||!!o.R);
    if(r.err){ if(!o.s) c.err(`grep: ${p}: ${r.err.message}\n`); errs=true; return; }
    if(r.node.type==='d'){ if(!rec){ if(!o.s) c.err(`grep: ${p}: Is a directory\n`); errs=true; return; }
      if(!c.can(r.node,4)||!c.can(r.node,1)){ c.err(`grep: ${p}: Permission denied\n`); errs=true; return; }
      for(const k of r.node.kids.keys()) addPath(joinP(p,k),false); return; }
    if(r.node.type==='l') return;
    list.push(p); };
  if(!files.length) list.push(rec?null:'-'); else files.forEach(p=>addPath(p,true));
  if(list[0]===null){ list.length=0; addPath('.',true); list.forEach((p,i)=>{ list[i]=p.replace(/^\.\//,''); }); }
  const multi=(list.length>1||rec)&&!o.h||o.H;
  for(const f of list){ let t, node=null;
    try{ if(f==='-') t=c.stdin(); else { const r=c.res(f); node=r.node; if(!c.can(node,4)) throw new FsErr('EACCES'); t=textOf(node); } }
    catch(e){ if(!(e instanceof FsErr)) throw e; if(!o.s) c.err(`grep: ${f}: ${e.message}\n`); errs=true; continue; }
    const name=f==='-'?'(standard input)':f;
    if(node&&node.bin){ re.lastIndex=0; if(!o.v&&re.test(t)){ any=true; if(!o.q&&!o.c&&!o.l) c.out(`grep: ${name}: binary file matches\n`); else if(o.l) c.out(name+'\n'); } else if(o.c) c.out((multi?name+':':'')+'0\n'); continue; }
    const {ls}=linesOf(t); let cnt=0;
    ls.forEach((l,k)=>{ re.lastIndex=0; const hit=re.test(l)!==!!o.v; if(!hit) return; cnt++; any=true;
      if(o.q||o.c||o.l||o.L) return;
      const pre=(multi?name+':':'')+(o.n?(k+1)+':':'');
      if(o.o&&!o.v){ re.lastIndex=0; for(const m of l.matchAll(re)) if(m[0]) c.out(pre+m[0]+'\n'); } else c.out(pre+l+'\n'); });
    if(o.q) continue;
    if(o.c) c.out((multi?name+':':'')+cnt+'\n');
    if(o.l&&cnt) c.out(name+'\n');
    if(o.L&&!cnt) c.out(name+'\n');
  }
  st=any?0:1; if(errs&&!(o.q&&any)) st=2;
  return st;
});
/* sed：アドレス（行番号・$・/正規表現/・範囲）と、s・d・p・q・= に対応する */
function parseSed(c,script,ere){
  const cmds=[]; let i=0; const S=script; const n=S.length;
  const bad=m=>{ throw new ShErr(`sed: -e expression #1, char ${Math.min(i+1,n)}: ${m}`); };
  const readRe=d=>{ let s=''; i++; while(i<n&&S[i]!==d){ if(S[i]==='\\'&&S[i+1]===d){ s+=d; i+=2; continue; } if(S[i]==='\\'){ s+=S[i]+S[i+1]; i+=2; continue; } s+=S[i++]; } if(i>=n) return null; i++; return s; };
  const addr=()=>{ if(/\d/.test(S[i]||'')){ const m=/^\d+/.exec(S.slice(i)); i+=m[0].length; return {line:+m[0]}; }
    if(S[i]==='$'){ i++; return {last:true}; }
    if(S[i]==='/'){ const r=readRe('/'); if(r==null) bad('unterminated address regex'); let fl=''; if(S[i]==='I'){ fl='i'; i++; } return {re:makeRe('sed',r,ere,fl)}; }
    return null; };
  while(i<n){
    while(i<n&&/[\s;]/.test(S[i])) i++; if(i>=n) break;
    const cm={a1:addr(),a2:null,neg:false,active:false};
    if(cm.a1&&S[i]===','){ i++; cm.a2=addr(); if(!cm.a2) bad('unexpected `,\''); }
    while(S[i]===' ') i++;
    if(S[i]==='!'){ cm.neg=true; i++; }
    const op=S[i++]; cm.op=op;
    if(op==='s'){ const d=S[i]; if(!d) bad("unterminated `s' command"); const pat=readRe(d); if(pat==null) bad("unterminated `s' command"); i--; const rep=readRe(d); if(rep==null) bad("unterminated `s' command");
      let fl=''; while(i<n&&/[gpiI0-9]/.test(S[i])) fl+=S[i++];
      cm.g=fl.includes('g'); cm.p=fl.includes('p'); const nth=/\d+/.exec(fl); cm.nth=nth?+nth[0]:0;
      cm.re=makeRe('sed',pat,ere,/[iI]/.test(fl)?'gi':'g');
      /* 置換文字列：& は一致した部分、\1〜\9 はグループ、\n は改行 */
      cm.rep=[]; for(let k=0;k<rep.length;k++){ const ch=rep[k];
        if(ch==='\\'&&k+1<rep.length){ const nx=rep[++k]; cm.rep.push(/\d/.test(nx)?{g:+nx}:nx==='n'?'\n':nx); }
        else if(ch==='&') cm.rep.push({g:0}); else cm.rep.push(ch); }
    } else if('dpq='.includes(op)&&op){ }
    else if(op==='a'||op==='i'||op==='c'){ let t=S.slice(i).replace(/^\\?\s*/,''); i=n; cm.text=t; }
    else { i--; bad(`unknown command: \`${op}'`); }
    cmds.push(cm);
  }
  return cmds;
}
function runSed(cmds,lines,quiet){
  const out=[]; let quit=false;
  const hit=(a,l,k,last)=>a.line!=null?k===a.line:a.last?last:a.re.test(l);
  lines.forEach((l,idx)=>{ if(quit) return; const k=idx+1, last=idx===lines.length-1; let ps=l, del=false; const before=[], after=[];
    for(const cm of cmds){
      let sel=true;
      if(cm.a1&&!cm.a2) sel=hit(cm.a1,ps,k,last);
      else if(cm.a2){ if(!cm.active){ if(hit(cm.a1,ps,k,last)){ sel=true; cm.active=!(cm.a2.line!=null&&cm.a2.line<=k); } else sel=false; }
        else { sel=true; if(hit(cm.a2,ps,k,last)||(cm.a2.line!=null&&k>=cm.a2.line)) cm.active=false; } }
      if(cm.neg) sel=!sel; if(!sel) continue;
      if(cm.op==='d'){ del=true; break; }
      if(cm.op==='p') out.push(ps);
      if(cm.op==='=') out.push(String(k));
      if(cm.op==='q'){ quit=true; break; }
      if(cm.op==='a') after.push(cm.text); if(cm.op==='i') before.push(cm.text); if(cm.op==='c'){ before.push(cm.text); del=true; break; }
      if(cm.op==='s'){ let cnt=0, done=false; cm.re.lastIndex=0;
        let did=false;
        const r=ps.replace(cm.re,(...m)=>{ cnt++; if(done) return m[0]; if(cm.nth&&cnt<cm.nth) return m[0]; if(!cm.g) done=true; did=true;
          return cm.rep.map(x=>typeof x==='string'?x:(m[x.g]??'')).join(''); });
        if(did){ ps=r; if(cm.p) out.push(ps); } }
    }
    out.push(...before); if(!del&&!quiet) out.push(ps); out.push(...after); });
  return out;
}
def('sed','/usr/bin',c=>{
  const a=c.argv.slice(1).map(x=>x==='--in-place'?'-i':x);
  let inplace=null; const rest=[], scripts=[]; let quiet=false, ere=false;
  for(let i=0;i<a.length;i++){ const x=a[i];
    if(/^-i/.test(x)){ inplace=x.slice(2); continue; }
    if(x==='-e'){ scripts.push(a[++i]); continue; }
    if(x==='-n'){ quiet=true; continue; } if(x==='-E'||x==='-r'){ ere=true; continue; }
    if(/^-[nEr]+$/.test(x)){ if(x.includes('n')) quiet=true; if(/[Er]/.test(x)) ere=true; continue; }
    if(x.startsWith('-')&&x!=='-') throw usage('sed',`invalid option -- '${x[1]}'`);
    rest.push(x); }
  if(!scripts.length){ if(!rest.length){ c.err('Usage: sed [OPTION]... {script-only-if-no-other-script} [input-file]...\n'); return 1; } scripts.push(rest.shift()); }
  const cmds=parseSed(c,scripts.join('\n'),ere);
  if(inplace!==null){
    if(!rest.length){ c.err('sed: no input files\n'); return 1; } let st=0;
    for(const f of rest){ const r=c.look(f);
      if(r.err){ c.err(`sed: can't read ${f}: ${r.err.message}\n`); st=2; continue; }
      if(r.node.type!=='f'){ c.err(`sed: couldn't edit ${f}: not a regular file\n`); st=4; continue; }
      if(!c.can(r.node,4)||!c.can(r.dir,2)){ c.err(`sed: couldn't open temporary file ${dirname(f)}/sedXXXXXX: Permission denied\n`); st=4; continue; }
      cmds.forEach(x=>x.active=false);
      const {ls,nl}=linesOf(textOf(r.node));
      if(inplace){ const br=c.res(f+inplace,false); const b=br.node||c.create(br,'f'); b.data=r.node.data; b.bin=null; b.mode=r.node.mode; }
      r.node.data=unlines(runSed(cmds,ls,quiet),nl); r.node.bin=null; r.node.mtime=c.fs.now(); }
    return st;
  }
  let text='', st=0;
  for(const f of rest.length?rest:['-']){ try{ const t=c.read(f); text+=t&&!t.endsWith('\n')?t+'\n':t; }
    catch(e){ if(!(e instanceof FsErr)) throw e; c.err(e.code==='EISDIR'?`sed: read error on ${f}: Is a directory\n`:`sed: can't read ${f}: ${e.message}\n`); st=2; } }
  c.out(unlines(runSed(cmds,linesOf(text).ls,quiet)));
  return st;
});
def('tee','/usr/bin',c=>{
  const {o,args}=getopt('tee',c.argv.slice(1),'a',{append:'a'});
  const t=c.stdin(); let st=0;
  for(const f of args){ try{ c.sim.openWrite(f,c.sh,!!o.a).write(t); }catch(e){ if(!(e instanceof FsErr)) throw e; c.err(`tee: ${f}: ${e.message}\n`); st=1; } }
  c.out(t); return st;
});

/* ---- 探す ---- */
def('find','/usr/bin',c=>{
  const a=c.argv.slice(1); let i=0; const paths=[];
  while(i<a.length&&!(a[i].startsWith('-')&&a[i].length>1)&&a[i]!=='('&&a[i]!=='!'){ paths.push(a[i]); i++; }
  if(!paths.length) paths.push('.');
  const now=c.fs.now(); let maxd=Infinity, mind=0, hasAction=false, depthFirst=false, lastPred=null; const execs=[];
  const T=a.slice(i); let k=0;
  const need=p=>{ if(k>=T.length) throw new Usage(`find: missing argument to \`${p}'`); return T[k++]; };
  const del=x=>{ if(x.n.type==='d'&&x.n.kids.size){ c.err(`find: cannot delete ‘${x.p}’: Directory not empty\n`); return false; }
    if(!x.dir||!c.fs.canUnlink(x.dir,x.n,c.cred)){ c.err(`find: cannot delete ‘${x.p}’: Permission denied\n`); return false; }
    c.fs.drop(x.dir,x.name); return true; };
  function primary(){
    const t=T[k++]; const prev=lastPred; lastPred=t;
    switch(t){
      case '(': { const e=orE(); if(T[k++]!==')') throw new Usage("find: invalid expression; I was expecting to find a ')' somewhere but did not see one."); return e; }
      case '!': case '-not': { const e=primary(); return x=>!e(x); }
      case '-name': case '-iname': { const p=need(t); const ci=t==='-iname'; const re=globRe([...(ci?p.toLowerCase():p)]); return x=>re.test(ci?x.base.toLowerCase():x.base); }
      case '-path': { const p=need(t); const re=new RegExp(globRe([...p]).source.replace(/\[\^\/\]\*/g,'.*').replace(/\[\^\/\]/g,'.')); return x=>re.test(x.p); }
      case '-type': { const v=need(t); if(!/^[fdlcb]$/.test(v)) throw new Usage(`find: Unknown argument to -type: ${v}`); return x=>x.n.type===v; }
      case '-size': { const v=need(t); const m=/^([+-]?)(\d+)([bckMG]?)$/.exec(v); if(!m) throw new Usage(`find: invalid argument \`${v}' to \`-size'`);
        const unit={b:512,'':512,c:1,k:1024,M:1048576,G:1073741824}[m[3]], N=+m[2];
        return x=>{ const u=Math.ceil(sizeOf(x.n)/unit); return m[1]==='+'?u>N:m[1]==='-'?u<N:u===N; }; }
      case '-mtime': case '-mmin': { const v=need(t); const m=/^([+-]?)(\d+)$/.exec(v); if(!m) throw new Usage(`find: invalid argument \`${v}' to \`${t}'`);
        const per=t==='-mtime'?DAY:60000, N=+m[2];
        return x=>{ const age=Math.floor((now-x.n.mtime)/per); return m[1]==='+'?age>N:m[1]==='-'?age<N:age===N; }; }
      case '-user': { const v=need(t); const u=c.sim.user(v)||(/^\d+$/.test(v)?{uid:+v}:null); if(!u) throw new Usage(`find: '${v}' is not the name of a known user`); return x=>x.n.uid===u.uid; }
      case '-group': { const v=need(t); const g=c.sim.group(v)||(/^\d+$/.test(v)?{gid:+v}:null); if(!g) throw new Usage(`find: '${v}' is not the name of an existing group`); return x=>x.n.gid===g.gid; }
      case '-perm': { const v=need(t); let s=v, kind='='; if(s[0]==='-'||s[0]==='/'){ kind=s[0]; s=s.slice(1); }
        const m=applyMode(s,0,false,0); if(m==null) throw new Usage(`find: invalid mode '${v}'`);
        return x=>{ const p=x.n.mode&0o7777; return kind==='='?p===m:kind==='-'?(p&m)===m:(m===0||(p&m)!==0); }; }
      case '-newer': { const v=need(t); const r=c.look(v); if(r.err) throw new Usage(`find: '${v}': ${r.err.message}`); const tm=r.node.mtime; return x=>x.n.mtime>tm; }
      case '-empty': return x=>x.n.type==='d'?x.n.kids.size===0:x.n.type==='f'&&sizeOf(x.n)===0;
      case '-maxdepth': { const v=need(t); if(!/^\d+$/.test(v)) throw new Usage(`find: Expected a positive decimal integer argument to -maxdepth, but got '${v}'`); maxd=+v; return ()=>true; }
      case '-mindepth': { const v=need(t); mind=+v; return ()=>true; }
      case '-print': hasAction=true; return x=>{ c.out(x.p+'\n'); return true; };
      case '-delete': hasAction=true; depthFirst=true; return x=>del(x);
      case '-ls': hasAction=true; return x=>{ c.out(`${String(x.n.ino).padStart(9)} ${String(Math.ceil(sizeOf(x.n)/4096)*4).padStart(6)} ${modeStr(x.n)} ${String(x.n.nlink).padStart(3)} ${c.sim.uname(x.n.uid).padEnd(8)} ${c.sim.gname(x.n.gid).padEnd(8)} ${String(sizeOf(x.n)).padStart(8)} ${lsDate(x.n.mtime,now)} ${x.p}${x.n.type==='l'?' -> '+x.n.target:''}\n`); return true; };
      case '-exec': case '-ok': { if(t==='-ok') throw new Unsup('find の -ok（1 件ずつの確認）'); hasAction=true; const cmd=[];
        while(k<T.length&&T[k]!==';'&&!(T[k]==='+'&&T[k-1]==='{}')) cmd.push(T[k++]);
        if(k>=T.length||!cmd.length) throw new Usage(`find: missing argument to \`${t}'`);
        const plus=T[k]==='+'; k++;
        const run=argv=>{ if(!argv[0].includes('/')&&!c.sim.which(argv[0],c.sh)){ c.err(`find: '${argv[0]}': No such file or directory\n`); return 1; }
          return c.sim.runArgv(argv,c.sh,{stdin:'',stdout:c.io.stdout,stderr:c.io.stderr},[],null,true); };
        if(plus){ const ex={cmd,list:[],run}; execs.push(ex); return x=>{ ex.list.push(x.p); return true; }; }
        return x=>run(cmd.map(w=>w.split('{}').join(x.p)))===0; }
      default:
        if(t&&t.startsWith('-')) throw new Usage(`find: unknown predicate \`${t}'`);
        throw new Usage(`find: paths must precede expression: \`${t}'`+(['-name','-iname','-path'].includes(T[k-3])?`\nfind: possible unquoted pattern after predicate \`${T[k-3]}'?`:''));
    }
  }
  function andE(){ let e=primary(); while(k<T.length&&!['-o','-or',')'].includes(T[k])){ if(T[k]==='-a'||T[k]==='-and') k++; const r=primary(), l=e; e=x=>l(x)&&r(x); } return e; }
  function orE(){ let e=andE(); while(T[k]==='-o'||T[k]==='-or'){ k++; const r=andE(), l=e; e=x=>l(x)||r(x); } return e; }
  let expr=T.length?orE():()=>true;
  if(k<T.length) throw new Usage(`find: paths must precede expression: \`${T[k]}'`);
  if(!hasAction){ const e=expr; expr=x=>{ if(e(x)) c.out(x.p+'\n'); return true; }; }
  let st=0;
  const visit=(p,n,depth,dir,name)=>{
    const x={p,n,base:depth===0?basename(p):name,dir,name};
    if(!depthFirst&&depth>=mind) expr(x);
    if(n.type==='d'&&depth<maxd){
      if(!c.can(n,4)||!c.can(n,1)){ c.err(`find: ‘${p}’: Permission denied\n`); st=1; }
      else for(const [k2,v] of [...n.kids]) visit(joinP(p,k2),v,depth+1,n,k2); }
    if(depthFirst&&depth>=mind) expr(x); };
  for(const p of paths){ const r=c.look(p,false); if(r.err){ c.err(`find: ‘${p}’: ${r.err.message}\n`); st=1; continue; } visit(p,r.node,0,r.dir,r.name); }
  for(const ex of execs) if(ex.list.length) ex.run([...ex.cmd.filter(w=>w!=='{}'),...ex.list]);
  return st;
});
def('xargs','/usr/bin',c=>{
  const a=c.argv.slice(1); const o={}; let i=0;
  for(;i<a.length&&a[i].startsWith('-');i++){ const x=a[i];
    if(x==='-n'){ o.n=+a[++i]; continue; } if(/^-n\d+$/.test(x)){ o.n=+x.slice(2); continue; }
    if(x==='-I'){ o.I=a[++i]; continue; } if(x==='-r'||x==='--no-run-if-empty'){ o.r=1; continue; } if(x==='-0'){ o.z=1; continue; }
    throw usage('xargs',`invalid option -- '${x[1]}'`); }
  const cmd=a.length>i?a.slice(i):['echo'];
  const input=c.stdin();
  if(!cmd[0].includes('/')&&!c.sim.which(cmd[0],c.sh)){ c.err(`xargs: ${cmd[0]}: No such file or directory\n`); return 127; }
  const run=extra=>c.sim.runArgv([...cmd,...extra],c.sh,{stdin:'',stdout:c.io.stdout,stderr:c.io.stderr},[],null,true);
  let st=0;
  if(o.I){ for(const l of input.split('\n').filter(x=>x.trim())){ if(c.sim.runArgv(cmd.map(w=>w.split(o.I).join(l.trim())),c.sh,{stdin:'',stdout:c.io.stdout,stderr:c.io.stderr},[],null,true)) st=123; } return st; }
  const items=o.z?input.split('\0').filter(Boolean):(input.match(/'[^']*'|"[^"]*"|(?:\\.|[^\s'"])+/g)||[]).map(s=>s.replace(/^['"]|['"]$/g,'').replace(/\\(.)/g,'$1'));
  if(!items.length){ if(o.r) return 0; return run([])?123:0; }
  const n=o.n||items.length;
  for(let k=0;k<items.length;k+=n) if(run(items.slice(k,k+n))) st=123;
  return st;
});
def('which','/usr/bin',c=>{
  const args=c.argv.slice(1).filter(x=>!x.startsWith('-')); let st=0;
  for(const nm of args){ const f=c.sim.which(nm,c.sh); if(f) c.out(f.path+'\n'); else { c.err(`/usr/bin/which: no ${nm} in (${c.sh.get('PATH')})\n`); st=1; } }
  return st;
});
def('whereis','/usr/bin',c=>{
  for(const nm of c.argv.slice(1).filter(x=>!x.startsWith('-'))){ const f=c.sim.which(nm,c.sh); const sec=f&&/sbin/.test(f.path)?8:1;
    c.out(f?`${nm}: ${f.path} /usr/share/man/man${sec}/${nm}.${sec}.gz\n`:`${nm}:\n`); }
});
B('type',c=>{
  const a=c.argv.slice(1), t=a[0]==='-t'; const names=a.filter(x=>!x.startsWith('-')); let st=0;
  for(const nm of names){
    if(c.sh.aliases.has(nm)){ c.out(t?'alias\n':`${nm} is aliased to \`${c.sh.aliases.get(nm)}'\n`); continue; }
    if(BUILTIN[nm]){ c.out(t?'builtin\n':`${nm} is a shell builtin\n`); continue; }
    const f=c.sim.which(nm,c.sh); if(f){ c.out(t?'file\n':`${nm} is ${f.path}\n`); continue; }
    if(!t) c.err(`bash: type: ${nm}: not found\n`); st=1; }
  return st;
});
def('file','/usr/bin',c=>{
  const args=c.argv.slice(1).filter(x=>!x.startsWith('-'));
  if(!args.length){ c.err('Usage: file [-bcdEhikLlNnprsSvzZ0] [--apple] [--extension] [--mime-encoding]\n'); return 1; }
  const W=Math.max(...args.map(a=>a.length+1))+1;
  const desc=n=>{ if(n.type==='d') return 'directory'; if(n.type==='l') return `symbolic link to ${n.target}`; if(n.type==='c') return `character special (${n.dev.join('/')})`; if(n.type==='b') return `block special (${n.dev.join('/')})`;
    const b=n.bin; if(b){ if(b.kind==='elf') return 'ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, for GNU/Linux 3.2.0, stripped';
      if(b.kind==='tar') return 'POSIX tar archive (GNU)';
      if(b.kind==='gz') return `gzip compressed data, ${b.name?`was "${b.name}", `:''}last modified: ${new Date(n.mtime).toUTCString().replace(/^\w+, /,'').replace(' GMT','')}, from Unix, original size modulo 2^32 ${binSize(b.inner)}`;
      if(b.kind==='bz2') return 'bzip2 compressed data, block size = 900k'; if(b.kind==='xz') return 'XZ compressed data, checksum CRC64'; }
    const t=n.data; if(t==='') return 'empty';
    const kind=/[^\x00-\x7f]/.test(t)?'Unicode text, UTF-8 text':'ASCII text';
    if(/^#!\s*\/(usr\/)?bin\/bash/.test(t)) return 'Bourne-Again shell script, '+kind+' executable';
    if(/^#!\s*\/(usr\/)?bin\/sh/.test(t)) return 'POSIX shell script, '+kind+' executable';
    return kind; };
  for(const p of args){ const r=c.look(p,false);
    const d=r.err?`cannot open \`${p}' (${r.err.message})`:(r.node.type==='f'&&!c.can(r.node,4))?'regular file, no read permission':desc(r.node);
    c.out((p+':').padEnd(W)+d+'\n'); }
});
def('stat','/usr/bin',c=>{
  const a=c.argv.slice(1); let fmt=null; const args=[];
  for(let i=0;i<a.length;i++){ if(a[i]==='-c'||a[i]==='--format'){ fmt=a[++i]; continue; } if(a[i].startsWith('--format=')){ fmt=a[i].slice(9); continue; } if(!a[i].startsWith('-')) args.push(a[i]); }
  if(!args.length) throw usage('stat','missing operand'); let st=0;
  if(fmt!=null){ for(const p of args){ const r=c.look(p,false); if(r.err){ c.err(`stat: cannot statx '${p}': ${r.err.message}\n`); st=1; continue; } const n=r.node;
      c.out(fmt.replace(/%([aAUGugsnih%])/g,(m,k)=>({a:(n.mode&0o7777).toString(8),A:modeStr(n),U:c.sim.uname(n.uid),G:c.sim.gname(n.gid),u:n.uid,g:n.gid,s:sizeOf(n),n:p,i:n.ino,h:n.nlink,'%':'%'})[k])+'\n'); }
    return st; }
  const ts=t=>{ const d=jst(t); return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth()+1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}.000000000 +0900`; };
  for(const p of args){ const r=c.look(p,false); if(r.err){ c.err(`stat: cannot statx '${p}': ${r.err.message}\n`); st=1; continue; }
    const n=r.node, size=sizeOf(n), kind=n.type==='d'?'directory':n.type==='l'?'symbolic link':n.type==='c'?'character special file':size?'regular file':'regular empty file';
    c.out(`  File: ${p}${n.type==='l'?' -> '+n.target:''}\n  Size: ${String(size).padEnd(10)}\tBlocks: ${String(Math.ceil(size/4096)*8).padEnd(10)} IO Block: 4096   ${kind}\n`+
      `Device: fd00h/64768d\tInode: ${String(n.ino).padEnd(11)} Links: ${n.nlink}\n`+
      `Access: (${oct4(n.mode)}/${modeStr(n)})  Uid: (${String(n.uid).padStart(5)}/${c.sim.uname(n.uid).padStart(8)})   Gid: (${String(n.gid).padStart(5)}/${c.sim.gname(n.gid).padStart(8)})\n`+
      `Access: ${ts(n.mtime)}\nModify: ${ts(n.mtime)}\nChange: ${ts(n.mtime)}\n Birth: ${ts(n.mtime)}\n`); }
  return st;
});
def('du','/usr/bin',c=>{
  const {o,args}=getopt('du',c.argv.slice(1),'shac',{summarize:'s','human-readable':'h',all:'a',total:'c'});
  const fmt=k=>o.h?(k===0?'0':human(k*1024)):String(k); let st=0, total=0;
  const walk=(p,n,depth)=>{ if(n.type!=='d'){ const k=n.type==='f'?Math.ceil(sizeOf(n)/4096)*4:0; if(depth===0||o.a) c.out(`${fmt(k)}\t${p}\n`); return k; }
    let k=4; if(!c.can(n,4)||!c.can(n,1)){ c.err(`du: cannot read directory '${p}': Permission denied\n`); st=1; }
    else for(const [nm,v] of n.kids) k+=walk(joinP(p,nm),v,depth+1);
    if(!o.s||depth===0) c.out(`${fmt(k)}\t${p}\n`); return k; };
  for(const p of args.length?args:['.']){ const r=c.look(p); if(r.err){ c.err(`du: cannot access '${p}': ${r.err.message}\n`); st=1; continue; } total+=walk(p,r.node,0); }
  if(o.c) c.out(`${fmt(total)}\ttotal\n`);
  return st;
});
def('df','/usr/bin',c=>{
  const h=c.argv.includes('-h'), T=c.argv.includes('-T');
  const rows=[['devtmpfs','devtmpfs',4096,0,'/dev'],['tmpfs','tmpfs',1882144,0,'/dev/shm'],['tmpfs','tmpfs',752860,8892,'/run'],['/dev/mapper/vg0-root','xfs',17811456,Math.min(17811456,2252032+c.sim.fakeKB()),'/'],['/dev/sda1','xfs',1038336,262708,'/boot'],['tmpfs','tmpfs',376428,4,'/run/user/1000']];
  const H=h?['Filesystem','Size','Used','Avail','Use%','Mounted on']:['Filesystem','1K-blocks','Used','Available','Use%','Mounted on'];
  const data=rows.map(([fs,t,sz,used,mnt])=>{ const av=sz-used, pct=Math.ceil(used*100/sz)+'%', f=k=>h?(k===0?'0':human(k*1024)):String(k); return [fs,T?t:null,f(sz),f(used),f(av),pct,mnt]; });
  const hdr=[H[0],T?'Type':null,...H.slice(1)];
  const all=[hdr,...data].map(r=>r.filter(x=>x!==null)); const w=all[0].map((x,i)=>Math.max(...all.map(r=>r[i].length)));
  c.out(all.map(r=>r.map((x,i)=>i===r.length-1?x:(i<=(T?1:0)?x.padEnd(w[i]):x.padStart(w[i]))).join(' ')).join('\n')+'\n');
});
def('free','/usr/bin',c=>{
  const h=c.argv.includes('-h');
  c.out(h?'               total        used        free      shared  buff/cache   available\nMem:           3.6Gi       612Mi       2.6Gi       8.0Mi       610Mi       3.0Gi\nSwap:          2.0Gi          0B       2.0Gi\n'
    :'               total        used        free      shared  buff/cache   available\nMem:         3764292      627016     2746828        8224      624940     3137276\nSwap:        2097148           0     2097148\n');
});

/* ---- 権限と所有者 ---- */
def('chmod','/usr/bin',c=>{
  let rec=false, verbose=false; const rest=[];
  for(const x of c.argv.slice(1)){
    if(x==='-R'||x==='--recursive'){ rec=true; continue; } if(x==='-v'||x==='--verbose'){ verbose=true; continue; }
    if(/^-[rwxXst]+$/.test(x)&&!rest.length){ rest.push(x); continue; }   // chmod -w file のような記号の指定
    if(/^-[Rvcf]+$/.test(x)){ if(x.includes('R')) rec=true; if(x.includes('v')) verbose=true; continue; }
    if(x.startsWith('-')&&x.length>1&&!rest.length) throw usage('chmod',`invalid option -- '${x[1]}'`);
    rest.push(x); }
  if(!rest.length) throw usage('chmod','missing operand');
  const spec=rest[0], ops=rest.slice(1);
  if(applyMode(spec,0o644,false,0)==null){ c.err(`chmod: invalid mode: ‘${spec}’\nTry 'chmod --help' for more information.\n`); return 1; }
  if(!ops.length) throw usage('chmod',`missing operand after ‘${spec}’`);
  let st=0;
  const one=(p,n)=>{ if(!c.owner(n)){ c.err(`chmod: changing permissions of '${p}': Operation not permitted\n`); st=1; return; }
    let m=applyMode(spec,n.mode,n.type==='d',c.sh.umask);
    if(c.cred.uid!==0&&n.type!=='d'&&(m&0o2000)&&!c.cred.gids.includes(n.gid)) m&=~0o2000;   // 自分が属さないグループの SGID は付かない
    if(verbose) c.out(`mode of '${p}' changed from ${oct4(n.mode)} (${modeStr(n).slice(1)}) to ${oct4(m)} (${modeStr({type:n.type,mode:m}).slice(1)})\n`);
    n.mode=m; };
  const walk=(p,n)=>{ one(p,n); if(rec&&n.type==='d'){ if(!c.can(n,4)||!c.can(n,1)){ c.err(`chmod: cannot read directory '${p}': Permission denied\n`); st=1; return; }
    for(const [k,v] of n.kids) if(v.type!=='l') walk(joinP(p,k),v); } };
  for(const p of ops){ const r=c.look(p); if(r.err){ c.err(`chmod: cannot access '${p}': ${r.err.message}\n`); st=1; continue; } walk(p,r.node); }
  return st;
});
function chownCore(c,nm,ops,uid,gid,rec,verbose){
  let st=0;
  const one=(p,n)=>{
    const self=c.cred.uid===0;
    const okU=uid==null||self||uid===n.uid;
    const okG=gid==null||self||(n.uid===c.cred.uid&&c.cred.gids.includes(gid));
    if(!okU||!okG){ c.err(nm==='chgrp'?`chgrp: changing group of '${p}': Operation not permitted\n`:`chown: changing ownership of '${p}': Operation not permitted\n`); st=1; return; }
    const changed=(uid!=null&&uid!==n.uid)||(gid!=null&&gid!==n.gid);
    if(uid!=null) n.uid=uid; if(gid!=null) n.gid=gid;
    if(changed&&n.type==='f'&&(n.mode&0o111)) n.mode&=~0o6000;   // 実行ファイルの所有者を変えると SUID/SGID は外れる
    if(verbose&&changed) c.out(`changed ownership of '${p}'\n`); };
  const walk=(p,n)=>{ one(p,n); if(rec&&n.type==='d'&&c.can(n,4)&&c.can(n,1)) for(const [k,v] of n.kids) walk(joinP(p,k),v); };
  for(const p of ops){ const r=c.look(p); if(r.err){ c.err(`${nm}: cannot access '${p}': ${r.err.message}\n`); st=1; continue; } walk(p,r.node); }
  return st;
}
def('chown','/usr/bin',c=>{
  const {o,args}=getopt('chown',c.argv.slice(1),'Rvhcf',{recursive:'R',verbose:'v'});
  if(!args.length) throw usage('chown','missing operand');
  if(args.length<2) throw usage('chown',`missing operand after ‘${args[0]}’`);
  const spec=args[0], m=/^([^:.]*)(?:[:.](.*))?$/.exec(spec); let uid=null, gid=null;
  if(m[1]){ const u=c.sim.user(m[1])||(/^\d+$/.test(m[1])?{uid:+m[1],gid:null}:null); if(!u){ c.err(`chown: invalid user: ‘${spec}’\n`); return 1; } uid=u.uid; if(m[2]==='') gid=u.gid; }
  if(m[2]){ const g=c.sim.group(m[2])||(/^\d+$/.test(m[2])?{gid:+m[2]}:null); if(!g){ c.err(`chown: invalid group: ‘${spec}’\n`); return 1; } gid=g.gid; }
  return chownCore(c,'chown',args.slice(1),uid,gid,!!o.R,!!o.v);
});
def('chgrp','/usr/bin',c=>{
  const {o,args}=getopt('chgrp',c.argv.slice(1),'Rvhcf',{recursive:'R',verbose:'v'});
  if(!args.length) throw usage('chgrp','missing operand');
  if(args.length<2) throw usage('chgrp',`missing operand after ‘${args[0]}’`);
  const g=c.sim.group(args[0])||(/^\d+$/.test(args[0])?{gid:+args[0]}:null); if(!g){ c.err(`chgrp: invalid group: ‘${args[0]}’\n`); return 1; }
  return chownCore(c,'chgrp',args.slice(1),null,g.gid,!!o.R,!!o.v);
});
B('umask',c=>{
  const a=c.argv.slice(1);
  if(a[0]==='-S'){ const m=~c.sh.umask&0o777, f=b=>(b&4?'r':'')+(b&2?'w':'')+(b&1?'x':''); c.out(`u=${f(m>>6&7)},g=${f(m>>3&7)},o=${f(m&7)}\n`); return 0; }
  if(!a.length){ c.out(oct4(c.sh.umask)+'\n'); return 0; }
  if(!/^[0-7]{1,4}$/.test(a[0])){ c.err(`bash: umask: ${a[0]}: octal number out of range\n`); return 1; }
  c.sh.umask=parseInt(a[0],8)&0o777; return 0;
});

/* ---- ユーザーとグループ ---- */
def('id','/usr/bin',c=>{
  const {o,args}=getopt('id',c.argv.slice(1),'ugGnr',{user:'u',group:'g',groups:'G',name:'n'});
  const sim=c.sim; let cr;
  if(args[0]){ if(!sim.user(args[0])){ c.err(`id: ‘${args[0]}’: no such user\n`); return 1; } cr=sim.credOf(args[0]); } else cr=c.cred;
  sim.flags.ids.push(args[0]||c.sh.user);
  if(o.u){ c.out((o.n?sim.uname(cr.uid):cr.uid)+'\n'); return 0; }
  if(o.g){ c.out((o.n?sim.gname(cr.gid):cr.gid)+'\n'); return 0; }
  if(o.G){ c.out(cr.gids.map(g=>o.n?sim.gname(g):g).join(' ')+'\n'); return 0; }
  c.out(`uid=${cr.uid}(${sim.uname(cr.uid)}) gid=${cr.gid}(${sim.gname(cr.gid)}) groups=${cr.gids.map(g=>`${g}(${sim.gname(g)})`).join(',')}\n`);
});
def('whoami','/usr/bin',c=>{ c.out(c.sim.uname(c.cred.uid)+'\n'); });
def('groups','/usr/bin',c=>{
  const a=c.argv.slice(1); const sim=c.sim;
  if(!a.length){ c.out(c.cred.gids.map(g=>sim.gname(g)).join(' ')+'\n'); return 0; }
  let st=0; for(const u of a){ if(!sim.user(u)){ c.err(`groups: ‘${u}’: no such user\n`); st=1; continue; } c.out(`${u} : ${sim.credOf(u).gids.map(g=>sim.gname(g)).join(' ')}\n`); } return st;
});
def('who','/usr/bin',c=>{ c.out(`student  pts/0        ${fmtStamp(c.sim.loginAt)} (192.168.10.1)\n`); });
const needRoot=(c,prog,file='passwd')=>{ if(c.cred.uid===0) return false; c.err(`${prog}: Permission denied.\n${prog}: cannot lock /etc/${file}; try again later.\n`); return true; };
def('useradd','/usr/sbin',c=>{
  const {o,args}=getopt('useradd',c.argv.slice(1),'mMd:s:u:g:G:c:N',{'create-home':'m','no-create-home':'M','home-dir:':'d','shell:':'s','uid:':'u','gid:':'g','groups:':'G','comment:':'c'},2);
  if(needRoot(c,'useradd')) return 1;
  if(args.length!==1){ c.err(USERADD_USAGE); return 2; }
  const sim=c.sim, name=args[0];
  if(!/^[a-z_][a-z0-9_-]*$/.test(name)){ c.err(`useradd: invalid user name '${name}'\n`); return 3; }
  if(sim.user(name)){ c.err(`useradd: user '${name}' already exists\n`); return 9; }
  const extra=o.G?o.G.split(','):[];
  for(const g of [...(o.g?[o.g]:[]),...extra]) if(!sim.group(g)&&!(/^\d+$/.test(g)&&sim.groups().some(x=>x.gid===+g))){ c.err(`useradd: group '${g}' does not exist\n`); return 6; }
  const users=sim.users(), groups=sim.groups();
  let uid=o.u!=null?+o.u:Math.max(999,...users.filter(u=>u.uid>=1000&&u.uid<60000).map(u=>u.uid))+1;
  if(o.u!=null&&users.some(u=>u.uid===uid)){ c.err(`useradd: UID ${uid} is not unique\n`); return 4; }
  let gid;
  if(o.g){ const g=sim.group(o.g)||groups.find(x=>x.gid===+o.g); gid=g.gid; }
  else { if(sim.group(name)){ c.err(`useradd: group ${name} exists - if you want to add this user to that group, use -g.\n`); return 9; }
    gid=groups.some(g=>g.gid===uid)?Math.max(999,...groups.filter(g=>g.gid>=1000&&g.gid<60000).map(g=>g.gid))+1:uid;
    sim.setEtc('group',[...sim.etc('group'),`${name}:x:${gid}:`]); sim.setEtc('gshadow',[...sim.etc('gshadow'),`${name}:!::`]); }
  const home=o.d||'/home/'+name, shell=o.s||'/bin/bash';
  sim.setEtc('passwd',[...sim.etc('passwd'),`${name}:x:${uid}:${gid}:${o.c||''}:${home}:${shell}`]);
  sim.setEtc('shadow',[...sim.etc('shadow'),`${name}:!!:${Math.floor(c.fs.now()/DAY)}:0:99999:7:::`]);
  for(const g of extra) sim.addMember(g,name);
  if(!o.M){ const hr=c.look(home);
    if(!hr.err){ c.err(`useradd: warning: the home directory ${home} already exists.\nuseradd: Not copying any file from skel directory into it.\n`); }
    else { const r=c.res(home,false); const h=new Node('d',0o700,uid,gid,c.fs.now()); c.fs.add(r.dir,r.name,h);
      const skel=c.fs.get('/etc/skel'); for(const [k,v] of skel.kids){ const n=new Node('f',0o644,uid,gid,v.mtime); n.data=v.data; c.fs.add(h,k,n); } } }
  /* メールボックスも作る。userdel を -r なしで実行した後に同じ名前で作ると、残っていたものと重なる */
  const spool=c.fs.get('/var/spool/mail');
  if(spool.kids.has(name)) c.err('Creating mailbox file: File exists\n');
  else c.fs.add(spool,name,new Node('f',0o660,uid,12,c.fs.now()));
  sim.flags.useradd.push(name);
});
def('usermod','/usr/sbin',c=>{
  const {o,args}=getopt('usermod',c.argv.slice(1),'aG:g:s:c:d:mLUl:',{append:'a','groups:':'G','gid:':'g','shell:':'s','comment:':'c',lock:'L',unlock:'U'},2);
  if(needRoot(c,'usermod')) return 1;
  const sim=c.sim, name=args[0];
  if(o.a&&o.G==null){ c.err('usermod: -a flag is only allowed with the -G flag\n'+USERMOD_USAGE); return 2; }
  if(!name){ c.err(USERMOD_USAGE); return 2; }
  if(!sim.user(name)){ c.err(`usermod: user '${name}' does not exist\n`); return 6; }
  if(o.G!=null){ const gs=o.G.split(',').filter(Boolean);
    for(const g of gs) if(!sim.group(g)){ c.err(`usermod: group '${g}' does not exist\n`); return 6; }
    /* -a がないと「指定したグループだけ」に置き換わる。今までの補助グループからは外れる */
    if(!o.a) sim.setEtc('group',sim.etc('group').map(l=>{ const f=l.split(':'); const m=f[3]?f[3].split(','):[]; f[3]=m.filter(x=>x!==name).join(','); return f.join(':'); }));
    for(const g of gs) sim.addMember(g,name); }
  const edit=(i,v)=>sim.setEtc('passwd',sim.etc('passwd').map(l=>{ const f=l.split(':'); if(f[0]===name) f[i]=v; return f.join(':'); }));
  if(o.g!=null){ const g=sim.group(o.g); if(!g){ c.err(`usermod: group '${o.g}' does not exist\n`); return 6; } edit(3,String(g.gid)); }
  if(o.s!=null) edit(6,o.s); if(o.c!=null) edit(4,o.c);
  if(o.L) sim.lockPw(name,true); if(o.U) sim.lockPw(name,false);
  if(o.d!=null) edit(5,o.d);
  if(o.G==null&&o.g==null&&o.s==null&&o.c==null&&!o.L&&!o.U&&o.d==null) c.out('usermod: no changes\n');
});
def('userdel','/usr/sbin',c=>{
  const {o,args}=getopt('userdel',c.argv.slice(1),'rf',{remove:'r',force:'f'},2);
  if(needRoot(c,'userdel')) return 1;
  const sim=c.sim, name=args[0]; if(!name){ c.err('Usage: userdel [options] LOGIN\n'); return 2; }
  const u=sim.user(name); if(!u){ c.err(`userdel: user '${name}' does not exist\n`); return 6; }
  sim.setEtc('passwd',sim.etc('passwd').filter(l=>l.split(':')[0]!==name));
  sim.setEtc('shadow',sim.etc('shadow').filter(l=>l.split(':')[0]!==name));
  sim.setEtc('group',sim.etc('group').filter(l=>{ const f=l.split(':'); return !(f[0]===name&&+f[2]===u.gid); }).map(l=>{ const f=l.split(':'); f[3]=(f[3]?f[3].split(','):[]).filter(x=>x!==name).join(','); return f.join(':'); }));
  if(o.r){ const r=c.look(u.home,false); if(!r.err){ c.fs.drop(r.dir,r.name); } else c.err(`userdel: ${u.home} home directory (${u.home}) not found\n`);
    const spool=c.fs.get('/var/spool/mail'); if(spool.kids.has(name)) c.fs.drop(spool,name); }
});
def('groupadd','/usr/sbin',c=>{
  const {o,args}=getopt('groupadd',c.argv.slice(1),'g:r',{'gid:':'g'},2);
  if(needRoot(c,'groupadd','group')) return 1;
  const sim=c.sim, name=args[0]; if(!name){ c.err('Usage: groupadd [options] GROUP\n'); return 2; }
  if(sim.group(name)){ c.err(`groupadd: group '${name}' already exists\n`); return 9; }
  const gs=sim.groups(); const gid=o.g!=null?+o.g:Math.max(999,...gs.filter(g=>g.gid>=1000&&g.gid<60000).map(g=>g.gid))+1;
  if(gs.some(g=>g.gid===gid)){ c.err(`groupadd: GID '${gid}' already exists\n`); return 4; }
  sim.setEtc('group',[...sim.etc('group'),`${name}:x:${gid}:`]);
});
def('groupdel','/usr/sbin',c=>{
  if(needRoot(c,'groupdel','group')) return 1;
  const sim=c.sim, name=c.argv[1]; const g=name&&sim.group(name); if(!g){ c.err(`groupdel: group '${name}' does not exist\n`); return 6; }
  const u=sim.users().find(x=>x.gid===g.gid); if(u){ c.err(`groupdel: cannot remove the primary group of user '${u.name}'\n`); return 8; }
  sim.setEtc('group',sim.etc('group').filter(l=>l.split(':')[0]!==name));
});
def('gpasswd','/usr/bin',c=>{
  const a=c.argv.slice(1); if(c.cred.uid!==0){ c.err('gpasswd: Permission denied.\n'); return 1; }
  if((a[0]==='-a'||a[0]==='-d')&&a.length===3){ const sim=c.sim; if(!sim.user(a[1])){ c.err(`gpasswd: user '${a[1]}' does not exist\n`); return 3; } if(!sim.group(a[2])){ c.err(`gpasswd: group '${a[2]}' does not exist in /etc/group\n`); return 3; }
    if(a[0]==='-a'){ sim.addMember(a[2],a[1]); c.out(`Adding user ${a[1]} to group ${a[2]}\n`); }
    else { sim.setEtc('group',sim.etc('group').map(l=>{ const f=l.split(':'); if(f[0]===a[2]) f[3]=(f[3]?f[3].split(','):[]).filter(x=>x!==a[1]).join(','); return f.join(':'); })); c.out(`Removing user ${a[1]} from group ${a[2]}\n`); }
    return 0; }
  throw new Unsup('この形の gpasswd');
});
def('passwd','/usr/bin',c=>{
  const a=c.argv.slice(1), sim=c.sim; const flags=a.filter(x=>x.startsWith('-')), names=a.filter(x=>!x.startsWith('-'));
  const me=sim.uname(c.cred.uid), target=names[0]||me;
  if(names[0]&&c.cred.uid!==0){ c.err('passwd: Only root can specify a user name.\n'); return 1; }
  if(!sim.user(target)){ c.err(`passwd: Unknown user name '${target}'.\n`); return 1; }
  if(flags.some(f=>/[lu]/.test(f))){ if(c.cred.uid!==0){ c.err('passwd: Only root can do that.\n'); return 1; } const lock=flags.some(f=>f.includes('l'));
    c.out(`${lock?'Locking':'Unlocking'} password for user ${target}.\n`);
    /* ロックを外すとパスワードが空になる場合は、-f がないと外さない */
    if(!lock&&sim.shadowOf(target).split(':')[1].replace(/^!+/,'')===''&&!flags.some(f=>f.includes('f'))){ c.err('passwd: Warning: unlocked password would be empty.\n'); c.out('passwd: Unsafe operation (use -f to force)\n'); return 1; }
    sim.lockPw(target,lock); c.out('passwd: Success\n'); return 0; }
  if(flags.some(f=>f.includes('S'))){ const h=sim.shadowOf(target).split(':')[1]; c.out(`${target} ${h.startsWith('!')?'LK':h==='*'?'NP':'PS'} ${new Date(c.fs.now()).toISOString().slice(0,10)} 0 99999 7 -1 (${h.startsWith('!')?'Password locked.':'Password set, SHA512 crypt.'})\n`); return 0; }
  const pw=c.cnode&&c.cnode.pre&&c.cnode.pre.pw;
  if(!pw||pw.bad){ c.err('passwd: Authentication token manipulation error\n'); return 1; }
  if(pw.result==='exhausted') return 1;
  if(pw.result==='empty'){ c.err('No password has been supplied.\npasswd: Authentication token manipulation error\n'); return 1; }
  if(pw.result!=='ok'){ c.err('passwd: Authentication token manipulation error\n'); return 1; }
  sim.setPw(target,pw.n1); c.out('passwd: all authentication tokens updated successfully.\n');
});
def('su','/usr/bin',c=>{
  const a=c.argv.slice(1); let login=false, cmd=null, user=null;
  for(let i=0;i<a.length;i++){ const x=a[i];
    if(x==='-'||x==='-l'||x==='--login') login=true; else if(x==='-c') cmd=a[++i];
    else if(x.startsWith('-')) throw usage('su',`invalid option -- '${x.slice(1,2)}'`); else if(user==null) user=x; }
  user=user||'root'; const sim=c.sim;
  if(!sim.user(user)){ c.err(`su: user ${user} does not exist or the user entry does not contain all the required fields\n`); return 1; }
  if(c.cred.uid!==0){ const pre=c.cnode&&c.cnode.pre; if(!pre||!pre.auth){ c.err('su: Authentication failure\n'); return 1; } }
  const nsh=sim.makeShell(user,{login,from:c.sh,io:c.io});
  if(cmd!=null) return sim.runIn(cmd,nsh,c.io);
  sim.pushShell(nsh);
});
def('sudo','/usr/bin',c=>{
  const a=c.argv.slice(1), sim=c.sim; let user='root', mode=null, i=0;
  for(;i<a.length&&a[i].startsWith('-');i++){ const x=a[i];
    if(x==='-u'){ user=a[++i]; continue; } if(x==='--'){ i++; break; }
    if(x==='-i'||x==='-s'||x==='-l'){ mode=x[1]; continue; }
    if(x==='-k'){ delete sim.sudoOk[c.sh.user]; if(a.length===1) return 0; continue; }
    c.err(`sudo: invalid option -- '${x.slice(1,2)}'\nusage: sudo -h | -K | -k | -V\n`); return 1; }
  const cmd=a.slice(i);
  if(!cmd.length&&!mode){ c.err('usage: sudo -h | -K | -k | -V\nusage: sudo -v [-ABkNnS] [-g group] [-h host] [-p prompt] [-u user]\nusage: sudo -l [-ABkNnS] [-g group] [-h host] [-p prompt] [-U user] [-u user] [command [arg ...]]\nusage: sudo [-ABbEHkNnPS] [-r role] [-t type] [-C num] [-D directory] [-g group] [-h host] [-p prompt] [-R directory] [-T timeout] [-u user] [VAR=value] [-i | -s] [command [arg ...]]\n'); return 1; }
  if(c.cred.uid!==0){
    const pre=c.cnode&&c.cnode.pre;
    if(!(pre&&pre.auth)&&!sim.sudoOk[c.sh.user]){ c.err(pre&&pre.auth===false?'sudo: 3 incorrect password attempts\n':'sudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper\n'); return 1; }
    if(!sim.inSudoers(c.sh.user)){ c.err(`${c.sh.user} is not in the sudoers file.\n`); return 1; } }
  if(!sim.user(user)){ c.err(`sudo: unknown user ${user}\nsudo: error initializing audit plugin sudoers_audit\n`); return 1; }
  if(mode==='l'){ const me=c.sh.user;
    c.out(`Matching Defaults entries for ${me} on ${HOST}:\n    !visiblepw, always_set_home, match_group_by_gid, always_query_group_plugin,\n    env_reset, env_keep="COLORS DISPLAY HOSTNAME HISTSIZE KDEDIR LS_COLORS",\n    env_keep+="MAIL PS1 PS2 QTDIR USERNAME LANG LC_ADDRESS LC_CTYPE",\n    env_keep+="LC_COLLATE LC_IDENTIFICATION LC_MEASUREMENT LC_MESSAGES",\n    env_keep+="LC_MONETARY LC_NAME LC_NUMERIC LC_PAPER LC_TELEPHONE",\n    env_keep+="LC_TIME LC_ALL LANGUAGE LINGUAS _XKB_CHARSET XAUTHORITY",\n    secure_path=/sbin\\:/bin\\:/usr/sbin\\:/usr/bin\n\nUser ${me} may run the following commands on ${HOST}:\n    (ALL) ALL\n`); return 0; }
  const nsh=sim.makeShell(user,{login:mode==='i',from:c.sh,sudo:true,io:c.io});
  if(mode&&!cmd.length){ sim.pushShell(nsh); return 0; }
  if(mode) return sim.runIn(cmd.join(' '),nsh,c.io);
  /* sudo はコマンドを secure_path から探す。cd などシェルの組み込みコマンドは実行できない */
  if(!cmd[0].includes('/')&&!sim.which(cmd[0],nsh)){ c.err(`sudo: ${cmd[0]}: command not found\n`); return 1; }
  return sim.runArgv(cmd,nsh,c.io,[],c.cnode,true);
});
B('exit logout',c=>{
  const sim=c.sim, sh=c.sh; const code=c.argv[1]!=null?(parseInt(c.argv[1],10)&255):sh.status;
  if(c.name==='logout'&&!sh.login&&!sh.isScript){ c.err('bash: logout: not login shell: use `exit\'\n'); return 1; }
  if(sh.isScript||sh.isSub){ sh.exitReq=code; return code; }
  if(sim.shells.length>1&&sim.shells[sim.shells.length-1]===sh){ sim.popShell(); c.out(sh.login?'logout\n':'exit\n'); return code; }
  c.out('logout\n'); sim.note('% 最初のログインシェルなので、このドリルでは接続を閉じません'); return 0;
});

/* ---- アーカイブと圧縮 ---- */
function unwrapArc(b){ const layers=[]; while(b&&COMP[b.kind]){ layers.push(b.kind); b=b.inner; } return {layers,core:b}; }
def('tar','/usr/bin',c=>{
  let a=c.argv.slice(1); const old=a.length&&!a[0].startsWith('-')&&/^[A-Za-z]+$/.test(a[0]); if(old) a=['-'+a[0],...a.slice(1)];
  const tryMsg="Try 'tar --help' or 'tar --usage' for more information.";
  let o, args;
  try{ ({o,args}=getopt('tar',a,'cxtvf:zjJC:pP',{create:'c',extract:'x',list:'t',verbose:'v','file:':'f',gzip:'z',bzip2:'j',xz:'J','directory:':'C','preserve-permissions':'p'},2)); }
  catch(e){ const m=/requires an argument -- '(.)'/.exec(e.message); if(old&&m){ c.err(`tar: Old option '${m[1]}' requires an argument.\n${tryMsg}\n`); return 2; } throw e; }
  const modes=['c','x','t'].filter(k=>o[k]);
  if(modes.length!==1){ c.err(modes.length?`tar: You may not specify more than one '-Acdtrux', '--delete' or  '--test-label' option\n${tryMsg}\n`:`tar: You must specify one of the '-Acdtrux', '--delete' or '--test-label' options\n${tryMsg}\n`); return 2; }
  const comp=o.z?'gz':o.j?'bz2':o.J?'xz':null, sim=c.sim;
  if(o.c&&!args.length){ c.err(`tar: Cowardly refusing to create an empty archive\n${tryMsg}\n`); return 2; }
  if(o.f==null&&(o.c?c.tty:c.io.stdin==null)){ c.err(o.c?'tar: Refusing to write archive contents to terminal (missing -f option?)\ntar: Error is not recoverable: exiting now\n':'tar: Refusing to read archive contents from terminal (missing -f option?)\ntar: Error is not recoverable: exiting now\n'); return 2; }
  if(o.f==null) throw new Unsup('-f を付けない tar（標準入出力を使う形）');
  let base=c.sh.cwd;
  if(o.C!=null){ const r=c.look(o.C); if(r.err||r.node.type!=='d'){ c.err(`tar: ${o.C}: Cannot open: ${r.err?r.err.message:'Not a directory'}\ntar: Error is not recoverable: exiting now\n`); return 2; } base=r.abs; }
  const sub=c.sh.fork(); sub.cwd=base; const cc=new Ctx(sim,sub,c.argv,c.io,[],null,'tar');
  if(o.c){
    if(!args.length){ c.err(`tar: Cowardly refusing to create an empty archive\n${tryMsg}\n`); return 2; }
    const entries=[], errs=[]; let stripped=false;
    for(const p of args){
      const r=cc.look(p,false); if(r.err){ errs.push(`tar: ${p}: Cannot stat: ${r.err.message}`); continue; }
      let name=p.replace(/^\/+/,''); if(name!==p) stripped=true; name=name.replace(/\/+$/,'')||'.';
      const walk=(nm,n)=>{
        const e={name:nm,type:n.type,mode:n.mode,uid:n.uid,gid:n.gid,mtime:n.mtime,user:sim.uname(n.uid),group:sim.gname(n.gid),size:0};
        if(n.type==='f'){ if(!cc.can(n,4)){ errs.push(`tar: ${nm}: Cannot open: Permission denied`); return; } e.data=n.data; e.bin=n.bin?structuredClone(n.bin):null; e.size=sizeOf(n); }
        else if(n.type==='l') e.target=n.target;
        else if(n.type!=='d') return;
        entries.push(e); if(o.v) c.out(nm+(n.type==='d'?'/':'')+'\n');
        if(n.type==='d'){ if(!cc.can(n,4)||!cc.can(n,1)){ errs.push(`tar: ${nm}: Cannot open: Permission denied`); return; } for(const [k,v] of n.kids) walk(nm==='.'?k:nm+'/'+k,v); } };
      walk(name,r.node);
    }
    if(stripped) c.err("tar: Removing leading `/' from member names\n");
    let bin={kind:'tar',entries}; if(comp) bin={kind:comp,name:'',inner:bin};
    let sink; try{ sink=sim.openWrite(o.f,c.sh,false); }catch(e){ if(!(e instanceof FsErr)) throw e; c.err(`tar: ${o.f}: Cannot open: ${e.message}\ntar: Error is not recoverable: exiting now\n`); return 2; }
    if(sink.node){ sink.node.bin=bin; sink.node.data=''; sink.node.mtime=c.fs.now(); }
    sim.flags.tars.push({file:o.f,comp});
    if(errs.length){ c.err(errs.join('\n')+'\ntar: Exiting with failure status due to previous errors\n'); return 2; }
    return 0;
  }
  /* 展開と一覧。GNU tar は読むときに圧縮形式を自動で判別するので、z を付けなくても読める */
  const r=c.look(o.f);
  if(r.err){ c.err(comp?`tar (child): ${o.f}: Cannot open: ${r.err.message}\ntar (child): Error is not recoverable: exiting now\ntar: Child returned status 2\ntar: Error is not recoverable: exiting now\n`:`tar: ${o.f}: Cannot open: ${r.err.message}\ntar: Error is not recoverable: exiting now\n`); return 2; }
  if(!c.can(r.node,4)){ c.err(`tar: ${o.f}: Cannot open: Permission denied\ntar: Error is not recoverable: exiting now\n`); return 2; }
  const {layers,core}=unwrapArc(r.node.bin);
  if(comp&&layers[0]!==comp){ c.err({gz:'\ngzip: stdin: not in gzip format\ntar: Child returned status 1\n',bz2:'bzip2: (stdin) is not a bzip2 file.\ntar: Child returned status 2\n',xz:'xz: (stdin): File format not recognized\ntar: Child returned status 1\n'}[comp]+'tar: Error is not recoverable: exiting now\n'); return 2; }
  if(!core||core.kind!=='tar'){ c.err('tar: This does not look like a tar archive\ntar: Exiting with failure status due to previous errors\n'); return 2; }
  const want=args.map(x=>x.replace(/\/+$/,''));
  const sel=core.entries.filter(e=>!want.length||want.some(w=>e.name===w||e.name.startsWith(w+'/')));
  if(o.t){
    for(const e of sel){ const nm=e.name+(e.type==='d'?'/':'');
      if(!o.v){ c.out(nm+'\n'); continue; }
      const ug=`${e.user}/${e.group}`, sz=String(e.size); const pad=' '.repeat(Math.max(1,19-ug.length-sz.length));
      c.out(`${modeStr({type:e.type,mode:e.mode})} ${ug}${pad}${sz} ${fmtStamp(e.mtime)} ${nm}${e.type==='l'?' -> '+e.target:''}\n`); }
    const miss=want.filter(w=>!core.entries.some(e=>e.name===w||e.name.startsWith(w+'/')));
    if(miss.length){ c.err(miss.map(m=>`tar: ${m}: Not found in archive`).join('\n')+'\ntar: Exiting with failure status due to previous errors\n'); return 2; }
    return 0;
  }
  let st=0;
  for(const e of sel){
    if(o.v) c.out(e.name+(e.type==='d'?'/':'')+'\n');
    try{
      const parts=e.name.split('/'); let dir='';
      for(const p of parts.slice(0,-1)){ dir=dir?dir+'/'+p:p; const dr=cc.res(dir); if(!dr.node) cc.create(dr,'d'); else if(dr.node.type!=='d') throw new FsErr('ENOTDIR'); }
      const t=cc.res(e.name,false);
      const keep=c.cred.uid===0||o.p;
      const mode=keep?e.mode:e.mode&~c.sh.umask;
      let n=t.node;
      if(e.type==='d'){ if(!n) n=cc.create(t,'d'); n.mode=mode; }
      else { if(n){ if(n.type==='d') throw new FsErr('EISDIR'); if(!cc.can(t.dir,2)) throw new FsErr('EACCES'); c.fs.drop(t.dir,t.name); }
        n=cc.create(t,e.type==='l'?'l':'f');
        if(e.type==='l') n.target=e.target; else { n.data=e.data; n.bin=e.bin?structuredClone(e.bin):null; n.mode=mode; } }
      n.mtime=e.mtime; if(c.cred.uid===0){ n.uid=e.uid; n.gid=e.gid; }
    }catch(err){ if(!(err instanceof FsErr)) throw err; c.err(`tar: ${e.name}: Cannot open: ${err.message}\n`); st=2; }
  }
  sim.flags.untars.push({file:o.f,base});
  if(st) c.err('tar: Exiting with failure status due to previous errors\n');
  return st;
});
function compressor(kind,prog){ return c=>{
  const nm=c.name, ext=COMP[kind].ext;
  const {o,args}=getopt(nm,c.argv.slice(1),'dkcfvt',{decompress:'d',keep:'k',stdout:'c',force:'f',verbose:'v'});
  const D=o.d||/^(gunzip|bunzip2|unxz|zcat|bzcat|xzcat)$/.test(nm), C=o.c||/cat$/.test(nm);
  const missing=p=>prog==='bzip2'?`bzip2: Can't open input file ${p}: No such file or directory.`:`${prog}: ${p}: No such file or directory`;
  if(!args.length){
    if(!D&&c.tty&&!o.f){ c.err(`${prog}: compressed data not written to a terminal. Use -f to force compression.\nFor help, type: ${prog} -h\n`); return 1; }
    throw new Unsup(`標準入力を使う ${nm}`); }
  let st=0;
  for(const p of args){
    const r=c.look(p,false); if(r.err){ c.err((r.err.code==='ENOENT'?missing(p):`${prog}: ${p}: ${r.err.message}`)+'\n'); st=1; continue; }
    const n=r.node;
    if(n.type==='d'){ c.err(`${prog}: ${p} is a directory -- ignored\n`); st=2; continue; }
    if(!c.can(n,4)){ c.err(`${prog}: ${p}: Permission denied\n`); st=1; continue; }
    if(!D){
      if(p.endsWith(ext)){ c.err(`${prog}: ${p} already has ${ext} suffix -- unchanged\n`); st=2; continue; }
      const bin={kind,name:basename(p),inner:n.bin?n.bin:{kind:'text',data:n.data}};
      if(C){ c.out(textOf({type:'f',bin})); continue; }
      const dr=c.res(p+ext,false);
      if(dr.node&&!o.f){ c.err(`${prog}: ${p}${ext} already exists; not overwritten\n`); st=2; continue; }
      if(!c.can(dr.dir,2)){ c.err(`${prog}: ${p}${ext}: Permission denied\n`); st=1; continue; }
      if(dr.node) c.fs.drop(dr.dir,dr.name);
      const z=c.create(dr,'f'); z.bin=bin; z.mode=n.mode; z.mtime=n.mtime;
      if(o.v) c.out(`${p}:\t${(100-COMP[kind].rate*100).toFixed(1)}% -- replaced with ${p}${ext}\n`);
      if(!o.k) c.fs.drop(r.dir,r.name);
    } else {
      if(!p.endsWith(ext)){ c.err(`${prog}: ${p}: unknown suffix -- ignored\n`); st=2; continue; }
      if(!n.bin||n.bin.kind!==kind){ c.err(`${prog}: ${p}: not in ${prog} format\n`); st=1; continue; }
      const inner=n.bin.inner;
      if(C){ c.out(inner.kind==='text'?inner.data:textOf({type:'f',bin:inner})); continue; }
      const outP=p.slice(0,-ext.length); const dr=c.res(outP,false);
      if(dr.node&&!o.f){ c.err(`${prog}: ${outP} already exists; not overwritten\n`); st=2; continue; }
      if(dr.node) c.fs.drop(dr.dir,dr.name);
      const z=c.create(dr,'f'); if(inner.kind==='text') z.data=inner.data; else z.bin=inner; z.mode=n.mode; z.mtime=n.mtime;
      if(!o.k) c.fs.drop(r.dir,r.name);
    }
  }
  return st; }; }
def('gzip gunzip zcat','/usr/bin',compressor('gz','gzip'));
def('bzip2 bunzip2 bzcat','/usr/bin',compressor('bz2','bzip2'));
def('xz unxz xzcat','/usr/bin',compressor('xz','xz'));

/* ---- プロセスとサービス ---- */
const SIGS={HUP:1,INT:2,QUIT:3,KILL:9,USR1:10,USR2:12,TERM:15,CONT:18,STOP:19};
def('ps','/usr/bin',c=>{
  const a=c.argv.slice(1).join(' ').trim(), sim=c.sim, P=sim.procList(c.sh);
  const time=p=>p.time||'00:00:00';
  if(!a){ const mine=P.filter(p=>p.tty==='pts/0'&&p.uid===c.cred.uid);
    c.out('    PID TTY          TIME CMD\n'+mine.map(p=>`${String(p.pid).padStart(7)} ${p.tty.padEnd(8)} ${time(p)} ${p.cmd.split(' ')[0].replace(/^-/,'').split('/').pop()}`).join('\n')+'\n'); return 0; }
  if(/^-?aux$/.test(a)||a==='ax'||a==='-ax'){
    c.out('USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\n'+P.map(p=>`${sim.uname(p.uid).slice(0,8).padEnd(8)} ${String(p.pid).padStart(7)} ${p.cpu.padStart(4)} ${p.mem.padStart(4)} ${String(p.vsz).padStart(6)} ${String(p.rss).padStart(5)} ${p.tty.padEnd(8)} ${p.stat.padEnd(4)} ${p.start.padStart(5)} ${time(p).replace(/^00:0?/,'').padStart(6)} ${p.cmd}`).join('\n')+'\n'); return 0; }
  if(/^-e(f|F)?$/.test(a)||a==='-ef'||a==='-A'){
    c.out('UID          PID    PPID  C STIME TTY          TIME CMD\n'+P.map(p=>`${sim.uname(p.uid).slice(0,8).padEnd(8)} ${String(p.pid).padStart(7)} ${String(p.ppid).padStart(7)}  0 ${p.start.padStart(5)} ${p.tty.padEnd(8)} ${time(p)} ${p.cmd}`).join('\n')+'\n'); return 0; }
  throw new Unsup(`ps ${a} の形`);
});
B('kill',c=>{
  const a=c.argv.slice(1), sim=c.sim; let sig=15, i=0;
  if(a[0]==='-l'){ c.out(' 1) SIGHUP\t 2) SIGINT\t 3) SIGQUIT\t 4) SIGILL\t 5) SIGTRAP\n 6) SIGABRT\t 7) SIGBUS\t 8) SIGFPE\t 9) SIGKILL\t10) SIGUSR1\n11) SIGSEGV\t12) SIGUSR2\t13) SIGPIPE\t14) SIGALRM\t15) SIGTERM\n16) SIGSTKFLT\t17) SIGCHLD\t18) SIGCONT\t19) SIGSTOP\t20) SIGTSTP\n'); return 0; }
  const parseSig=s=>{ if(/^\d+$/.test(s)) return +s; const k=s.toUpperCase().replace(/^SIG/,''); return SIGS[k]??null; };
  if(a[0]==='-s'||a[0]==='-n'){ sig=parseSig(a[1]||''); i=2; } else if(a[0]&&a[0].startsWith('-')&&a[0].length>1){ sig=parseSig(a[0].slice(1)); i=1; }
  if(sig==null){ c.err(`bash: kill: ${a[i-1]}: invalid signal specification\n`); return 1; }
  const pids=a.slice(i); if(!pids.length){ c.err('kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]\n'); return 2; }
  let st=0;
  for(const s of pids){
    if(!/^\d+$/.test(s)){ c.err(`bash: kill: ${s}: arguments must be process or job IDs\n`); st=1; continue; }
    const r=sim.signal(+s,sig,c.cred); if(r){ c.err(`bash: kill: (${s}) - ${r}\n`); st=1; } }
  return st;
});
def('kill','/usr/bin',c=>BUILTIN.kill(c));
def('pgrep pkill','/usr/bin',c=>{
  const {o,args}=getopt(c.name,c.argv.slice(1),'lu:fx',{});
  if(!args.length){ c.err(`${c.name}: no matching criteria specified\nTry \`${c.name} --help' for more information.\n`); return 2; }
  const sim=c.sim, re=makeRe(c.name,args[0],true,''); const u=o.u?sim.user(o.u):null;
  const hits=sim.procList(c.sh).filter(p=>!p.transient&&(o.f?re.test(p.cmd):re.test(p.name))&&(!u||p.uid===u.uid));
  if(!hits.length) return 1;
  if(c.name==='pgrep'){ c.out(hits.map(p=>o.l?`${p.pid} ${p.name}`:String(p.pid)).join('\n')+'\n'); return 0; }
  let st=0; for(const p of hits){ const r=sim.signal(p.pid,15,c.cred); if(r){ c.err(`pkill: killing pid ${p.pid} failed: ${r}\n`); st=1; } } return st;
});
def('sleep','/usr/bin',c=>{ const a=c.argv[1]; if(a==null) throw usage('sleep','missing operand'); if(!/^\d+(\.\d+)?[smhd]?$/.test(a)){ c.err(`sleep: invalid time interval ‘${a}’\nTry 'sleep --help' for more information.\n`); return 1; } });
def('systemctl','/usr/bin',c=>{
  const a=c.argv.slice(1).filter(x=>x!=='--no-pager'), sim=c.sim;
  const now=a.includes('--now'); const args=a.filter(x=>x!=='--now'&&!x.startsWith('--type')&&x!=='-t');
  const verb=args[0]||'list-units', units=args.slice(1).map(u=>u.replace(/\.service$/,''));
  const wants='/etc/systemd/system/multi-user.target.wants/';
  const enabled=s=>!!c.fs.get(wants+s+'.service',false);
  const root=c.cred.uid===0;
  const deny=(what,u)=>{ c.err(u?`Failed to ${what} ${u}.service: Interactive authentication required.\nSee system logs and 'systemctl status ${u}.service' for details.\n`:`Failed to ${what} unit: Interactive authentication required.\n`); return 1; };
  const known=u=>{ if(sim.svcs[u]) return true; c.err(`Unit ${u}.service could not be found.\n`); return false; };
  switch(verb){
    case 'status': { let st=0; for(const u of units){ const s=sim.svcs[u]; if(!s){ c.err(`Unit ${u}.service could not be found.\n`); st=4; continue; }
        const en=enabled(u)?'enabled':'disabled';
        c.out(`${s.active?'●':'○'} ${u}.service - ${s.desc}\n     Loaded: loaded (/usr/lib/systemd/system/${u}.service; ${en}; preset: ${s.preset})\n     Active: `+
          (s.active?`active (running) since ${WDAY[jst(s.since).getUTCDay()]} ${fmtStamp(s.since)}:00 JST\n`:'inactive (dead)\n')+
          (s.docs?`       Docs: ${s.docs.join('\n             ')}\n`:'')+(s.active?`   Main PID: ${s.pid} (${s.bin})\n`:'')+(u===units[units.length-1]?'':'\n'));
        if(!s.active) st=3; } return st; }
    case 'is-active': { let st=0; for(const u of units){ const s=sim.svcs[u]; c.out((s&&s.active?'active':'inactive')+'\n'); if(!(s&&s.active)) st=3; } return st; }
    case 'is-enabled': { let st=0; for(const u of units){ if(!sim.svcs[u]){ c.err(`Failed to get unit file state for ${u}.service: No such file or directory\n`); st=1; continue; } const e=enabled(u); c.out((e?'enabled':'disabled')+'\n'); if(!e) st=1; } return st; }
    case 'start': case 'stop': case 'restart': case 'reload': {
      for(const u of units){ if(!sim.svcs[u]){ c.err(`Failed to ${verb} ${u}.service: Unit ${u}.service not found.\n`); return 5; } if(!root) return deny(verb,u);
        sim.setActive(u,verb!=='stop'); }
      return 0; }
    case 'enable': case 'disable': {
      for(const u of units) if(!sim.svcs[u]){ c.err(`Failed to ${verb} unit: Unit file ${u}.service does not exist.\n`); return 1; }
      if(!root) return deny(verb);
      for(const u of units){ const dir=c.fs.get(wants);
        if(verb==='enable'&&!enabled(u)){ const n=new Node('l',0o777,0,0,c.fs.now()); n.target=`/usr/lib/systemd/system/${u}.service`; c.fs.add(dir,u+'.service',n); c.err(`Created symlink ${wants}${u}.service → /usr/lib/systemd/system/${u}.service.\n`); }
        if(verb==='disable'&&enabled(u)){ c.fs.drop(dir,u+'.service'); c.err(`Removed "${wants}${u}.service".\n`); }
        if(now) sim.setActive(u,verb==='enable'); }
      return 0; }
    case 'list-units': case 'list-unit-files': {
      const names=Object.keys(sim.svcs).sort();
      if(verb==='list-unit-files'){ c.out('UNIT FILE          STATE    PRESET\n'+names.map(u=>`${(u+'.service').padEnd(18)} ${(enabled(u)?'enabled':'disabled').padEnd(8)} ${sim.svcs[u].preset}`).join('\n')+`\n\n${names.length} unit files listed.\n`); return 0; }
      const act=names.filter(u=>sim.svcs[u].active);
      c.out('  UNIT               LOAD   ACTIVE SUB     DESCRIPTION\n'+act.map(u=>`  ${(u+'.service').padEnd(18)} loaded active running ${sim.svcs[u].desc}`).join('\n')+`\n\nLOAD   = Reflects whether the unit definition was properly loaded.\nACTIVE = The high-level unit activation state, i.e. generalization of SUB.\nSUB    = The low-level unit activation state, values depend on unit type.\n${act.length} loaded units listed.\n`); return 0; }
    case 'get-default': c.out('multi-user.target\n'); return 0;
    default: throw new Unsup(`systemctl ${verb}`);
  }
});

/* ---- ネットワークとシステムの情報（表示だけ） ---- */
def('hostname','/usr/bin',c=>{ if(c.argv[1]==='-I'){ c.out('192.168.10.20 \n'); return 0; } if(c.argv[1]&&!c.argv[1].startsWith('-')){ if(c.cred.uid!==0){ c.err('hostname: you must be root to change the host name\n'); return 1; } throw new Unsup('ホスト名の変更（実機では hostnamectl set-hostname を使う）'); } c.out(HOST+'\n'); });
def('uname','/usr/bin',c=>{ const a=c.argv.slice(1).join(''); const K='5.14.0-427.el9.x86_64';
  if(a.includes('a')){ c.out(`Linux ${HOST} ${K} #1 SMP PREEMPT_DYNAMIC Fri Oct 10 10:00:00 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux\n`); return 0; }
  const parts=[]; if(!a||a.includes('s')) parts.push('Linux'); if(a.includes('n')) parts.push(HOST); if(a.includes('r')) parts.push(K); if(a.includes('m')) parts.push('x86_64'); c.out(parts.join(' ')+'\n'); });
def('ip','/usr/sbin',c=>{
  const a=c.argv.slice(1).filter(x=>!x.startsWith('-')); const obj=a[0]||'';
  if(/^a(d(d(r(e(s(s)?)?)?)?)?)?$/.test(obj)){ c.out(`1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: ens160: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
    link/ether 00:0c:29:3a:5b:7c brd ff:ff:ff:ff:ff:ff
    altname enp3s0
    inet 192.168.10.20/24 brd 192.168.10.255 scope global noprefixroute ens160
       valid_lft forever preferred_lft forever
    inet6 fe80::20c:29ff:fe3a:5b7c/64 scope link noprefixroute
       valid_lft forever preferred_lft forever
`); return 0; }
  if(/^r(o(u(t(e)?)?)?)?$/.test(obj)){ c.out('default via 192.168.10.1 dev ens160 proto static metric 100\n192.168.10.0/24 dev ens160 proto kernel scope link src 192.168.10.20 metric 100\n'); return 0; }
  if(/^l(i(n(k)?)?)?$/.test(obj)){ c.out('1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000\n    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00\n2: ens160: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP mode DEFAULT group default qlen 1000\n    link/ether 00:0c:29:3a:5b:7c brd ff:ff:ff:ff:ff:ff\n'); return 0; }
  throw new Unsup(`ip ${obj}`);
});
def('ss','/usr/sbin',c=>{
  const sim=c.sim, rows=[['22','sshd'],['80','httpd']].filter(([,s])=>sim.svcs[s]&&sim.svcs[s].active);
  const L=[]; for(const [port] of rows){ const local='0.0.0.0'; L.push(`LISTEN 0      ${port==='80'?511:128}   ${(local+':'+port).padStart(18)} ${'0.0.0.0:*'.padStart(18)}`); if(port==='22'||port==='80') L.push(`LISTEN 0      ${port==='80'?511:128}   ${('[::]:'+port).padStart(18)} ${'[::]:*'.padStart(18)}`); }
  c.out('State  Recv-Q Send-Q      Local Address:Port  Peer Address:Port\n'+L.join('\n')+'\n');
});
def('date','/usr/bin',c=>{
  const a=c.argv.slice(1); const d=jst(c.fs.now()); const fmt=a.find(x=>x.startsWith('+'));
  if(a.some(x=>!x.startsWith('+'))) throw new Unsup('date の日付指定や設定（-d、-s など）');
  const F={Y:d.getUTCFullYear(),m:pad2(d.getUTCMonth()+1),d:pad2(d.getUTCDate()),e:String(d.getUTCDate()).padStart(2),H:pad2(d.getUTCHours()),M:pad2(d.getUTCMinutes()),S:pad2(d.getUTCSeconds()),a:WDAY[d.getUTCDay()],b:MON[d.getUTCMonth()],y:pad2(d.getUTCFullYear()%100),Z:'JST',s:Math.floor(c.fs.now()/1000),'%':'%',n:'\n'};
  F.F=`${F.Y}-${F.m}-${F.d}`; F.T=`${F.H}:${F.M}:${F.S}`;
  c.out((fmt?fmt.slice(1).replace(/%([A-Za-z%])/g,(m,k)=>F[k]!=null?F[k]:m):`${F.a} ${F.b} ${F.e} ${F.T} JST ${F.Y}`)+'\n');
});
def('seq','/usr/bin',c=>{ const a=c.argv.slice(1).map(Number); if(!a.length||a.some(isNaN)) throw usage('seq','missing operand');
  const [f,inc,l]=a.length===1?[1,1,a[0]]:a.length===2?[a[0],1,a[1]]:a; const out=[]; for(let x=f;inc>0?x<=l:x>=l;x+=inc){ out.push(String(x)); if(out.length>10000) break; } c.out(unlines(out)); });
def('basename','/usr/bin',c=>{ const a=c.argv.slice(1); if(!a.length) throw usage('basename','missing operand'); let b=basename(a[0]); if(a[1]&&b.endsWith(a[1])&&b!==a[1]) b=b.slice(0,-a[1].length); c.out(b+'\n'); });
def('dirname','/usr/bin',c=>{ const a=c.argv.slice(1); if(!a.length) throw usage('dirname','missing operand'); c.out(a.map(dirname).join('\n')+'\n'); });
def('clear','/usr/bin',c=>{ c.sim.clearReq=true; });
def('true','/usr/bin',()=>0); def('false','/usr/bin',()=>1);
B('true',()=>0); B('false',()=>1);

/* ---- シェルの組み込みコマンド ---- */
function echoArgs(a){ let n=false, e=false, i=0; for(;i<a.length&&/^-[neE]+$/.test(a[i]);i++){ if(a[i].includes('n')) n=true; if(a[i].includes('e')) e=true; if(a[i].includes('E')) e=false; }
  let s=a.slice(i).join(' '); let stop=false;
  if(e) s=s.replace(/\\([\\abfnrtvc0]|x[0-9a-fA-F]{1,2})/g,(m,k)=>{ if(stop) return ''; if(k==='c'){ stop=true; return ''; } return ({'\\':'\\',a:'\x07',b:'\b',f:'\f',n:'\n',r:'\r',t:'\t',v:'\v','0':'\0'})[k]??String.fromCharCode(parseInt(k.slice(1),16)); });
  return s+(n||stop?'':'\n'); }
B('echo',c=>{ c.out(echoArgs(c.argv.slice(1))); });
def('echo','/usr/bin',c=>{ c.out(echoArgs(c.argv.slice(1))); });
function printfFmt(a){
  const fmt=a[0]??''; let args=a.slice(1), out='';
  const esc=s=>s.replace(/\\([\\nt"])/g,(m,k)=>({n:'\n',t:'\t','\\':'\\','"':'"'})[k]);
  do{ out+=esc(fmt).replace(/%(-?\d*)(?:\.(\d+))?([sdifxoc%])/g,(m,w,p,k)=>{ if(k==='%') return '%'; let v=args.length?args.shift():'';
      if(k==='d'||k==='i') v=String(parseInt(v,10)||0); else if(k==='f') v=(parseFloat(v)||0).toFixed(p==null?6:+p); else if(k==='x') v=(parseInt(v,10)||0).toString(16); else if(k==='o') v=(parseInt(v,10)||0).toString(8); else if(k==='c') v=String(v)[0]||''; else if(p!=null) v=String(v).slice(0,+p);
      v=String(v); const width=Math.abs(parseInt(w||'0',10)); return w.startsWith('-')?v.padEnd(width):v.padStart(width); });
  }while(args.length&&/%[-\d.]*[sdifxoc]/.test(fmt));
  return out; }
B('printf',c=>{ if(c.argv.length<2){ c.err('printf: usage: printf [-v var] format [arguments]\n'); return 2; } c.out(printfFmt(c.argv.slice(1))); });
def('printf','/usr/bin',c=>{ c.out(printfFmt(c.argv.slice(1))); });
B('export',c=>{ const a=c.argv.slice(1), sh=c.sh; const un=a[0]==='-n'; const list=a.filter(x=>x!=='-n'&&x!=='-p');
  if(!list.length){ c.out([...sh.vars].filter(([,v])=>v.x).sort((x,y)=>byteCmp(x[0],y[0])).map(([k,v])=>`declare -x ${k}="${v.v}"`).join('\n')+'\n'); return 0; }
  let st=0; for(const x of list){ const m=/^([A-Za-z_][A-Za-z0-9_]*)(?:=(.*))?$/s.exec(x); if(!m){ c.err(`bash: export: \`${x}': not a valid identifier\n`); st=1; continue; }
    if(m[2]!=null) sh.vars.set(m[1],{v:m[2],x:!un}); else { const e=sh.vars.get(m[1]); if(e) e.x=!un; else if(!un) sh.vars.set(m[1],{v:'',x:true,unset:true}); } }
  return st; });
B('unset',c=>{ for(const x of c.argv.slice(1)) if(!x.startsWith('-')) c.sh.vars.delete(x); });
B('alias',c=>{ const a=c.argv.slice(1), sh=c.sh;
  if(!a.length||a[0]==='-p'){ c.out([...sh.aliases].sort((x,y)=>byteCmp(x[0],y[0])).map(([k,v])=>`alias ${k}='${v}'`).join('\n')+(sh.aliases.size?'\n':'')); return 0; }
  let st=0; for(const x of a){ const i=x.indexOf('='); if(i<0){ if(sh.aliases.has(x)) c.out(`alias ${x}='${sh.aliases.get(x)}'\n`); else { c.err(`bash: alias: ${x}: not found\n`); st=1; } continue; } sh.aliases.set(x.slice(0,i),x.slice(i+1)); }
  return st; });
B('unalias',c=>{ let st=0; for(const x of c.argv.slice(1)){ if(x==='-a'){ c.sh.aliases.clear(); continue; } if(!c.sh.aliases.delete(x)){ c.err(`bash: unalias: ${x}: not found\n`); st=1; } } return st; });
def('env printenv','/usr/bin',c=>{ const a=c.argv.slice(1), vars=[...c.sh.vars].filter(([,v])=>v.x&&!v.unset);
  if(c.name==='printenv'&&a.length){ let st=0; for(const k of a){ const e=c.sh.vars.get(k); if(e&&e.x) c.out(e.v+'\n'); else st=1; } return st; }
  if(c.name==='env'&&a.length) throw new Unsup('env に続けてコマンドを指定する形');
  c.out(vars.map(([k,v])=>`${k}=${v.v}`).join('\n')+'\n'); });
B('history',c=>{ const sim=c.sim, a=c.argv.slice(1);
  if(a[0]==='-c'){ sim.hist.length=0; return 0; }
  const n=a[0]&&/^\d+$/.test(a[0])?+a[0]:sim.hist.length; const start=sim.hist.length-n;
  c.out(sim.hist.slice(start).map((h,k)=>`${String(start+k+1).padStart(5)}  ${h}`).join('\n')+(n?'\n':'')); });
B('source .',c=>{ const f=c.argv[1]; if(f==null){ c.err(`bash: ${c.name}: filename argument required\n${c.name}: usage: ${c.name} filename [arguments]\n`); return 2; }
  let t; try{ t=c.read(f); }catch(e){ if(!(e instanceof FsErr)) throw e; c.err(`bash: ${f}: ${e.message}\n`); return 1; }
  return c.sim.runIn(t,c.sh,c.io,true); });
def('bash sh','/usr/bin',c=>{ const a=c.argv.slice(1), sim=c.sim;
  if(a[0]==='-c'){ if(a[1]==null){ c.err(`${c.name}: -c: option requires an argument\n`); return 2; }
    /* 子のシェルには export した変数だけが渡る */
    const sub=c.sh.fork(); sub.vars=new Map([...c.sh.vars].filter(([,v])=>v.x).map(([k,v])=>[k,{...v}])); for(const [k,v] of c.av) sub.vars.set(k,{v,x:true});
    sub.aliases=new Map(); sub.isSub=true; sub.pos=a.slice(3); return sim.runIn(a[1],sub,c.io); }
  if(a.length){ let t; try{ t=c.read(a[0]); }catch(e){ if(!(e instanceof FsErr)) throw e; c.err(`${c.name}: ${a[0]}: ${e.message}\n`); return 127; }
    return sim.runScript(t,a[0],a,c.sh,c.io,c.av); }
  const nsh=sim.makeShell(c.sh.user,{login:false,from:c.sh,keepCred:c.cred}); nsh.via='bash'; sim.pushShell(nsh); });
/* test と [ ：ファイルの判定、文字列と整数の比較 */
function testEval(c,a){
  if(!a.length) return false;
  if(a[0]==='!') return !testEval(c,a.slice(1));
  const ia=a.indexOf('-a'), io=a.indexOf('-o');
  if(io>0) return testEval(c,a.slice(0,io))||testEval(c,a.slice(io+1));
  if(ia>0) return testEval(c,a.slice(0,ia))&&testEval(c,a.slice(ia+1));
  if(a.length===1) return a[0]!=='';
  if(a.length===2){ const [op,v]=a; const r=()=>c.look(v); const f=()=>{ const x=r(); return x.err?null:x.node; };
    switch(op){ case '-z': return v===''; case '-n': return v!=='';
      case '-e': return !!f(); case '-f': return f()?.type==='f'; case '-d': return f()?.type==='d';
      case '-L': case '-h': { const x=c.look(v,false); return !x.err&&x.node.type==='l'; }
      case '-r': { const n=f(); return !!n&&c.can(n,4); } case '-w': { const n=f(); return !!n&&c.can(n,2); } case '-x': { const n=f(); return !!n&&c.can(n,1); }
      case '-s': { const n=f(); return !!n&&sizeOf(n)>0; }
      default: throw new ShErr(`bash: test: ${op}: unary operator expected`,2); } }
  if(a.length===3){ const [x,op,y]=a;
    if(op==='='||op==='==') return x===y; if(op==='!=') return x!==y;
    const num=v=>{ if(!/^\s*-?\d+\s*$/.test(v)) throw new ShErr(`bash: test: ${v}: integer expression expected`,2); return parseInt(v,10); };
    switch(op){ case '-eq': return num(x)===num(y); case '-ne': return num(x)!==num(y); case '-lt': return num(x)<num(y); case '-le': return num(x)<=num(y); case '-gt': return num(x)>num(y); case '-ge': return num(x)>=num(y); }
    throw new ShErr(`bash: test: ${op}: binary operator expected`,2); }
  throw new ShErr('bash: test: too many arguments',2);
}
B('test',c=>testEval(c,c.argv.slice(1))?0:1);
B('builtin',c=>{ const n=c.argv[1]; if(n==null) return 0; const f=BUILTIN[n]; if(!f){ c.err(`bash: builtin: ${n}: not a shell builtin\n`); return 1; } c.argv=c.argv.slice(1); c.name=n; return f(c); });
def('getent','/usr/bin',c=>{
  const [db,key]=c.argv.slice(1); const sim=c.sim;
  const lines=db==='passwd'?sim.etc('passwd'):db==='group'?sim.etc('group'):db==='hosts'?linesOf(textOf(c.fs.get('/etc/hosts'))).ls.filter(l=>l&&!l.startsWith('#')):null;
  if(!lines){ c.err(db?`Unknown database: ${db}\nTry \`getent --help' or \`getent --usage' for more information.\n`:'getent: wrong number of arguments\nTry `getent --help\' or `getent --usage\' for more information.\n'); return db?1:1; }
  if(key==null){ c.out(unlines(lines)); return 0; }
  const hit=lines.filter(l=>db==='hosts'?l.split(/\s+/).includes(key):(l.split(':')[0]===key||l.split(':')[2]===key));
  if(!hit.length) return 2; c.out(unlines(db==='hosts'?hit.map(l=>{ const f=l.split(/\s+/); return f[0].padEnd(15)+' '+f.slice(1).join(' '); }):hit));
});
const USERADD_USAGE=`Usage: useradd [options] LOGIN
       useradd -D
       useradd -D [options]

Options:
      --badname                 do not check for bad names
  -b, --base-dir BASE_DIR       base directory for the home directory of the
                                new account
      --btrfs-subvolume-home    use BTRFS subvolume for home directory
  -c, --comment COMMENT         GECOS field of the new account
  -d, --home-dir HOME_DIR       home directory of the new account
  -D, --defaults                print or change default useradd configuration
  -e, --expiredate EXPIRE_DATE  expiration date of the new account
  -f, --inactive INACTIVE       password inactivity period of the new account
  -g, --gid GROUP               name or ID of the primary group of the new
                                account
  -G, --groups GROUPS           list of supplementary groups of the new
                                account
  -h, --help                    display this help message and exit
  -k, --skel SKEL_DIR           use this alternative skeleton directory
  -K, --key KEY=VALUE           override /etc/login.defs defaults
  -l, --no-log-init             do not add the user to the lastlog and
                                faillog databases
  -m, --create-home             create the user's home directory
  -M, --no-create-home          do not create the user's home directory
  -N, --no-user-group           do not create a group with the same name as
                                the user
  -o, --non-unique              allow to create users with duplicate
                                (non-unique) UID
  -p, --password PASSWORD       encrypted password of the new account
  -r, --system                  create a system account
  -R, --root CHROOT_DIR         directory to chroot into
  -P, --prefix PREFIX_DIR       prefix directory where are located the /etc/* files
  -s, --shell SHELL             login shell of the new account
  -u, --uid UID                 user ID of the new account
  -U, --user-group              create a group with the same name as the user
  -Z, --selinux-user SEUSER     use a specific SEUSER for the SELinux user mapping

`;
const USERMOD_USAGE=`Usage: usermod [options] LOGIN

Options:
  -b, --badname                 allow bad names
  -c, --comment COMMENT         new value of the GECOS field
  -d, --home HOME_DIR           new home directory for the user account
  -e, --expiredate EXPIRE_DATE  set account expiration date to EXPIRE_DATE
  -f, --inactive INACTIVE       set password inactive after expiration
                                to INACTIVE
  -g, --gid GROUP               force use GROUP as new primary group
  -G, --groups GROUPS           new list of supplementary GROUPS
  -a, --append                  append the user to the supplemental GROUPS
                                mentioned by the -G option without removing
                                the user from other groups
  -h, --help                    display this help message and exit
  -l, --login NEW_LOGIN         new value of the login name
  -L, --lock                    lock the user account
  -m, --move-home               move contents of the home directory to the
                                new location (use only with -d)
  -o, --non-unique              allow using duplicate (non-unique) UID
  -p, --password PASSWORD       use encrypted password for the new password
  -R, --root CHROOT_DIR         directory to chroot into
  -P, --prefix PREFIX_DIR       prefix directory where are located the /etc/* files
  -s, --shell SHELL             new login shell for the user account
  -u, --uid UID                 new UID for the user account
  -U, --unlock                  unlock the user account
  -v, --add-subuids FIRST-LAST  add range of subordinate uids
  -V, --del-subuids FIRST-LAST  remove range of subordinate uids
  -w, --add-subgids FIRST-LAST  add range of subordinate gids
  -W, --del-subgids FIRST-LAST  remove range of subordinate gids
  -Z, --selinux-user SEUSER     new SELinux user mapping for the user account

`;
B('[',c=>{ const a=c.argv.slice(1); if(a[a.length-1]!==']'){ c.err("bash: [: missing `]'\n"); return 2; } return testEval(c,a.slice(0,-1))?0:1; });
def('test','/usr/bin',c=>testEval(c,c.argv.slice(1))?0:1);

/* 実機にはあるが、画面だけでは扱いにくいコマンド。案内だけを出す */
const NOT_HERE={vi:'vi はエディタです。四択で操作を確認してください',vim:'vim はエディタです。四択で操作を確認してください',nano:'nano はエディタです',emacs:'emacs はエディタです',
  man:'man ページは表示できません。実機では man コマンド名 で開き、q で閉じます',info:'info は表示できません',top:'top は画面を更新し続けるコマンドです（実機では q で終了）',
  awk:'awk は扱いません',crontab:'crontab は四択で確認してください（実機では crontab -e で編集、-l で一覧）',at:'at は四択で確認してください',
  rpm:'パッケージ管理は四択で確認してください',dnf:'パッケージ管理は四択で確認してください',yum:'パッケージ管理は四択で確認してください',apt:'このドリルは RHEL 系なので apt はありません（Debian 系のコマンド）','apt-get':'このドリルは RHEL 系なので apt-get はありません',dpkg:'このドリルは RHEL 系なので dpkg はありません',
  mount:'mount は扱いません（四択で確認してください）',umount:'umount は扱いません',fdisk:'fdisk は扱いません',mkfs:'mkfs は扱いません',lsblk:'lsblk は扱いません',
  journalctl:'journalctl は四択で確認してください',ping:'ping はネットワークに出られないため扱いません',ssh:'ssh は扱いません（すでに server1 に ssh で接続している想定です）',scp:'scp は扱いません',
  curl:'curl はネットワークに出られないため扱いません',wget:'wget は扱いません',nmcli:'nmcli は扱いません',hostnamectl:'hostnamectl は四択で確認してください',timedatectl:'timedatectl は四択で確認してください',localectl:'localectl は扱いません',
  visudo:'visudo は扱いません（sudo の設定は /etc/sudoers を visudo で編集します）',locate:'locate は扱いません（事前に updatedb でデータベースを作るコマンドです）',updatedb:'updatedb は扱いません',
  shutdown:'shutdown は実行しません',reboot:'reboot は実行しません',nice:'nice は四択で確認してください',renice:'renice は四択で確認してください',jobs:'ジョブ制御（jobs、fg、bg）は四択で確認してください',fg:'ジョブ制御は四択で確認してください',bg:'ジョブ制御は四択で確認してください',
  diff:'diff は扱いません',lsof:'lsof は扱いません',uptime:'uptime は扱いません',w:'w は扱いません',last:'last は扱いません',newgrp:'newgrp は扱いません（グループの変更を反映するには、ログインし直すのが確実です）'};

/* ================= シミュレーター本体 ================= */
const ROOT_PATH='/root/.local/bin:/root/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin';
const SECURE_PATH='/sbin:/bin:/usr/sbin:/usr/bin';
const userPath=h=>`${h}/.local/bin:${h}/bin:/usr/local/bin:/usr/bin:/usr/local/sbin:/usr/sbin`;
/* パスワードの保存形式（練習用の簡易なハッシュ。実物は SHA-512 の crypt） */
function pwHash(pw,salt){ let h1=0x811c9dc5, h2=0x1234567; const s=salt+':'+pw; let out='';
  for(let r=0;r<6;r++){ for(let i=0;i<s.length;i++){ h1=Math.imul(h1^s.charCodeAt(i),16777619)>>>0; h2=Math.imul(h2+s.charCodeAt(i)+r,2246822519)>>>0; } out+=(h1.toString(36)+h2.toString(36)); }
  return `$6$${salt}$${out.slice(0,64)}`; }
const SALTS='Qx7rTn2Lm9WpZs4KvBc8YeHd';

class Sim{
  constructor(term){
    this.t=term||null; if(term) term.sim=this; this.onAfter=null; this.onTip=null; this.log=[];
    this.ttyOut={tty:true,write:s=>{ this.lineOut.out+=s; this.emit(s,''); }};
    this.ttyErr={tty:true,write:s=>{ this.lineOut.err+=s; this.emit(s,'err'); }};
    this.lineOut={out:'',err:''}; this.outBuf=[];
  }
  reset(P){
    this.P=P; this.base=Date.now(); this.loginAt=this.base-25*60000;
    this.fs=buildWorld(P,this);
    this.svcs=makeServices(this.base); this.extra=[]; this.pidSeq=4200; this.sudoOk={}; this.lectured={};
    this.shells=[]; const sh=this.makeShell('student',{login:true}); sh.pid=1505; this.shells.push(sh);
    this.buf=''; this.ask=null; this.queue=null; this.hist=[]; this.lastTab=null; this.depth=0;
    this.flags={mkdirs:[],ids:[],tars:[],untars:[],useradd:[],shells:[],lastStdout:'',lastStderr:'',lastStatus:0,scripts:[]};
    this.stats={cmds:0,errs:0}; this.outBuf=[];
    if(this.t){ this.t.clear(); this.refresh(); }
  }
  cur(){ return this.shells[this.shells.length-1]; }
  /* 見かけだけ大きいファイルの合計（KB）。df の使用量に足す */
  fakeKB(){ let t=0; const walk=n=>{ for(const v of n.kids.values()){ if(v.fake!=null) t+=Math.ceil(v.fake/1024); else if(v.type==='d') walk(v); } }; walk(this.fs.root); return t; }

  /* ---- ユーザー情報（/etc/passwd などのファイルが正本） ---- */
  etc(name){ const n=this.fs.get('/etc/'+name); return n?n.data.split('\n').filter(Boolean):[]; }
  setEtc(name,lines){ const n=this.fs.get('/etc/'+name); n.data=lines.map(l=>l+'\n').join(''); n.mtime=this.fs.now(); }
  users(){ return this.etc('passwd').map(l=>{ const f=l.split(':'); return {name:f[0],uid:+f[2],gid:+f[3],gecos:f[4]||'',home:f[5],shell:f[6]}; }); }
  groups(){ return this.etc('group').map(l=>{ const f=l.split(':'); return {name:f[0],gid:+f[2],members:f[3]?f[3].split(','):[]}; }); }
  user(n){ return this.users().find(u=>u.name===n)||null; }
  group(n){ return this.groups().find(g=>g.name===n)||null; }
  uname(uid){ const u=this.users().find(x=>x.uid===uid); return u?u.name:String(uid); }
  gname(gid){ const g=this.groups().find(x=>x.gid===gid); return g?g.name:String(gid); }
  /* ログインした時点の所属で権限が決まる。あとからグループを足しても、ログインし直すまでは反映されない */
  credOf(n){ const u=this.user(n); const gids=[u.gid,...this.groups().filter(g=>g.members.includes(n)&&g.gid!==u.gid).map(g=>g.gid)]; return {uid:u.uid,gid:u.gid,gids,name:n}; }
  addMember(g,u){ this.setEtc('group',this.etc('group').map(l=>{ const f=l.split(':'); if(f[0]!==g) return l; const m=f[3]?f[3].split(','):[]; if(!m.includes(u)) m.push(u); f[3]=m.join(','); return f.join(':'); })); }
  shadowOf(n){ return this.etc('shadow').find(l=>l.split(':')[0]===n)||`${n}:!!:::::::`; }
  editShadow(n,fn){ this.setEtc('shadow',this.etc('shadow').map(l=>{ const f=l.split(':'); if(f[0]===n) f[1]=fn(f[1]); return f.join(':'); })); }
  setPw(n,pw){ const salt=[...SALTS].sort(()=>Math.random()-.5).join('').slice(0,16); this.editShadow(n,()=>pwHash(pw,salt)); }
  lockPw(n,lock){ this.editShadow(n,h=>lock?(h.startsWith('!')?h:'!'+h):h.replace(/^!+/,'')); }
  pwOk(n,pw){ const h=this.shadowOf(n).split(':')[1]; if(!h||!h.startsWith('$6$')) return false; return h===pwHash(pw,h.split('$')[2]); }
  inSudoers(n){ return n==='root'||this.groups().some(g=>g.name==='wheel'&&g.members.includes(n)); }

  makeShell(user,{login=false,from=null,sudo=false,keepCred=null,io=null}={}){
    const u=this.user(user), sh=new Shell();
    /* RHEL 9 の既定の umask は root も一般ユーザーも 022（Rocky Linux 9 の実機で確認） */
    sh.user=user; sh.cred=keepCred||this.credOf(user); sh.umask=0o022;
    sh.vars=new Map(); sh.aliases=new Map();
    if(from&&!login&&!sudo){ for(const [k,v] of from.vars) sh.vars.set(k,{...v}); for(const [k,v] of from.aliases) sh.aliases.set(k,v); sh.umask=from.umask; }
    const X=(k,v)=>sh.vars.set(k,{v,x:true});
    if(login||sudo||!from){ X('PATH',sudo&&!login?SECURE_PATH:sh.cred.uid===0?ROOT_PATH:userPath(u.home)); X('LANG','C.UTF-8'); X('TERM','xterm-256color'); X('HOSTNAME',HOST); X('HISTSIZE','1000'); }
    /* su（- なし）は HOME や USER も元のユーザーのまま引き継ぐ（実機で確認） */
    if(!from||login||sudo){ X('HOME',u.home); X('USER',user); X('LOGNAME',user); X('SHELL',u.shell); X('MAIL','/var/spool/mail/'+user); }
    if(login||!from){ sh.aliases.set('ll','ls -l'); sh.aliases.set('l.','ls -d .*'); }
    sh.cwd=from&&!login?from.cwd:u.home;
    if(login&&!this.fs.get(u.home)){ sh.cwd='/'; if(io) io.stderr.write(`su: warning: cannot change directory to ${u.home}: No such file or directory\n`); }
    X('PWD',sh.cwd); sh.status=0; sh.pos=[]; sh.arg0='-bash'; sh.login=!!login; sh.pid=++this.pidSeq; sh.via=sudo?'sudo':from?'su':'login';
    return sh;
  }
  pushShell(sh){ this.shells.push(sh); this.flags.shells.push(sh.user); }
  popShell(){ this.shells.pop(); }
  which(name,sh){ for(const d of sh.get('PATH').split(':')){ if(!d) continue;
      try{ const r=this.fs.resolve(joinP(d,name),'/',sh.cred,true); if(r.node&&r.node.type==='f'&&this.fs.can(r.node,sh.cred,1)) return {node:r.node,path:joinP(d,name)}; }catch(e){ if(!(e instanceof FsErr)) throw e; } }
    return null; }

  /* ---- ファイルの作成と、リダイレクトの開き方 ---- */
  create(r,type,sh,mode){
    if(!this.fs.can(r.dir,sh.cred,2)) throw new FsErr('EACCES');
    const sgid=(r.dir.mode&0o2000)!==0;
    const base=type==='d'?0o777:0o666;
    const n=new Node(type,type==='l'?0o777:(mode!=null?mode:(base&~sh.umask))&0o7777,sh.cred.uid,sgid?r.dir.gid:sh.cred.gid,this.fs.now());
    if(type==='d'&&sgid) n.mode|=0o2000;   // SGID のディレクトリの下に作ったディレクトリは SGID を引き継ぐ
    this.fs.add(r.dir,r.name,n); return n;
  }
  openWrite(p,sh,append){
    const r=this.fs.resolve(p,sh.cwd,sh.cred,true); let n=r.node;
    if(n){ if(n.type==='d') throw new FsErr('EISDIR'); if(n.type==='c'||n.type==='b') return nullSink;
      if(!this.fs.can(n,sh.cred,2)) throw new FsErr('EACCES');
      if(!append){ n.data=''; n.bin=null; n.mtime=this.fs.now(); }   // > はコマンドの実行より前に中身を空にする
      return fileSink(this.fs,n); }
    return fileSink(this.fs,this.create(r,'f',sh));
  }
  readFor(p,sh){ const r=this.fs.resolve(p,sh.cwd,sh.cred,true); if(!r.node) throw new FsErr('ENOENT'); if(r.node.type==='d') throw new FsErr('EISDIR'); if(!this.fs.can(r.node,sh.cred,4)) throw new FsErr('EACCES'); return textOf(r.node); }

  /* ---- 実行 ---- */
  envOf(sh){ const sim=this; return {
    get:k=>{ if(k==='?') return String(sh.status); if(k==='$') return String(sh.pid); if(k==='#') return String(sh.pos.length); if(k==='0') return sh.arg0;
      if(/^\d$/.test(k)) return sh.pos[+k-1]??''; if(k==='@'||k==='*') return sh.pos.join(' '); if(k==='!'||k==='-') return ''; return sh.get(k); },
    pos:()=>sh.pos, homeOf:u=>{ const x=sim.user(u); return x?x.home:null; }, subst:src=>sim.capture(src,sh) }; }
  capture(src,sh){ const lx=lexShell(src); if(!lx.toks) return ''; const out=bufSink(); const sub=sh.fork(); sub.isSub=true;
    this.execList(parseShell(lx.toks),sub,{stdin:null,stdout:out,stderr:this.ttyErr}); sh.status=sub.status; return out.buf.replace(/\n+$/,''); }
  execList(items,sh,io){ let st=sh.status||0;
    for(const it of items){ if(it.op==='&&'&&st!==0) continue; if(it.op==='||'&&st===0) continue;
      st=this.execPipe(it.cmds,sh,io); sh.status=st; if(sh.exitReq!=null) break; }
    return st; }
  execPipe(cmds,sh,io){
    if(cmds.length===1) return this.execCmd(cmds[0],sh,io);
    let input=io.stdin, st=0;
    cmds.forEach((c,k)=>{ const last=k===cmds.length-1, out=last?io.stdout:bufSink();
      st=this.execCmd(c,sh.fork(),{stdin:input,stdout:out,stderr:io.stderr}); if(!last) input=out.buf; });
    return st; }
  execCmd(c,sh,io){
    let words=c.words;
    if(words.length&&/^[A-Za-z0-9_.:-]+$/.test(words[0])&&sh.aliases.has(words[0])){
      const lx=lexShell(sh.aliases.get(words[0])); if(lx.toks) words=[...lx.toks.filter(t=>t.t==='w').map(t=>t.raw),...words.slice(1)]; }
    const g={res:(p,f)=>this.fs.resolve(p,sh.cwd,sh.cred,f),fs:this.fs,cred:sh.cred};
    const env=this.envOf(sh);
    let k=0; while(k<words.length&&/^[A-Za-z_][A-Za-z0-9_]*=/.test(words[k])) k++;
    let argv, av;
    try{
      argv=words.slice(k).flatMap(braceExpand).flatMap(w=>expandWord(w,env)).flatMap(f=>globField(f,g));
      av=words.slice(0,k).map(a=>{ const p=a.indexOf('='); return [a.slice(0,p),expandOne(a.slice(p+1),env)]; });
    }catch(e){ if(e instanceof ShErr){ io.stderr.write(e.message+'\n'); return 1; } throw e; }
    const fds=[io.stdin,io.stdout,io.stderr];
    for(const r of c.redirs){
      if(r.op==='dup'){ fds[r.fd]=r.to==='-'?(r.fd===0?'':nullSink):fds[+r.to]; continue; }
      const t=expandWord(r.target,env).flatMap(f=>globField(f,g));
      if(t.length!==1){ fds[2].write(`bash: ${r.target}: ambiguous redirect\n`); return 1; }
      const p=t[0];
      try{
        if(r.op==='<'){ fds[r.fd??0]=this.readFor(p,sh); continue; }
        const s=this.openWrite(p,sh,r.op.endsWith('>>'));
        if(r.op.startsWith('&')){ fds[1]=s; fds[2]=s; } else fds[r.fd??1]=s;
      }catch(e){ if(e instanceof FsErr){ fds[2].write(`bash: ${p}: ${e.message}\n`); return 1; } throw e; }
    }
    if(!argv.length){ for(const [n,v] of av) sh.set(n,v); return 0; }
    return this.runArgv(argv,sh,{stdin:fds[0],stdout:fds[1],stderr:fds[2]},av,c);
  }
  /* コマンドを探して実行する。noBuiltin は sudo・find -exec・xargs から呼ぶとき（シェルの組み込みは使えない） */
  runArgv(argv,sh,io,av=[],cnode=null,noBuiltin=false){
    const name=argv[0];
    if(!noBuiltin&&BUILTIN[name]) return this.call(BUILTIN[name],name,argv,sh,io,av,cnode);
    let node, path;
    if(name.includes('/')){
      let r; try{ r=this.fs.resolve(name,sh.cwd,sh.cred,true); }catch(e){ if(!(e instanceof FsErr)) throw e; io.stderr.write(`bash: ${name}: ${e.message}\n`); return e.code==='EACCES'?126:127; }
      if(!r.node){ io.stderr.write(`bash: ${name}: No such file or directory\n`); return 127; }
      if(r.node.type==='d'){ io.stderr.write(`bash: ${name}: Is a directory\n`); return 126; }
      if(!this.fs.can(r.node,sh.cred,1)){ io.stderr.write(`bash: ${name}: Permission denied\n`); return 126; }
      node=r.node; path=r.abs;
    } else {
      const f=this.which(name,sh);
      if(!f){ io.stderr.write(`bash: ${name}: command not found\n`); return 127; }
      node=f.node; path=f.path;
    }
    if(node.bin&&node.bin.kind==='elf'){
      const impl=CMDS[node.bin.cmd];
      if(impl) return this.call(impl.fn,node.bin.cmd,argv,sh,io,av,cnode);
      this.note(`% ${node.bin.cmd} は実機にあるコマンドですが、このドリルでは実行できません。${NOT_HERE[node.bin.cmd]||''}`); this.flags.unsup=true; return 1;
    }
    if(node.bin){ io.stderr.write(`bash: ${name}: cannot execute binary file: Exec format error\n`); return 126; }
    if(!this.fs.can(node,sh.cred,4)){ io.stderr.write(`/bin/bash: ${name}: Permission denied\n`); return 126; }
    return this.runScript(textOf(node),name,argv,sh,io,av);
  }
  call(fn,name,argv,sh,io,av,cnode){
    const c=new Ctx(this,sh,argv,io,av,cnode,name);
    if(argv[1]==='--help'&&!BUILTIN[name]){ c.out(`Usage: ${name} [OPTION]... [FILE]...\n`); this.note('% このドリルでは --help の本文を省略しています。早見表のタブも使ってください'); return 0; }
    if(argv[1]==='--version'&&!BUILTIN[name]){ c.out(`${name} (GNU coreutils) 8.32\n`); return 0; }
    try{ const r=fn(c); return r==null?0:(r===true?0:r===false?1:r); }
    catch(e){
      if(e instanceof Usage||e instanceof ShErr){ io.stderr.write(e.message+'\n'); return e.code; }
      if(e instanceof FsErr){ io.stderr.write(`${name}: ${e.message}\n`); return 1; }
      if(e instanceof Unsup){ this.note(`% ${e.message}は、このドリルでは扱いません`); this.flags.unsup=true; return 1; }
      throw e; }
  }
  runScript(text,path,argv,sh,io,av=[]){
    const body=text.replace(/^#.*$/mg,'');
    if(/^\s*(if|for|while|until|case|function|then|do|done|fi|esac)\b/m.test(body)||/^\s*\w+\s*\(\)\s*\{/m.test(body)){
      this.note('% if・for などの制御構文を含むスクリプトは、このドリルでは実行できません（四択で確認してください）'); return 1; }
    if(++this.depth>20){ this.depth--; io.stderr.write('bash: maximum nested script depth exceeded\n'); return 1; }
    const sub=sh.fork(); sub.vars=new Map([...sh.vars].filter(([,v])=>v.x).map(([k,v])=>[k,{...v}])); for(const [k,v] of av) sub.vars.set(k,{v,x:true});
    sub.pos=argv.slice(1); sub.arg0=path; sub.aliases=new Map(); sub.status=0; sub.isScript=true; sub.exitReq=null;
    this.flags.scripts.push(path);
    let st;
    try{ const lx=lexShell(text);
      if(lx.incomplete){ io.stderr.write(`${path}: line ${text.split('\n').length}: unexpected EOF while looking for matching \`${lx.incomplete}'\n`); st=2; }
      else st=this.execList(parseShell(lx.toks),sub,io);
    }catch(e){ if(e instanceof ShErr){ io.stderr.write(`${path}: line 1: ${e.message.replace(/^bash: /,'')}\n`); st=2; } else { this.depth--; throw e; } }
    this.depth--;
    return sub.exitReq!=null?sub.exitReq:st;
  }
  /* 文字列をシェルとして実行する（su -c、bash -c、source、一問一答の準備で使う） */
  runIn(src,sh,io,inPlace=false){
    const lx=lexShell(src);
    if(lx.incomplete){ io.stderr.write(`bash: -c: line 1: unexpected EOF while looking for matching \`${lx.incomplete}'\n`); return 2; }
    let items; try{ items=parseShell(lx.toks); }catch(e){ if(e instanceof ShErr){ io.stderr.write(e.message+'\n'); return e.code; } throw e; }
    const s=inPlace?sh:sh; const st=this.execList(items,s,io); if(!inPlace) s.exitReq=null; return st;
  }
  /* 画面に出さずに実行する（問題の準備用）。user で実行者を選ぶ */
  silent(src,user='root'){ const sh=this.makeShell(user,{login:true}); const saved=this.lineOut; this.lineOut={out:'',err:''};
    const io={stdin:'',stdout:nullSink,stderr:bufSink()}; const st=this.runIn(src,sh,io); this.lineOut=saved;
    if(st!==0&&io.stderr.buf) console.warn('setup:',src,io.stderr.buf); return st; }

  /* ---- プロセスとサービス ---- */
  procList(sh){
    const hm=t=>{ const d=jst(t); return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`; };
    const boot=hm(this.base-3*3600000), login=hm(this.loginAt);
    const P=[];
    const add=(pid,ppid,uid,cmd,o={})=>P.push({pid,ppid,uid,cmd,name:o.name||cmd.replace(/^-/,'').split(' ')[0].split('/').pop().replace(/:$/,''),tty:o.tty||'?',stat:o.stat||'Ss',start:o.start||boot,cpu:o.cpu||'0.0',mem:o.mem||'0.1',vsz:o.vsz||20000+pid*13%90000,rss:o.rss||3000+pid*7%9000,time:o.time,...o});
    add(1,0,0,'/usr/lib/systemd/systemd --switched-root --system --deserialize 31',{name:'systemd',mem:'0.4',time:'00:00:02'});
    add(2,0,0,'[kthreadd]',{name:'kthreadd',stat:'S',vsz:0,rss:0});
    add(612,1,0,'/usr/lib/systemd/systemd-journald',{mem:'0.6'});
    for(const [name,s] of Object.entries(this.svcs)) if(s.active) for(const p of s.procs) add(p.pid,p.ppid||1,p.uid,p.cmd,{svc:name,stat:p.stat||'Ss',start:hm(s.since)});
    add(1500,this.svcs.sshd.active?this.svcs.sshd.pid:1,0,'sshd: student [priv]',{name:'sshd',start:login});
    add(1504,1500,1000,'sshd: student@pts/0',{name:'sshd',stat:'S',start:login});
    this.shells.forEach((s,k)=>{ if(k===0){ add(1505,1504,1000,'-bash',{name:'bash',tty:'pts/0',start:login,shell:s}); return; }
      const parent=k===1?1505:this.shells[k-1].pid;
      if(s.via==='bash') add(s.pid,parent,s.cred.uid,'bash',{tty:'pts/0',stat:'S',shell:s});
      else { add(s.pid-1000,parent,0,s.via==='sudo'?`sudo ${s.login?'-i':'-s'}`:`su ${s.login?'- ':''}${s.user}`,{tty:'pts/0',stat:'S+'}); add(s.pid,s.pid-1000,s.cred.uid,s.login?'-bash':'bash',{name:'bash',tty:'pts/0',stat:'S',shell:s}); } });
    for(const x of this.extra) add(x.pid,x.ppid||1505,x.uid,x.cmd,{tty:x.tty||'pts/0',stat:x.stat||'S',start:hm(x.since||this.base),cpu:x.cpu||'0.0',name:x.name,extra:x});
    const me=sh||this.cur();
    add(++this.pidSeq,me.pid,me.cred.uid,'ps',{tty:'pts/0',stat:'R+',start:hm(this.fs.now()),transient:true});
    return P;
  }
  signal(pid,sig,cred){
    const p=this.procList().find(x=>x.pid===pid&&!x.transient);
    if(!p) return 'No such process';
    if(cred.uid!==0&&p.uid!==cred.uid) return 'Operation not permitted';
    if([0,18,19,10,12].includes(sig)) return null;
    if(p.pid<=2) return null;
    if(p.shell){ if(sig===9) this.note('% ログイン中のシェルを強制終了すると接続が切れます。このドリルでは止めずに残しました'); return null; }
    if(p.svc){ if(sig===1) return null; this.setActive(p.svc,false); return null; }
    if(p.extra){ if(p.extra.ignoreTerm&&sig!==9) return null; this.extra=this.extra.filter(x=>x!==p.extra); this.flags.killed=(this.flags.killed||[]).concat([{pid,sig}]); return null; }
    return null;
  }
  setActive(u,on){ const s=this.svcs[u]; if(on&&!s.active){ s.active=true; s.since=this.fs.now(); s.pid=++this.pidSeq; s.procs=s.make(s.pid); } else if(!on){ s.active=false; s.procs=[]; } }

  /* ---- 画面への出力 ---- */
  emit(s,cls){ if(!s) return; const last=this.outBuf[this.outBuf.length-1]; if(last&&last.cls===cls) last.s+=s; else this.outBuf.push({s,cls}); }
  note(s){ this.emit(s+'\n','note'); }
  flush(){ for(const {s,cls} of this.outBuf){ const t=s.endsWith('\n')?s.slice(0,-1):s; this.print(t,cls); } this.outBuf=[]; }
  print(s,cls){ this.log.push(s); if(this.t) this.t.print(s,cls); }
  ttyWait(name){ if(this.ttyNoted) return; this.ttyNoted=true;
    this.note(`% ${name} は標準入力（キーボード）からの入力を待つ状態になります。実機では Ctrl+D で入力を終え、Ctrl+C で中断します。このドリルでは空の入力として扱いました`);
    if(this.onTip) this.onTip('stdin',name); }
  prompt(){ if(this.buf) return '> '; const sh=this.cur(); const home=sh.get('HOME');
    const w=sh.cwd===home?'~':sh.cwd==='/'?'/':basename(sh.cwd); return `[${sh.user}@${HOST} ${w}]${sh.cred.uid===0?'#':'$'} `; }
  refresh(){ if(!this.t) return; if(this.ask){ this.t.setPrompt(this.ask.text); this.t.setMask(!!this.ask.mask); } else { this.t.setPrompt(this.prompt()); this.t.setMask(false); } }
  after(){ this.refresh(); if(this.onAfter&&!this.ask&&!this.buf) this.onAfter(); }

  /* ---- 1 行の入力を受け取る ---- */
  submit(raw){
    if(this.ask){ const s=this.ask; this.ask=null; this.print(s.text,''); this.answer(s,raw); this.refresh(); return; }
    this.print(this.prompt()+raw,'');
    const src=this.buf+raw;
    if(!src.trim()){ this.buf=''; this.refresh(); return; }
    const lx=lexShell(src);
    if(lx.incomplete){ this.buf=src+'\n'; if(this.onTip) this.onTip('cont',lx.incomplete); this.refresh(); return; }
    this.buf=''; this.hist.push(src); this.stats.cmds++;
    this.runLine(lx.toks);
  }
  runLine(toks){
    let items;
    try{ items=parseShell(toks); }
    catch(e){ if(e instanceof ShErr){ this.emit(e.message+'\n','err'); this.cur().status=e.code; this.stats.errs++; this.flags.lastStatus=e.code; this.flags.lastStdout=''; this.flags.lastStderr=e.message; }
      else if(e instanceof Unsup){ this.note(`% ${e.message}は、このドリルでは扱いません`); this.flags.unsup=true; }
      else throw e;
      this.flush(); this.after(); return; }
    const steps=this.plan(items);
    if(steps.length){ this.queue={steps,items,k:0,skip:new Set()}; this.askNext(); return; }
    this.execTop(items);
  }
  execTop(items){
    const sh=this.cur(); this.lineOut={out:'',err:''}; this.ttyNoted=false; this.flags.unsup=false;
    let st;
    try{ st=this.execList(items,sh,{stdin:null,stdout:this.ttyOut,stderr:this.ttyErr}); }
    catch(e){
      if(e instanceof Unsup){ this.note(`% ${e.message}は、このドリルでは扱いません`); this.flags.unsup=true; st=1; }
      else if(e instanceof ShErr){ this.ttyErr.write(e.message+'\n'); st=e.code; }
      else { console.error(e); this.note('% ドリル内部のエラーです。この行は途中までしか実行されていない可能性があります'); this.flags.internal=e; st=1; } }
    sh.status=st; sh.exitReq=null;
    this.flags.lastStdout=this.lineOut.out; this.flags.lastStderr=this.lineOut.err; this.flags.lastStatus=st;
    /* 失敗として数えるのは、エラーの表示があり、終了ステータスも 0 以外のとき（systemctl enable のように、成功しても標準エラー出力に書くものがある） */
    if(this.lineOut.err&&st!==0) this.stats.errs++;
    if(this.clearReq){ this.clearReq=false; this.outBuf=[]; if(this.t) this.t.clear(); }
    this.flush(); this.after();
  }
  /* パスワードの入力が要るコマンド（sudo・su・passwd）は、実行の前にまとめて聞く */
  plan(items){
    const steps=[], sh=this.cur(); let sudoAsked=sh.cred.uid===0||!!this.sudoOk[sh.user];
    const dq=x=>x.replace(/^(['"])(.*)\1$/,'$2');
    /* 同じ行で先に useradd するユーザーは、passwd の時点ではいるものとして扱う（sudo useradd erin; sudo passwd erin） */
    const added=new Set();
    for(const it of items) for(const c of it.cmds){
      let w=c.words.map(dq);
      if(w.length&&sh.aliases.has(w[0])) w=[...sh.aliases.get(w[0]).split(/\s+/),...w.slice(1)];
      const body=w[0]==='sudo'?w.slice(w.findIndex((x,k)=>k>0&&!x.startsWith('-')&&w[k-1]!=='-u')):w;
      if(body[0]==='useradd'&&body.length>1) added.add(body[body.length-1]);
      if(w[0]==='sudo'){
        let i=1; while(i<w.length&&w[i].startsWith('-')){ if(w[i]==='-u') i++; i++; }
        if(w.length===2&&w[1]==='-k') continue;
        if(!sudoAsked&&w.length>1){ steps.push(this.sudoStep(c,sh)); sudoAsked=true; }
        if(w[i]==='passwd') steps.push(...this.passwdSteps(c,w.slice(i),ROOT,added));
        continue; }
      if(w[0]==='su'&&sh.cred.uid!==0){
        let user='root'; for(let k=1;k<w.length;k++){ if(w[k]==='-c'){ k++; continue; } if(!w[k].startsWith('-')){ user=w[k]; break; } }
        if(this.user(user)) steps.push({c,text:'Password: ',mask:true,run:ans=>{ c.pre={auth:this.pwOk(user,ans)}; this.flags.suTry=(this.flags.suTry||0)+1; }});
        continue; }
      if(w[0]==='passwd') steps.push(...this.passwdSteps(c,w,sh.cred,added));
    }
    return steps;
  }
  sudoStep(c,sh){ let tries=0;
    /* 初めて sudo を使うユーザーには、認証に成功するまで注意書きを出す（sudo 1.9.17 の実機の表示） */
    const lecture=this.lectured[sh.user]?null:'\nWe trust you have received the usual lecture from the local System\nAdministrator. It usually boils down to these three things:\n\n    #1) Respect the privacy of others.\n    #2) Think before you type.\n    #3) With great power comes great responsibility.\n\nFor security reasons, the password you type will not be visible.\n\n';
    return {c,header:lecture,text:`[sudo] password for ${sh.user}: `,mask:true,run:ans=>{
      if(this.pwOk(sh.user,ans)){ c.pre=Object.assign(c.pre||{},{auth:true}); this.sudoOk[sh.user]=true; this.lectured[sh.user]=true; return; }
      if(++tries<3){ this.emit('Sorry, try again.\n','err'); return 'again'; }
      c.pre=Object.assign(c.pre||{},{auth:false}); return 'abort'; }}; }
  passwdSteps(c,w,cred,added=new Set()){
    const args=w.slice(1); if(args.some(x=>x.startsWith('-'))) return [];
    const me=this.uname(cred.uid), target=args[0]||me;
    if(args[0]&&cred.uid!==0) return []; if(!this.user(target)&&!added.has(target)) return [];
    const pw={}; c.pre=Object.assign(c.pre||{},{pw}); const header=`Changing password for user ${target}.\n`; const steps=[];
    if(cred.uid!==0) steps.push({c,header,text:'Current password: ',mask:true,run:ans=>{ if(!this.pwOk(target,ans)){ pw.bad=true; return 'abort'; } }});
    /* 新しいパスワードは 3 回まで聞き直す。弱いパスワードは、一般ユーザーなら拒否、root なら警告だけ（pam_pwquality の実機の動き） */
    let tries=0, first=null;
    const weak=v=>v===''?'No password supplied':v.length<8?'The password is shorter than 8 characters':v.toLowerCase().includes(target.toLowerCase())?'The password contains the user name in some form':null;
    const fail=()=>{ if(++tries>=3){ pw.result='exhausted'; this.emit('passwd: Have exhausted maximum number of retries for service\n','err'); return 'abort'; } st.text='New password: '; return 'again'; };
    const st={c,header:cred.uid===0?header:null,text:'New password: ',mask:true,run:ans=>{
      if(st.text==='New password: '){
        const w=weak(ans);
        if(w){ this.emit(`BAD PASSWORD: ${w}\n`,''); if(cred.uid!==0) return fail(); }
        first=ans; st.text='Retype new password: '; return 'again'; }
      if(ans!==first){ this.emit('Sorry, passwords do not match.\n','err'); return fail(); }
      if(first===''){ pw.result='empty'; return; }
      pw.result='ok'; pw.n1=first; }};
    steps.push(st);
    return steps; }
  askNext(){
    const q=this.queue;
    while(q.k<q.steps.length&&q.skip.has(q.steps[q.k].c)) q.k++;
    if(q.k>=q.steps.length){ this.queue=null; this.flush(); this.execTop(q.items); return; }
    const s=q.steps[q.k]; if(s.header&&!s.shown){ s.shown=true; this.emit(s.header,''); this.flush(); }
    this.ask=s; this.refresh();
  }
  answer(s,line){ const q=this.queue; const r=s.run(line); this.flush();
    if(r==='again'){ this.ask=s; return; }
    if(r==='abort') q.skip.add(s.c);
    q.k++; this.askNext(); }
  ctrlC(text){
    if(this.ask){ this.print(this.ask.text,''); this.ask=null; this.queue=null; this.refresh(); this.after(); return; }
    this.print((this.buf?'> ':this.prompt())+(text||'')+'^C',''); this.buf=''; this.cur().status=130; this.refresh();
  }

  /* ---- Tab 補完。1 回目は共通部分まで、2 回目で候補の一覧 ---- */
  complete(text){
    if(this.ask) return null;
    const m=/([^\s|;&<>]*)$/.exec(text), word=m[1], head=text.slice(0,text.length-word.length);
    const seg=head.split(/[|;&]/).pop(), cmdPos=!seg.trim()||/^\s*sudo\s+$/.test(seg);
    const sh=this.cur(); let cands=[], dirPart='', base=word;
    if(cmdPos&&!word.includes('/')){
      const names=new Set([...Object.keys(BUILTIN),...sh.aliases.keys()]);
      for(const d of sh.get('PATH').split(':')){ const n=this.fs.get(d); if(n&&n.type==='d'&&this.fs.can(n,sh.cred,4)) for(const k of n.kids.keys()) names.add(k); }
      cands=[...names].filter(n=>n.startsWith(word)).sort(byteCmp).map(n=>({show:n,full:n,dir:false}));
    } else {
      const i=word.lastIndexOf('/'); dirPart=i<0?'':word.slice(0,i+1); base=word.slice(i+1);
      let dp=dirPart||'.'; if(dp.startsWith('~')) dp=sh.get('HOME')+dp.slice(1);
      let dn; try{ dn=this.fs.resolve(dp,sh.cwd,sh.cred,true).node; }catch(e){ dn=null; }
      if(dn&&dn.type==='d'&&this.fs.can(dn,sh.cred,4))
        cands=[...dn.kids].filter(([k])=>k.startsWith(base)&&(base.startsWith('.')||k[0]!=='.')).sort((a,b)=>byteCmp(a[0],b[0]))
          .map(([k,n])=>{ let isDir=n.type==='d'; if(n.type==='l'){ try{ const t=this.fs.resolve(joinP(dp,k),sh.cwd,sh.cred,true).node; isDir=!!t&&t.type==='d'; }catch(e){} } return {show:k+(isDir?'/':''),full:dirPart+k,dir:isDir}; });
    }
    if(!cands.length){ this.lastTab=null; return null; }
    if(cands.length===1){ this.lastTab=null; return head+cands[0].full+(cands[0].dir?'/':' '); }
    let pre=cands[0].full; for(const c of cands) while(!c.full.startsWith(pre)) pre=pre.slice(0,-1);
    if(pre.length>word.length){ this.lastTab=null; return head+pre; }
    if(this.lastTab===text){ this.print(this.prompt()+text,''); this.print(columns(cands.map(c=>c.show)).replace(/\n$/,''),''); this.lastTab=null; return null; }
    this.lastTab=text; return null;
  }
}

/* ================= 初期状態のファイルシステム ================= */
const SKEL={'.bash_logout':'# ~/.bash_logout\n\n',
  '.bash_profile':'# .bash_profile\n\n# Get the aliases and functions\nif [ -f ~/.bashrc ]; then\n\t. ~/.bashrc\nfi\n\n# User specific environment and startup programs\n',
  '.bashrc':'# .bashrc\n\n# Source global definitions\nif [ -f /etc/bashrc ]; then\n\t. /etc/bashrc\nfi\n\n# User specific aliases and functions\n'};
const SBIN=new Set(['fdisk','mkfs','visudo','shutdown','reboot']);
const SUID={passwd:0o4755,su:0o4755,sudo:0o4111,crontab:0o4755,mount:0o4755,umount:0o4755,at:0o4755,gpasswd:0o4755};
const SERVICES={
  sshd:{desc:'OpenSSH server daemon',bin:'sshd',preset:'enabled',on:true,docs:['man:sshd(8)','man:sshd_config(5)'],make:p=>[{pid:p,uid:0,cmd:'sshd: /usr/sbin/sshd -D [listener] 0 of 10-100 startups'}]},
  crond:{desc:'Command Scheduler',bin:'crond',preset:'enabled',on:true,make:p=>[{pid:p,uid:0,cmd:'/usr/sbin/crond -n'}]},
  chronyd:{desc:'NTP client/server',bin:'chronyd',preset:'enabled',on:true,make:p=>[{pid:p,uid:998,cmd:'/usr/sbin/chronyd -F 2',stat:'S'}]},
  rsyslog:{desc:'System Logging Service',bin:'rsyslogd',preset:'enabled',on:true,make:p=>[{pid:p,uid:0,cmd:'/usr/sbin/rsyslogd -n'}]},
  firewalld:{desc:'firewalld - dynamic firewall daemon',bin:'firewalld',preset:'enabled',on:true,make:p=>[{pid:p,uid:0,cmd:'/usr/bin/python3 -s /usr/sbin/firewalld --nofork --nopid'}]},
  httpd:{desc:'The Apache HTTP Server',bin:'httpd',preset:'disabled',on:false,docs:['man:httpd.service(8)'],make:p=>[{pid:p,uid:0,cmd:'/usr/sbin/httpd -DFOREGROUND'},{pid:p+1,ppid:p,uid:48,cmd:'/usr/sbin/httpd -DFOREGROUND',stat:'S'},{pid:p+2,ppid:p,uid:48,cmd:'/usr/sbin/httpd -DFOREGROUND',stat:'Sl'}]},
};
function makeServices(t){ const o={}; let pid=880;
  for(const [k,s] of Object.entries(SERVICES)){ pid+=7; o[k]={...s,active:s.on,since:t-3*3600000,pid:s.on?pid:null,procs:s.on?s.make(pid):[]}; }
  return o; }
const PASSWD_BASE=['root:x:0:0:root:/root:/bin/bash','bin:x:1:1:bin:/bin:/sbin/nologin','daemon:x:2:2:daemon:/sbin:/sbin/nologin','adm:x:3:4:adm:/var/adm:/sbin/nologin',
  'lp:x:4:7:lp:/var/spool/lpd:/sbin/nologin','sync:x:5:0:sync:/sbin:/bin/sync','shutdown:x:6:0:shutdown:/sbin:/sbin/shutdown','halt:x:7:0:halt:/sbin:/sbin/halt',
  'mail:x:8:12:mail:/var/spool/mail:/sbin/nologin','operator:x:11:0:operator:/root:/sbin/nologin','games:x:12:100:games:/usr/games:/sbin/nologin','ftp:x:14:50:FTP User:/var/ftp:/sbin/nologin',
  'nobody:x:65534:65534:Kernel Overflow User:/:/sbin/nologin','dbus:x:81:81:System message bus:/:/sbin/nologin','systemd-coredump:x:999:997:systemd Core Dumper:/:/sbin/nologin',
  'chrony:x:998:996:chrony system user:/var/lib/chrony:/sbin/nologin','sshd:x:74:74:Privilege-separated SSH:/usr/share/empty.sshd:/sbin/nologin','apache:x:48:48:Apache:/usr/share/httpd:/sbin/nologin',
  'student:x:1000:1000:student:/home/student:/bin/bash','guest:x:1001:1001::/home/guest:/bin/bash'];
function buildWorld(P,sim){
  inoSeq=33554500;
  const now=()=>Date.now(); const fs=new FS(now); const T=sim.base;
  const ago=d=>T-d*DAY-((d*3779)%600)*60000;
  /* 途中のディレクトリは root の 755 で作る */
  const put=(path,o={})=>{ const parts=path.split('/').filter(Boolean); let d=fs.root;
    parts.slice(0,-1).forEach(p=>{ let n=d.kids.get(p); if(!n){ n=new Node('d',0o755,0,0,ago(300)); fs.add(d,p,n); } d=n; });
    const name=parts[parts.length-1]; const old=d.kids.get(name); if(old) fs.drop(d,name);
    const type=o.type||(o.target!=null?'l':'f'); const n=new Node(type,o.mode??(type==='d'?0o755:type==='l'?0o777:0o644),o.uid??0,o.gid??0,o.t??ago(o.age??200));
    if(type==='f'){ n.data=o.data??''; n.bin=o.bin||null; } if(type==='l') n.target=o.target; if(o.dev) n.dev=o.dev;
    fs.add(d,name,n); return n; };
  const dir=(p,mode=0o755,uid=0,gid=0,age=300)=>put(p,{type:'d',mode,uid,gid,age});
  for(const d of ['boot','dev','etc','home','media','mnt','opt','proc','root','run','srv','tmp','usr','var','usr/bin','usr/sbin','usr/lib','usr/lib64','usr/local/bin','usr/local/sbin','usr/share','var/log','var/tmp','var/spool','var/www/html','etc/skel','etc/ssh','etc/systemd/system/multi-user.target.wants'])
    dir('/'+d,{tmp:0o1777,'var/tmp':0o1777,root:0o550,proc:0o555}[d]??0o755);
  fs.root.kids.get('proc').mode=0o555;
  for(const [l,t] of [['bin','usr/bin'],['sbin','usr/sbin'],['lib','usr/lib'],['lib64','usr/lib64']]) put('/'+l,{target:t,age:300});
  /* コマンドの実体 */
  for(const [n,c] of Object.entries(CMDS)) put(`${c.dir}/${n}`,{mode:SUID[n]??0o755,bin:{kind:'elf',cmd:n},age:120});
  for(const n of Object.keys(NOT_HERE)) if(!CMDS[n]) put(`${SBIN.has(n)?'/usr/sbin':'/usr/bin'}/${n}`,{mode:SUID[n]??0o755,bin:{kind:'elf',cmd:n},age:120});
  put('/usr/bin/[',{mode:0o755,bin:{kind:'elf',cmd:'test'},age:120});
  /* RHEL 系には、シェルの組み込みコマンドを呼ぶだけの小さなスクリプトが /usr/bin にある。
     そのため sudo cd はエラーにならないが、別のプロセスで移動するだけで、今のシェルの場所は変わらない */
  for(const n of ['cd','umask','alias','unalias','type']) put('/usr/bin/'+n,{mode:0o755,data:`#!/usr/bin/sh\nbuiltin ${n} "$@"\n`,age:400});
  for(const [k,s] of Object.entries(SERVICES)) put(`/usr/lib/systemd/system/${k}.service`,{data:`[Unit]\nDescription=${s.desc}\nAfter=network.target\n\n[Service]\nType=simple\nExecStart=/usr/sbin/${s.bin}\n\n[Install]\nWantedBy=multi-user.target\n`,age:120});
  for(const [k,s] of Object.entries(SERVICES)) if(s.on) put(`/etc/systemd/system/multi-user.target.wants/${k}.service`,{target:`/usr/lib/systemd/system/${k}.service`,age:150});
  /* /etc */
  const users=[...PASSWD_BASE];
  put('/etc/passwd',{data:users.map(l=>l+'\n').join(''),age:30});
  const groups=['root:x:0:','bin:x:1:','daemon:x:2:','sys:x:3:','adm:x:4:','tty:x:5:','disk:x:6:','lp:x:7:','mem:x:8:','kmem:x:9:','wheel:x:10:student','mail:x:12:','users:x:100:',
    'nobody:x:65534:','dbus:x:81:','systemd-coredump:x:997:','chrony:x:996:','sshd:x:74:','apache:x:48:','student:x:1000:','guest:x:1001:',`${P.group}:x:1100:student`];
  put('/etc/group',{data:groups.map(l=>l+'\n').join(''),age:30});
  const day=Math.floor(T/DAY)-30;
  const shadow=users.map(l=>{ const n=l.split(':')[0]; const h=n==='root'?pwHash(P.rootpw,'Rt0Pq8wLx2Vn5Kd1'):n==='student'?pwHash(P.stupw,'St9Hm3Jc6Fp1Qw4Z'):n==='guest'?'!!':'*'; return `${n}:${h}:${day}:0:99999:7:::`; });
  put('/etc/shadow',{data:shadow.map(l=>l+'\n').join(''),mode:0,age:30});
  put('/etc/gshadow',{data:groups.map(l=>`${l.split(':')[0]}:!::${l.split(':')[3]||''}\n`).join(''),mode:0,age:30});
  for(const [k,v] of Object.entries(SKEL)) put('/etc/skel/'+k,{data:v,age:300});
  put('/etc/hostname',{data:HOST+'\n'});
  put('/etc/hosts',{data:'127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4\n::1         localhost localhost.localdomain localhost6 localhost6.localdomain6\n192.168.10.20  server1\n192.168.10.30  db1\n'});
  put('/etc/resolv.conf',{data:'# Generated by NetworkManager\nsearch example.lan\nnameserver 192.168.10.1\n'});
  put('/etc/nsswitch.conf',{data:'passwd:     files\nshadow:     files\ngroup:      files\nhosts:      files dns myhostname\nservices:   files\n'});
  put('/etc/fstab',{data:'#\n# /etc/fstab\n#\n/dev/mapper/vg0-root   /       xfs     defaults        0 0\nUUID=6a1f3e2c-41d5-4c7e-9b1a-1f2d3c4b5a69 /boot xfs defaults 0 0\n/dev/mapper/vg0-swap   none    swap    defaults        0 0\n'});
  put('/etc/os-release',{data:'NAME="Practice Linux"\nVERSION="9.4"\nID="practice"\nID_LIKE="rhel centos fedora"\nVERSION_ID="9.4"\nPRETTY_NAME="Practice Linux 9.4（練習用の架空のディストリビューション）"\n'});
  put('/etc/services',{data:'# /etc/services excerpt\nftp-data        20/tcp\nftp             21/tcp\nssh             22/tcp          # The Secure Shell (SSH) Protocol\ntelnet          23/tcp\nsmtp            25/tcp          mail\ndomain          53/tcp          # name-domain server\ndomain          53/udp\nhttp            80/tcp          www www-http    # WorldWideWeb HTTP\npop3            110/tcp         pop-3           # POP version 3\nntp             123/udp                         # Network Time Protocol\nimap            143/tcp         imap2           # Interim Mail Access Proto v2\nsnmp            161/udp\nhttps           443/tcp                         # http protocol over TLS/SSL\nsubmission      587/tcp\nimaps           993/tcp\npop3s           995/tcp\n'});
  put('/etc/login.defs',{data:'MAIL_DIR\t/var/spool/mail\nPASS_MAX_DAYS\t99999\nPASS_MIN_DAYS\t0\nPASS_WARN_AGE\t7\nUID_MIN\t\t\t 1000\nUID_MAX\t\t\t60000\nGID_MIN\t\t\t 1000\nGID_MAX\t\t\t60000\nCREATE_HOME\tyes\nUMASK\t\t022\nUSERGROUPS_ENAB yes\nENCRYPT_METHOD SHA512\n'});
  put('/etc/crontab',{data:'SHELL=/bin/bash\nPATH=/sbin:/bin:/usr/sbin:/usr/bin\nMAILTO=root\n\n# Example of job definition:\n# .---------------- minute (0 - 59)\n# |  .------------- hour (0 - 23)\n# |  |  .---------- day of month (1 - 31)\n# |  |  |  .------- month (1 - 12) OR jan,feb,mar,apr ...\n# |  |  |  |  .---- day of week (0 - 6) (Sunday=0 or 7) OR sun,mon,tue,wed,thu,fri,sat\n# |  |  |  |  |\n# *  *  *  *  * user-name  command to be executed\n'});
  put('/etc/sudoers',{mode:0o440,data:'## Allows people in group wheel to run all commands\n%wheel\tALL=(ALL)\tALL\nroot\tALL=(ALL) \tALL\nDefaults    secure_path = /sbin:/bin:/usr/sbin:/usr/bin\n'});
  dir('/etc/sudoers.d',0o750);
  put('/etc/ssh/sshd_config',{mode:0o600,data:'#\t$OpenBSD: sshd_config,v 1.104 2021/07/02 05:11:21 dtucker Exp $\n\n# To modify the system-wide sshd configuration, create a  *.conf  file under\n#  /etc/ssh/sshd_config.d/  which will be automatically included below\nInclude /etc/ssh/sshd_config.d/*.conf\n\n#Port 22\n#ListenAddress 0.0.0.0\n\n#PermitRootLogin prohibit-password\n#PubkeyAuthentication yes\nAuthorizedKeysFile\t.ssh/authorized_keys\n\n#PasswordAuthentication yes\nUsePAM yes\nX11Forwarding yes\nSubsystem\tsftp\t/usr/libexec/openssh/sftp-server\n'});
  put('/etc/ssh/ssh_config',{data:'# ssh_config excerpt\nInclude /etc/ssh/ssh_config.d/*.conf\n#   Port 22\n'});
  dir('/etc/ssh/sshd_config.d',0o700); put('/etc/ssh/sshd_config.d/50-redhat.conf',{mode:0o600,data:'SyslogFacility AUTHPRIV\nChallengeResponseAuthentication no\n'});
  put('/etc/httpd/conf/httpd.conf',{data:'ServerRoot "/etc/httpd"\nListen 80\nUser apache\nGroup apache\nServerAdmin root@localhost\nDocumentRoot "/var/www/html"\nErrorLog "logs/error_log"\n'});
  put('/etc/chrony.conf',{data:'pool 2.pool.ntp.org iburst\ndriftfile /var/lib/chrony/drift\nmakestep 1.0 3\nrtcsync\n'});
  put('/etc/logrotate.conf',{data:'# rotate log files weekly\nweekly\n\n# keep 4 weeks worth of backlogs\nrotate 4\n\n# create new (empty) log files after rotating old ones\ncreate\n\ninclude /etc/logrotate.d\n'});
  put('/etc/rsyslog.conf',{data:'*.info;mail.none;authpriv.none;cron.none                /var/log/messages\nauthpriv.*                                              /var/log/secure\nmail.*                                                  -/var/log/maillog\ncron.*                                                  /var/log/cron\n'});
  put('/etc/ld.so.conf',{data:'include ld.so.conf.d/*.conf\n'});
  put('/etc/profile',{data:'# /etc/profile\n# System wide environment and startup programs, for login setup\n'});
  put('/etc/bashrc',{data:'# /etc/bashrc\n# System wide functions and aliases\n'});
  put('/etc/default/grub',{data:'GRUB_TIMEOUT=5\nGRUB_DEFAULT=saved\nGRUB_CMDLINE_LINUX="crashkernel=1G-4G:192M rd.lvm.lv=vg0/root rd.lvm.lv=vg0/swap"\n'});
  put('/etc/localtime',{target:'../usr/share/zoneinfo/Asia/Tokyo'}); put('/usr/share/zoneinfo/Asia/Tokyo',{data:'TZif2',age:300});
  /* /boot /dev /proc */
  put('/boot/vmlinuz-5.14.0-427.el9.x86_64',{mode:0o755,bin:{kind:'elf',cmd:'vmlinuz'},age:60});
  put('/boot/initramfs-5.14.0-427.el9.x86_64.img',{mode:0o600,data:'',bin:{kind:'gz',name:'',inner:{kind:'text',data:'x'.repeat(4000)}},age:60});
  dir('/boot/grub2',0o700); put('/boot/grub2/grub.cfg',{mode:0o600,data:'set default="0"\n'});
  for(const [n,dv,m,g] of [['null',[1,3],0o666,0],['zero',[1,5],0o666,0],['random',[1,8],0o666,0],['tty',[5,0],0o666,5],['sda',[8,0],0o660,6],['sda1',[8,1],0o660,6],['sda2',[8,2],0o660,6]])
    put('/dev/'+n,{type:n.startsWith('sda')?'b':'c',dev:dv,mode:m,gid:g,age:0});
  put('/proc/version',{mode:0o444,data:'Linux version 5.14.0-427.el9.x86_64 (mockbuild@practice) (gcc (GCC) 11.4.1) #1 SMP PREEMPT_DYNAMIC\n',age:0});
  put('/proc/cpuinfo',{mode:0o444,data:'processor\t: 0\nvendor_id\t: GenuineIntel\nmodel name\t: Intel(R) Xeon(R) CPU\ncpu cores\t: 2\n\nprocessor\t: 1\nvendor_id\t: GenuineIntel\nmodel name\t: Intel(R) Xeon(R) CPU\ncpu cores\t: 2\n',age:0});
  put('/proc/meminfo',{mode:0o444,data:'MemTotal:        3764292 kB\nMemFree:         2746828 kB\nMemAvailable:    3137276 kB\nSwapTotal:       2097148 kB\nSwapFree:        2097148 kB\n',age:0});
  put('/proc/partitions',{mode:0o444,data:'major minor  #blocks  name\n\n   8        0   20971520 sda\n   8        1    1048576 sda1\n   8        2   19921920 sda2\n',age:0});
  fs.get('/proc').mode=0o555;
  /* /root /var */
  for(const [k,v] of Object.entries(SKEL)) put('/root/'+k,{data:v,mode:0o644,age:300});
  put('/root/anaconda-ks.cfg',{mode:0o600,data:'#version=RHEL9\n',age:300});
  put('/var/log/messages',{mode:0o600,data:`${MON[jst(T).getUTCMonth()]} ${String(jst(T).getUTCDate()).padStart(2)} 09:00:01 server1 systemd[1]: Started Session 3 of User student.\n`,age:0});
  put('/var/log/secure',{mode:0o600,data:'sshd[1500]: Accepted password for student from 192.168.10.1 port 51022 ssh2\n',age:0});
  put('/var/log/cron',{mode:0o600,data:'',age:0});
  put('/var/log/dnf.log',{mode:0o644,data:'INFO --- logging initialized ---\n',age:3});
  dir('/var/log/httpd',0o700);
  dir('/var/spool/cron',0o700); dir('/var/spool/mail',0o775,0,12);
  put('/var/spool/mail/student',{mode:0o660,uid:1000,gid:12,age:60}); put('/var/spool/mail/guest',{mode:0o660,uid:1001,gid:12,age:40});
  put('/var/www/html/index.html',{data:'<h1>It works</h1>\n',age:10});
  /* ホームディレクトリ */
  dir('/home/guest',0o700,1001,1001,40); for(const [k,v] of Object.entries(SKEL)) put('/home/guest/'+k,{data:v,uid:1001,gid:1001,age:40});
  dir('/home/student',0o700,1000,1000,60);
  for(const [k,v] of Object.entries(SKEL)) put('/home/student/'+k,{data:v,uid:1000,gid:1000,age:60});
  for(const f of P.files){ if(f.type==='d') dir('/home/student/'+f.path,0o755,1000,1000,f.age??5); else put('/home/student/'+f.path,{data:f.data,uid:1000,gid:1000,mode:f.mode??0o644,age:f.age??5,t:f.t}); }
  /* /home/student 以下の中間ディレクトリは student のものにする */
  const fix=n=>{ for(const v of n.kids.values()){ if(v.type==='d'&&v.uid===0){ v.uid=1000; v.gid=1000; v.mode=0o755; } if(v.type==='d') fix(v); } };
  fix(fs.get('/home/student'));
  return fs;
}
