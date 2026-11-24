import { expect, test } from "@playwright/test";

const films = [{ id: "1", title: "A New Hope", director: "George Lucas" }];
const characters = [{ id: "10", name: "Luke Skywalker" }];

test("loads data, scopes favorites by user, toggles a favorite, and recovers from an error", async ({
  page,
}) => {
  const favorites = new Map();
  const seenUserIds = [];
  const ensureStore = (userId) => {
    if (!favorites.has(userId)) favorites.set(userId, { films: [], characters: [] });
    return favorites.get(userId);
  };
  let failNextFilmsRequest = false;

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    const userId = request.headers()["x-user-id"] || "anonymous";

    const json = (status, body) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

    if (path.startsWith("/api/favorites")) seenUserIds.push(userId);

    if (path === "/api/films" && method === "GET") {
      if (failNextFilmsRequest) {
        failNextFilmsRequest = false;
        return json(500, { error: "boom" });
      }
      return json(200, films);
    }
    if (path === "/api/characters" && method === "GET") return json(200, characters);
    if (path === "/api/favorites" && method === "GET") return json(200, ensureStore(userId));

    const favMatch = path.match(/^\/api\/favorites\/(films|characters)\/(\d+)$/);
    if (favMatch) {
      const [, type, id] = favMatch;
      const list = ensureStore(userId)[type];
      if (method === "POST") {
        if (!list.includes(id)) list.push(id);
        return json(201, { success: true });
      }
      if (method === "DELETE") {
        const index = list.indexOf(id);
        if (index !== -1) list.splice(index, 1);
        return route.fulfill({ status: 204, body: "" });
      }
    }
    return json(404, { error: "not found" });
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "SWAPI Explorer" })).toBeVisible();
  await expect(page.getByText("A New Hope")).toBeVisible();
  await expect(page.getByText("Luke Skywalker")).toBeVisible();

  const userInput = page.getByLabel(/user id/i);
  await userInput.fill("alice");
  await page.getByRole("button", { name: "Reload" }).click();
  await expect(page.getByText(/scoped by/i)).toContainText("alice");
  expect(seenUserIds).toContain("alice");

  const favoriteButton = page.getByRole("button", { name: /add favorite film a new hope/i });
  await favoriteButton.click();
  await expect(page.getByText("1 saved")).toBeVisible();
  await expect(page.getByRole("button", { name: /remove favorite film a new hope/i })).toBeVisible();
  expect(favorites.get("alice").films).toEqual(["1"]);

  await page.getByRole("button", { name: /remove favorite film a new hope/i }).click();
  await expect(page.getByText("0 saved")).toBeVisible();
  expect(favorites.get("alice").films).toEqual([]);

  failNextFilmsRequest = true;
  await page.getByRole("button", { name: "Reload" }).click();
  await expect(page.getByRole("alert")).toContainText("boom");

  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByText("A New Hope")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
