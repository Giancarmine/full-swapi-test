const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  createMemoryStore,
  createJsonStore,
  createSqliteStore,
  resolveStoreType,
} = require("../../src/services/favoriteStore");

const sharedContract = (label, makeStore) => {
  describe(label, () => {
    let store;

    beforeEach(() => {
      store = makeStore();
    });

    afterEach(() => {
      store.close();
    });

    it("returns null for an unknown user and supports insert/read/delete", () => {
      expect(store.get("u1")).toBeNull();
      expect(store.has("u1")).toBe(false);

      store.put("u1", { films: ["1"], characters: ["2"] });
      expect(store.get("u1")).toEqual({ films: ["1"], characters: ["2"] });
      expect(store.has("u1")).toBe(true);
      expect(store.size()).toBe(1);

      expect(store.delete("u1")).toBe(true);
      expect(store.delete("u1")).toBe(false);
      expect(store.get("u1")).toBeNull();
      expect(store.size()).toBe(0);
    });

    it("returns defensive copies of stored entries", () => {
      const entry = { films: ["1"], characters: [] };
      store.put("u1", entry);
      entry.films.push("2");

      const first = store.get("u1");
      first.films.push("3");

      expect(store.get("u1")).toEqual({ films: ["1"], characters: [] });
    });

    it("lists all entries and reports readiness", () => {
      store.put("u1", { films: ["1"], characters: [] });
      store.put("u2", { films: [], characters: ["2"] });

      expect(store.all()).toEqual([
        ["u1", { films: ["1"], characters: [] }],
        ["u2", { films: [], characters: ["2"] }],
      ]);
      expect(store.ping()).toBe(true);
      store.clear();
      expect(store.all()).toEqual([]);
      expect(store.size()).toBe(0);
    });
  });
};

describe("favoriteStore adapters", () => {
  sharedContract("memory adapter", () => createMemoryStore());

  const withTempDir = (fn) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "favorite-store-"));
    try {
      return fn(dir);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };

  sharedContract("json adapter", () =>
    createJsonStore(
      path.join(fs.mkdtempSync(path.join(os.tmpdir(), "favorite-store-")), "favorites.json")
    )
  );

  it("json adapter writes entries to disk and reloads them", () => {
    withTempDir((dir) => {
      const file = path.join(dir, "favorites.json");
      const first = createJsonStore(file);
      first.put("alice", { films: ["1"], characters: ["2"] });
      expect(fs.existsSync(file)).toBe(true);

      first.close();
      const second = createJsonStore(file);
      expect(second.get("alice")).toEqual({ films: ["1"], characters: ["2"] });
      second.close();
    });
  });

  it("json adapter sanitizes invalid users, duplicates, and empty entries on load", () => {
    withTempDir((dir) => {
      const file = path.join(dir, "favorites.json");
      fs.writeFileSync(
        file,
        JSON.stringify({
          "bad id": { films: ["1"] },
          empty: { films: [], characters: [] },
          alice: { films: ["1", "1", "2"], characters: ["3"] },
        })
      );

      const store = createJsonStore(file);
      expect(store.all()).toEqual([["alice", { films: ["1", "2"], characters: ["3"] }]]);
      store.close();
    });
  });

  it("json adapter tolerates missing and malformed files", () => {
    withTempDir((dir) => {
      const file = path.join(dir, "missing.json");
      const missing = createJsonStore(file);
      expect(missing.size()).toBe(0);
      missing.close();

      fs.writeFileSync(file, "{not-json");
      const malformed = createJsonStore(file);
      expect(malformed.size()).toBe(0);
      malformed.reload();
      expect(malformed.size()).toBe(0);
      malformed.close();
    });
  });

  it("json adapter warns and keeps serving when writes fail", () => {
    withTempDir((dir) => {
      const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
      const write = jest.spyOn(fs, "writeFileSync").mockImplementation(() => {
        throw new Error("disk full");
      });
      const store = createJsonStore(path.join(dir, "favorites.json"));

      expect(() => store.put("u1", { films: ["1"], characters: [] })).not.toThrow();
      expect(store.get("u1")).toEqual({ films: ["1"], characters: [] });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("disk full"));

      warn.mockRestore();
      write.mockRestore();
      store.close();
    });
  });

  sharedContract("sqlite adapter", () =>
    createSqliteStore(
      path.join(fs.mkdtempSync(path.join(os.tmpdir(), "favorite-sqlite-")), "favorites.db")
    )
  );

  it("sqlite adapter persists across reopened connections", () => {
    withTempDir((dir) => {
      const file = path.join(dir, "favorites.db");
      const first = createSqliteStore(file);
      first.put("alice", { films: ["7"], characters: ["8"] });
      first.close();

      const second = createSqliteStore(file);
      expect(second.get("alice")).toEqual({ films: ["7"], characters: ["8"] });
      expect(second.ping()).toBe(true);
      second.close();
    });
  });

  describe("resolveStoreType", () => {
    const original = {};

    beforeEach(() => {
      for (const key of [
        "FAVORITES_STORE",
        "FAVORITES_PERSIST",
        "FAVORITES_DATA_FILE",
        "NODE_ENV",
      ]) {
        original[key] = process.env[key];
        delete process.env[key];
      }
    });

    afterEach(() => {
      for (const [key, value] of Object.entries(original)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    });

    it("honors an explicit store selection", () => {
      process.env.FAVORITES_STORE = "sqlite";
      expect(resolveStoreType()).toBe("sqlite");
      process.env.FAVORITES_STORE = "json";
      expect(resolveStoreType()).toBe("json");
      process.env.FAVORITES_STORE = "memory";
      expect(resolveStoreType()).toBe("memory");
    });

    it("uses json for legacy persistence settings", () => {
      process.env.FAVORITES_PERSIST = "true";
      expect(resolveStoreType()).toBe("json");
      process.env.FAVORITES_PERSIST = "false";
      process.env.FAVORITES_DATA_FILE = "/tmp/favorites.json";
      expect(resolveStoreType()).toBe("json");
    });

    it("uses memory in tests and sqlite elsewhere", () => {
      process.env.NODE_ENV = "test";
      expect(resolveStoreType()).toBe("memory");
      process.env.NODE_ENV = "development";
      expect(resolveStoreType()).toBe("sqlite");
    });

    it("falls back to memory when the selected store cannot be opened", () => {
      const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
      process.env.FAVORITES_STORE = "sqlite";
      process.env.FAVORITES_DB_FILE = path.join(os.tmpdir(), "not-a-directory", "favorites.db");
      fs.writeFileSync(path.join(os.tmpdir(), "not-a-directory"), "occupied");

      let fallback;
      jest.isolateModules(() => {
        fallback = require("../../src/services/favoriteStore").store;
      });

      expect(fallback.type).toBe("memory");
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("using memory store"));
      fs.rmSync(path.join(os.tmpdir(), "not-a-directory"), { force: true });
      warn.mockRestore();
    });
  });
});
