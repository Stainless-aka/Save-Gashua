(async function loadPublicGallery() {
  const grid = document.getElementById("public-gallery-grid");
  const empty = document.getElementById("gallery-empty");
  const lightbox = document.getElementById("gallery-lightbox");
  const lightboxImage = document.getElementById("lightbox-image");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const closeButton = document.getElementById("lightbox-close");
  const previousButton = document.getElementById("lightbox-previous");
  const nextButton = document.getElementById("lightbox-next");
  if (!grid || !empty || !lightbox) return;

  let activePhotos = [];
  let activeIndex = 0;
  let lastFocused = null;

  function showPhoto(index) {
    if (!activePhotos.length) return;
    activeIndex = (index + activePhotos.length) % activePhotos.length;
    const photo = activePhotos[activeIndex];
    lightboxImage.src = photo.image_url;
    lightboxImage.alt = photo.albumTitle;
    lightboxCaption.textContent = photo.albumTitle + " · " + (activeIndex + 1) + " of " + activePhotos.length;
    previousButton.disabled = activePhotos.length < 2;
    nextButton.disabled = activePhotos.length < 2;
  }
  function openViewer(photos, index) {
    activePhotos = photos;
    lastFocused = document.activeElement;
    showPhoto(index);
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    closeButton.focus();
  }
  function closeViewer() {
    lightbox.hidden = true;
    lightboxImage.removeAttribute("src");
    document.body.classList.remove("lightbox-open");
    if (lastFocused) lastFocused.focus();
  }
  closeButton.addEventListener("click", closeViewer);
  previousButton.addEventListener("click", () => showPhoto(activeIndex - 1));
  nextButton.addEventListener("click", () => showPhoto(activeIndex + 1));
  lightbox.addEventListener("click", event => { if (event.target === lightbox) closeViewer(); });
  document.addEventListener("keydown", event => {
    if (lightbox.hidden) return;
    if (event.key === "Escape") closeViewer();
    if (event.key === "ArrowLeft") showPhoto(activeIndex - 1);
    if (event.key === "ArrowRight") showPhoto(activeIndex + 1);
  });

  try {
    const { data: albums, error } = await window.saveGashuaSupabase.from("gallery_albums")
      .select("id,title,description,created_at,gallery_album_images(id,image_url,created_at)")
      .eq("is_published", true).order("created_at", { ascending: false });
    if (error) throw error;
    grid.replaceChildren();
    if (!albums.length) {
      empty.textContent = "New photographs will be shared here as Save Gashua activities take place.";
      empty.hidden = false;
      return;
    }
    albums.forEach((album, albumIndex) => {
      const photos = (album.gallery_album_images || []).slice()
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map(photo => ({ ...photo, albumTitle: album.title }));
      if (!photos.length) return;
      const section = document.createElement("article");
      section.className = "gallery-album";
      const heading = document.createElement("div");
      heading.className = "gallery-album-heading";
      const title = document.createElement("h3");
      title.textContent = album.title;
      const count = document.createElement("span");
      count.textContent = photos.length + (photos.length === 1 ? " photo" : " photos");
      heading.append(title, count);
      section.append(heading);
      if (album.description) {
        const description = document.createElement("p");
        description.className = "gallery-album-description";
        description.textContent = album.description;
        section.append(description);
      }
      const photoGrid = document.createElement("div");
      photoGrid.className = "gallery-album-photos";
      photos.forEach((photo, photoIndex) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "gallery-photo-button";
        button.setAttribute("aria-label", "View " + album.title + " photograph " + (photoIndex + 1));
        const image = document.createElement("img");
        image.src = photo.image_url;
        image.alt = album.title;
        image.loading = "lazy";
        button.append(image);
        button.addEventListener("click", () => openViewer(photos, photoIndex));
        photoGrid.append(button);
      });
      section.append(photoGrid);
      grid.append(section);
    });
    empty.hidden = grid.children.length > 0;
  } catch (error) {
    empty.textContent = "Photographs are temporarily unavailable. Please check back soon.";
    empty.hidden = false;
    console.error(error);
  }
})();