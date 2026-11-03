const supabase = window.saveGashuaSupabase;
const loginPanel = document.getElementById("login-panel");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("login-form");
const uploadForm = document.getElementById("upload-form");
const galleryGrid = document.getElementById("admin-gallery-grid");
const imageInput = document.getElementById("gallery-image");
const preview = document.getElementById("image-preview");
const bucket = "save-gashua-gallery";
let selectedFile = null;

function showMessage(element, message, type = "") {
    element.textContent = message;
    element.className = "admin-message " + type;
}

function setAuthenticated(authenticated) {
    loginPanel.hidden = authenticated;
    dashboard.hidden = !authenticated;
}

function requireAdmin(user) {
    return Boolean(user && user.app_metadata && user.app_metadata.role === "admin");
}

async function loadGallery() {
    const { data: images, error } = await supabase
        .from("gallery_images")
        .select("id,title,description,image_url,storage_path,is_published,created_at")
        .order("created_at", { ascending: false });
    if (error) throw error;

    document.getElementById("image-count").textContent =
        images.length + (images.length === 1 ? " image" : " images");
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
            const { error } = await supabase.from("gallery_images")
                .update({ is_published: !item.is_published }).eq("id", item.id);
            if (error) {
                alert("Could not update photograph: " + error.message);
                toggle.disabled = false;
                return;
            }
            await loadGallery();
        });

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "delete-image";
        remove.textContent = "Delete";
        remove.addEventListener("click", async () => {
            if (!confirm("Delete this photograph permanently?")) return;
            remove.disabled = true;
            const { error: rowError } = await supabase.from("gallery_images").delete().eq("id", item.id);
            if (rowError) {
                alert("Could not delete photograph: " + rowError.message);
                remove.disabled = false;
                return;
            }
            const { error: fileError } = await supabase.storage.from(bucket).remove([item.storage_path]);
            if (fileError) console.error("Image file cleanup failed:", fileError);
            await loadGallery();
        });

        controls.append(toggle, remove);
        content.append(title, description, meta, controls);
        card.append(image, content);
        galleryGrid.append(card);
    });
}

async function handleLogin() {
    const message = document.getElementById("login-message");
    const button = document.getElementById("sign-in-button");
    if (!loginForm.reportValidity()) return;

    if (!supabase) {
        showMessage(message, "The sign-in service could not load. Refresh the page and try again.", "error");
        return;
    }

    button.disabled = true;
    showMessage(message, "Signing in...");
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: loginForm.elements.email.value.trim(),
            password: loginForm.elements.password.value
        });
        if (error) throw error;
        if (!requireAdmin(data.user)) {
            await supabase.auth.signOut();
            throw new Error("This account does not have administrator access.");
        }
        loginForm.reset();
        setAuthenticated(true);
        await loadGallery();
    } catch (error) {
        showMessage(message, error.message || "Sign in failed.", "error");
    } finally {
        button.disabled = false;
    }
}

document.getElementById("sign-in-button").addEventListener("click", handleLogin);
loginForm.addEventListener("submit", event => {
    event.preventDefault();
    handleLogin();
});

imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    selectedFile = null;
    preview.hidden = true;
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) {
        showMessage(document.getElementById("upload-message"), "Choose a JPG, PNG or WebP image under 8 MB.", "error");
        imageInput.value = "";
        return;
    }
    selectedFile = file;
    document.getElementById("file-label").textContent = file.name;
    preview.src = URL.createObjectURL(file);
    preview.hidden = false;
});

uploadForm.addEventListener("submit", async event => {
    event.preventDefault();
    const message = document.getElementById("upload-message");
    const button = uploadForm.querySelector('button[type="submit"]');
    if (!selectedFile) return showMessage(message, "Select an image first.", "error");

    button.disabled = true;
    showMessage(message, "Uploading photograph...");
    const extension = selectedFile.type === "image/png" ? "png" :
        selectedFile.type === "image/webp" ? "webp" : "jpg";
    const storagePath = "gallery/" + crypto.randomUUID() + "." + extension;

    try {
        const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, selectedFile, {
            contentType: selectedFile.type,
            cacheControl: "3600",
            upsert: false
        });
        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(storagePath);
        const { error: insertError } = await supabase.from("gallery_images").insert({
            title: uploadForm.elements.title.value.trim(),
            description: uploadForm.elements.description.value.trim(),
            image_url: publicUrl.publicUrl,
            storage_path: storagePath,
            is_published: true
        });
        if (insertError) {
            await supabase.storage.from(bucket).remove([storagePath]);
            throw insertError;
        }

        uploadForm.reset();
        selectedFile = null;
        preview.removeAttribute("src");
        preview.hidden = true;
        document.getElementById("file-label").textContent = "Choose an image";
        showMessage(message, "Photograph uploaded and published.", "success");
        await loadGallery();
    } catch (error) {
        showMessage(message, error.message || "Upload failed.", "error");
    } finally {
        button.disabled = false;
    }
});

document.getElementById("logout-button").addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        alert("Could not sign out: " + error.message);
        return;
    }
    setAuthenticated(false);
});

(async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!requireAdmin(user)) {
        setAuthenticated(false);
        return;
    }
    setAuthenticated(true);
    try {
        await loadGallery();
    } catch (error) {
        alert("Could not load gallery: " + error.message);
    }
})();
