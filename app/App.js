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

// Determina o caminho base de onde está o index.html
const basePath = (() => {
  // Pega a URL da página atual
  const path = window.location.pathname;

  // Se estiver rodando localmente (localhost ou file://), remove apenas o arquivo da URL
  if (window.location.hostname === "localhost" || window.location.protocol === "file:") {
    return path.replace(/\/[^\/]*$/, "");
  }

  // Se estiver no GitHub Pages, remove tudo após o nome do repositório
  // Exemplo: /vertex/index.html -> /vertex
  const repoMatch = path.match(/^\/[^\/]+/);
  return repoMatch ? repoMatch[0] : "";
})();

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
