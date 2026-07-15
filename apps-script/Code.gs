/**
 * Marketing-Kitchen Publisher
 *
 * Veröffentlicht Beiträge aus Gmail oder aus dem mitgelieferten Webformular
 * direkt in ein GitHub-Repository. Geheimnisse werden ausschließlich in den
 * Script Properties gespeichert und niemals in diesem Quelltext.
 */

const MK = Object.freeze({
  CONTENT_PATH: "content/posts.json",
  UPLOAD_DIR: "assets/uploads",
  PLACEHOLDER_IMAGE: "assets/uploads/placeholder.svg",
  PROCESSED_LABEL: "MarketingKitchen/Verarbeitet",
  FAILED_LABEL: "MarketingKitchen/Fehler",
  MAX_EMAILS_PER_RUN: 20,
  MAX_IMAGE_BYTES: 8 * 1024 * 1024,
  CATEGORIES: Object.freeze({
    restaurant: Object.freeze({ id: "restaurants", label: "Restaurants" }),
    restaurants: Object.freeze({ id: "restaurants", label: "Restaurants" }),
    kueche: Object.freeze({ id: "kitchen", label: "Küchen-Hardware" }),
    kitchen: Object.freeze({ id: "kitchen", label: "Küchen-Hardware" }),
    tech: Object.freeze({ id: "tech", label: "Tech-Gadgets" })
  })
});

/**
 * Einmal ausführen: legt Labels und einen 5-Minuten-Trigger an.
 * Vorher Script Properties gemäß README setzen.
 */
function setupMarketingKitchen() {
  validateConfiguration_();
  getOrCreateLabel_(MK.PROCESSED_LABEL);
  getOrCreateLabel_(MK.FAILED_LABEL);

  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === "importPostsFromEmail")
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger("importPostsFromEmail")
    .timeBased()
    .everyMinutes(5)
    .create();

  console.log("Marketing-Kitchen ist eingerichtet. E-Mail-Import läuft alle 5 Minuten.");
}

/**
 * Liest neue Nachrichten an die Plus-Aliasse der konfigurierten Gmail-Adresse.
 * Beispiel: name+kueche@gmail.com
 */
function importPostsFromEmail() {
  const config = getConfig_();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    console.log("Ein anderer Import läuft bereits.");
    return;
  }

  try {
    const query = buildGmailQuery_(config.mailboxAddress, config.allowedSenders);
    const threads = GmailApp.search(query, 0, MK.MAX_EMAILS_PER_RUN);

    threads.forEach((thread) => {
      thread.getMessages()
        .filter((message) => message.isUnread())
        .forEach((message) => processEmailMessage_(message, config));
    });
  } finally {
    lock.releaseLock();
  }
}

/** Web-App-Einstieg für die Formular-Alternative. */
function doGet() {
  return HtmlService.createHtmlOutputFromFile("Form")
    .setTitle("Marketing-Kitchen Beitrag")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

/** Wird vom geschützten Formular aufgerufen. */
function submitPostFromForm(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const config = getConfig_();
    const category = categoryFromValue_(payload.category);
    if (!category) throw new Error("Unbekannte Kategorie.");

    const title = cleanTitle_(payload.title);
    const excerpt = cleanExcerpt_(payload.excerpt);
    const url = normalizeUrl_(payload.url || "");
    const imageBlob = dataUrlToBlob_(payload.imageDataUrl, payload.imageName || title);

    const result = publishPost_({
      title,
      excerpt,
      category,
      url,
      linkText: cleanOptional_(payload.linkText) || defaultLinkText_(category.id, url),
      badge: cleanOptional_(payload.badge),
      imageAlt: cleanOptional_(payload.imageAlt) || title,
      featured: Boolean(payload.featured),
      imageBlob
    }, config);

    return {
      ok: true,
      message: `„${result.title}“ wurde veröffentlicht.`,
      commitUrl: result.commitUrl || ""
    };
  } finally {
    lock.releaseLock();
  }
}

