"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getAdmin } from "./auth";
import { RESOURCES, IMAGE_COLUMNS, type Resource } from "./resources";
import { serverClient, serviceClient } from "../supabase/clients";
import { copyObject, deleteObject } from "../r2";
import { validTz, zonedToUtcISO } from "../time";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type R = { ok: true; id?: string; message?: string } | { ok: false; error?: string; errors?: Record<string, string>; needsDecision?: boolean; count?: number };

const refresh = () => { revalidateTag("menu"); revalidatePath("/"); revalidatePath("/admin"); revalidatePath("/admin/[resource]"); };
const need = async () => { const a = await getAdmin(); if (!a) throw new Error("UNAUTH"); return a; };
const fail = (e: any): R => {
  console.error(JSON.stringify({ level: "error", where: "admin-action", msg: String(e?.message || e) }));
  return { ok: false, error: e?.message === "UNAUTH" ? "Your session ended. Sign in again." : "Something went wrong. Try again." };
};
const dbMsg = (e: any) => {
  console.error("DB error:", e);
  return (
    e?.code === "23505" ? "That name is already used. Choose another." :
    e?.code === "23503" ? "This is linked to other content. Remove or reassign that first." :
    e?.code === "23514" ? "A value is out of range. Check prices, dates and times." :
    e?.code === "23502" ? `A required field (${e?.column || "field"}) was missing.` :
    e?.code === "42501" ? "You do not have permission to do this." :
    (e?.message || "Could not save. Try again.")
  );
};
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "category";

function validate(res: Resource, input: Record<string, any>, tz: string) {
  const values: Record<string, any> = {}, errors: Record<string, string> = {};
  for (const f of res.fields) {
    const raw = input[f.name], empty = raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "");
    const bad = (m: string) => { errors[f.name] = m; };
    if (f.type === "bool") { values[f.name] = !!raw; continue; }
    if (f.type === "tags") { values[f.name] = Array.from(new Set(((Array.isArray(raw) ? raw : []) as any[]).map((x) => String(x).trim().slice(0, 40)).filter(Boolean))).slice(0, 30); continue; }
    if (f.type === "variants") {
      const out: any[] = [];
      for (const v of (Array.isArray(raw) ? raw : []) as any[]) {
        const name = String(v?.name ?? "").trim(); if (!name) continue;
        const price = Number(v?.price); if (!Number.isFinite(price) || price < 0) { bad("Every size or add-on needs a price of 0 or more."); break; }
        out.push({ name: name.slice(0, 60), price, kind: v?.kind === "addon" ? "addon" : "size" });
      }
      values[f.name] = out.slice(0, 30); continue;
    }
    if (empty) {
      if (f.required) bad(`${f.label} is required.`);
      values[f.name] = f.type === "select" && f.numeric ? 0 : (f.name === "link_section" ? "menu" : null);
      if (f.name === "currency") values[f.name] = "";
      if (f.name === "timezone") values[f.name] = "Asia/Dubai";
      continue;
    }
    const s = String(raw).trim();
    if (f.type === "number") { const n = Number(s); if (!Number.isFinite(n)) bad(`Enter a number for ${f.label}.`); else if (f.min !== undefined && n < f.min) bad(`${f.label} must be at least ${f.min}.`); else if (f.max !== undefined && n > f.max) bad(`${f.label} is too large.`); else values[f.name] = Math.round(n * 100) / 100; }
    else if (f.type === "select") { if (f.choices && !f.choices.some((c) => c.value === s)) bad(`Pick a valid ${f.label.toLowerCase()}.`); else values[f.name] = f.numeric ? Number(s) : s; }
    else if (f.type === "image") { if (!/^[a-z]+\/[\w-]+\.(webp|jpg|png|avif)$/.test(s)) bad("That image is not valid. Upload it again."); else values[f.name] = s; }
    else if (f.type === "datetime") { const iso = zonedToUtcISO(s, tz); if (!iso) bad(`${f.label} is not a valid date and time.`); else values[f.name] = iso; }
    else if (f.type === "date") { if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) bad(`${f.label} is not a valid date.`); else values[f.name] = s; }
    else if (f.type === "time") { if (!/^\d{2}:\d{2}/.test(s)) bad(`${f.label} is not a valid time.`); else values[f.name] = s.slice(0, 5); }
    else { if (f.validate === "timezone" && !validTz(s)) bad("Unknown timezone. Example: Asia/Dubai."); else values[f.name] = s.slice(0, f.type === "textarea" ? 4000 : 300); }
  }
  if (res.range) { const [a, b] = res.range; if (values[a] && values[b] && values[b] <= values[a]) errors[b] = "The end must be after the start."; }
  return { values, errors };
}

