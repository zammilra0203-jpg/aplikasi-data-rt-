/* RT SMART Google Drive appDataFolder sync; no photo compression. */
(()=>{'use strict';
const KEY='rt-smart-drive-meta-v2';let token='',tokenClient=null,busy=false,timer=0;
const meta=()=>JSON.parse(localStorage.getItem(KEY)||'{}');const setMeta=o=>localStorage.setItem(KEY,JSON.stringify({...meta(),...o}));
const status=s=>{const e=document.getElementById('driveSyncStatus');if(e)e.textContent=s};
const client=()=>window.RT_GOOGLE_CLIENT_ID||'';
function auth(){return new Promise((resolve,reject)=>{if(!window.google?.accounts?.oauth2)return reject(Error('Google Sign-In belum termuat. Gunakan HTTPS dan internet.'));if(!client()||client().startsWith('GANTI'))return reject(Error('Penjual belum mengisi OAuth Client ID pada google-config.js'));tokenClient=google.accounts.oauth2.initTokenClient({client_id:client(),scope:'https://www.googleapis.com/auth/drive.appdata',callback:r=>{if(r.error)reject(Error(r.error));else{token=r.access_token;resolve(token)}}});tokenClient.requestAccessToken({prompt:token?'':'consent'})})}
async function api(url,options={}){if(!token)throw Error('Hubungkan Google terlebih dahulu');let r=await fetch(url,{...options,headers:{Authorization:'Bearer '+token,...options.headers}});if(!r.ok){let e=await r.text();if(r.status===401)token='';throw Error('Google Drive '+r.status+': '+e.slice(0,240))}return r}
async function locate(){let q=encodeURIComponent("name = 'rt-smart-premium-data.json' and trashed = false");let r=await api('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name,modifiedTime),nextPageToken&q='+q);let d=await r.json();return d.files?.[0]||null}
async function read(f){let r=await api('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(f.id)+'?alt=media');return r.json()}
async function write(f,data){let body=JSON.stringify({version:4,created:new Date().toISOString(),data});if(!f){const boundary='rtSmartBoundary'+Date.now();const multipart='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify({name:'rt-smart-premium-data.json',parents:['appDataFolder'],mimeType:'application/json'})+'\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n'+body+'\r\n--'+boundary+'--';let r=await api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body:multipart});return r.json()}let r=await api('https://www.googleapis.com/upload/drive/v3/files/'+f.id+'?uploadType=media&fields=id,modifiedTime',{method:'PATCH',headers:{'Content-Type':'application/json'},body});return r.json()}

// Three-way merge using last synced snapshot; divergent edits to the same record stop sync.
// NOTE: Google Drive appDataFolder is not a transactional multiwriter database.
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function merge(base,local,remote){
 const result={}; const conflicts=[];
 for(const store of STORE){
  const b=new Map((base?.[store]||[]).map(x=>[x.id,x]));
  const l=new Map((local?.[store]||[]).map(x=>[x.id,x]));
  const r=new Map((remote?.[store]||[]).map(x=>[x.id,x]));
  const merged=[];
  for(const id of new Set([...b.keys(),...l.keys(),...r.keys()])){
   const old=b.get(id),lv=l.get(id),rv=r.get(id);
   const lc=!same(old,lv),rc=!same(old,rv);
   if(lc&&rc&&!same(lv,rv)){conflicts.push(store+':'+id);continue}
   const selected=lc?lv:rv;
   if(selected!==undefined)merged.push(selected);
  }
  result[store]=merged;
 }
 return {result,conflicts};
}
const snapKey='rt-smart-last-synced-v2';
function getBase(){try{return JSON.parse(localStorage.getItem(snapKey)||'null')}catch{return null}}
function setBase(data){try{localStorage.setItem(snapKey,JSON.stringify(data))}catch(e){status('Penyimpanan snapshot penuh; sinkronisasi berikutnya memerlukan pemeriksaan manual.')}}

async function apply(data){if(!data||!STORE.every(s=>Array.isArray(data[s])))throw Error('Data cloud tidak sesuai');for(const name of STORE){await new Promise((resolve,reject)=>{const t=db.transaction(name,'readwrite');t.objectStore(name).clear();for(const x of data[name])t.objectStore(name).put(x);t.oncomplete=resolve;t.onerror=()=>reject(t.error)})}await refresh()}
async function sync(){
 if(busy||!token)return;
 busy=true;status('Memeriksa Google Drive…');
 try{
  const f=await locate(),m=meta(),dirty=!!m.dirty;
  if(!f){
   if(STORE.some(s=>state[s].length)){
    const w=await write(null,state);setBase(state);
    setMeta({fileId:w.id,version:w.modifiedTime,dirty:false});
    status('✓ Data dan foto asli dikirim ke Google Drive');
   }else status('Drive kosong. Tambahkan data untuk memulai.');
   return;
  }
  const cloud=await read(f);
  if(!cloud?.data||!STORE.every(s=>Array.isArray(cloud.data[s])))throw Error('Format data cloud tidak sesuai');
  const base=getBase();
  // If there is no baseline, never silently merge unknown unrelated datasets.
  if(!base){
   if(STORE.some(s=>state[s].length)){
    status('⚠ Ada data lokal dan cloud yang belum pernah disatukan. Unduh backup terlebih dahulu, lalu pulihkan pada perangkat baru yang kosong.');
    return;
   }
   await apply(cloud.data);setBase(cloud.data);setMeta({fileId:f.id,version:f.modifiedTime,dirty:false});
   status('✓ Data dan foto asli diterima dari Google Drive');return;
  }
  const {result,conflicts}=merge(base,state,cloud.data);
  if(conflicts.length){
   status('⚠ Konflik pada '+conflicts.length+' catatan. Backup kedua perangkat sebelum memilih perubahan. Tidak ada data ditimpa.');
   return;
  }
  const remoteChanged=!same(result,cloud.data);
  if(remoteChanged){
   // Check immediately before upload. This reduces (but cannot eliminate) races.
   const latest=await locate();
   if(latest?.modifiedTime!==f.modifiedTime){status('⚠ Cloud berubah saat sinkronisasi. Coba Sinkronkan Sekarang.');return}
   const w=await write(f,result);
   await apply(result);setBase(result);setMeta({fileId:f.id,version:w.modifiedTime,dirty:false});
   status('✓ Perubahan dari semua perangkat digabungkan dan disimpan');
  }else{
   if(!same(state,result))await apply(result);
   setBase(result);setMeta({fileId:f.id,version:f.modifiedTime,dirty:false});
   status(dirty?'✓ Perubahan sudah tersinkron':'✓ Semua perangkat sinkron');
  }
 }catch(e){status('Gagal sinkronisasi: '+e.message)}finally{busy=false}
}
window.rtDriveDirty=()=>{setMeta({dirty:true});clearTimeout(timer);timer=setTimeout(()=>{if(token)sync()},2500)};
async function connect(){try{status('Menghubungkan akun Google…');await auth();status('Google terhubung. Menyinkronkan…');await sync()}catch(e){status(e.message)}}
document.addEventListener('click',e=>{if(e.target?.id==='driveConnect')connect();if(e.target?.id==='driveSyncNow')token?sync():connect();if(e.target?.id==='driveDownload')download('rt-smart-salinan-asli-'+new Date().toISOString().slice(0,10)+'.json',new Blob([JSON.stringify({version:4,created:new Date().toISOString(),data:state})],{type:'application/json'}))});
setInterval(()=>{if(token&&navigator.onLine)sync()},45000);
window.addEventListener('online',()=>{if(token)sync()});
})();