function processEmailMessage_(message, config) {
  const sender = extractEmailAddress_(message.getFrom());
  const allowedSenders = config.allowedSenders;

  if (!allowedSenders.includes(sender)) {
    console.log(`Übersprungen: nicht freigegebener Absender ${sender}`);
    return;
  }

  const category = categoryFromRecipients_(message.getTo());
  const parsed = parseMessageBody_(message.getPlainBody());
  const resolvedCategory = category || categoryFromValue_(parsed.controls.category);

  if (!resolvedCategory) {
    failMessage_(message, config, "Kategorie nicht erkannt. Bitte an +restaurant, +kueche oder +tech senden.");
    return;
  }

  try {
    const title = cleanTitle_(message.getSubject());
    const attachments = message.getAttachments({
      includeInlineImages: true,
      includeAttachments: true
    });
    const imageBlob = chooseImageAttachment_(attachments);

    const resolvedUrl = normalizeUrl_(parsed.controls.link || parsed.url || "");
    const result = publishPost_({
      title,
      excerpt: cleanExcerpt_(parsed.text),
      category: resolvedCategory,
      url: resolvedUrl,
      linkText: cleanOptional_(parsed.controls.linktext) || defaultLinkText_(resolvedCategory.id, resolvedUrl),
      badge: cleanOptional_(parsed.controls.badge),
      imageAlt: cleanOptional_(parsed.controls.bildtext) || title,
      featured: parseBoolean_(parsed.controls.featured),
      imageBlob
    }, config);

    message.markRead();
    message.getThread().addLabel(getOrCreateLabel_(MK.PROCESSED_LABEL));
    message.getThread().removeLabel(getOrCreateLabel_(MK.FAILED_LABEL));

    if (config.sendConfirmations) {
      GmailApp.sendEmail(
        sender,
        `Veröffentlicht: ${title}`,
        `Der Beitrag „${title}“ wurde in Marketing-Kitchen veröffentlicht.${result.commitUrl ? `\n\nCommit: ${result.commitUrl}` : ""}`
      );
    }
  } catch (error) {
    failMessage_(message, config, error.message || String(error));
  }
}

function publishPost_(input, config) {
  const now = new Date();
  const slug = slugify_(input.title);
  const stamp = Utilities.formatDate(now, "Europe/Vienna", "yyyyMMdd-HHmmss");
  const id = `${slug}-${stamp}`;

  let imagePath = MK.PLACEHOLDER_IMAGE;
  if (input.imageBlob) {
    validateImageBlob_(input.imageBlob);
    const extension = extensionForMime_(input.imageBlob.getContentType());
    imagePath = `${MK.UPLOAD_DIR}/${stamp}-${slug}.${extension}`;
    putGitHubFile_(
      imagePath,
      Utilities.base64Encode(input.imageBlob.getBytes()),
      `content: add image for ${input.title}`,
      config
    );
  }

  const post = {
    id,
    title: input.title,
    category: input.category.id,
    excerpt: input.excerpt,
    image: imagePath,
    imageAlt: input.imageAlt || input.title,
    url: input.url || "",
    linkText: input.linkText || "Mehr erfahren",
    badge: input.badge || "",
    featured: Boolean(input.featured),
    published: true,
    publishedAt: Utilities.formatDate(now, "Europe/Vienna", "yyyy-MM-dd'T'HH:mm:ssXXX")
  };

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const current = getGitHubFile_(MK.CONTENT_PATH, config);
      const content = JSON.parse(current.text);
      if (!Array.isArray(content.posts)) throw new Error("content/posts.json enthält kein posts-Array.");

      content.posts.unshift(post);
      const response = putGitHubFile_(
        MK.CONTENT_PATH,
        Utilities.base64Encode(JSON.stringify(content, null, 2) + "\n", Utilities.Charset.UTF_8),
        `content: publish ${input.title}`,
        config,
        current.sha
      );

      return {
        title: input.title,
        commitUrl: response.content?.html_url || response.commit?.html_url || ""
      };
    } catch (error) {
      lastError = error;
      if (!String(error.message).includes("409") || attempt === 3) throw error;
      Utilities.sleep(500 * attempt);
    }
  }

  throw lastError;
}

