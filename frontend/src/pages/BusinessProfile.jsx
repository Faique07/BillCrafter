import React, { useEffect, useState } from "react";
import {
  businessProfileStyles,
  iconColors,
  customStyles,
} from "../assets/dummyStyles";
import { useAuth, useUser } from "@clerk/clerk-react";

const API_BASE = "http://localhost:4000";

//icons
const UploadIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const ImageIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const DeleteIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const SaveIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);
const ResetIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

// will fetch the image coming from our server side

function resolveImageUrl(url) {
  if (!url) return null;
  const s = String(url).trim();

  // keep blob/object URLs and data URIs as-is
  if (s.startsWith("blob:") || s.startsWith("data:")) return s;

  // absolute http(s) -> if localhost/127.0.0.1, rewrite to API_BASE
  if (/^https?:\/\//i.test(s)) {
    try {
      const parsed = new URL(s);
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
        const path =
          parsed.pathname + (parsed.search || "") + (parsed.hash || "");
        return `${API_BASE.replace(/\/+$/, "")}${path}`;
      }
      return parsed.href;
    } catch (e) {
      // fall through to relative handling
    }
  }

  // relative path like "/uploads/..." or "uploads/..." -> prefix with API_BASE
  return `${API_BASE.replace(/\/+$/, "")}/${s.replace(/^\/+/, "")}`;
}

