import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

function Section({ title, children, right }) {
  return (
    <section className="card" aria-label={title}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export default function App() {
  const [userIdInput, setUserIdInput] = useState("demo-user");
  const [activeUserId, setActiveUserId] = useState("demo-user");
  const [films, setFilms] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [favorites, setFavorites] = useState({ films: [], characters: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const favoriteFilmSet = useMemo(() => new Set((favorites.films || []).map(String)), [favorites]);
  const favoriteCharacterSet = useMemo(
    () => new Set((favorites.characters || []).map(String)),
    [favorites]
  );

  async function loadAll(nextUserId = activeUserId) {
    const resolvedUserId = (nextUserId || "anonymous").trim() || "anonymous";
    setLoading(true);
    setLoadError("");
    setActionError("");
    try {
      const [filmsData, charsData, favData] = await Promise.all([
        api.getFilms(),
        api.getCharacters(),
        api.getFavorites(resolvedUserId),
      ]);
      setFilms(Array.isArray(filmsData) ? filmsData : []);
      setCharacters(Array.isArray(charsData) ? charsData : []);
      setFavorites(favData || { films: [], characters: [] });
      setActiveUserId(resolvedUserId);
    } catch (e) {
      setLoadError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll(activeUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleFilmFavorite(id) {
    const key = `film-${id}`;
    setBusyKey(key);
    setActionError("");
    try {
      if (favoriteFilmSet.has(String(id))) {
        await api.removeFavoriteFilm(id, activeUserId);
      } else {
        await api.addFavoriteFilm(id, activeUserId);
      }
      setFavorites(await api.getFavorites(activeUserId));
    } catch (e) {
      setActionError(e.message || "Failed to update film favorite");
    } finally {
      setBusyKey("");
    }
  }

  async function toggleCharacterFavorite(id) {
    const key = `char-${id}`;
    setBusyKey(key);
    setActionError("");
    try {
      if (favoriteCharacterSet.has(String(id))) {
        await api.removeFavoriteCharacter(id, activeUserId);
      } else {
        await api.addFavoriteCharacter(id, activeUserId);
      }
      setFavorites(await api.getFavorites(activeUserId));
    } catch (e) {
      setActionError(e.message || "Failed to update character favorite");
    } finally {
      setBusyKey("");
    }
  }

  const hasData = films.length > 0 || characters.length > 0;
  const apiBase = (import.meta.env.VITE_API_BASE || "").trim() || "(same origin / Vite proxy)";

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1 style={{ marginBottom: 4 }}>SWAPI Explorer</h1>
          <div className="muted">Browse films and characters, manage scoped favorites.</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            API base: <code>{apiBase}</code>
          </div>
        </div>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            loadAll(userIdInput);
          }}
          aria-label="Load data for user"
        >
          <label className="row" htmlFor="user-id-input">
            <span className="muted">User ID</span>
            <input
              id="user-id-input"
              name="userId"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              placeholder="anonymous"
              autoComplete="off"
            />
          </label>
          <button className="primary" type="submit" disabled={loading}>
            {loading ? "Loading..." : "Reload"}
          </button>
        </form>
      </header>

      {(loadError || actionError) && (
        <div className="card error" role="alert" aria-live="polite">
          {loadError ? (
            <>
              <div style={{ marginBottom: 8 }}>Error: {loadError}</div>
              <button type="button" onClick={() => loadAll(userIdInput)} disabled={loading}>
                Retry
              </button>
            </>
          ) : (
            <div>Error: {actionError}</div>
          )}
        </div>
      )}

      <div className="grid">
        <Section
          title="Favorites"
          right={
            <span className="badge">
              {(favorites.films?.length || 0) + (favorites.characters?.length || 0)} saved
            </span>
          }
        >
          <div className="muted" style={{ marginBottom: 8 }}>
            Scoped by <code>X-User-Id</code>: <strong>{activeUserId || "anonymous"}</strong>
          </div>
          <div className="row" style={{ gap: 16, alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <strong>Films</strong>
              <div className="muted">{(favorites.films || []).join(", ") || "None"}</div>
            </div>
            <div style={{ flex: 1 }}>
              <strong>Characters</strong>
              <div className="muted">{(favorites.characters || []).join(", ") || "None"}</div>
            </div>
          </div>
        </Section>

        <Section title="Films" right={<span className="badge">{films.length}</span>}>
          {loading && !hasData ? (
            <div className="muted" aria-live="polite">Loading films...</div>
          ) : !loading && films.length === 0 ? (
            <div className="muted">No films loaded.</div>
          ) : (
            <ul>
              {films.map((film) => {
                const id = film.id ?? film.uid ?? film.episodeId ?? film.title;
                const fav = favoriteFilmSet.has(String(id));
                const busy = busyKey === `film-${id}`;
                return (
                  <li key={String(id)}>
                    <div>
                      <div>{film.title || `Film ${id}`}</div>
                      <div className="muted">
                        ID: {String(id)} {film.director ? `• ${film.director}` : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={busy || loading}
                      aria-pressed={fav}
                      aria-label={`${fav ? "Remove" : "Add"} favorite film ${film.title || id}`}
                      onClick={() => toggleFilmFavorite(id)}
                    >
                      {busy ? "Saving..." : fav ? "★ Unfavorite" : "☆ Favorite"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section title="Characters" right={<span className="badge">{characters.length}</span>}>
          {loading && !hasData ? (
            <div className="muted" aria-live="polite">Loading characters...</div>
          ) : !loading && characters.length === 0 ? (
            <div className="muted">No characters loaded.</div>
          ) : (
            <ul>
              {characters.map((char) => {
                const id = char.id ?? char.uid ?? char.name;
                const fav = favoriteCharacterSet.has(String(id));
                const busy = busyKey === `char-${id}`;
                return (
                  <li key={String(id)}>
                    <div>
                      <div>{char.name || `Character ${id}`}</div>
                      <div className="muted">ID: {String(id)}</div>
                    </div>
                    <button
                      type="button"
                      disabled={busy || loading}
                      aria-pressed={fav}
                      aria-label={`${fav ? "Remove" : "Add"} favorite character ${char.name || id}`}
                      onClick={() => toggleCharacterFavorite(id)}
                    >
                      {busy ? "Saving..." : fav ? "★ Unfavorite" : "☆ Favorite"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
