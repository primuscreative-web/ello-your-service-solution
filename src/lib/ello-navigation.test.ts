import test from "node:test";
import assert from "node:assert/strict";
import { getBottomNavigation } from "./ello-navigation.ts";

test("client navigation matches the approved five destinations", () => {
  assert.deepEqual(
    getBottomNavigation("client").map(({ label, to }) => [label, to]),
    [
      ["Início", "/app"],
      ["Busca", "/app/search"],
      ["Favoritos", "/app/favorites"],
      ["Mensagens", "/app/messages"],
      ["Perfil", "/app/profile"],
    ],
  );
});

test("professional navigation matches the approved five destinations", () => {
  assert.deepEqual(
    getBottomNavigation("professional").map(({ label, to }) => [label, to]),
    [
      ["Início", "/app/business"],
      ["Agenda", "/app/agenda"],
      ["Clientes", "/app/business/clients"],
      ["Orçamentos", "/app/business/quotes"],
      ["Mais", "/app/settings"],
    ],
  );
});
