import { assert, formatDate } from "../common/Common";
import { SolutionBoard } from "../common/SolutionBoard";
import { Game, GameState } from "./Game";
import { renderBoard, renderTiles } from "./GameRender";

async function gameMain(): Promise<void>
{
    const puzzles: Record<string, string> = await loadPuzzles();

    let gameString: string = puzzles[formatDate(new Date())];
    const urlParams = new URLSearchParams(window.location.search);
    const gameStringFromUrl = urlParams.get('board');
    if (gameStringFromUrl)
        gameString = gameStringFromUrl;

    const game: Game = new Game(document.getElementById("game_canvas") as HTMLCanvasElement,
                                SolutionBoard.deserialise(gameString),
                                await loadDictionary());

    // @ts-ignore
    window.game = game;

    let lastGameState: GameState = game.gameState;

    function update(): void {
        game.rescale();

        game.ctx.clearRect(0, 0, game.gameCanvas.width, game.gameCanvas.height);
        renderBoard(game);
        renderTiles(game);

        if (game.gameState !== lastGameState) {
            if (game.gameState === GameState.WonConfirmed)
                alert("YOU WIN");
            else if (game.gameState === GameState.WonOriginal)
                alert("YOU WIN - and you found a different solution!");
        }

        lastGameState = game.gameState;

        requestAnimationFrame(update);
    }
    update();

    game.gameCanvas.addEventListener('mousemove', (e) => {
        game.onMouseMove(e.offsetX * window.devicePixelRatio, e.offsetY * window.devicePixelRatio);
    });

    game.gameCanvas.addEventListener('touchmove', (e) => {
        game.onMouseMove(e.touches[0].clientX * window.devicePixelRatio, e.touches[0].clientY * window.devicePixelRatio);
    });

    game.gameCanvas.addEventListener('mousedown', (e) => {
        game.onMouseDown(e.offsetX * window.devicePixelRatio, e.offsetY * window.devicePixelRatio);
    });

    game.gameCanvas.addEventListener('touchstart', (e) => {
        game.onMouseDown(e.touches[0].clientX * window.devicePixelRatio, e.touches[0].clientY * window.devicePixelRatio);
    });

    game.gameCanvas.addEventListener('mouseup', (e) => {
        game.onMouseUp();
    });

    game.gameCanvas.addEventListener('touchend', (e) => {
        game.onMouseUp();
    });
}

async function loadDictionary(): Promise<Set<string>> {
    const response = await fetch("dictionary_full.txt");
    assert(response.ok);
    const text = await response.text();
    return new Set<string>(text.split('\n'));
}

async function loadPuzzles(): Promise<Record<string, string>> {
    const response = await fetch("puzzles.json?blah=" + formatDate(new Date())); // force cache break daily
    assert(response.ok);
    return await response.json();
}

gameMain().then()