(async function loadPublicGallery() {
    const grid = document.getElementById("public-gallery-grid");
    const empty = document.getElementById("gallery-empty");
    if (!grid || !empty) return;
    try {
        const response = await fetch("/api/gallery");
        if (!response.ok) throw new Error("Gallery could not be loaded.");
        const { images } = await response.json();
        grid.replaceChildren();
        if (!images.length) {
            empty.textContent = "New photographs will be shared here as Save Gashua activities take place.";
            return;
        }
        images.forEach((item, index) => {
            const figure = document.createElement("figure");
            figure.className = "gallery-card";
            const image = document.createElement("img");
            image.src = item.image_url;
            image.alt = item.title;
            image.loading = "lazy";
            const caption = document.createElement("figcaption");
            const number = document.createElement("span");
            number.textContent = String(index + 1).padStart(2, "0");
            const title = document.createElement("strong");
            title.textContent = item.title;
            caption.append(number, title);
            figure.append(image, caption);
            if (item.description) {
                const description = document.createElement("p");
                description.className = "gallery-card-description";
                description.textContent = item.description;
                figure.append(description);
            }
            grid.append(figure);
        });
        empty.hidden = true;
    } catch (error) {
        empty.textContent = "Photographs are temporarily unavailable. Please check back soon.";
        console.error(error);
    }
})();
