(async function loadPublicGallery() {
  const grid = document.getElementById("public-gallery-grid");
  const empty = document.getElementById("gallery-empty");
  if (!grid || !empty) return;
  try {
    const { data: images, error } = await window.saveGashuaSupabase.from("gallery_images")
      .select("id,title,description,image_url,created_at").eq("is_published", true).order("created_at", { ascending: false });
    if (error) throw error;
    grid.replaceChildren();
    if (!images.length) { empty.textContent = "New photographs will be shared here as Save Gashua activities take place."; empty.hidden = false; return; }
    images.forEach((item, index) => {
      const figure = document.createElement("figure"); figure.className = "gallery-card";
      const image = document.createElement("img"); image.src = item.image_url; image.alt = item.title; image.loading = "lazy";
      const caption = document.createElement("figcaption");
      const number = document.createElement("span"); number.textContent = String(index + 1).padStart(2, "0");
      const title = document.createElement("strong"); title.textContent = item.title;
      caption.append(number, title); figure.append(image, caption);
      if (item.description) { const p = document.createElement("p"); p.className = "gallery-card-description"; p.textContent = item.description; figure.append(p); }
      grid.append(figure);
    });
    empty.hidden = true;
  } catch (error) { empty.textContent = "Photographs are temporarily unavailable. Please check back soon."; empty.hidden = false; console.error(error); }
})();
