const MIN_ID = 1;
const MAX_ID = 649; // Gen 5 maximum
let currentId = Math.floor(Math.random() * (MAX_ID - MIN_ID + 1)) + MIN_ID;

const infoBox = document.getElementById("info-box");
const statsBox = document.getElementById("stats-box");
const spriteImg = document.getElementById("sprite");
const levelLabel = document.getElementById("level");

const pokemonCache = {};
const nameToId = {};

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
      .map(t => `<img src="assets/types/${t.type.name}.png" alt="${t.type.name}" class="type-icon">`)
      .join(" ");

    const abilities = data.abilities
      .map(a => toTitleCase(a.ability.name.replace("-", " ")))
      .join(", ");
    const forms = data.forms.map(f => toTitleCase(f.name)).join(", ");
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
      <p>Types: ${typesHtml}</p>
      <p>Abilities: ${abilities}</p>
      ${formsHTML}
      <p>Held Items: ${heldItems}</p>
    `;

    statsBox.innerHTML = data.stats.map(
      s => `<p><b>${s.stat.name.toUpperCase()}</b>: ${s.base_stat}</p>`
    ).join("");

    spriteImg.src = `sprites/${dex}.gif`;
    spriteImg.onerror = () => spriteImg.src = "";

    // levelLabel.textContent = `Lv. ${Math.floor(Math.random() * 50) + 1}`;

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
  loadJson("assets/names_to_id_min.json").then(data => {
    Object.assign(nameToId, data);
  });

  loadCompressedJson("assets/pokemon_min.json.gz").then(data => {
    Object.assign(pokemonCache, data);
    showToast("Pokédex Data Loaded");
    console.log("done loading cached data");
  });
});

const body = document.querySelector("body");

document.getElementById("toggle-bg").addEventListener("click", () => {
  body.classList.toggle("bg-scrolling");
});

loadPokemon(currentId);