function parseMessageBody_(body) {
  const controls = {};
  const keptLines = [];
  const controlPattern = /^(kategorie|category|badge|linktext|link|bildtext|featured)\s*:\s*(.+)$/i;

  String(body || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .forEach((line) => {
      const match = line.trim().match(controlPattern);
      if (match) {
        controls[match[1].toLocaleLowerCase("de")] = match[2].trim();
      } else {
        keptLines.push(line);
      }
    });

  let text = keptLines.join("\n")
    .split(/^--\s*$/m)[0]
    .split(/^Am .+ schrieb .+:$/m)[0]
    .trim();

  const urlMatch = text.match(/https?:\/\/[^\s<>]+/i);
  const url = urlMatch ? urlMatch[0].replace(/[),.;!?]+$/, "") : "";
  if (url) text = text.replace(url, "").replace(/\s+([,.!?])/g, "$1");

  return { controls, text, url };
}

function chooseImageAttachment_(attachments) {
  const images = attachments
    .filter((blob) => String(blob.getContentType()).toLowerCase().startsWith("image/"))
    .filter((blob) => blob.getBytes().length <= MK.MAX_IMAGE_BYTES)
    .sort((a, b) => b.getBytes().length - a.getBytes().length);

  if (!images.length) {
    throw new Error("Kein geeignetes Bild gefunden. Bitte JPG, PNG oder WebP bis 8 MB anhängen.");
  }
  return images[0];
}

function validateImageBlob_(blob) {
  const mime = String(blob.getContentType()).toLowerCase();
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(mime)) throw new Error(`Nicht unterstütztes Bildformat: ${mime}`);
  if (blob.getBytes().length > MK.MAX_IMAGE_BYTES) throw new Error("Das Bild ist größer als 8 MB.");
}

function categoryFromRecipients_(recipients) {
  const value = String(recipients || "").toLowerCase();
  const aliasMatch = value.match(/\+([a-z0-9_-]+)@/i);
  return aliasMatch ? categoryFromValue_(aliasMatch[1]) : null;
}

function categoryFromValue_(value) {
  if (!value) return null;
  const normalized = String(value)
    .trim()
    .toLocaleLowerCase("de")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

  if (MK.CATEGORIES[normalized]) return MK.CATEGORIES[normalized];
  return Object.values(MK.CATEGORIES).find((category) =>
    category.id === normalized || category.label.toLocaleLowerCase("de").replace(/[^a-z]/g, "") === normalized
  ) || null;
}

function buildGmailQuery_(mailboxAddress, allowedSenders) {
  const parts = String(mailboxAddress).toLowerCase().split("@");
  if (parts.length !== 2) throw new Error("MAILBOX_ADDRESS ist ungültig.");
  const [local, domain] = parts;
  const aliases = ["restaurant", "kueche", "tech"]
    .map((alias) => `to:${local}+${alias}@${domain}`)
    .join(" ");
  const senders = allowedSenders.map((sender) => `from:${sender}`).join(" ");
  return `is:unread newer_than:30d {${aliases}} {${senders}}`;
}

function failMessage_(message, config, reason) {
  const sender = extractEmailAddress_(message.getFrom());
  message.markRead();
  message.getThread().addLabel(getOrCreateLabel_(MK.FAILED_LABEL));

  if (config.sendConfirmations && sender) {
    GmailApp.sendEmail(
      sender,
      `Marketing-Kitchen: Beitrag nicht veröffentlicht`,
      `Die Nachricht „${message.getSubject()}“ konnte nicht veröffentlicht werden.\n\nGrund: ${reason}`
    );
  }
  console.error(`Import fehlgeschlagen: ${reason}`);
}

