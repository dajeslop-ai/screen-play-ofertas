import { supabase } from "./supabase-client.js";
import { MEDIA_BUCKET } from "./config.js";

const $ = (selector) => document.querySelector(selector);

const pairSection = $("#pairSection");
const offerSection = $("#offerSection");
const listSection = $("#listSection");
const pairForm = $("#pairForm");
const pairCode = $("#pairCode");
const pairMessage = $("#pairMessage");
const connectionBadge = $("#connectionBadge");
const offerForm = $("#offerForm");
const offerMessage = $("#offerMessage");
const contentTypeInput = $("#contentType");
const titleLabel = $("#titleLabel");
const titleInput = $("#title");
const descriptionInput = $("#description");
const previousPriceInput = $("#previousPrice");
const currentPriceInput = $("#currentPrice");
const priceFields = $("#priceFields");
const ctaField = $("#ctaField");
const ctaTextInput = $("#ctaText");
const mediaLabel = $("#mediaLabel");
const mediaInput = $("#media");
const durationInput = $("#duration");
const imagePreview = $("#imagePreview");
const previewImage = $("#previewImage");
const saveButton = $("#saveButton");
const offersList = $("#offersList");
const offerCount = $("#offerCount");
const unlinkButton = $("#unlinkButton");
const appearanceSection = $("#appearanceSection");
const appearanceForm = $("#appearanceForm");
const appearanceMessage = $("#appearanceMessage");
const backgroundInput = $("#backgroundInput");
const backgroundPreview = $("#backgroundPreview");
const backgroundPreviewImage = $("#backgroundPreviewImage");
const tickerTextInput = $("#tickerText");
const tickerDirectionInput = $("#tickerDirection");
const tickerSpeedInput = $("#tickerSpeed");
const showClockInput = $("#showClock");
const transitionStyleInput = $("#transitionStyle");
const saveAppearanceButton = $("#saveAppearanceButton");
const summaryEnabledInput = $("#summaryEnabled");
const noticeDurationInput = $("#noticeDuration");
const summaryDurationInput = $("#summaryDuration");
const offersDurationInput = $("#offersDuration");
const openPreviewButton = $("#openPreviewButton");
const previewModal = $("#previewModal");
const closePreviewButton = $("#closePreviewButton");
const tvPreviewFrame = $("#tvPreviewFrame");
const backgroundModeInput = $("#backgroundMode");
const presetBackgroundPanel = $("#presetBackgroundPanel");
const imageBackgroundPanel = $("#imageBackgroundPanel");
const solidBackgroundPanel = $("#solidBackgroundPanel");
const gradientBackgroundPanel = $("#gradientBackgroundPanel");
const presetThemeCards = [...document.querySelectorAll(".preset-theme-card")];
const solidColorInput = $("#solidColor");
const solidColorTextInput = $("#solidColorText");
const gradientColor1Input = $("#gradientColor1");
const gradientColor2Input = $("#gradientColor2");
const gradientDirectionInput = $("#gradientDirection");
const backgroundPreviewPlaceholder = $("#backgroundPreviewPlaceholder");

let linkedScreen = null;
let previewUrl = null;
let backgroundPreviewUrl = null;
let selectedPresetTheme = "clasico";

function showMessage(element, text, type = "success") {
  element.textContent = text;
  element.className = `message ${type}`;
}

function clearMessage(element) {
  element.textContent = "";
  element.className = "message hidden";
}

function money(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
  }).format(Number(value || 0));
}

function saveSession(screen) {
  localStorage.setItem("publiScreen.screen", JSON.stringify({
    id: screen.id,
    control_token: screen.control_token
  }));
}

