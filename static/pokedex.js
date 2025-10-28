const MIN_ID = 1;
const MAX_ID = 649; // Gen 5 maximum
let currentId = Math.floor(Math.random() * (MAX_ID - MIN_ID + 1)) + MIN_ID;

const infoBox = document.getElementById("info-box");
const statsBox = document.getElementById("stats-box");
const spriteImg = document.getElementById("sprite");
const levelLabel = document.getElementById("level");

const pokemonCache = {};
const nameToId = {};
const abilityCache = {};

async function loadCompressedJson(url) {
  const res = await fetch(url);
  const compressed = await res.arrayBuffer(); // fetch as binary
  const decompressed = pako.inflate(new Uint8Array(compressed), { to: "string" });
  const data = JSON.parse(decompressed);
  return data;
}

async function loadJson(url) {
  return fetch(url)
          .then(response => response.text())
          .then(data => JSON.parse(data));
}

function showToast(message, duration = 1000) {
  const container = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  // Hide after `duration` ms
  setTimeout(() => {
    toast.classList.remove("show");
    // Remove from DOM after transition
    setTimeout(() => container.removeChild(toast), 300);
  }, duration);
}

function formatId(id) {
  return String(id).padStart(3, "0");
}

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

function removeCommonPrefix(strings) {
  if (!strings.length) return strings;
  let prefix = strings[0];
  for (let i = 1; i < strings.length; i++) {
    while (strings[i].indexOf(prefix) !== 0) {
      prefix = prefix.slice(0, -1);
      if (!prefix) break;
    }
  }
  return strings.map(s => s.slice(prefix.length));
}

async function loadPokemon(id) {
  try {
    let data;

    // Check cache first
    if (pokemonCache[id]) {
      data = pokemonCache[id];
    } else {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      if (!res.ok) throw new Error("Not found");
      data = await res.json();
      pokemonCache[id] = data;
      nameToId[data.name.charAt(0).toUpperCase() + data.name.slice(1)] = id;
    }

    const name = data.name.charAt(0).toUpperCase() + data.name.slice(1);
    const dex = formatId(id);

    // Render type images
    const typesHtml = data.types
      .map(t => `<img src="/dex/static/assets/types/${t.type.name}.png" alt="${t.type.name}" class="type-icon">`)
      .join(" ");

    const abilitiesHtml = await Promise.all(
      data.abilities.map(async (a) => {
        const abilityName = toTitleCase(a.ability.name.replace("-", " "));

        // fetch ability data if not cached
        let abilityData;
        if (abilityCache[a.ability.name]) {
          abilityData = abilityCache[a.ability.name];
        } else {
          const res = await fetch(a.ability.url);
          console.log('requested');
          abilityData = await res.json();
          pokemonCache.abilities = pokemonCache.abilities || {};
          pokemonCache.abilities[a.ability.name] = abilityData;
        }

        const effect = abilityData.effect_entries.find(
          e => e.language.name === "en"
        )?.short_effect || "";

        // wrap ability text and tooltip
        return `<span class="ability">${abilityName}<span class="tooltip">${effect}</span></span>`;
      })
    );
    const abilities = abilitiesHtml.join(", ");

    const cleanedForms = removeCommonPrefix(data.forms.map(f => f.name)).map(f => toTitleCase(f));
    const forms = cleanedForms.join(", ");
    const formsHTML = forms.includes(",") ? `<p>Forms: ${forms}</p>` : '';
    const heldItems = data.held_items
      .map(item => toTitleCase(item.item.name.replace("-", " ")))
      .join(", ") || "None";
    const species = toTitleCase(data.species.name.replace("-", " "));

    infoBox.innerHTML = `
      <p><span class="blue">${name}</span></p>
      <p>National Dex #${dex}</p>
      <p>Height: ${(data.height / 10).toFixed(1)} m</p>
      <p>Weight: ${(data.weight / 10).toFixed(1)} kg</p>
      <p>Type: ${typesHtml}</p>
      ${formsHTML}
      <p>Held Items: ${heldItems}</p>
    `;

    statsBox.innerHTML = `
      <table class="stats-table">
        <tbody>
          ${data.stats.map(s => {
            const statName = s.stat.name.toUpperCase();
            const value = s.base_stat;
            const barWidth = Math.min(value, 180); // cap width
            const hue = 120 * (value / 180); // 0=red, 120=green
            return `
              <tr>
                <td class="stat-name">${statName}</td>
                <td class="stat-bar">
                  <div class="bar-bg">
                    <div class="bar-fill"
                        data-width="${barWidth}px"
                        style="width: 0; background-color: hsl(${hue}, 70%, 45%)">
                    </div>
                  </div>
                </td>
                <td class="stat-value">${value}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
      <p>Abilities: ${abilities}</p>
    `;

    // Trigger the animation *after* insertion
    requestAnimationFrame(() => {
      document.querySelectorAll('.bar-fill').forEach(bar => {
        bar.offsetWidth;
        bar.style.width = bar.dataset.width;
      });
    });

    spriteImg.src = `/dex/static/assets/sprites/${dex}.gif`;
    spriteImg.onerror = () => spriteImg.src = "";

    // ===== OVERWORLD SPRITE =====
    const overworldContainer = spriteImg.parentElement;
    let overworldDirIndex = 0;
    const overworldDirs = ["down", "left", "up", "right"];

    let overworldImg = document.getElementById("overworld");
    if (!overworldImg) {
      overworldImg = document.createElement("img");
      overworldImg.id = "overworld";
      overworldImg.className = "overworld-sprite";
      overworldContainer.appendChild(overworldImg);
    }

    function updateOverworldSprite() {
      const direction = overworldDirs[overworldDirIndex];
      overworldImg.src = `/dex/static/assets/overworld_sprites/${name.toLowerCase().replace('-', '_')}_${direction == "right" ? "left" : direction}.gif`;
      overworldImg.style.transform = direction === "right" ? "scaleX(-1)" : "";
    }

    overworldImg.onclick = () => {
      overworldDirIndex = (overworldDirIndex + 1) % overworldDirs.length;
      updateOverworldSprite();
    };

    updateOverworldSprite();

  } catch (e) {
    console.error(e);
    infoBox.innerHTML = `<p>Pokémon #${id} not found</p>`;
    statsBox.innerHTML = "";
    spriteImg.src = "";
  }
}