async function keyUsed(sb: any, key: string) {
  for (const { table, column } of IMAGE_COLUMNS) {
    const { count } = await sb.from(table).select("*", { count: "exact", head: true }).eq(column, key);
    if (count) return true;
  }
  return false;
}
async function release(sb: any, key: string) {
  if (await keyUsed(sb, key)) return;
  try { await deleteObject(key); } catch (e) { console.error(JSON.stringify({ level: "warn", msg: "r2 delete failed", key })); }
  await sb.from("images").delete().eq("object_key", key);
}
async function syncImages(sb: any, res: Resource, values: any, old: any) {
  for (const f of res.fields.filter((x) => x.type === "image")) {
    if (values[f.name]) await sb.from("images").update({ status: "active" }).eq("object_key", values[f.name]);
    if (old?.[f.name] && old[f.name] !== values[f.name]) await release(sb, old[f.name]);
  }
}
async function nextOrder(sb: any, table: string) {
  const { data } = await sb.from(table).select("sort_order").order("sort_order", { ascending: false }).limit(1);
  return (data?.[0]?.sort_order ?? 0) + 10;
}
async function insertRow(sb: any, res: Resource, values: any): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const slugged = res.table === "categories", base = slugged ? slugify(values.name) : "";
  for (let i = 0; i < 4; i++) {
    const row = slugged ? { ...values, slug: i ? `${base}-${Math.random().toString(36).slice(2, 6)}` : base } : values;
    const { data, error } = await sb.from(res.table).insert(row).select("id").single();
    if (!error) return { ok: true, id: data.id };
    if (!(slugged && error.code === "23505")) return { ok: false, error: dbMsg(error) };
  }
  return { ok: false, error: "Could not create a unique link name. Rename it and try again." };
}

export async function saveRow(slug: string, id: string | null, input: Record<string, any>): Promise<R> {
  try {
    const { sb } = await need(); const res = RESOURCES[slug]; if (!res) return { ok: false, error: "Unknown section." };
    const { data: st } = await sb.from("restaurant_settings").select("timezone").eq("id", 1).maybeSingle();
    const { values, errors } = validate(res, input, st?.timezone || "Asia/Dubai");
    if (Object.keys(errors).length) return { ok: false, errors, error: "Please fix the highlighted fields." };
    let old: any = null; if (id && !res.singleton) old = (await sb.from(res.table).select("*").eq("id", id).maybeSingle()).data;
    if (res.singleton) {
      old = (await sb.from(res.table).select("*").eq("id", 1).maybeSingle()).data;
      const { error } = await sb.from(res.table).upsert({ id: 1, ...values });
      if (error) {
        console.error("Settings save error:", error);
        return { ok: false, error: dbMsg(error) };
      }
    }
    else if (id) { const { error } = await sb.from(res.table).update(values).eq("id", id); if (error) return { ok: false, error: dbMsg(error) }; }
    else { if (res.sortable) values.sort_order = await nextOrder(sb, res.table); const r = await insertRow(sb, res, values); if (!r.ok) return r; id = r.id; }
    await syncImages(sb, res, values, old); refresh();
    return { ok: true, id: id ?? undefined, message: "Saved." };
  } catch (e) { return fail(e); }
}