function readSession() {
  try {
    return JSON.parse(localStorage.getItem("publiScreen.screen") || "null");
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem("publiScreen.screen");
}

async function restoreSession() {
  const session = readSession();
  if (!session?.id || !session?.control_token) return;

  const { data } = await supabase
    .from("screens")
    .select("*")
    .eq("id", session.id)
    .eq("control_token", session.control_token)
    .maybeSingle();

  if (data?.is_linked) {
    linkedScreen = data;
    showLinkedUI();
    loadAppearanceIntoForm();
    await loadOffers();
  } else {
    clearSession();
  }
}

function showLinkedUI() {
  pairSection.classList.add("hidden");
  offerSection.classList.remove("hidden");
  listSection.classList.remove("hidden");
  appearanceSection.classList.remove("hidden");
  connectionBadge.textContent = "TV vinculada";
  connectionBadge.classList.add("connected");
}

function showUnlinkedUI() {
  pairSection.classList.remove("hidden");
  offerSection.classList.add("hidden");
  listSection.classList.add("hidden");
  appearanceSection.classList.add("hidden");
  connectionBadge.textContent = "Sin TV vinculada";
  connectionBadge.classList.remove("connected");
}

pairForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage(pairMessage);

  const code = pairCode.value.replace(/\D/g, "").slice(0, 6);
  if (code.length !== 6) {
    showMessage(pairMessage, "Escribe los seis dígitos de la televisión.", "error");
    return;
  }

  const token = crypto.randomUUID();

  const { data, error } = await supabase
    .from("screens")
    .update({
      is_linked: true,
      control_token: token,
      linked_at: new Date().toISOString()
    })
    .eq("pairing_code", code)
    .select()
    .maybeSingle();

  if (error || !data) {
    showMessage(pairMessage, "Código no encontrado. Verifica el Código TV que aparece en la esquina de la televisión.", "error");
    return;
  }

  linkedScreen = data;
  saveSession(data);
  showLinkedUI();
  loadAppearanceIntoForm();
  await loadOffers();
  showMessage(pairMessage, "TV vinculada. El control de la cartelera fue recuperado correctamente.");
});


function getDisplaySettings() {
  return linkedScreen?.display_settings || {};
}

const PRESET_THEME_URLS = {
  "clasico": "theme-clasico.png",
  "vacaciones": "theme-vacaciones.png",
  "regreso-clases": "theme-regreso-clases.png",
  "fiestas-patrias": "theme-fiestas-patrias.png",
  "halloween": "theme-halloween.png",
  "dia-muertos": "theme-dia-muertos.png",
  "navidad": "theme-navidad.png"
};

function normalizeBackgroundMode(settings) {
  if (settings.background_mode) return settings.background_mode;
  if (settings.background_url) return "image";
  return "preset";
}

function setPresetTheme(theme) {
  selectedPresetTheme = PRESET_THEME_URLS[theme] ? theme : "clasico";
  presetThemeCards.forEach((card) => {
    card.classList.toggle("selected", card.dataset.theme === selectedPresetTheme);
  });
}

function updateBackgroundPanels() {
  const mode = backgroundModeInput.value;
  presetBackgroundPanel.classList.toggle("hidden", mode !== "preset");
  imageBackgroundPanel.classList.toggle("hidden", mode !== "image");
  solidBackgroundPanel.classList.toggle("hidden", mode !== "solid");
  gradientBackgroundPanel.classList.toggle("hidden", mode !== "gradient");
  updateBackgroundPreview();
}

