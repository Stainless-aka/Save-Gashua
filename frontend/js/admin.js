const loginPanel = document.getElementById("login-panel");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("login-form");
const uploadForm = document.getElementById("upload-form");
const galleryGrid = document.getElementById("admin-gallery-grid");
const imageInput = document.getElementById("gallery-image");
const preview = document.getElementById("image-preview");
let selectedImage = "";

async function api(url, options = {}) {
    const response = await fetch(url, {
        credentials: "same-origin",
        ...options,
        headers: { ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...options.headers }
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Something went wrong.");
    return result;
}

function showMessage(element, message, type = "") {
    element.textContent = message;
    element.className = "admin-message " + type;
}

function setAuthenticated(authenticated) {
    loginPanel.hidden = authenticated;
    dashboard.hidden = !authenticated;
}

async function loadGallery() {
    const { images } = await api("/api/admin/gallery");
    document.getElementById("image-count").textContent = images.length + (images.length === 1 ? " image" : " images");
    document.getElementById("empty-gallery").hidden = images.length > 0;
    galleryGrid.replaceChildren();

    images.forEach(item => {
        const card = document.createElement("article");
        card.className = "admin-image-card";
        const image = document.createElement("img");
        image.src = item.image_url;
        image.alt = item.title;
        image.loading = "lazy";
        const content = document.createElement("div");
        content.className = "admin-image-content";
        const title = document.createElement("h3");
        title.textContent = item.title;
        const description = document.createElement("p");
        description.textContent = item.description || "No description provided.";
        const meta = document.createElement("div");
        meta.className = "admin-image-meta " + (item.is_published ? "status-published" : "status-draft");
        meta.textContent = item.is_published ? "Published" : "Hidden";
        const controls = document.createElement("div");
        controls.className = "admin-image-controls";
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.textContent = item.is_published ? "Unpublish" : "Publish";
        toggle.addEventListener("click", async () => {
            toggle.disabled = true;
            try {
                await api("/api/admin/gallery/" + item.id, {
                    method: "PATCH",
                    body: JSON.stringify({ title: item.title, description: item.description, isPublished: !item.is_published })
                });
                await loadGallery();
            } catch (error) { alert(error.message); toggle.disabled = false; }
        });
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "delete-image";
        remove.textContent = "Delete";
        remove.addEventListener("click", async () => {
            if (!confirm("Delete this photograph permanently?")) return;
            remove.disabled = true;
            try {
                await api("/api/admin/gallery/" + item.id, { method: "DELETE" });
                await loadGallery();
            } catch (error) { alert(error.message); remove.disabled = false; }
        });
        controls.append(toggle, remove);
        content.append(title, description, meta, controls);
        card.append(image, content);
        galleryGrid.append(card);
    });
}

loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    const message = document.getElementById("login-message");
    const button = loginForm.querySelector("button");
    button.disabled = true;
    try {
        await api("/api/admin/login", { method: "POST", body: JSON.stringify({ password: loginForm.password.value }) });
        loginForm.reset();
        setAuthenticated(true);
        await loadGallery();
    } catch (error) {
        showMessage(message, error.message, "error");
    } finally { button.disabled = false; }
});

imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    selectedImage = "";
    preview.hidden = true;
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) {
        showMessage(document.getElementById("upload-message"), "Choose a JPG, PNG or WebP image under 8 MB.", "error");
        imageInput.value = "";
        return;
    }
    document.getElementById("file-label").textContent = file.name;
    const reader = new FileReader();
    reader.onload = () => { selectedImage = reader.result; preview.src = selectedImage; preview.hidden = false; };
    reader.readAsDataURL(file);
});

uploadForm.addEventListener("submit", async event => {
    event.preventDefault();
    const message = document.getElementById("upload-message");
    const button = uploadForm.querySelector("button[type=submit]");
    if (!selectedImage) return showMessage(message, "Select an image first.", "error");
    button.disabled = true;
    showMessage(message, "Uploading photograph...");
    try {
        await api("/api/admin/gallery", {
            method: "POST",
            body: JSON.stringify({
                title: uploadForm.title.value,
                description: uploadForm.description.value,
                image: selectedImage
            })
        });
        uploadForm.reset();
        selectedImage = "";
        preview.hidden = true;
        document.getElementById("file-label").textContent = "Choose an image";
        showMessage(message, "Photograph uploaded and published.", "success");
        await loadGallery();
    } catch (error) { showMessage(message, error.message, "error"); }
    finally { button.disabled = false; }
});

document.getElementById("logout-button").addEventListener("click", async () => {
    await api("/api/admin/logout", { method: "POST", body: "{}" });
    setAuthenticated(false);
});

(async function init() {
    try {
        await api("/api/admin/session");
        setAuthenticated(true);
        await loadGallery();
    } catch { setAuthenticated(false); }
})();
