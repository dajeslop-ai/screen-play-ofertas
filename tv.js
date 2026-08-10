import { supabase } from "./supabase-client.js";
const $=(s)=>document.querySelector(s);
const pairView=$("#pairView"), emptyView=$("#emptyView"), offerView=$("#offerView"), pairingCode=$("#pairingCode"), pairStatus=$("#pairStatus");
const progressBar=$("#progressBar"), slideCounter=$("#slideCounter"), contentStage=$("#contentStage");
const tvBackground=$("#tvBackground"), floatingClock=$("#floatingClock"), tvClock=$("#tvClock"), tvDate=$("#tvDate");
const tvRecoveryCode=$("#tvRecoveryCode");
const tickerTrack=$("#tickerTrack"), tickerTextView=$("#tickerTextView"), tickerTextClone=$("#tickerTextClone");
const noticeScreen=$("#noticeScreen"), noticeImageFrame=$("#noticeImageFrame"), noticeImage=$("#noticeImage"), noticeTitle=$("#noticeTitle"), noticeDescription=$("#noticeDescription"), noticeCta=$("#noticeCta");
const summaryScreen=$("#summaryScreen"), summaryGrid=$("#summaryGrid"), offersWindow=$("#offersWindow");
const continuousCarouselHost=$("#continuousCarouselHost"), carouselPanelA=$("#carouselPanelA"), carouselPanelB=$("#carouselPanelB");
const cards=[1,2].map(n=>({card:$(`#offerCard${n}`),title:$(`#offerTitle${n}`),description:$(`#offerDescription${n}`),previous:$(`#previousPrice${n}`),current:$(`#currentPrice${n}`),saving:$(`#savingPrice${n}`),image:$(`#offerImage${n}`),prices:$(`#offerCard${n} .compact-prices`),savingBox:$(`#offerCard${n} .compact-saving`),frame:$(`#offerCard${n} .compact-image-frame`),renderToken:0}));
const DEVICE_KEY="publiScreen.deviceId";
let screen=null, playlist=[], presentationPages=[], currentPageIndex=0, timer=null, screenChannel=null, playlistChannel=null, noticeToken=0;
let activeCarouselPanel="A", carouselBusy=false;
function getDeviceId(){let id=localStorage.getItem(DEVICE_KEY);if(!id){id=crypto.randomUUID();localStorage.setItem(DEVICE_KEY,id)}return id}
function createPairCode(){return String(Math.floor(100000+Math.random()*900000))}
function updateRecoveryCode(){if(tvRecoveryCode&&screen?.pairing_code)tvRecoveryCode.textContent=screen.pairing_code}
function money(v){return new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"}).format(Number(v||0))}
function updateClock(){const now=new Date();tvClock.textContent=new Intl.DateTimeFormat("es-MX",{hour:"2-digit",minute:"2-digit"}).format(now);tvDate.textContent=new Intl.DateTimeFormat("es-MX",{weekday:"short",day:"numeric",month:"short"}).format(now)}
function applyDisplaySettings() {
  const settings = screen?.display_settings || {};

  const presetUrls = {
    "clasico": "theme-clasico.png",
    "vacaciones": "theme-vacaciones.png",
    "regreso-clases": "theme-regreso-clases.png",
    "fiestas-patrias": "theme-fiestas-patrias.png",
    "halloween": "theme-halloween.png",
    "dia-muertos": "theme-dia-muertos.png",
    "navidad": "theme-navidad.png"
  };

  const mode = settings.background_mode ||
    (settings.background_url ? "image" : "preset");

  tvBackground.style.backgroundImage = "";
  tvBackground.style.backgroundColor = "";
  tvBackground.classList.remove("has-background");

  if (mode === "preset") {
    const preset = settings.background_preset || "clasico";
    const url = presetUrls[preset] || presetUrls.clasico;
    tvBackground.style.backgroundImage = `url("${url}")`;
    tvBackground.classList.add("has-background");
  } else if (mode === "image" && settings.background_url) {
    tvBackground.style.backgroundImage = `url("${settings.background_url}")`;
    tvBackground.classList.add("has-background");
  } else if (mode === "solid") {
    tvBackground.style.backgroundColor = settings.background_color || "#073b7a";
  } else if (mode === "gradient") {
    const c1 = settings.gradient_color_1 || "#123f91";
    const c2 = settings.gradient_color_2 || "#5b21b6";
    const direction = settings.gradient_direction || "135deg";
    tvBackground.style.backgroundImage =
      `linear-gradient(${direction}, ${c1}, ${c2})`;
  } else {
    tvBackground.style.backgroundImage = `url("${presetUrls.clasico}")`;
    tvBackground.classList.add("has-background");
  }

  floatingClock.classList.toggle("hidden", settings.show_clock === false);

  const text = settings.ticker_text ||
    "GRANDES OFERTAS TODOS LOS DÍAS • ACEPTAMOS TARJETAS • PREGUNTA POR NUESTRO CLUB DE PUNTOS";

  tickerTextView.textContent = text;
  tickerTextClone.textContent = text;
  tickerTrack.dataset.direction = settings.ticker_direction || "left";
  tickerTrack.dataset.speed = settings.ticker_speed || "normal";

  const transition = settings.transition_style || "fade";
  const transitionClasses = [
    "transition-fade",
    "transition-slide-left",
    "transition-slide-right",
    "transition-zoom-in",
    "transition-zoom-out",
    "transition-rise",
    "transition-drop",
    "transition-carousel",
    "transition-continuous-carousel"
  ];

  contentStage.classList.remove(...transitionClasses);
  offersWindow.classList.remove(...transitionClasses);
  contentStage.classList.add(`transition-${transition}`);

  tickerTrack.classList.remove("running");
  void tickerTrack.offsetWidth;
  tickerTrack.classList.add("running");
}


function buildPresentationPages(items){
  const settings=screen?.display_settings||{};
  const notices=items.filter(i=>i.content_type==="notice");
  const offers=items.filter(i=>i.content_type!=="notice");
  const pages=[];
  const noticeDuration=Math.max(3,Number(settings.notice_duration||10));
  const summaryDuration=Math.max(3,Number(settings.summary_duration||8));
  const offersDuration=Math.max(3,Number(settings.offers_duration||10));
  const summaryEnabled=settings.summary_enabled!==false;

  notices.forEach(item=>pages.push({
    type:"notice",
    item,
    duration:noticeDuration
  }));

  for(let i=0;i<offers.length;i+=6){
    const group=offers.slice(i,i+6);

    if(summaryEnabled){
      pages.push({
        type:"summary",
        items:group,
        duration:summaryDuration
      });
    }

    for(let j=0;j<group.length;j+=2){
      pages.push({
        type:"offers",
        items:group.slice(j,j+2),
        duration:offersDuration
      });
    }
  }
  return pages;
}
function hide(el){el.classList.add("hidden");el.hidden=true;el.style.setProperty("display","none","important")}
function show(el){el.classList.remove("hidden");el.hidden=false;el.style.removeProperty("display")}
function hideAll(){hide(noticeScreen);hide(summaryScreen);hide(offersWindow)}
function resetCard(c){c.renderToken++;hide(c.card);c.title.textContent="";c.description.textContent="";c.previous.textContent="";c.current.textContent="";c.saving.textContent="";show(c.prices);show(c.savingBox);c.frame.classList.remove("no-media");hide(c.image);c.image.classList.remove("changing");c.image.removeAttribute("src")}
function fillOffer(c,item){resetCard(c);if(!item)return;const token=++c.renderToken;show(c.card);c.title.textContent=item.title||"Producto";c.description.textContent=item.description||"";c.previous.textContent=money(item.previous_price);c.current.textContent=money(item.current_price);c.saving.textContent=money(Math.max(Number(item.previous_price)-Number(item.current_price),0));if(!item.media_url){c.frame.classList.add("no-media");return}show(c.image);c.image.classList.add("changing");const im=new Image();im.onload=()=>{if(c.renderToken!==token)return;c.image.src=item.media_url;c.image.classList.remove("changing")};im.onerror=()=>{if(c.renderToken!==token)return;hide(c.image);c.frame.classList.add("no-media")};im.src=item.media_url}
function renderNotice(item){hideAll();show(noticeScreen);const token=++noticeToken;noticeTitle.textContent=item.title||"Aviso";noticeDescription.textContent=item.description||"";noticeCta.textContent=item.cta_text||"MÁS INFORMACIÓN";hide(noticeImage);noticeImage.removeAttribute("src");noticeImageFrame.classList.remove("no-media");if(!item.media_url){noticeImageFrame.classList.add("no-media");return}const im=new Image();im.onload=()=>{if(noticeToken!==token)return;noticeImage.src=item.media_url;show(noticeImage)};im.onerror=()=>{if(noticeToken!==token)return;noticeImageFrame.classList.add("no-media")};im.src=item.media_url}
function esc(v){return String(v||"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[ch])}
function renderSummary(items){hideAll();show(summaryScreen);summaryGrid.innerHTML="";items.forEach(item=>{const save=Math.max(Number(item.previous_price||0)-Number(item.current_price||0),0);const card=document.createElement("article");card.className="summary-offer-card";card.innerHTML=`<div class="summary-image-frame">${item.media_url?`<img src="${esc(item.media_url)}" alt="">`:""}</div><div class="summary-card-copy"><h3>${esc(item.title||"Producto")}</h3><div class="summary-price-line"><span class="summary-before">${money(item.previous_price)}</span><strong>${money(item.current_price)}</strong></div><small>AHORRAS ${money(save)}</small></div>`;summaryGrid.appendChild(card)})}
function playTransition(){
  contentStage.classList.remove("transition-active");
  void contentStage.offsetWidth;
  contentStage.classList.add("transition-active");
}
function renderPair(items){
  hideAll();
  show(offersWindow);
  resetCard(cards[0]);
  resetCard(cards[1]);
  fillOffer(cards[0],items[0]);
  fillOffer(cards[1],items[1]);
  offersWindow.classList.toggle("single-offer",items.length===1);
}

function currentTransitionStyle(){return screen?.display_settings?.transition_style||"fade"}

function renderPageWithoutAnimation(page){
  if(page.type==="notice")renderNotice(page.item);
  else if(page.type==="summary")renderSummary(page.items);
  else renderPair(page.items);
}

function snapshotStage(){
  const clone=contentStage.cloneNode(true);
  clone.removeAttribute("id");
  clone.classList.remove("transition-active");
  clone.style.visibility="";
  clone.querySelectorAll("[id]").forEach(n=>n.removeAttribute("id"));
  return clone.outerHTML;
}

async function pageSnapshot(page){
  renderPageWithoutAnimation(page);
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  return snapshotStage();
}

async function startContinuousCarousel(){
  continuousCarouselHost.classList.remove("hidden");
  continuousCarouselHost.hidden=false;
  contentStage.style.visibility="hidden";
  carouselPanelA.innerHTML=await pageSnapshot(presentationPages[currentPageIndex]);
  carouselPanelB.innerHTML="";
  carouselPanelA.className="carousel-panel is-active";
  carouselPanelB.className="carousel-panel";
  activeCarouselPanel="A";
  slideCounter.textContent=`${currentPageIndex+1} / ${presentationPages.length}`;
}

async function advanceContinuousCarousel(){
  if(carouselBusy||presentationPages.length<2)return;
  carouselBusy=true;
  const nextIndex=(currentPageIndex+1)%presentationPages.length;
  const incoming=activeCarouselPanel==="A"?carouselPanelB:carouselPanelA;
  const outgoing=activeCarouselPanel==="A"?carouselPanelA:carouselPanelB;
  incoming.innerHTML=await pageSnapshot(presentationPages[nextIndex]);

  outgoing.className="carousel-panel is-active";
  incoming.className="carousel-panel is-next";
  void continuousCarouselHost.offsetWidth;
  outgoing.classList.add("move-out");
  incoming.classList.add("move-in");

  await new Promise(r=>setTimeout(r,900));

  outgoing.innerHTML="";
  outgoing.className="carousel-panel";
  incoming.className="carousel-panel is-active";
  activeCarouselPanel=activeCarouselPanel==="A"?"B":"A";
  currentPageIndex=nextIndex;
  slideCounter.textContent=`${currentPageIndex+1} / ${presentationPages.length}`;
  carouselBusy=false;
}

function scheduleCarousel(){
  clearTimeout(timer);
  const page=presentationPages[currentPageIndex];
  const d=Math.max(3,Number(page?.duration||8));
  progressBar.style.animation="none";
  void progressBar.offsetWidth;
  progressBar.style.animation=`progress ${d}s linear forwards`;
  timer=setTimeout(async()=>{
    await advanceContinuousCarousel();
    scheduleCarousel();
  },d*1000);
}

function renderCurrentPage(){
  clearTimeout(timer);
  if(!presentationPages.length)return;
  if(currentPageIndex>=presentationPages.length)currentPageIndex=0;
  const mode=currentTransitionStyle();

  if(mode==="continuous-carousel"&&presentationPages.length>1){
    carouselBusy=false;
    startContinuousCarousel().then(scheduleCarousel);
    return;
  }

  continuousCarouselHost.classList.add("hidden");
  continuousCarouselHost.hidden=true;
  contentStage.style.visibility="";
  const page=presentationPages[currentPageIndex];
  renderPageWithoutAnimation(page);
  playTransition();
  slideCounter.textContent=`${currentPageIndex+1} / ${presentationPages.length}`;
  const d=Math.max(3,Number(page.duration||8));
  progressBar.style.animation="none";
  void progressBar.offsetWidth;
  progressBar.style.animation=`progress ${d}s linear forwards`;
  timer=setTimeout(()=>{
    currentPageIndex=(currentPageIndex+1)%presentationPages.length;
    renderCurrentPage();
  },d*1000);
}
async function registerScreen(){
  const params=new URLSearchParams(window.location.search);
  const isPreview=params.get("preview")==="1";
  const previewScreenId=params.get("screen");
  const previewToken=params.get("token");

  if(isPreview && previewScreenId && previewToken){
    const {data,error}=await supabase
      .from("screens")
      .select("*")
      .eq("id",previewScreenId)
      .eq("control_token",previewToken)
      .maybeSingle();

    if(error)throw error;
    if(!data)throw new Error("No se pudo abrir la vista previa.");

    screen=data;
    pairView.classList.add("hidden");
    await enterLinkedMode();
    subscribeScreen();
    document.body.classList.add("preview-tv");
    return;
  }

  const deviceId=getDeviceId();
  const {data:existing}=await supabase
    .from("screens")
    .select("*")
    .eq("device_id",deviceId)
    .maybeSingle();

  if(existing)screen=existing;
  else{
    const {data,error}=await supabase
      .from("screens")
      .insert({
        device_id:deviceId,
        pairing_code:createPairCode(),
        is_linked:false,
        last_seen:new Date().toISOString()
      })
      .select()
      .single();
    if(error)throw error;
    screen=data;
  }

  updateRecoveryCode();
  if(screen.is_linked)await enterLinkedMode();
  else showPairing();
  subscribeScreen();
}
function showPairing(){clearTimeout(timer);updateRecoveryCode();pairView.classList.remove("hidden");emptyView.classList.add("hidden");offerView.classList.add("hidden");pairingCode.textContent=screen.pairing_code;pairStatus.textContent="Esperando conexión…"}
async function enterLinkedMode(){pairView.classList.add("hidden");applyDisplaySettings();await loadPlaylist();subscribePlaylist()}
async function loadPlaylist(){const {data,error}=await supabase.from("screen_playlist_items").select("*").eq("screen_id",screen.id).eq("is_active",true).order("position",{ascending:true}).order("created_at",{ascending:true});if(error){console.error(error);return}playlist=data||[];presentationPages=buildPresentationPages(playlist);if(!presentationPages.length){clearTimeout(timer);currentPageIndex=0;hideAll();emptyView.classList.remove("hidden");offerView.classList.add("hidden");return}if(currentPageIndex>=presentationPages.length)currentPageIndex=0;emptyView.classList.add("hidden");offerView.classList.remove("hidden");renderCurrentPage()}
function subscribeScreen(){
  screenChannel?.unsubscribe();
  screenChannel=supabase
    .channel(`screen-${screen.id}`)
    .on(
      "postgres_changes",
      {event:"UPDATE",schema:"public",table:"screens",filter:`id=eq.${screen.id}`},
      async({new:updated})=>{
        screen=updated;
        updateRecoveryCode();
        applyDisplaySettings();

        if(!updated.is_linked){
          const params=new URLSearchParams(window.location.search);
          if(params.get("preview")!=="1") showPairing();
          return;
        }

        presentationPages=buildPresentationPages(playlist);
        if(currentPageIndex>=presentationPages.length)currentPageIndex=0;
        if(presentationPages.length) renderCurrentPage();
      }
    )
    .subscribe()
}
function subscribePlaylist(){playlistChannel?.unsubscribe();playlistChannel=supabase.channel(`playlist-${screen.id}`).on("postgres_changes",{event:"*",schema:"public",table:"screen_playlist_items",filter:`screen_id=eq.${screen.id}`},loadPlaylist).subscribe()}
updateClock();setInterval(updateClock,1000);registerScreen().catch(e=>{console.error(e);pairStatus.textContent=`Error de conexión: ${e.message}`});