function updateBackgroundPreview() {
  const mode = backgroundModeInput.value;
  backgroundPreview.style.backgroundImage = "";
  backgroundPreview.style.backgroundColor = "";
  backgroundPreviewImage.classList.add("hidden");
  backgroundPreviewPlaceholder.classList.add("hidden");

  if (mode === "preset") {
    backgroundPreviewImage.src = PRESET_THEME_URLS[selectedPresetTheme] || PRESET_THEME_URLS.clasico;
    backgroundPreviewImage.classList.remove("hidden");
    return;
  }

  if (mode === "image") {
    const file = backgroundInput.files?.[0];
    if (file && backgroundPreviewUrl) {
      backgroundPreviewImage.src = backgroundPreviewUrl;
      backgroundPreviewImage.classList.remove("hidden");
      return;
    }

    const settings = getDisplaySettings();
    if (settings.background_url) {
      backgroundPreviewImage.src = settings.background_url;
      backgroundPreviewImage.classList.remove("hidden");
      return;
    }

    backgroundPreviewPlaceholder.classList.remove("hidden");
    return;
  }

  if (mode === "solid") {
    backgroundPreview.style.backgroundColor = solidColorInput.value || "#073b7a";
    return;
  }

  if (mode === "gradient") {
    const c1 = gradientColor1Input.value || "#123f91";
    const c2 = gradientColor2Input.value || "#5b21b6";
    const direction = gradientDirectionInput.value || "135deg";
    backgroundPreview.style.backgroundImage = `linear-gradient(${direction}, ${c1}, ${c2})`;
  }
}

function loadAppearanceIntoForm() {
  const settings = getDisplaySettings();

  tickerTextInput.value = settings.ticker_text ||
    "GRANDES OFERTAS TODOS LOS DÍAS • ACEPTAMOS TARJETAS • PREGUNTA POR NUESTRO CLUB DE PUNTOS";
  tickerDirectionInput.value = settings.ticker_direction || "left";
  tickerSpeedInput.value = settings.ticker_speed || "normal";
  if (transitionStyleInput) transitionStyleInput.value = settings.transition_style || "fade";
  summaryEnabledInput.checked = settings.summary_enabled !== false;
  noticeDurationInput.value = String(settings.notice_duration || 10);
  summaryDurationInput.value = String(settings.summary_duration || 8);
  offersDurationInput.value = String(settings.offers_duration || 10);
  showClockInput.checked = settings.show_clock !== false;

  const mode = normalizeBackgroundMode(settings);
  backgroundModeInput.value = mode;

  setPresetTheme(settings.background_preset || "clasico");

  solidColorInput.value = settings.background_color || "#073b7a";
  solidColorTextInput.value = solidColorInput.value;
  gradientColor1Input.value = settings.gradient_color_1 || "#123f91";
  gradientColor2Input.value = settings.gradient_color_2 || "#5b21b6";
  gradientDirectionInput.value = settings.gradient_direction || "135deg";

  updateBackgroundPanels();
}

backgroundModeInput.addEventListener("change", updateBackgroundPanels);

presetThemeCards.forEach((card) => {
  card.addEventListener("click", () => {
    setPresetTheme(card.dataset.theme);
    updateBackgroundPreview();
  });
});

backgroundInput.addEventListener("change", () => {
  const file = backgroundInput.files?.[0];
  if (backgroundPreviewUrl) URL.revokeObjectURL(backgroundPreviewUrl);
  backgroundPreviewUrl = file ? URL.createObjectURL(file) : null;
  updateBackgroundPreview();
});

solidColorInput.addEventListener("input", () => {
  solidColorTextInput.value = solidColorInput.value;
  updateBackgroundPreview();
});

solidColorTextInput.addEventListener("input", () => {
  const value = solidColorTextInput.value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    solidColorInput.value = value;
    updateBackgroundPreview();
  }
});

gradientColor1Input.addEventListener("input", updateBackgroundPreview);
gradientColor2Input.addEventListener("input", updateBackgroundPreview);
gradientDirectionInput.addEventListener("change", updateBackgroundPreview);

async function uploadBackground(file) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${linkedScreen.id}/backgrounds/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type
    });

  if (error) throw error;

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

appearanceForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage(appearanceMessage);

  if (!linkedScreen) {
    showMessage(appearanceMessage, "Primero vincula una televisión.", "error");
    return;
  }

  saveAppearanceButton.disabled = true;
  saveAppearanceButton.textContent = "Guardando…";

  try {
    const current = getDisplaySettings();
    const mode = backgroundModeInput.value;

    let backgroundUrl = current.background_url || "";
    let backgroundPath = current.background_path || "";

    if (mode === "image") {
      const file = backgroundInput.files?.[0];
      if (file) {
        const uploaded = await uploadBackground(file);
        backgroundUrl = uploaded.url;
        backgroundPath = uploaded.path;
      }

      if (!backgroundUrl) {
        throw new Error("Selecciona una imagen personalizada.");
      }
    }

    const displaySettings = {
      background_mode: mode,
      background_preset: selectedPresetTheme,
      background_url: backgroundUrl,
      background_path: backgroundPath,
      background_color: solidColorInput.value || "#073b7a",
      gradient_color_1: gradientColor1Input.value || "#123f91",
      gradient_color_2: gradientColor2Input.value || "#5b21b6",
      gradient_direction: gradientDirectionInput.value || "135deg",
      ticker_text: tickerTextInput.value.trim() || "GRANDES OFERTAS TODOS LOS DÍAS",
      ticker_direction: tickerDirectionInput.value,
      ticker_speed: tickerSpeedInput.value,
      transition_style: transitionStyleInput?.value || current.transition_style || "fade",
      summary_enabled: summaryEnabledInput.checked,
      notice_duration: Number(noticeDurationInput.value || 10),
      summary_duration: Number(summaryDurationInput.value || 8),
      offers_duration: Number(offersDurationInput.value || 10),
      show_clock: showClockInput.checked
    };

    const { data, error } = await supabase
      .from("screens")
      .update({ display_settings: displaySettings })
      .eq("id", linkedScreen.id)
      .eq("control_token", linkedScreen.control_token)
      .select()
      .single();

    if (error) throw error;

    linkedScreen = data;
    saveSession(data);
    backgroundInput.value = "";
    if (backgroundPreviewUrl) {
      URL.revokeObjectURL(backgroundPreviewUrl);
      backgroundPreviewUrl = null;
    }

    loadAppearanceIntoForm();
    showMessage(appearanceMessage, "Apariencia actualizada en la TV.");
  } catch (error) {
    console.error(error);
    showMessage(appearanceMessage, `No se pudo guardar: ${error.message}`, "error");
  } finally {
    saveAppearanceButton.disabled = false;
    saveAppearanceButton.textContent = "Guardar apariencia";
  }
});

function updateContentTypeUI() {
  const isNotice = contentTypeInput.value === "notice";
  titleLabel.textContent = isNotice ? "Título del aviso" : "Producto";
  titleInput.placeholder = isNotice ? "Ej. ÚNETE AL CLUB DE PUNTOS" : "Ej. Coca-Cola";
  descriptionInput.placeholder = isNotice ? "Ej. Compra, registra y gana beneficios" : "Ej. Paquete de 2 botellas de 2.5 L";
  priceFields.classList.toggle("hidden", isNotice);
  ctaField.classList.toggle("hidden", !isNotice);
  previousPriceInput.required = !isNotice;
  currentPriceInput.required = !isNotice;
  ctaTextInput.required = isNotice;
  mediaInput.required = !isNotice;
  mediaLabel.textContent = isNotice ? "Imagen del aviso (opcional)" : "Imagen del producto";
  saveButton.textContent = isNotice ? "Guardar aviso" : "Guardar oferta";
}
contentTypeInput.addEventListener("change", updateContentTypeUI);
updateContentTypeUI();


function previewUrl() {
  if (!linkedScreen?.id || !linkedScreen?.control_token) return "";
  const url = new URL("tv.html", window.location.href);
  url.searchParams.set("preview", "1");
  url.searchParams.set("screen", linkedScreen.id);
  url.searchParams.set("token", linkedScreen.control_token);
  return url.toString();
}

function openTvPreview() {
  if (!linkedScreen) {
    showMessage(appearanceMessage, "Primero vincula una televisión.", "error");
    return;
  }
  const url = previewUrl();
  if (!url) return;
  tvPreviewFrame.src = url;
  previewModal.classList.remove("hidden");
  document.body.classList.add("preview-open");
}

