import {assert, formatDate} from "../common/Common";
import {Game, GameState} from "./Game";
import {renderBoard, renderTiles, renderVictoryMessage} from "./GameRender";

declare global {
    interface Window {
        showPreviousPuzzlesDays: (puzzles: Record<string, string>, year: number, month: number) => void;
        showPreviousPuzzlesMonths: (puzzles: Record<string, string>, year: number) => void;
        showPreviousPuzzlesYears: (puzzles: Record<string, string>) => void;
        loadPuzzleDay: (day: string) => void;

        puzzles: Record<string, string>;
        game?: Game;
    }
}

const gameCanvas = document.getElementById("game_canvas") as HTMLCanvasElement;
let dictionary: Set<string> = new Set();

async function gameMain(): Promise<void>
{
    const todayGameId = formatDate(new Date());

    const puzzlesRaw: Record<string, string> = await loadPuzzles();
    const puzzles: Record<string, string> = {};
    for (const key in puzzlesRaw)
    {
        if (key <= todayGameId)
            puzzles[key] = puzzlesRaw[key];
    }
    window.puzzles = puzzles;

    dictionary = await loadDictionary()

    await setupBurgerMenu(puzzles);

    function update(): void {
        const game = window.game;
        if (game) {
            game.rescale();

            game.ctx.clearRect(0, 0, game.gameCanvas.width, game.gameCanvas.height);
            renderBoard(game);
            renderTiles(game);
            renderVictoryMessage(game);
        }

        requestAnimationFrame(update);
    }
    update();

    gameCanvas.addEventListener('mousemove', (e) => {
        window.game?.onMouseMove(e.offsetX * window.devicePixelRatio, e.offsetY * window.devicePixelRatio);
    });

    gameCanvas.addEventListener('touchmove', (e) => {
        window.game?.onMouseMove(e.touches[0].clientX * window.devicePixelRatio, e.touches[0].clientY * window.devicePixelRatio);
    });

    gameCanvas.addEventListener('mousedown', (e) => {
        window.game?.onMouseDown(e.offsetX * window.devicePixelRatio, e.offsetY * window.devicePixelRatio);
    });

    gameCanvas.addEventListener('touchstart', (e) => {
        window.game?.onMouseDown(e.touches[0].clientX * window.devicePixelRatio, e.touches[0].clientY * window.devicePixelRatio);
    });

    gameCanvas.addEventListener('mouseup', (e) => {
        window.game?.onMouseUp();
    });

    gameCanvas.addEventListener('touchend', (e) => {
        window.game?.onMouseUp();
    });

    document.addEventListener('visibilitychange', (e) =>
    {
       window.game?.setTimerBlock(document.visibilityState === "hidden");
    });

    const urlParams = new URLSearchParams(window.location.search);
    const dayFromUrl = urlParams.get('day');
    if (dayFromUrl)
    {
        loadPuzzleDay(dayFromUrl);
        window.history.replaceState({}, "", window.location.href.split('?')[0]);
    }
    else
    {
        let gameId = todayGameId;
        let gameString: string = window.puzzles[gameId];
        const gameStringFromUrl = urlParams.get('board');
        if (gameStringFromUrl) {
            gameId = "url";
            gameString = gameStringFromUrl;
        }
        loadGame(gameId, gameString);
    }
}

function loadGame(gameId: string, gameString: string): void
{
    window.game = new Game(gameCanvas, dictionary, gameId, gameString);
    document.getElementById("title-extra")!.innerHTML = "";
}

function loadPuzzleDay(day: string): void
{
    loadGame(day, window.puzzles[day]);
    closeModal();
    document.getElementById("title-extra")!.innerHTML = day;
}
window.loadPuzzleDay = loadPuzzleDay;

function showPreviousPuzzlesDays(puzzles: Record<string, string>, year: number, month: number)
{
    const content = document.getElementById("previous-puzzles-modal")!.querySelector(".modal-content")!;
    const prefix = year+"-"+String(month).padStart(2, "0") + "-";

    const days: Array<string> = [];
    for (const key in puzzles)
    {
        if (key.startsWith(prefix))
            days.push(key);
    }

    days.sort().reverse()

    const sb: Array<string> = [];
    sb.push(`<a class="previous-link" href="#" onclick="showPreviousPuzzlesMonths(puzzles, ${year})">Back</a><br>`);
    for (const key of days)
    {
        const solved = Game.tryLoadGame(key)?.solved || false;
        const emoji: string = solved ? '🟩' : '🟥';
        sb.push(`<a class="previous-link" href="#" onclick="loadPuzzleDay('${key}')">${emoji} ${key}</a>`)
    }
    content.innerHTML = sb.join("<br>");
}
window.showPreviousPuzzlesDays = showPreviousPuzzlesDays;

