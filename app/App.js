import { MenuScreen } from "./MenuScreen.js";
import { GameScreen } from "../ui/GameScreen.js";
import { ClassificationEngine } from "../engines/ClassificationEngine.js";
import { MatchEngine } from "../engines/MatchEngine.js";

const app = document.getElementById("app");

// Lista de conteúdos disponíveis
const engineMap = {
  ClassificationEngine: ClassificationEngine,
  MatchEngine: MatchEngine
};

// Função para obter caminho relativo ao arquivo atual
function getBasePath() {
  // `import.meta.url` retorna algo como:
  // "https://illity.github.io/vertex/App.js" ou "file:///C:/projeto/App.js"
  const url = new URL(import.meta.url);
  // Remove o arquivo (App.js) da URL
  url.pathname = url.pathname.replace(/\/[^\/]*$/, "");
  return url.href;
}

const basePath = getBasePath();

async function startMenu() {
  const res = await fetch(`${basePath}/content/index.json`);
  const contents = await res.json();

  const menu = new MenuScreen(app, contents, startGame);
  menu.mount();
}

async function startGame(content) {
  const res = await fetch(`${basePath}/content/${content.file}`);
  const json = await res.json();

  const engine = new engineMap[content.engine](json);
  const screen = new GameScreen(app, engine);
  screen.mount();
}

startMenu();