function closeTvPreview() {
  previewModal.classList.add("hidden");
  document.body.classList.remove("preview-open");
  tvPreviewFrame.src = "about:blank";
}

openPreviewButton?.addEventListener("click", openTvPreview);
closePreviewButton?.addEventListener("click", closeTvPreview);
previewModal?.addEventListener("click", (event) => {
  if (event.target === previewModal) closeTvPreview();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !previewModal.classList.contains("hidden")) {
    closeTvPreview();
  }
});

mediaInput.addEventListener("change", () => {
  const file = mediaInput.files?.[0];
  if (previewUrl) URL.revokeObjectURL(previewUrl);

  if (!file) {
    previewImage.classList.add("hidden");
    imagePreview.classList.add("empty");
    return;
  }

  previewUrl = URL.createObjectURL(file);
  previewImage.src = previewUrl;
  previewImage.classList.remove("hidden");
  imagePreview.classList.remove("empty");
});

async function uploadImage(file) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${linkedScreen.id}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type
    });

  if (error) throw error;

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

offerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage(offerMessage);

  const contentType = contentTypeInput.value === "notice" ? "notice" : "offer";
  const isNotice = contentType === "notice";
  const file = mediaInput.files?.[0];
  const previous = isNotice ? 0 : Number(previousPriceInput.value);
  const current = isNotice ? 0 : Number(currentPriceInput.value);

  if (!linkedScreen) {
    showMessage(offerMessage, "Primero vincula una televisión.", "error");
    return;
  }
  if (!isNotice && !file) {
    showMessage(offerMessage, "Selecciona una imagen para la oferta.", "error");
    return;
  }
  if (isNotice && !ctaTextInput.value.trim()) {
    showMessage(offerMessage, "Escribe el llamado a la acción del aviso.", "error");
    return;
  }
  if (!isNotice && previous < current) {
    showMessage(offerMessage, "El precio anterior debe ser mayor o igual al actual.", "error");
    return;
  }

  saveButton.disabled = true;
  saveButton.textContent = "Guardando…";

  try {
    const media = file ? await uploadImage(file) : { path: "", url: "" };

    const { data: last } = await supabase
      .from("screen_playlist_items")
      .select("position")
      .eq("screen_id", linkedScreen.id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const payload = {
      screen_id: linkedScreen.id,
      title: titleInput.value.trim(),
      description: descriptionInput.value.trim(),
      previous_price: previous,
      current_price: current,
      duration_seconds: Number(durationInput.value || 8),
      theme: "blue",
      position: Number(last?.position ?? -1) + 1,
      is_active: true,
      media_url: media.url,
      media_path: media.path,
      media_type: "image",
      content_type: contentType,
      cta_text: isNotice ? ctaTextInput.value.trim() : "",
      image_fit: "contain"
    };

    const { error } = await supabase.from("screen_playlist_items").insert(payload);
    if (error) throw error;

    offerForm.reset();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    previewImage.classList.add("hidden");
    imagePreview.classList.add("empty");
    showMessage(offerMessage, isNotice ? "Aviso guardado y enviado a la TV." : "Oferta guardada y enviada a la TV.");
    updateContentTypeUI();
    await loadOffers();
  } catch (error) {
    console.error(error);
    showMessage(offerMessage, `No se pudo guardar: ${error.message}`, "error");
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = contentTypeInput.value === "notice" ? "Guardar aviso" : "Guardar oferta";
  }
});

