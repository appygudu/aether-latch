import "./styles/global.css";
import { Game } from "./game/Game";

const canvas = document.getElementById("game");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Aether Latch requires a #game canvas");
}

const game = new Game(canvas);
game.start();