export async function toggleField(slug: string, id: string, field: string, value: boolean): Promise<R> {
  try {
    const { sb } = await need(); const res = RESOURCES[slug];
    if (!res || !res.toggles.some((t) => t.field === field)) return { ok: false, error: "Not allowed." };
    const { error } = await sb.from(res.table).update({ [field]: value }).eq("id", id); if (error) return { ok: false, error: dbMsg(error) };
    refresh(); return { ok: true };
  } catch (e) { return fail(e); }
}

export async function bulkSet(slug: string, ids: string[], patch: { field: string; value: any }): Promise<R> {
  try {
    const { sb } = await need(); const res = RESOURCES[slug]; if (!res || !res.bulk || !ids.length) return { ok: false, error: "Nothing selected." };
    let set: Record<string, any>;
    if (res.toggles.some((t) => t.field === patch.field)) set = { [patch.field]: !!patch.value };
    else if (patch.field === "category_id" && typeof patch.value === "string") set = { category_id: patch.value };
    else if (patch.field === "archived") set = { archived_at: patch.value ? new Date().toISOString() : null };
    else return { ok: false, error: "Not allowed." };
    const { error } = await sb.from(res.table).update(set).in("id", ids); if (error) return { ok: false, error: dbMsg(error) };
    refresh(); return { ok: true, message: `Updated ${ids.length}.` };
  } catch (e) { return fail(e); }
}

export async function setArchived(slug: string, id: string, archived: boolean): Promise<R> {
  try {
    const { sb } = await need(); const res = RESOURCES[slug]; if (!res?.archivable) return { ok: false, error: "Not allowed." };
    const { error } = await sb.from(res.table).update({ archived_at: archived ? new Date().toISOString() : null }).eq("id", id); if (error) return { ok: false, error: dbMsg(error) };
    refresh(); return { ok: true, message: archived ? "Archived." : "Restored." };
  } catch (e) { return fail(e); }
}

export async function reorder(slug: string, ids: string[]): Promise<R> {
  try {
    const { sb } = await need(); const res = RESOURCES[slug]; if (!res?.sortable) return { ok: false, error: "Not allowed." };
    const rs = await Promise.all(ids.map((id, i) => sb.from(res.table).update({ sort_order: (i + 1) * 10 }).eq("id", id)));
    if (rs.some((r) => r.error)) return { ok: false, error: "Could not save the new order." };
    refresh(); return { ok: true };
  } catch (e) { return fail(e); }
}

export async function duplicateRow(slug: string, id: string): Promise<R> {
  try {
    const { sb } = await need(); const res = RESOURCES[slug]; if (!res || res.singleton) return { ok: false, error: "Not allowed." };
    const { data: row } = await sb.from(res.table).select("*").eq("id", id).maybeSingle(); if (!row) return { ok: false, error: "Not found." };
    for (const k of ["id", "created_at", "updated_at", "slug", "archived_at"]) delete row[k];
    row[res.titleField === "item_id" ? "promo_text" : res.titleField] = res.titleField === "item_id" ? row.promo_text : `${row[res.titleField]} (copy)`;
    for (const t of res.toggles) if (["is_published", "is_active"].includes(t.field)) row[t.field] = false; // copy starts hidden
    if (res.sortable) row.sort_order = await nextOrder(sb, res.table);
    for (const f of res.fields.filter((x) => x.type === "image")) {
      const k = row[f.name]; if (!k) continue;
      const nk = `${k.split("/")[0]}/${crypto.randomUUID()}.${k.split(".").pop()}`;
      try { await copyObject(k, nk); await sb.from("images").insert({ object_key: nk, content_type: "image/" + k.split(".").pop(), size_bytes: 0, folder: k.split("/")[0], status: "active" }); row[f.name] = nk; } catch { row[f.name] = null; }
    }
    const r = await insertRow(sb, res, row); if (!r.ok) return r; refresh(); return { ok: true, id: r.id, message: "Duplicated. The copy is hidden until you turn it on." };
  } catch (e) { return fail(e); }
}

