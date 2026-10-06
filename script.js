// Rules page: accordion toggle (one open at a time)

function toggleRule(btn) {
  const item = btn.closest('.rule-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.rule-item.open').forEach(el => el.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

// SPA-style page switching (home / rules / creators / support / profile ...)

(function () {
  /**
   * navigateTo(pageId)
   * ──────────────────
   * Hides all .page divs, shows #page-{pageId},
   * and syncs the active class on navbar links.
   */
  function navigateTo(pageId, smooth) {
    // 1. Hide every page
    document.querySelectorAll('.page').forEach(function (p) {
      p.classList.remove('active');
    });

    // 2. Show the target page
    var target = document.getElementById('page-' + pageId);
    if (target) {
      target.classList.add('active');
      // Smooth scroll when triggered from the logo, instant otherwise
      window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'instant' });
    }

    // 3. Update active class on navbar links
    document.querySelectorAll('.navbar-links a[data-page]').forEach(function (link) {
      if (link.dataset.page === pageId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /**
   * Attach click listeners to every element with data-page attribute.
   * Uses event delegation on document so dynamically-added elements
   * (e.g. cards rendered by JS) are also covered.
   */
  document.addEventListener('click', function (e) {
    // Walk up the DOM in case the click landed on a child element
    var el = e.target;
    while (el && el !== document) {
      if (el.dataset && el.dataset.page) {
        e.preventDefault();
        // If the click came from the navbar logo, animate the scroll
        var isLogo = el.classList && el.classList.contains('navbar-logo');
        navigateTo(el.dataset.page, isLogo);
        return;
      }
      el = el.parentElement;
    }
  });

  // On first load, make sure the URL hash or the default 'home' page is shown
  (function init() {
    // Honour ?page=xxx query param or just default to 'home'
    var params = new URLSearchParams(window.location.search);
    var startPage = params.get('page') || 'home';
    navigateTo(startPage);
  })();
})();

// Discord OAuth login + profile page

(function () {
  const DISCORD_CLIENT_ID = '1507544246134116525';
  const DISCORD_GUILD_ID = '1499886158954631378';
  const DISCORD_REDIRECT_URI = '';
  const DISCORD_AUTH_KEY = 'lastEraDiscordAuth';

  const loginBtn = document.getElementById('loginBtn');
  const profileLoginBtn = document.getElementById('profileLoginBtn');
  const profileContent = document.getElementById('profileContent');
  const profileLoginPrompt = document.getElementById('profileLoginPrompt');
  const refreshBtn = document.getElementById('refreshDiscordProfile');
  const logoutBtn = document.getElementById('logoutDiscord');
  const copyBtn = document.getElementById('copyDiscordId');

  function getRedirectUri() {
    return DISCORD_REDIRECT_URI || (window.location.origin + window.location.pathname);
  }

  function getStoredAuth() {
    try {
      const auth = JSON.parse(localStorage.getItem(DISCORD_AUTH_KEY) || 'null');
      if (!auth || !auth.accessToken || !auth.expiresAt) return null;
      if (Date.now() > auth.expiresAt) {
        localStorage.removeItem(DISCORD_AUTH_KEY);
        return null;
      }
      return auth;
    } catch (err) {
      localStorage.removeItem(DISCORD_AUTH_KEY);
      return null;
    }
  }

  function saveAuth(auth) {
    localStorage.setItem(DISCORD_AUTH_KEY, JSON.stringify(auth));
  }

  function startDiscordLogin() {
    if (window.location.protocol === 'file:') {
      alert('Dis Error by midoo.14');
      return;
    }

    const state = crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    sessionStorage.setItem('discordOAuthState', state);

    const params = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      redirect_uri: getRedirectUri(),
      response_type: 'token',
      scope: 'identify guilds',
      state: state,
      prompt: 'consent'
    });

    window.location.href = 'https://discord.com/oauth2/authorize?' + params.toString();
  }

  function activatePage(pageId) {
    document.querySelectorAll('.page').forEach(function (page) {
      page.classList.remove('active');
    });

    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');

    document.querySelectorAll('.navbar-links a[data-page]').forEach(function (link) {
      link.classList.toggle('active', link.dataset.page === pageId);
    });

    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function avatarUrl(user) {
    if (!user || !user.avatar) return 'Logo/LE.png';
    const extension = user.avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=256`;
  }

  function formatDiscordName(user) {
    if (!user) return 'Discord User';
    return user.global_name || user.username || 'Discord User';
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function showLoggedOutProfile() {
    if (profileContent) profileContent.classList.add('profile-hidden');
    if (profileLoginPrompt) profileLoginPrompt.classList.remove('profile-hidden');
  }

  function showLoggedInProfile(auth) {
    const user = auth && auth.user;
    const guilds = auth && Array.isArray(auth.guilds) ? auth.guilds : [];
    const isInGuild = DISCORD_GUILD_ID ? guilds.some(function (guild) { return guild.id === DISCORD_GUILD_ID; }) : null;

    if (profileContent) profileContent.classList.remove('profile-hidden');
    if (profileLoginPrompt) profileLoginPrompt.classList.add('profile-hidden');

    const avatar = document.getElementById('profileAvatar');
    if (avatar) avatar.src = avatarUrl(user);

    setText('profileName', formatDiscordName(user));
    setText('profileId', user && user.id ? user.id : '-');
    setText('profileUpdatedAt', auth.fetchedAt ? new Date(auth.fetchedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-');
    setText('profileAuthStatus', 'مفعل');

    if (isInGuild === true) {
      setText('profileServerStatus', 'داخل السيرفر');
      setText('profileNote', 'حسابك داخل السيرفر وتصريح الدخول مفعل.');
    } else if (isInGuild === false) {
      setText('profileServerStatus', 'خارج السيرفر');
      setText('profileNote', 'سجلت دخولك بنجاح، لكن الحساب غير ظاهر داخل السيرفر.');
    } else {
      setText('profileServerStatus', 'غير مؤكد');
      setText('profileNote', 'سجلت دخولك بنجاح. أضف Discord Guild ID في الكود لتفعيل فحص وجودك داخل السيرفر.');
    }
  }

  function updateLoginButton(auth) {
    if (!loginBtn) return;

    if (auth && auth.user) {
      loginBtn.textContent = formatDiscordName(auth.user);
      loginBtn.dataset.page = 'profile';
      loginBtn.href = '#';
      loginBtn.title = 'عرض البروفايل';
    } else {
      loginBtn.textContent = 'تسجيل الدخول';
      delete loginBtn.dataset.page;
      loginBtn.href = '#';
      loginBtn.title = '';
    }
  }

  async function fetchDiscordProfile(accessToken) {
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: 'Bearer ' + accessToken }
    });
    if (!userRes.ok) throw new Error('Failed to fetch Discord user');
    const user = await userRes.json();

    let guilds = [];
    try {
      const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: 'Bearer ' + accessToken }
      });
      if (guildsRes.ok) guilds = await guildsRes.json();
    } catch (err) {
      guilds = [];
    }

    return { user, guilds };
  }

  async function refreshDiscordProfile() {
    const auth = getStoredAuth();
    if (!auth) {
      showLoggedOutProfile();
      updateLoginButton(null);
      return null;
    }

    try {
      const profile = await fetchDiscordProfile(auth.accessToken);
      const nextAuth = Object.assign({}, auth, profile, { fetchedAt: Date.now() });
      saveAuth(nextAuth);
      showLoggedInProfile(nextAuth);
      updateLoginButton(nextAuth);
      return nextAuth;
    } catch (err) {
      localStorage.removeItem(DISCORD_AUTH_KEY);
      showLoggedOutProfile();
      updateLoginButton(null);
      return null;
    }
  }

  async function handleOAuthReturn() {
    if (!window.location.hash || !window.location.hash.includes('access_token=')) return false;

    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get('access_token');
    const expiresIn = Number(params.get('expires_in') || 0);
    const returnedState = params.get('state');
    const savedState = sessionStorage.getItem('discordOAuthState');

    history.replaceState(null, '', getRedirectUri() + '?page=profile');
    sessionStorage.removeItem('discordOAuthState');

    if (!accessToken || !expiresIn || (savedState && returnedState !== savedState)) {
      showLoggedOutProfile();
      activatePage('profile');
      return true;
    }

    const auth = {
      accessToken: accessToken,
      expiresAt: Date.now() + expiresIn * 1000,
      fetchedAt: Date.now()
    };

    saveAuth(auth);
    await refreshDiscordProfile();
    activatePage('profile');
    return true;
  }

  function logoutDiscord() {
    localStorage.removeItem(DISCORD_AUTH_KEY);
    showLoggedOutProfile();
    updateLoginButton(null);
    activatePage('profile');
  }

  [loginBtn, profileLoginBtn].forEach(function (btn) {
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      const auth = getStoredAuth();
      if (auth && btn === loginBtn) return;
      e.preventDefault();
      startDiscordLogin();
    });
  });

  if (refreshBtn) {
    refreshBtn.addEventListener('click', function (e) {
      e.preventDefault();
      refreshDiscordProfile();
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      logoutDiscord();
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      const id = document.getElementById('profileId');
      if (id && navigator.clipboard) navigator.clipboard.writeText(id.textContent);
    });
  }

  (async function initDiscordAuth() {
    const handledReturn = await handleOAuthReturn();
    const auth = getStoredAuth();

    if (auth) {
      showLoggedInProfile(auth);
      updateLoginButton(auth);
    } else {
      showLoggedOutProfile();
      updateLoginButton(null);
    }

    if (!handledReturn && new URLSearchParams(window.location.search).get('page') === 'profile') {
      activatePage('profile');
    }
  })();
})();

// Hero video autoplay fallback + playback speed

document.addEventListener('DOMContentLoaded', function () {
  var vid = document.querySelector('.video-bg video');
  if (vid) {
    vid.playbackRate = 1.4;
    vid.play().catch(function () {
      // Autoplay was prevented — video stays paused (muted autoplay is allowed on all modern browsers)
    });
  }
});

// Kick streamers list, live status checks, filters, and Discord member counter

/*
  ═══════════════════════════════════════════════════════════
  HOW TO ADD / EDIT STREAMERS
  ═══════════════════════════════════════════════════════════
  Just add, remove or edit objects in the "streamers" array below.

  - username : the streamer's Kick channel slug, EXACTLY as it
                appears in their channel URL: kick.com/<username>
  - name     : the display name shown on the card
  - image    : fallback profile picture shown before/while the
                Kick API responds (and used if the API call fails).
                If the Kick API returns a profile picture for the
                channel, it will automatically replace this image.

  Example:
    {
      username: "aboel3bas",
      name: "Aboel3bas",
      image: "profile.jpg"
    }
  ═══════════════════════════════════════════════════════════
*/
const streamers = [
  {
    username: "0mariooo",
    name: "0mariooo",
    image: "https://kick.com/favicon.ico"
  },
  {
    username: "tribal-chief95",
    name: "Tribal Chief95",
    image: "https://kick.com/favicon.ico"
  },
  {
    username: "saifra3d",
    name: "Saifra3d",
    image: "https://kick.com/favicon.ico"
  },
  {
    username: "medo-gm",
    name: "Medo GM",
    image: "https://kick.com/favicon.ico"
  },
  {
    username: "zhammeedo",
    name: "Zhammeedo",
    image: "https://kick.com/favicon.ico"
  },
  {
    username: "g3edy",
    name: "G3edy",
    image: "https://kick.com/favicon.ico"
  }
];

// How often to re-check live status (in milliseconds). 30000 = 30 seconds.
const CHECK_INTERVAL = 30000;

const streamersGrid = document.getElementById('streamersGrid');
const creatorsCount = document.getElementById('creatorsCount');

let currentFilter = 'all';

/* ─────────────────────────────────────────────────────────
   Build the streamer cards dynamically from the array above
───────────────────────────────────────────────────────── */
function renderStreamerCards() {
  streamersGrid.innerHTML = streamers.map(s => `
    <div class="streamer-card" id="card-${s.username}">
      <div class="streamer-kick-glow"></div>
      <img src="Logo/Kick Logo.webp" alt="Kick" class="streamer-kick-logo" />
      <div class="streamer-avatar-wrap">
        <img
          class="streamer-avatar"
          id="avatar-${s.username}"
          src="${s.image}"
          alt="${s.name}"
          onerror="this.onerror=null;this.src='Logo/Kick Logo.webp';this.classList.add('avatar-fallback');"
        />
        <span class="live-badge">LIVE</span>
      </div>

      <div class="streamer-name">${s.name}</div>

      <div class="streamer-status" id="status-${s.username}">
        <span class="status-dot"></span>
        <span class="status-text">Offline</span>
      </div>

      <div class="streamer-followers" id="followers-${s.username}">
        <svg class="followers-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <span class="followers-text">-- Followers</span>
      </div>

      <a
        href="https://kick.com/${s.username}"
        target="_blank"
        rel="noopener"
        class="streamer-watch-btn offline-btn"
        id="watch-${s.username}"
      >Link<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></a>
    </div>
  `).join('');
}

/* ─────────────────────────────────────────────────────────
   Fetch a single channel's data from Kick's public API.
   Kick's API sits behind Cloudflare and sometimes blocks
   direct browser requests with CORS errors, so we try a
   few endpoints in order and use whichever one succeeds.
───────────────────────────────────────────────────────── */
async function fetchKickChannel(username) {
  const targetUrl = `https://kick.com/api/v2/channels/${username}`;

  const endpoints = [
    targetUrl,
    // CORS proxy fallbacks (used only if the direct request is blocked)
    `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) continue;
      const data = await res.json();
      if (data) return data;
    } catch (err) {
      // try the next endpoint
      continue;
    }
  }
  return null;
}

/* ─────────────────────────────────────────────────────────
   Update one streamer card's UI based on Kick API response
───────────────────────────────────────────────────────── */
function updateStreamerCard(streamer, data) {
  const card        = document.getElementById(`card-${streamer.username}`);
  const statusText  = card.querySelector('.status-text');
  const followersEl = document.getElementById(`followers-${streamer.username}`);
  const avatarEl    = document.getElementById(`avatar-${streamer.username}`);
  const watchBtn    = document.getElementById(`watch-${streamer.username}`);

  if (!data) {
    card.classList.remove('is-live');
    statusText.textContent = 'Offline';
    applyFilter(currentFilter);
    return;
  }

  // "livestream" is null when the channel is offline, and an
  // object (with viewer count, title, etc.) when it's live.
  const isLive = !!data.livestream;

  const followers = data.followersCount ?? data.followers_count ?? 0;
  const followersTextEl = followersEl.querySelector('.followers-text');
  if (followersTextEl) {
    followersTextEl.textContent = `${followers.toLocaleString('en-US')} Followers`;
  } else {
    followersEl.textContent = `${followers.toLocaleString('en-US')} Followers`;
  }
  followersEl.dataset.followers = followers;

  const profilePic = data.user && data.user.profile_pic;
  if (profilePic) {
    avatarEl.src = profilePic;
    avatarEl.classList.remove('avatar-fallback');
  }

  if (isLive) {
    card.classList.add('is-live');
    statusText.textContent = 'Live';
    watchBtn.classList.remove('disabled');
    watchBtn.classList.remove('offline-btn');
    watchBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/></svg>مشاهدة البث';
  } else {
    card.classList.remove('is-live');
    statusText.textContent = 'Offline';
    watchBtn.classList.add('offline-btn');
    watchBtn.innerHTML = 'Link<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
  }

  applyFilter(currentFilter);
}

/* ─────────────────────────────────────────────────────────
   Check the live status of every streamer in the array
───────────────────────────────────────────────────────── */
async function checkAllStreamers() {
  for (const streamer of streamers) {
    const data = await fetchKickChannel(streamer.username);
    updateStreamerCard(streamer, data);
  }
}

/* ─────────────────────────────────────────────────────────
   Filter / sort the streamer grid based on the active tab
───────────────────────────────────────────────────────── */
function sortLiveFirst() {
  const cards = Array.from(streamersGrid.children).filter(el => el.classList.contains('streamer-card'));
  cards
    .sort((a, b) => {
      const aLive = a.classList.contains('is-live') ? 1 : 0;
      const bLive = b.classList.contains('is-live') ? 1 : 0;
      return bLive - aLive;
    })
    .forEach(card => streamersGrid.appendChild(card));
}

function applyFilter(filter) {
  currentFilter = filter;
  const cards = Array.from(streamersGrid.children).filter(el => el.classList.contains('streamer-card'));
  let visibleCount = 0;

  cards.forEach(card => {
    const isLive = card.classList.contains('is-live');
    let show = true;
    if (filter === 'live') show = isLive;
    if (filter === 'offline') show = !isLive;
    card.style.display = show ? '' : 'none';
    if (show) visibleCount++;
  });

  if (filter === 'popular') {
    cards
      .slice()
      .sort((a, b) => {
        const fa = Number(a.querySelector('.streamer-followers').dataset.followers) || 0;
        const fb = Number(b.querySelector('.streamer-followers').dataset.followers) || 0;
        return fb - fa;
      })
      .forEach(card => streamersGrid.appendChild(card));
  } else {
    sortLiveFirst();
  }

  // Toggle empty state message
  let emptyMsg = streamersGrid.querySelector('.no-results');
  if (visibleCount === 0) {
    if (!emptyMsg) {
      emptyMsg = document.createElement('div');
      emptyMsg.className = 'no-results';
      streamersGrid.appendChild(emptyMsg);
    }
    emptyMsg.textContent = filter === 'live'
      ? 'لا يوجد صناع محتوى يبثون الآن'
      : 'لا توجد نتائج';
  } else if (emptyMsg) {
    emptyMsg.remove();
  }
}

// Wire up the filter tab buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilter(btn.dataset.filter);
  });
});

// Build the cards, set the creators count, run an initial
// check, then keep checking every CHECK_INTERVAL (30 seconds).
creatorsCount.textContent = streamers.length;
renderStreamerCards();
checkAllStreamers();
setInterval(checkAllStreamers, CHECK_INTERVAL);

/* ─────────────────────────────────────────────────────────
   Live Discord member count (hero stat).
   Uses Discord's public invite endpoint (no auth/bot needed):
   GET /api/v9/invites/<code>?with_counts=true
   Falls back to the static "68+" already in the HTML if the
   request fails for any reason (offline, CORS, rate limit...).
───────────────────────────────────────────────────────── */
const DISCORD_INVITE_CODE = 'Cwq7ydvTFr';

async function updateDiscordMemberCount() {
  const el = document.getElementById('discordMemberCount');
  if (!el) return;
  try {
    const res = await fetch(`https://discord.com/api/v9/invites/${DISCORD_INVITE_CODE}?with_counts=true`);
    if (!res.ok) return;
    const data = await res.json();
    if (data && typeof data.approximate_member_count === 'number') {
      el.textContent = data.approximate_member_count.toLocaleString('en-US') + '+';
    }
  } catch (err) {
    // Keep whatever value is already shown (static fallback).
  }
}

updateDiscordMemberCount();
setInterval(updateDiscordMemberCount, 5 * 60 * 1000); // refresh every 5 minutes

// ═══════════════════════════════════════════════