document.getElementById("next").addEventListener("click", () => {
  currentId = (currentId % MAX_ID) + 1;
  loadPokemon(currentId);
});

document.getElementById("prev").addEventListener("click", () => {
  currentId = (currentId - 2 + MAX_ID) % MAX_ID + 1;
  loadPokemon(currentId);
});

document.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") document.getElementById("next").click();
  if (e.key === "ArrowLeft") document.getElementById("prev").click();
});

// ===== SEARCH BAR =====
const searchInput = document.getElementById("search");
searchInput.addEventListener("keydown", async e => {
  if (e.key === "Enter") {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return;

    // numeric query → load directly
    if (!isNaN(query)) {
      currentId = parseInt(query);
      await loadPokemon(currentId);
    } else {
      // name query → fetch its numeric ID first
      if (nameToId[query]) {
        loadPokemon(nameToId[query]);
      } else {
        try {
          const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
          if (!res.ok) throw new Error("Not found");
          const data = await res.json();
          currentId = data.id;
          await loadPokemon(currentId);
        } catch {
          infoBox.innerHTML = `<p>Pokémon "${query}" not found</p>`;
          statsBox.innerHTML = "";
          spriteImg.src = "";
        }
      }
    }

    searchInput.value = "";
  }
});

document.getElementById("random").addEventListener("click", () => {
  currentId = Math.floor(Math.random() * (MAX_ID - MIN_ID + 1)) + MIN_ID;
  loadPokemon(currentId);
});

document.getElementById("load-all-mons").addEventListener("click", () => {
  showToast("Loading Pokédex Data...");

  loadJson("/dex/static/assets/names_to_id_min.json").then(data => {
    Object.assign(nameToId, data);
  });

  loadJson("/dex/static/assets/abilities_min.json").then(data => {
    Object.assign(abilityCache, data);
  });

  loadCompressedJson("/dex/static/assets/pokemon_min.json.gz").then(data => {
    Object.assign(pokemonCache, data);
    showToast("Pokédex Data Loaded");
    console.log("done loading cached data");
  });

  document.getElementById("load-all-mons").disabled = "disabled";
});

const body = document.querySelector("body");

document.getElementById("toggle-bg").addEventListener("click", () => {
  body.classList.toggle("bg-scrolling");
});

// ===== MAGNIFIER POPUP =====
let zoomPopup = document.createElement("div");
zoomPopup.id = "zoom-popup";
zoomPopup.style.display = "none";
zoomPopup.innerHTML = `<div id="zoom-lens"></div>`;
document.body.appendChild(zoomPopup);

const zoomLens = document.getElementById("zoom-lens");

spriteImg.addEventListener("mouseenter", () => {
  zoomPopup.style.display = "block";
});

let zoom = 2;
let lastMouseEvent = null;

spriteImg.addEventListener("wheel", e => {
  e.preventDefault();
  // Adjust zoom based on scroll direction
  zoom += e.deltaY < 0 ? 0.5 : -0.5;
  zoom = Math.max(1.5, Math.min(zoom, 10)); // Clamp zoom between 1x and 10x
  if (lastMouseEvent) spriteImg.dispatchEvent(new MouseEvent("mousemove", lastMouseEvent));
});

spriteImg.addEventListener("mousemove", e => {
  lastMouseEvent = e;
  const rect = spriteImg.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const lensSize = 128; // area to magnify

  // Move popup near cursor
  zoomPopup.style.left = e.pageX + 20 + "px";
  zoomPopup.style.top = e.pageY + 20 + "px";

  // Update lens background to zoom in on cursor area
  zoomLens.style.backgroundImage = `url(${spriteImg.src})`;
  zoomLens.style.backgroundRepeat = "no-repeat";
  zoomLens.style.backgroundSize = `${spriteImg.width * zoom}px ${spriteImg.height * zoom}px`;
  zoomLens.style.backgroundPosition = `-${x * zoom - lensSize / 2}px -${y * zoom - lensSize / 2}px`;
});

spriteImg.addEventListener("mouseleave", () => {
  zoomPopup.style.display = "none";
});



loadPokemon(currentId);
