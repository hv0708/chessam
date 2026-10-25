/* CHESSAM · étape I — Auth minimal */
(function(){
  const cfg = window.CHESSAM_CONFIG;
  if(!cfg){ console.error('config.js missing'); return; }
  
  const supabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  let currentUser = null;

  const style = document.createElement('style');
  style.textContent = `
  #chessam-modal{position:fixed;inset:0;background:rgba(0,0,0,.85);display:none;place-items:center;z-index:9999}
  #chessam-modal.open{display:grid}
  #chessam-box{background:#111;border:1px solid #D4AF3755;border-radius:16px;padding:24px;width:90%;max-width:400px;color:white}
  #chessam-box input{width:100%;padding:12px;margin:8px 0;border-radius:8px;border:1px solid #333;background:#000;color:white}
  #chessam-box button{width:100%;padding:12px;margin-top:12px;border-radius:8px;border:0;font-weight:bold;cursor:pointer}
  .btn-gold{background:#D4AF37;color:black}
  .btn-orange{background:#FE7E3C;color:black}
  .btn-ghost{background:transparent;color:#aaa}
  #chessam-msg{font-size:13px;margin-top:8px;color:#FE7E3C}
  `;
  document.head.appendChild(style);

  const modal = document.createElement('div');
  modal.id = 'chessam-modal';
  modal.innerHTML = `
    <div id="chessam-box">
      <h2 id="chessam-title" style="color:#D4AF37;font-size:20px;font-weight:bold;margin-bottom:12px">Connexion</h2>
      <input id="ch-email" type="email" placeholder="Email" />
      <input id="ch-pass" type="password" placeholder="Mot de passe" />
      <div id="chessam-msg"></div>
      <button id="ch-action" class="btn-gold">Se connecter</button>
      <button id="ch-switch" class="btn-ghost">Pas de compte ? Créer un compte</button>
      <button id="ch-close" class="btn-ghost" style="margin-top:0">Fermer</button>
    </div>
  `;
  document.body.appendChild(modal);

  const emailEl = modal.querySelector('#ch-email');
  const passEl = modal.querySelector('#ch-pass');
  const msgEl = modal.querySelector('#chessam-msg');
  const actionBtn = modal.querySelector('#ch-action');
  const switchBtn = modal.querySelector('#ch-switch');
  const closeBtn = modal.querySelector('#ch-close');
  const titleEl = modal.querySelector('#chessam-title');

  let mode = 'login';
  function setMode(m){
    mode = m;
    if(m==='login'){
      titleEl.textContent='Connexion'; actionBtn.textContent='Se connecter'; actionBtn.className='btn-gold'; switchBtn.textContent="Pas de compte ? Créer un compte";
    }else{
      titleEl.textContent='Inscription'; actionBtn.textContent='Créer mon compte'; actionBtn.className='btn-orange'; switchBtn.textContent="Déjà un compte ? Se connecter";
    }
    msgEl.textContent='';
  }

  function open(m='login'){ setMode(m); modal.classList.add('open'); }
  function close(){ modal.classList.remove('open'); msgEl.textContent=''; }

  switchBtn.onclick = ()=> setMode(mode==='login'?'signup':'login');
  closeBtn.onclick = close;
  modal.onclick = (e)=>{ if(e.target===modal) close(); }

  async function handleAction(){
    const email = emailEl.value.trim();
    const pass = passEl.value.trim();
    if(!email || !pass){ msgEl.textContent='Email et mot de passe requis'; return; }
    actionBtn.disabled=true; msgEl.textContent='...';
    try{
      let res;
      if(mode==='login'){ res = await supabase.auth.signInWithPassword({email,password:pass}); }
      else{ res = await supabase.auth.signUp({email,password:pass}); }
      if(res.error) throw res.error;
      if(mode==='signup' && !res.data.session){ msgEl.textContent='Compte créé ! Vérifiez votre email.'; setTimeout(close,2000); }
      else { currentUser = res.data.user || res.data.session?.user; close(); window.dispatchEvent(new CustomEvent('chessam:auth',{detail:{user:currentUser}})); }
    }catch(err){ msgEl.textContent=err.message; }
    finally{ actionBtn.disabled=false; }
  }
  actionBtn.onclick = handleAction;

  supabase.auth.onAuthStateChange((_,session)=>{
    currentUser = session?.user || null;
    window.dispatchEvent(new CustomEvent('chessam:auth',{detail:{user:currentUser}}));
  });

  async function init(){
    const {data} = await supabase.auth.getSession();
    currentUser = data.session?.user || null;
  }
  init();

  window.ChessamAuth = {
    open, close,
    user:()=>currentUser,
    signOut: async ()=>{ await supabase.auth.signOut(); currentUser=null; window.dispatchEvent(new CustomEvent('chessam:auth',{detail:{user:null}})); },
    getSupabase:()=>supabase
  };
})();
