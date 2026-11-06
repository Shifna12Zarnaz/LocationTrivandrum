import { firestore } from "./admin";

type Filter = { field: string; op: FirebaseFirestore.WhereFilterOp; value: unknown };

class Query<T = any> implements PromiseLike<any> {
  private filters: Filter[] = [];
  private sort?: { field: string; direction: "asc" | "desc" };
  private max?: number;
  private projection?: string[];
  private singleMode: "single" | "maybe" | null = null;
  private operation: { kind: string; value?: any } = { kind: "read" };

  constructor(private readonly collection: string) {}
  select(fields = "*", _options?: any) { this.projection = fields === "*" ? undefined : fields.split(",").map((x) => x.trim()); return this; }
  eq(field: string, value: unknown) { this.filters.push({ field, op: "==", value }); return this; }
  is(field: string, value: unknown) { this.filters.push({ field, op: "==", value }); return this; }
  gte(field: string, value: unknown) { this.filters.push({ field, op: ">=", value }); return this; }
  lt(field: string, value: unknown) { this.filters.push({ field, op: "<", value }); return this; }
  order(field: string, options: { ascending?: boolean } = {}) { this.sort = { field, direction: options.ascending === false ? "desc" : "asc" }; return this; }
  limit(value: number) { this.max = value; return this; }
  maybeSingle() { this.singleMode = "maybe"; return this; }
  single() { this.singleMode = "single"; return this; }
  insert(value: any) { this.operation = { kind: "insert", value }; return this; }
  update(value: any) { this.operation = { kind: "update", value }; return this; }
  upsert(value: any) { this.operation = { kind: "upsert", value }; return this; }
  delete() { this.operation = { kind: "delete" }; return this; }
  in(field: string, values: unknown[]) { this.filters.push({ field, op: "in", value: values }); return this; }

  async run() {
    try {
      if (this.operation.kind !== "read") {
        const ref = firestore().collection(this.collection);
        const value = this.operation.value ?? {};
        if (this.operation.kind === "insert" || this.operation.kind === "upsert") {
          const id = String(value.id ?? crypto.randomUUID());
          await ref.doc(id).set({ ...value, id }, { merge: this.operation.kind === "upsert" });
          return { data: [{ id, ...value }], error: null };
        }
        const snap = await ref.get();
        const matches = snap.docs.filter((doc) => this.filters.every((f) => f.op === "==" ? (f.field === "id" ? doc.id : doc.get(f.field)) === f.value : Array.isArray(f.value) && f.value.includes(f.field === "id" ? doc.id : doc.get(f.field))));
        const batch = firestore().batch();
        for (const doc of matches) this.operation.kind === "delete" ? batch.delete(doc.ref) : batch.update(doc.ref, value);
        await batch.commit();
        return { data: [], error: null };
      }
      const snap = await firestore().collection(this.collection).get();
      let rows: any[] = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      rows = rows.filter((row) => this.filters.every((f) => {
        const actual = f.field === "id" ? String(row.id) : row[f.field];
        if (f.op === "==") return f.field === "id" ? String(actual) === String(f.value) : actual === f.value || (actual == null && f.value == null);
        if (f.op === "in") return Array.isArray(f.value) && f.value.map(String).includes(String(actual));
        if (f.op === ">=") return actual >= (f.value as any);
        if (f.op === "<") return actual < (f.value as any);
        return true;
      }));
      if (this.sort) rows.sort((a, b) => (a[this.sort!.field] > b[this.sort!.field] ? 1 : a[this.sort!.field] < b[this.sort!.field] ? -1 : 0) * (this.sort!.direction === "asc" ? 1 : -1));
      if (this.max) rows = rows.slice(0, this.max);
      if (this.projection) rows = rows.map((row) => Object.fromEntries(this.projection!.map((key) => [key, row[key]])));
      if (this.singleMode) {
        if (rows.length > 1 || (this.singleMode === "single" && rows.length === 0)) return { data: null, error: new Error("Expected one document") };
        return { data: rows[0] ?? null, error: null };
      }
      return { data: rows, error: null, count: rows.length };
    } catch (error) { return { data: null, error }; }
  }
  then<TResult1 = any, TResult2 = never>(onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null) { return this.run().then(onfulfilled, onrejected); }
}

export const firebaseDb = { from: (collection: string) => new Query(collection) };