export async function deleteRow(slug: string, id: string, opt?: { mode: "reassign" | "archive"; to?: string }): Promise<R> {
  try {
    const { sb } = await need(); const res = RESOURCES[slug]; if (!res || res.singleton) return { ok: false, error: "Not allowed." };
    if (res.table === "categories") {
      const { count } = await sb.from("menu_items").select("*", { count: "exact", head: true }).eq("category_id", id);
      if (count) {
        if (!opt) return { ok: false, needsDecision: true, count };
        if (opt.mode === "reassign") { if (!opt.to || opt.to === id) return { ok: false, error: "Pick another category." }; const { error } = await sb.from("menu_items").update({ category_id: opt.to }).eq("category_id", id); if (error) return { ok: false, error: dbMsg(error) }; }
        else { const t = new Date().toISOString(); await sb.from("menu_items").update({ archived_at: t, is_published: false }).eq("category_id", id); await sb.from("categories").update({ archived_at: t, is_active: false }).eq("id", id); refresh(); return { ok: true, message: "Category and its dishes archived." }; }
      }
    }
    const { data: old } = await sb.from(res.table).select("*").eq("id", id).maybeSingle();
    const { error } = await sb.from(res.table).delete().eq("id", id); if (error) return { ok: false, error: dbMsg(error) };
    for (const f of res.fields.filter((x) => x.type === "image")) if (old?.[f.name]) await release(sb, old[f.name]);
    refresh(); return { ok: true, message: "Deleted." };
  } catch (e) { return fail(e); }
}

export async function cleanupImages(): Promise<R> {
  try {
    const { sb } = await need(); let n = 0;
    const { data } = await sb.from("images").select("object_key").eq("status", "pending").lt("created_at", new Date(Date.now() - 864e5).toISOString());
    for (const { object_key } of data ?? []) { if (!(await keyUsed(sb, object_key))) { try { await deleteObject(object_key); } catch { /* ignore */ } await sb.from("images").delete().eq("object_key", object_key); n++; } }
    return { ok: true, message: `Removed ${n} unused upload${n === 1 ? "" : "s"}.` };
  } catch (e) { return fail(e); }
}

/* ---- accounts ---- */
export async function signIn(_: unknown, fd: FormData) {
  const sb = await serverClient();
  const { error } = await sb.auth.signInWithPassword({ email: String(fd.get("email") || "").trim(), password: String(fd.get("password") || "") });
  if (error) return { error: "Email or password is wrong." };
  redirect("/admin");
}
export async function signOut() { const sb = await serverClient(); await sb.auth.signOut(); redirect("/admin/login"); }

export async function createAdmin(email: string, password: string, role: "admin" | "owner"): Promise<R> {
  try {
    const a = await need(); if (a.role !== "owner") return { ok: false, error: "Only the owner can add administrators." };
    if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Enter a valid email." };
    if (password.length < 10) return { ok: false, error: "Password needs at least 10 characters." };
    const svc = serviceClient();
    const { data, error } = await svc.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) return { ok: false, error: error?.message.includes("already") ? "That email already has an account." : "Could not create the account." };
    const { error: e2 } = await svc.from("admins").insert({ user_id: data.user.id, email, role });
    if (e2) { await svc.auth.admin.deleteUser(data.user.id); return { ok: false, error: "Could not grant access." }; }
    revalidatePath("/admin/access"); return { ok: true, message: "Administrator added. Share the password privately." };
  } catch (e) { return fail(e); }
}
export async function removeAdmin(userId: string): Promise<R> {
  try {
    const a = await need(); if (a.role !== "owner") return { ok: false, error: "Only the owner can remove administrators." };
    if (a.user.id === userId) return { ok: false, error: "You cannot remove yourself." };
    const { error } = await serviceClient().from("admins").delete().eq("user_id", userId); if (error) return { ok: false, error: "Could not remove." };
    revalidatePath("/admin/access"); return { ok: true, message: "Access removed." };
  } catch (e) { return fail(e); }
}