interface Group
{
    completed: number;
    total: number;
}

function showPreviousPuzzlesMonths(puzzles: Record<string, string>, year: number)
{
    const content = document.getElementById("previous-puzzles-modal")!.querySelector(".modal-content")!;
    const prefix = year+"-";

    const monthsMap = new Map<number, Group>();
    for (const key in puzzles)
    {
        if (key.startsWith(prefix))
        {
            const solved = Game.tryLoadGame(key)?.solved || false;
            const month = parseInt(key.split('-')[1]);

            if (!monthsMap.has(month))
                monthsMap.set(month, {completed: 0, total: 0});

            const monthData: Group = monthsMap.get(month)!;
            monthData.total++;
            if (solved)
                monthData.completed++;
        }
    }

    const months = Array.from(monthsMap.keys()).sort((a, b) => b-a);

    const monthNames = ["-", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const sb: Array<string> = [];
    sb.push(`<a class="previous-link" href="#" onclick="showPreviousPuzzlesYears(puzzles)">Back</a><br>`);
    for (const month of months)
    {
        const monthData: Group = monthsMap.get(month)!;
        const emoji: string = monthData.completed === monthData.total ? '🟩' : (monthData.completed > 0 ? '🟨' : '🟥');
        sb.push(`<a class="previous-link" href="#" onclick="showPreviousPuzzlesDays(puzzles, ${year}, ${month})">${emoji} ${monthNames[month]}</a>`)
    }
    content.innerHTML = sb.join("<br>");
}
window.showPreviousPuzzlesMonths = showPreviousPuzzlesMonths;

function showPreviousPuzzlesYears(puzzles: Record<string, string>)
{
    const content = document.getElementById("previous-puzzles-modal")!.querySelector(".modal-content")!;

    const yearsMap = new Map<number, Group>();
    for (const key in puzzles)
    {
        const solved = Game.tryLoadGame(key)?.solved || false;
        const year = parseInt(key.split('-')[0]);

        if (!yearsMap.has(year))
            yearsMap.set(year, {completed: 0, total: 0});

        const yearData: Group = yearsMap.get(year)!;
        yearData.total++;
        if (solved)
            yearData.completed++;
    }

    const years = Array.from(yearsMap.keys()).sort((a, b) => b-a);

    const sb: Array<string> = [];
    for (const year of years)
    {
        const yearData: Group = yearsMap.get(year)!;
        const emoji: string = yearData.completed === yearData.total ? '🟩' : (yearData.completed > 0 ? '🟨' : '🟥');
        sb.push(`<a class="previous-link" href="#" onclick="showPreviousPuzzlesMonths(puzzles, ${year})">${emoji} ${year}</a>`)
    }
    content.innerHTML = sb.join("<br>");
}

let modalBackdrop: HTMLElement | null = null;
function closeModal() {
    modalBackdrop?.classList.remove('open');
    modalBackdrop = null;
}

async function setupBurgerMenu(puzzles: Record<string, string>): Promise<void>
{
    const burger = document.getElementById('burger')!;
    const dropdown = document.getElementById('dropdown')!;

    burger.addEventListener('click', (e) =>
    {
        e.stopPropagation();
        dropdown.classList.toggle('open');
    });
    document.addEventListener('click', (_) =>
    {
        dropdown.classList.remove('open');
    });

    function openModal(e: Event, modal: HTMLElement) {
        modalBackdrop = modal;
        e.stopPropagation();
        dropdown.classList.remove('open');
        modalBackdrop.classList.add('open');
    }

    document.querySelectorAll(".modal-close").forEach((modalClose) =>
    {
        modalClose.addEventListener('pointerdown', closeModal);
    });

    document.querySelectorAll(".modal-backdrop").forEach((item) =>
    {
        item.addEventListener('pointerdown', (e) => {
            if (e.target === modalBackdrop) closeModal();
        });
    });


    document.getElementById('previous-puzzles-button')!.addEventListener('pointerdown', (e: PointerEvent) => {
        showPreviousPuzzlesYears(puzzles);
        openModal(e, document.getElementById('previous-puzzles-modal')!);
    });

    document.getElementById('about-button')!.addEventListener('pointerdown', (e: PointerEvent) => {
        openModal(e, document.getElementById('about-modal')!);
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