const BusinessProfile = () => {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();

  const [meta, setMeta] = useState({});
  const [saving, setSaving] = useState(false);

  // CONDENSED file / preview state
  const [files, setFiles] = useState({
    logo: null,
    stamp: null,
    signature: null,
  });
  const [previews, setPreviews] = useState({
    logo: null,
    stamp: null,
    signature: null,
  });

  // helper: safely get token (tries forceRefresh once)
  async function getAuthToken() {
    if (typeof getToken !== "function") return null;
    try {
      let t = await getToken({ template: "default" }).catch(() => null);
      if (!t) t = await getToken({ forceRefresh: true }).catch(() => null);
      return t;
    } catch {
      return null;
    }
  }

  // fetch user profile if saved previously
  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      if (!isSignedIn) return;
      const token = await getAuthToken();
      if (!token) {
        console.warn("No auth token available — cannot fetch BusinessProfile");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/businessProfile/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          if (res.status !== 204 && res.status !== 401)
            console.error("Failed to fetch business profile:", res.status);
          return;
        }

        const json = await res.json().catch(() => null);
        const data = json?.data;
        if (!data || !mounted) return;

        const serverMeta = {
          businessName: data.businessName ?? "",
          email: data.email ?? "",
          address: data.address ?? "",
          phone: data.phone ?? "",
          gst: data.gst ?? "",
          logoUrl: data.logoUrl ?? null,
          stampUrl: data.stampUrl ?? null,
          signatureUrl: data.signatureUrl ?? null,
          signatureOwnerName: data.signatureOwnerName ?? "",
          signatureOwnerTitle: data.signatureOwnerTitle ?? "",
          defaultTaxPercent: data.defaultTaxPercent ?? 18,
          notes: data.notes ?? "",
          profileId: data._id ?? data.id ?? null,
        };

        setMeta(serverMeta);
        setPreviews((p) => ({
          ...p,
          logo: resolveImageUrl(serverMeta.logoUrl),
          stamp: resolveImageUrl(serverMeta.stampUrl),
          signature: resolveImageUrl(serverMeta.signatureUrl),
        }));
      } catch (err) {
        console.error("Error fetching business profile:", err);
      }
    }

    fetchProfile();

    return () => {
      mounted = false;
      // revoke any object URLs created locally
      Object.values(previews).forEach((u) => {
        if (u && typeof u === "string" && u.startsWith("blob:")) {
          URL.revokeObjectURL(u);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, getToken]);

  function updateMeta(field, value) {
    setMeta((m) => ({ ...m, [field]: value }));
  }

  // file handling for logo stamp and signature
  // file handling helpers: kind = "logo" | "stamp" | "signature"
  function handleLocalFilePick(kind, file) {
    if (!file) return;
    // revoke previous object URL if we created it
    const prev = previews[kind];
    if (prev && typeof prev === "string" && prev.startsWith("blob:")) {
      URL.revokeObjectURL(prev);
    }

    const objUrl = URL.createObjectURL(file);
    setFiles((f) => ({ ...f, [kind]: file }));
    setPreviews((p) => ({ ...p, [kind]: objUrl }));
    updateMeta(
      kind === "logo"
        ? "logoUrl"
        : kind === "stamp"
          ? "stampUrl"
          : "signatureUrl",
      objUrl,
    );
  }

  //you can remove the preview file by this function if you want to change it or remove it
  function removeLocalFile(kind) {
    const prev = previews[kind];
    if (prev && typeof prev === "string" && prev.startsWith("blob:")) {
      URL.revokeObjectURL(prev);
    }
    setFiles((f) => ({ ...f, [kind]: null }));
    setPreviews((p) => ({ ...p, [kind]: null }));
    updateMeta(
      kind === "logo"
        ? "logoUrl"
        : kind === "stamp"
          ? "stampUrl"
          : "signatureUrl",
      null,
    );
  }

  //to save the business profile in DB
  async function handleSave(e) {
    e?.preventDefault();
    setSaving(true);

    try {
      const token = await getAuthToken();
      if (!token) {
        alert("You must be signed in to save your business profile.");
        return;
      }

      const fd = new FormData();
      fd.append("businessName", meta.businessName || "");
      fd.append("email", meta.email || "");
      fd.append("address", meta.address || "");
      fd.append("phone", meta.phone || "");
      fd.append("gst", meta.gst || "");
      fd.append("defaultTaxPercent", String(meta.defaultTaxPercent ?? 18));
      fd.append("signatureOwnerName", meta.signatureOwnerName || "");
      fd.append("signatureOwnerTitle", meta.signatureOwnerTitle || "");
      fd.append("notes", meta.notes || "");

      // Respect original field names expected by server
      if (files.logo) fd.append("logoName", files.logo);
      else if (meta.logoUrl) fd.append("logoUrl", meta.logoUrl);

      if (files.stamp) fd.append("stampName", files.stamp);
      else if (meta.stampUrl) fd.append("stampUrl", meta.stampUrl);

      if (files.signature) fd.append("signatureNameMeta", files.signature);
      else if (meta.signatureUrl) fd.append("signatureUrl", meta.signatureUrl);

      const profileId = meta.profileId;
      const url = profileId
        ? `${API_BASE}/api/businessProfile/${profileId}` //edit route
        : `${API_BASE}/api/businessProfile`; // creation route
      const method = profileId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.message || `Save failed (${res.status})`;
        throw new Error(msg);
      }

      const saved = json?.data || json;
      const merged = {
        ...meta,
        businessName: saved.businessName ?? meta.businessName,
        email: saved.email ?? meta.email,
        address: saved.address ?? meta.address,
        phone: saved.phone ?? meta.phone,
        gst: saved.gst ?? meta.gst,
        logoUrl: saved.logoUrl ?? meta.logoUrl,
        stampUrl: saved.stampUrl ?? meta.stampUrl,
        signatureUrl: saved.signatureUrl ?? meta.signatureUrl,
        signatureOwnerName: saved.signatureOwnerName ?? meta.signatureOwnerName,
        signatureOwnerTitle:
          saved.signatureOwnerTitle ?? meta.signatureOwnerTitle,
        defaultTaxPercent: saved.defaultTaxPercent ?? meta.defaultTaxPercent,
        notes: saved.notes ?? meta.notes,
        profileId: saved._id ?? meta.profileId ?? saved.id ?? meta.profileId,
      };

      setMeta(merged); //saved in the DB

      if (saved.logoUrl)
        setPreviews((p) => ({ ...p, logo: resolveImageUrl(saved.logoUrl) }));
      if (saved.stampUrl)
        setPreviews((p) => ({ ...p, stamp: resolveImageUrl(saved.stampUrl) }));
      if (saved.signatureUrl)
        setPreviews((p) => ({
          ...p,
          signature: resolveImageUrl(saved.signatureUrl),
        }));

      alert(`Profile ${profileId ? "updated" : "created"} successfully.`);
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert(err?.message || "Failed to save profile. See console for details.");
    } finally {
      setSaving(false);
    }
  }

  // to remove the profile the image saved in the uploads will get deleted
  function handleClearProfile() {
    if (
      !confirm(
        "Clear current profile data? This will remove local changes and previews.",
      )
    )
      return;
    // revoke any object URLs created locally
    Object.values(previews).forEach((u) => {
      if (u && typeof u === "string" && u.startsWith("blob:")) {
        URL.revokeObjectURL(u);
      }
    });
    setMeta({});
    setFiles({ logo: null, stamp: null, signature: null });
    setPreviews({ logo: null, stamp: null, signature: null });
  }

  return (
    <div className={businessProfileStyles.pageContainer}>
      <div className={businessProfileStyles.headerContainer}>
        <h1 className={businessProfileStyles.headerTitle}>Business Profile</h1>
        <p className={businessProfileStyles.headerSubtitle}>
          Configure you company detail, branding assets and invoice defaults
        </p>
        {!isSignedIn && (
          <div
            style={{
              marginTop: 12,
              color: "#92400e",
              background: "#fff7ed",
              padding: 10,
              borderRadius: 8,
            }}
          >
            You are not signed in - changes cannot be saved. Please sign in to
            load your business profile
          </div>
        )}
      </div>

      <form
        onSubmit={handleSave}
        className={businessProfileStyles.pageContainer}
      >
        {/* business info */}
        <div className={businessProfileStyles.cardContainer}>
          <div className={businessProfileStyles.cardHeaderContainer}>
            <div
              className={`${businessProfileStyles.cardIconContainer} ${iconColors.business}`}
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8v-4m0 4h4" />
              </svg>
            </div>
            <h2 className={businessProfileStyles.cardTitle}>
              Business Information
            </h2>
            </div>
            <div className={businessProfileStyles.gridCols2}>
              <div>
                <label className={businessProfileStyles.label}>
                  Business Name
                </label>
                <input
                  className={businessProfileStyles.input}
                  value={meta.businessName || ""}
                  onChange={(e) => updateMeta("businessName", e.target.value)}
                  placeholder="Enter your business name"
                />
              </div>

              <div>
                <label className={businessProfileStyles.label}>
                  Business Email
                </label>
                <input
                  className={businessProfileStyles.input}
                  value={meta.email || ""}
                  onChange={(e) => updateMeta("email", e.target.value)}
                  placeholder="business@example.com"
                />
              </div>
              <div className={businessProfileStyles.gridColSpan2}>
                <label className={businessProfileStyles.label}>Address</label>
                <textarea
                  rows={3}
                  className={businessProfileStyles.textarea}
                  value={meta.address || ""}
                  onChange={(e) => updateMeta("address", e.target.value)}
                  placeholder="Enter your business address"
                ></textarea>
              </div>
              <div>
                <label className={businessProfileStyles.label}>
                  Phone
                </label>
                <input
                  className={businessProfileStyles.input}
                  value={meta.phone || ""}
                  onChange={(e) => updateMeta("phone", e.target.value)}
                  placeholder="+91-8053096283"
                />
              </div>
              <div>
                <label className={businessProfileStyles.label}>
                  GST Number
                </label>
                <input
                  className={businessProfileStyles.input}
                  value={meta.gst || ""}
                  onChange={(e) => updateMeta("gst", e.target.value)}
                  placeholder="07ABCDE1234F1Z5"
                />
              </div>
            </div>
          </div>
          {/*Branding and Defaults*/}
      </form>
    </div>
  );
};

export default BusinessProfile;
