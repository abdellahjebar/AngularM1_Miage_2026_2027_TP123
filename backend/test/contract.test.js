import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";

// Tests de contrat et de sécurité qui s'arrêtent avant MongoDB : le middleware
// d'authentification et le filtre Multer répondent avant tout accès à la base.
// Les cas qui exigent une base (pagination, piste d'un autre utilisateur)
// sont vérifiés par les scripts de navigateur du rapport, pas ici.

let server, base;

// Même secret que src/app.js (variable d'environnement ou valeur de développement).
const SECRET = process.env.JWT_SECRET || "tp1-development-secret";
const bearer = (options = {}, secret = SECRET) =>
  `Bearer ${jwt.sign({ sub: "64b000000000000000000001", email: "t@example.com" }, secret, options)}`;

function audioForm(file, type) {
  const form = new FormData();
  if (file) form.append("audio", new Blob(["abc"], { type }), file);
  form.append("title", "Essai");
  return form;
}

test.before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

test("GET /api/tracks sans JWT répond 401", async () => {
  const r = await fetch(base + "/api/tracks");
  assert.equal(r.status, 401);
  assert.equal((await r.json()).message, "Authentification requise");
});

test("DELETE /api/tracks/:id sans JWT répond 401 : la suppression n'est pas protégée par l'interface mais par le backend", async () => {
  const r = await fetch(base + "/api/tracks/64b000000000000000000002", { method: "DELETE" });
  assert.equal(r.status, 401);
});

test("un JWT invalide répond 401 (texte quelconque)", async () => {
  const r = await fetch(base + "/api/tracks", { headers: { Authorization: "Bearer pas-un-jwt" } });
  assert.equal(r.status, 401);
  assert.equal((await r.json()).message, "Jeton invalide ou expiré");
});

test("un JWT signé avec un autre secret répond 401", async () => {
  const r = await fetch(base + "/api/tracks", { headers: { Authorization: bearer({}, "autre-secret") } });
  assert.equal(r.status, 401);
});

test("un JWT expiré répond 401", async () => {
  const r = await fetch(base + "/api/tracks", { headers: { Authorization: bearer({ expiresIn: -10 }) } });
  assert.equal(r.status, 401);
});

test("POST /api/tracks sans JWT répond 401 avant d'écrire le fichier", async () => {
  const r = await fetch(base + "/api/tracks", { method: "POST", body: audioForm("a.mp3", "audio/mpeg") });
  assert.equal(r.status, 401);
});

test("upload sans fichier : 400 « Fichier audio requis »", async () => {
  const r = await fetch(base + "/api/tracks", {
    method: "POST",
    headers: { Authorization: bearer() },
    body: audioForm(null),
  });
  assert.equal(r.status, 400);
  assert.equal((await r.json()).message, "Fichier audio requis");
});

test("upload d'un type MIME refusé (text/plain) : 400", async () => {
  const r = await fetch(base + "/api/tracks", {
    method: "POST",
    headers: { Authorization: bearer() },
    body: audioForm("note.txt", "text/plain"),
  });
  assert.equal(r.status, 400);
});
