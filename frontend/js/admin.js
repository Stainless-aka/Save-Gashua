const sgClient = window.saveGashuaSupabase;
const loginPanel = document.getElementById("login-panel");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("login-form");
const uploadForm = document.getElementById("upload-form");
const galleryGrid = document.getElementById("admin-gallery-grid");
const imageInput = document.getElementById("gallery-images");
const preview = document.getElementById("image-preview");
const bucket = "save-gashua-gallery";
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
function extensionFor(file) {
    return file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
}
function validateFiles(files) {
    if (!files.length) throw new Error("Choose at least one photograph.");
    if (files.some(file => !ALLOWED_TYPES.includes(file.type))) throw new Error("Only JPG, PNG and WebP images are allowed.");
    if (files.some(file => file.size > MAX_FILE_SIZE)) throw new Error("Each image must be 8 MB or smaller.");
}
async function uploadAlbumImages(albumId, files) {
    const uploadedPaths = [];
    try {
        for (const file of files) {
            const path = "albums/" + albumId + "/" + crypto.randomUUID() + "." + extensionFor(file);
            const { error } = await sgClient.storage.from(bucket).upload(path, file, {
                contentType: file.type, cacheControl: "3600", upsert: false
            });
            if (error) throw error;
            uploadedPaths.push(path);
        }
        const rows = uploadedPaths.map(path => ({
            album_id: albumId,
            storage_path: path,
            image_url: sgClient.storage.from(bucket).getPublicUrl(path).data.publicUrl
        }));
        const { error: insertError } = await sgClient.from("gallery_album_images").insert(rows);
        if (insertError) throw insertError;
        return uploadedPaths;
    } catch (error) {
        if (uploadedPaths.length) await sgClient.storage.from(bucket).remove(uploadedPaths);
        throw error;
    }
}
async function loadGallery() {
    const { data: albums, error } = await sgClient.from("gallery_albums")
        .select("id,title,description,is_published,created_at,gallery_album_images(id,image_url,storage_path,created_at)")
        .order("created_at", { ascending: false });
    if (error) throw error;
    document.getElementById("image-count").textContent =
        albums.reduce((sum, album) => sum + album.gallery_album_images.length, 0) + " photos · " +
        albums.length + (albums.length === 1 ? " album" : " albums");
    document.getElementById("empty-gallery").hidden = albums.length > 0;
    galleryGrid.replaceChildren();

    albums.forEach(album => {
        const photos = album.gallery_album_images || [];
        const card = document.createElement("article");
        card.className = "admin-image-card";
        const cover = document.createElement("img");
        cover.src = photos[0]?.image_url || "";
        cover.alt = album.title;
        cover.loading = "lazy";
        const content = document.createElement("div");
        content.className = "admin-image-content";
        const title = document.createElement("h3");
        title.textContent = album.title;
        const description = document.createElement("p");
        description.textContent = album.description || "No description provided.";
        const count = document.createElement("small");
        count.className = "admin-album-count";
        count.textContent = photos.length + (photos.length === 1 ? " photo" : " photos");
        const status = document.createElement("div");
        status.className = "admin-image-meta " + (album.is_published ? "status-published" : "status-draft");
        status.textContent = album.is_published ? "Published" : "Hidden";

        const controls = document.createElement("div");
        controls.className = "admin-image-controls";
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit album";
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.textContent = album.is_published ? "Unpublish" : "Publish";
        toggle.addEventListener("click", async () => {
            toggle.disabled = true;
            const { error } = await sgClient.from("gallery_albums")
                .update({ is_published: !album.is_published }).eq("id", album.id);
            if (error) { alert("Could not update album: " + error.message); toggle.disabled = false; return; }
            await loadGallery();
        });
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "delete-image";
        remove.textContent = "Delete";
        remove.addEventListener("click", async () => {
            if (!confirm("Delete this album and all its photographs permanently?")) return;
            remove.disabled = true;
            const paths = photos.map(photo => photo.storage_path);
            const { error } = await sgClient.from("gallery_albums").delete().eq("id", album.id);
            if (error) { alert("Could not delete album: " + error.message); remove.disabled = false; return; }
            if (paths.length) {
                const { error: storageError } = await sgClient.storage.from(bucket).remove(paths);
                if (storageError) console.error("Storage cleanup failed:", storageError);
            }
            await loadGallery();
        });
        controls.append(editButton, toggle, remove);

        const editor = document.createElement("form");
        editor.className = "admin-post-editor";
        editor.hidden = true;
        const titleLabel = document.createElement("label");
        titleLabel.textContent = "Album title";
        const titleInput = document.createElement("input");
        titleInput.maxLength = 120;
        titleInput.required = true;
        titleInput.value = album.title;
        titleLabel.append(titleInput);
        const descriptionLabel = document.createElement("label");
        descriptionLabel.textContent = "Description";
        const descriptionInput = document.createElement("textarea");
        descriptionInput.maxLength = 500;
        descriptionInput.rows = 3;
        descriptionInput.value = album.description || "";
        descriptionLabel.append(descriptionInput);

        const currentPhotos = document.createElement("div");
        currentPhotos.className = "admin-current-photos";
        const photosHeading = document.createElement("strong");
        photosHeading.textContent = "Photos in this album";
        currentPhotos.append(photosHeading);
        photos.forEach(photo => {
            const photoRow = document.createElement("div");
            photoRow.className = "admin-edit-photo";
            const thumb = document.createElement("img");
            thumb.src = photo.image_url;
            thumb.alt = album.title;
            const deletePhoto = document.createElement("button");
            deletePhoto.type = "button";
            deletePhoto.textContent = "Remove";
            deletePhoto.addEventListener("click", async () => {
                if (photos.length <= 1) {
                    alert("An album must keep at least one photograph. Delete the album if you want to remove it completely.");
                    return;
                }
                if (!confirm("Remove this photograph from the album?")) return;
                deletePhoto.disabled = true;
                const { error } = await sgClient.from("gallery_album_images").delete().eq("id", photo.id);
                if (error) { alert("Could not remove photograph: " + error.message); deletePhoto.disabled = false; return; }
                const { error: storageError } = await sgClient.storage.from(bucket).remove([photo.storage_path]);
                if (storageError) console.error("Storage cleanup failed:", storageError);
                await loadGallery();
            });
            photoRow.append(thumb, deletePhoto);
            currentPhotos.append(photoRow);
        });
        const addLabel = document.createElement("label");
        addLabel.textContent = "Add more photographs";
        const addInput = document.createElement("input");
        addInput.type = "file";
        addInput.accept = ALLOWED_TYPES.join(",");
        addInput.multiple = true;
        addLabel.append(addInput);
        const actions = document.createElement("div");
        actions.className = "admin-editor-actions";
        const save = document.createElement("button");
        save.type = "submit";
        save.textContent = "Save album";
        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.textContent = "Cancel";
        cancel.addEventListener("click", () => { editor.hidden = true; editButton.hidden = false; });
        actions.append(save, cancel);
        editor.append(titleLabel, descriptionLabel, currentPhotos, addLabel, actions);
        editor.addEventListener("submit", async event => {
            event.preventDefault();
            const files = Array.from(addInput.files || []);
            try { if (files.length) validateFiles(files); } catch (error) { alert(error.message); return; }
            save.disabled = true;
            save.textContent = "Saving...";
            try {
                const { error: updateError } = await sgClient.from("gallery_albums")
                    .update({ title: titleInput.value.trim(), description: descriptionInput.value.trim() })
                    .eq("id", album.id);
                if (updateError) throw updateError;
                if (files.length) await uploadAlbumImages(album.id, files);
                await loadGallery();
            } catch (error) {
                alert("Could not save album: " + error.message);
                save.disabled = false;
                save.textContent = "Save album";
            }
        });
        editButton.addEventListener("click", () => { editor.hidden = false; editButton.hidden = true; titleInput.focus(); });
        content.append(title, description, count, status, controls, editor);
        card.append(cover, content);
        galleryGrid.append(card);
    });
}

