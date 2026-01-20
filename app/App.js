import { MenuScreen } from "./MenuScreen.js";
import { GameScreen } from "../ui/GameScreen.js";
import { ClassificationEngine } from "../engines/ClassificationEngine.js";
import { MatchEngine } from "../engines/MatchEngine.js";

const app = document.getElementById("app");

// Lista de engines disponíveis
const engineMap = {
  ClassificationEngine: ClassificationEngine,
  MatchEngine: MatchEngine
};

// Caminho base absoluto
// Para GitHub Pages: inclui nome do repositório
// Para localhost/file://: vazio
const basePath = window.location.hostname === "localhost" || window.location.protocol === "file:"
  ? ""
  : "/vertex"; // substitua "vertex" pelo nome do seu repositório

async function startMenu() {
  // Use basePath absoluto + /content
  const url = `${basePath}/content/index.json`;
  console.log("Buscando conteúdo em:", url); // Para debug

  const res = await fetch(url);
  if (!res.ok) {
    console.error("Não foi possível carregar o index.json:", res.status, res.statusText);
    return;
  }
  const contents = await res.json();

  const menu = new MenuScreen(app, contents, startGame);
  menu.mount();
}

async function startGame(content) {
  const url = `${basePath}/content/${content.file}`;
  console.log("Buscando arquivo de jogo em:", url); // Para debug

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Não foi possível carregar ${content.file}:`, res.status, res.statusText);
    return;
  }
  const json = await res.json();

  const engine = new engineMap[content.engine](json);
  const screen = new GameScreen(app, engine);
  screen.mount();
}

startMenu();