function getConfig_() {
  const properties = PropertiesService.getScriptProperties().getProperties();
  const config = {
    owner: String(properties.GITHUB_OWNER || "").trim(),
    repo: String(properties.GITHUB_REPO || "").trim(),
    token: String(properties.GITHUB_TOKEN || "").trim(),
    branch: String(properties.GITHUB_BRANCH || "main").trim(),
    mailboxAddress: String(properties.MAILBOX_ADDRESS || "").trim().toLowerCase(),
    allowedSenders: String(properties.ALLOWED_SENDERS || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
    sendConfirmations: parseBoolean_(properties.SEND_CONFIRMATIONS)
  };

  validateConfiguration_(config);
  return config;
}

function validateConfiguration_(providedConfig) {
  const config = providedConfig || getConfig_();
  const missing = [];
  if (!config.owner) missing.push("GITHUB_OWNER");
  if (!config.repo) missing.push("GITHUB_REPO");
  if (!config.token) missing.push("GITHUB_TOKEN");
  if (!config.mailboxAddress) missing.push("MAILBOX_ADDRESS");
  if (!config.allowedSenders.length) missing.push("ALLOWED_SENDERS");
  if (missing.length) throw new Error(`Fehlende Script Properties: ${missing.join(", ")}`);
}

function getGitHubFile_(path, config) {
  const response = githubRequest_("get", `/repos/${config.owner}/${config.repo}/contents/${encodePath_(path)}?ref=${encodeURIComponent(config.branch)}`, null, config);
  return {
    sha: response.sha,
    text: Utilities.newBlob(Utilities.base64Decode(String(response.content).replace(/\s/g, ""))).getDataAsString("UTF-8")
  };
}

function putGitHubFile_(path, base64Content, message, config, sha) {
  const payload = {
    message,
    content: base64Content,
    branch: config.branch
  };
  if (sha) payload.sha = sha;

  return githubRequest_(
    "put",
    `/repos/${config.owner}/${config.repo}/contents/${encodePath_(path)}`,
    payload,
    config
  );
}

function githubRequest_(method, endpoint, payload, config) {
  const options = {
    method,
    muteHttpExceptions: true,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "X-GitHub-Api-Version": "2026-03-10",
      "User-Agent": "marketing-kitchen-apps-script"
    }
  };
  if (payload) {
    options.contentType = "application/json";
    options.payload = JSON.stringify(payload);
  }

  const response = UrlFetchApp.fetch(`https://api.github.com${endpoint}`, options);
  const status = response.getResponseCode();
  const body = response.getContentText();
  let parsed = {};
  try { parsed = body ? JSON.parse(body) : {}; } catch (_) { parsed = { message: body }; }

  if (status < 200 || status >= 300) {
    throw new Error(`GitHub API ${status}: ${parsed.message || body || "Unbekannter Fehler"}`);
  }
  return parsed;
}

function dataUrlToBlob_(dataUrl, fallbackName) {
  if (!dataUrl) throw new Error("Bitte ein Bild auswählen.");
  const match = String(dataUrl).match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/);
  if (!match) throw new Error("Das Bild konnte nicht gelesen werden.");
  const mime = match[1];
  const bytes = Utilities.base64Decode(match[2]);
  const extension = extensionForMime_(mime);
  return Utilities.newBlob(bytes, mime, `${slugify_(fallbackName)}.${extension}`);
}

function extensionForMime_(mime) {
  const map = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif"
  };
  const extension = map[String(mime).toLowerCase()];
  if (!extension) throw new Error(`Nicht unterstütztes Bildformat: ${mime}`);
  return extension;
}

function normalizeUrl_(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  if (!/^https?:\/\/[^\s]+$/i.test(withProtocol)) throw new Error("Der Link ist ungültig.");
  return withProtocol;
}

function cleanTitle_(value) {
  const text = String(value || "").replace(/^(re|fw|fwd):\s*/i, "").trim();
  if (text.length < 2) throw new Error("Der Betreff muss den Beitragstitel enthalten.");
  return text.slice(0, 120);
}

function cleanExcerpt_(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length < 10) throw new Error("Der Beschreibungstext ist zu kurz.");
  return text.slice(0, 900);
}

function cleanOptional_(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 160);
}

function slugify_(value) {
  const slug = String(value || "post")
    .toLocaleLowerCase("de")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return slug || "post";
}

function defaultLinkText_(categoryId, url) {
  const domain = String(url || "").toLowerCase();
  if (domain.includes("amazon.")) return "Bei Amazon ansehen";
  if (categoryId === "restaurants") return "Website besuchen";
  if (categoryId === "kitchen") return "Produkt ansehen";
  return "Mehr erfahren";
}

function parseBoolean_(value) {
  return [true, 1, "1", "true", "ja", "yes", "x"].includes(
    typeof value === "string" ? value.trim().toLowerCase() : value
  );
}

function extractEmailAddress_(value) {
  const match = String(value || "").toLowerCase().match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return match ? match[0] : "";
}

function encodePath_(path) {
  return String(path).split("/").map(encodeURIComponent).join("/");
}

function getOrCreateLabel_(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}