async function handleLogin() {
    const message = document.getElementById("login-message");
    const button = document.getElementById("sign-in-button");
    if (!loginForm.reportValidity()) return;
    if (!sgClient) { showMessage(message, "The sign-in service could not load. Refresh and try again.", "error"); return; }
    button.disabled = true;
    showMessage(message, "Signing in...");
    try {
        const { data, error } = await sgClient.auth.signInWithPassword({
            email: loginForm.elements.email.value.trim(),
            password: loginForm.elements.password.value
        });
        if (error) throw error;
        if (!requireAdmin(data.user)) {
            await sgClient.auth.signOut();
            throw new Error("This account does not have administrator access.");
        }
        loginForm.reset();
        setAuthenticated(true);
        await loadGallery();
    } catch (error) {
        showMessage(message, error.message || "Sign in failed.", "error");
    } finally { button.disabled = false; }
}
window.handleAdminLogin = handleLogin;

imageInput.addEventListener("change", () => {
    const files = Array.from(imageInput.files || []);
    document.getElementById("file-label").textContent = files.length
        ? files.length + (files.length === 1 ? " photograph selected" : " photographs selected")
        : "Choose photographs";
    preview.hidden = !files.length;
    if (files.length) preview.src = URL.createObjectURL(files[0]);
});
uploadForm.addEventListener("submit", async event => {
    event.preventDefault();
    const message = document.getElementById("upload-message");
    const button = uploadForm.querySelector('button[type="submit"]');
    const files = Array.from(imageInput.files || []);
    try { validateFiles(files); } catch (error) { showMessage(message, error.message, "error"); return; }
    button.disabled = true;
    showMessage(message, "Creating album and uploading photographs...");
    let albumId = null;
    try {
        const { data: album, error } = await sgClient.from("gallery_albums").insert({
            title: uploadForm.elements.title.value.trim(),
            description: uploadForm.elements.description.value.trim(),
            is_published: true
        }).select("id").single();
        if (error) throw error;
        albumId = album.id;
        await uploadAlbumImages(albumId, files);
        uploadForm.reset();
        preview.removeAttribute("src");
        preview.hidden = true;
        document.getElementById("file-label").textContent = "Choose photographs";
        showMessage(message, "Album created and published with " + files.length + " photographs.", "success");
        await loadGallery();
    } catch (error) {
        if (albumId !== null) await sgClient.from("gallery_albums").delete().eq("id", albumId);
        showMessage(message, error.message || "Album upload failed.", "error");
    } finally { button.disabled = false; }
});
document.getElementById("logout-button").addEventListener("click", async () => {
    const { error } = await sgClient.auth.signOut();
    if (error) { alert("Could not sign out: " + error.message); return; }
    setAuthenticated(false);
});
(async function init() {
    try {
        if (!sgClient) throw new Error("Supabase client did not load. Refresh the page.");
        const { data: { session }, error } = await sgClient.auth.getSession();
        if (error) throw error;
        if (!requireAdmin(session?.user)) { setAuthenticated(false); return; }
        setAuthenticated(true);
        await loadGallery();
    } catch (error) {
        setAuthenticated(false);
        showMessage(document.getElementById("login-message"), error.message || "Could not initialise admin login.", "error");
    }
})();