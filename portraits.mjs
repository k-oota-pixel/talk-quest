const ages=['young','adult','senior'];
const genders=['woman','man'];
const groups=['white','asian','african-american'];
export const PORTRAIT_IDS=ages.flatMap(age=>genders.flatMap(gender=>groups.map(group=>`${age}-${gender}-${group}`)));

const skin={
  white:['#f1c2a2','#d99b78'],
  asian:['#e8b68f','#cd8d69'],
  'african-american':['#9a5d3d','#74402b']
};
const hair={white:'#5a392b',asian:'#24211f','african-american':'#2a211e'};
const cloth={
  young:{woman:['#4c9290','#327674'],man:['#d89d28','#b67716']},
  adult:{woman:['#c8654e','#a74937'],man:['#448a8e','#2e6d72']},
  senior:{woman:['#8fa67c','#6f895f'],man:['#557db1','#3c6598']}
};

function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
function parse(id){
  if(!PORTRAIT_IDS.includes(id))throw new Error(`Unknown portrait: ${id}`);
  const [age,gender,...rest]=id.split('-');
  return {age,gender,group:rest.join('-')};
}
function curls(color,silver=false){
  const fill=silver?'#d8d4cc':color;
  const pts=[[116,86],[138,62],[166,52],[194,50],[223,54],[250,70],[270,96],[105,116],[127,104],[153,92],[181,86],[211,88],[239,99],[273,122]];
  return pts.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i%3===0?27:24}" fill="${fill}"/>`).join('');
}
function hairBack({age,gender,group}){
  const c=age==='senior'?'#d4d1ca':hair[group];
  if(group==='african-american')return `<g>${curls(c,age==='senior')}</g>`;
  if(gender==='woman'){
    if(age==='young')return `<path d="M91 174C78 92 116 43 188 42c78-3 119 48 105 141-9-35-20-69-52-91-31-22-77-26-112 3-22 18-32 47-38 79z" fill="${c}"/><path d="M96 142c-7 51 5 99 35 127l24-35c-22-26-30-58-24-96zM288 142c7 51-5 99-35 127l-24-35c22-26 30-58 24-96z" fill="${c}"/>`;
    if(age==='adult')return `<path d="M86 180C70 98 107 43 181 39c83-5 130 46 120 141-16-38-38-77-75-94-42-18-88-8-113 25-15 20-20 44-27 69z" fill="${c}"/><path d="M89 145c-10 58 5 111 42 140l28-36c-27-30-36-65-29-108zM295 145c10 58-5 111-42 140l-28-36c27-30 36-65 29-108z" fill="${c}"/>`;
    return `<path d="M90 169c-10-78 32-125 102-126 73-2 113 45 105 126-24-44-54-67-103-67-49 0-81 23-104 67z" fill="${c}"/>${curls(c,true)}`;
  }
  if(age==='young')return `<path d="M102 132c-8-55 29-94 89-95 61 0 98 36 92 92-24-34-50-48-91-48-42 0-66 16-90 51z" fill="${c}"/>${group==='white'?'<path d="M124 70c25-28 62-36 91-20-31 2-56 16-74 39z" fill="#734a32"/>':''}`;
  if(age==='adult')return `<path d="M101 126c-4-55 33-88 91-88 59 0 94 31 91 85-23-28-49-42-90-42-41 0-68 14-92 45z" fill="${c}"/>`;
  return `<path d="M102 128c-3-52 33-87 90-87 56 0 92 31 90 83-22-27-48-40-90-40-41 0-67 13-90 44z" fill="#cfcac1"/>`;
}
function hairFront({age,gender,group}){
  const c=age==='senior'?'#d4d1ca':hair[group];
  if(group==='african-american')return '';
  if(gender==='woman'){
    if(age==='young')return `<path d="M107 113c20-57 69-74 119-55 26 10 43 30 52 57-25-18-48-31-79-32-34-2-61 9-92 30z" fill="${c}"/><path d="M128 78c23 12 38 33 42 61-15-20-30-31-55-38z" fill="${c}" opacity=".88"/>`;
    if(age==='adult')return `<path d="M101 110c31-63 87-76 137-50 21 11 35 30 42 54-28-20-54-31-89-30-34 0-59 9-90 26z" fill="${c}"/><path d="M154 57c-13 31-35 50-66 61 14-34 35-55 66-61z" fill="${c}" opacity=".9"/>`;
    return `<path d="M104 111c25-51 72-70 121-52 28 10 47 29 55 55-28-18-56-27-90-26-34 1-57 9-86 23z" fill="${c}"/>`;
  }
  return `<path d="M109 101c25-45 69-60 113-46 26 8 45 25 56 48-29-14-54-21-86-20-32 0-56 7-83 18z" fill="${c}"/>`;
}
function faceDetails({age,gender,group}){
  const eye=group==='asian'?6:7;
  const lines=age==='senior'?`<path d="M132 164q16 8 31 0M221 164q16 8 31 0M149 221q43 18 86 0" fill="none" stroke="#a96f58" stroke-width="2" opacity=".42"/><path d="M143 142q16-11 33-2M208 140q18-10 35 2" fill="none" stroke="#9c735f" stroke-width="2" opacity=".35"/>`:age==='adult'?`<path d="M137 168q12 5 24 0M225 168q12 5 24 0" fill="none" stroke="#a96f58" stroke-width="1.7" opacity=".3"/>`:'';
  const glasses=gender==='man'&&age==='adult'?`<g fill="none" stroke="#3b342e" stroke-width="5"><circle cx="150" cy="154" r="31"/><circle cx="234" cy="154" r="31"/><path d="M181 154h22M119 148l-26-6M265 148l26-6"/></g>`:'';
  const beard=gender==='man'&&age==='senior'?`<path d="M132 218c8 48 34 71 60 71s53-23 61-71c-15 22-35 34-61 34s-46-12-60-34z" fill="#d4d1ca" opacity=".96"/><path d="M158 220q34 25 68 0" fill="none" stroke="#88786d" stroke-width="5"/>`:'';
  return `${lines}<path d="M130 142q20-14 40-3M214 139q20-11 41 4" fill="none" stroke="#5b4035" stroke-width="5" stroke-linecap="round"/><ellipse cx="150" cy="158" rx="17" ry="12" fill="#fffaf4"/><ellipse cx="234" cy="158" rx="17" ry="12" fill="#fffaf4"/><circle cx="150" cy="158" r="${eye}" fill="#3a2b26"/><circle cx="234" cy="158" r="${eye}" fill="#3a2b26"/><circle cx="148" cy="155" r="2" fill="#fff"/><circle cx="232" cy="155" r="2" fill="#fff"/><path d="M192 164q-8 24 5 31" fill="none" stroke="#b77b61" stroke-width="3" stroke-linecap="round"/><path d="M151 214q41 29 82 0" fill="none" stroke="#934f47" stroke-width="6" stroke-linecap="round"/>${glasses}${beard}`;
}
export function portraitDataUri(id){
  const meta=parse(id),[base,shadow]=skin[meta.group],[top,bottom]=cloth[meta.age][meta.gender];
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 384" role="img" aria-label="Friendly illustrated conversation partner"><defs><radialGradient id="bg" cx="50%" cy="35%"><stop offset="0" stop-color="#fffdf7"/><stop offset="1" stop-color="#f6efdf"/></radialGradient><linearGradient id="shirt" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient><filter id="soft"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#775f48" flood-opacity=".14"/></filter></defs><rect width="384" height="384" fill="url(#bg)"/>${hairBack(meta)}<path d="M109 384c6-73 39-111 83-111s77 38 83 111z" fill="url(#shirt)"/><path d="M166 244h52v60h-52z" fill="${base}"/><ellipse cx="99" cy="168" rx="17" ry="27" fill="${shadow}"/><ellipse cx="285" cy="168" rx="17" ry="27" fill="${shadow}"/><ellipse cx="192" cy="161" rx="92" ry="111" fill="${base}" filter="url(#soft)"/>${hairFront(meta)}${faceDetails(meta)}<path d="M147 276q45 24 90 0" fill="none" stroke="#ffffff" stroke-width="7" opacity=".55"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