async function loadOffers() {
  if (!linkedScreen) return;

  const { data, error } = await supabase
    .from("screen_playlist_items")
    .select("*")
    .eq("screen_id", linkedScreen.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    offersList.innerHTML = `<p class="message error">${error.message}</p>`;
    return;
  }

  const offers = data || [];
  offerCount.textContent = String(offers.length);

  if (!offers.length) {
    offersList.innerHTML = '<p class="empty-list">Todavía no hay publicaciones.</p>';
    return;
  }

  offersList.innerHTML = offers.map((item, index) => `
    <article class="offer-list-item ${item.is_active ? "" : "paused"}" data-id="${item.id}">
      <span class="position-number">${index + 1}</span>
      ${item.media_url ? `<img src="${item.media_url}" alt="">` : `<div class="list-media-placeholder">AVISO</div>`}
      <div class="offer-list-copy">
        <strong>${escapeHtml(item.title)}</strong>
        <span>${item.content_type === "notice" ? `AVISO · ${escapeHtml(item.cta_text || "")}` : `${money(item.previous_price)} → ${money(item.current_price)}`}</span>
        <small>${Number(item.duration_seconds || 8)} segundos · ${item.is_active ? "Activa" : "Pausada"}</small>
      </div>
      <div class="playlist-actions">
        <button class="icon-button move-up" data-id="${item.id}" type="button" ${index === 0 ? "disabled" : ""} aria-label="Subir">↑</button>
        <button class="icon-button move-down" data-id="${item.id}" type="button" ${index === offers.length - 1 ? "disabled" : ""} aria-label="Bajar">↓</button>
        <button class="icon-button toggle-offer" data-id="${item.id}" data-active="${item.is_active}" type="button">
          ${item.is_active ? "Pausar" : "Activar"}
        </button>
        <button class="icon-button delete-offer" data-id="${item.id}" data-path="${item.media_path || ""}" type="button">Eliminar</button>
      </div>
    </article>
  `).join("");
}

offersList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button || !linkedScreen) return;

  button.disabled = true;
  const id = button.dataset.id;

  try {
    if (button.classList.contains("delete-offer")) {
      const path = button.dataset.path;

      const { error } = await supabase
        .from("screen_playlist_items")
        .delete()
        .eq("id", id)
        .eq("screen_id", linkedScreen.id);

      if (error) throw error;
      if (path) await supabase.storage.from(MEDIA_BUCKET).remove([path]);
    }

    if (button.classList.contains("toggle-offer")) {
      const active = button.dataset.active === "true";
      const { error } = await supabase
        .from("screen_playlist_items")
        .update({ is_active: !active })
        .eq("id", id)
        .eq("screen_id", linkedScreen.id);

      if (error) throw error;
    }

    if (button.classList.contains("move-up") || button.classList.contains("move-down")) {
      const { data: currentOffers, error: loadError } = await supabase
        .from("screen_playlist_items")
        .select("id, position")
        .eq("screen_id", linkedScreen.id)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });

      if (loadError) throw loadError;

      const currentIndex = currentOffers.findIndex((item) => item.id === id);
      const targetIndex = button.classList.contains("move-up")
        ? currentIndex - 1
        : currentIndex + 1;

      if (currentIndex >= 0 && targetIndex >= 0 && targetIndex < currentOffers.length) {
        const current = currentOffers[currentIndex];
        const target = currentOffers[targetIndex];

        // Posiciones temporales para evitar choques si existe una restricción única.
        const tempPosition = -100000 - currentIndex;
        let result = await supabase
          .from("screen_playlist_items")
          .update({ position: tempPosition })
          .eq("id", current.id);
        if (result.error) throw result.error;

        result = await supabase
          .from("screen_playlist_items")
          .update({ position: current.position })
          .eq("id", target.id);
        if (result.error) throw result.error;

        result = await supabase
          .from("screen_playlist_items")
          .update({ position: target.position })
          .eq("id", current.id);
        if (result.error) throw result.error;
      }
    }

    await loadOffers();
  } catch (error) {
    console.error(error);
    showMessage(offerMessage, `No se pudo actualizar la lista: ${error.message}`, "error");
    button.disabled = false;
  }
});

unlinkButton.addEventListener("click", () => {
  linkedScreen = null;
  clearSession();
  showUnlinkedUI();
});

function escapeHtml(value = "") {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

restoreSession();
