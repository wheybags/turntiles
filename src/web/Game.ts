import {SolutionBoard, type SolutionBoardSlot} from "../common/SolutionBoard"
import {type BoardSlot, GameBoard, type Tile, TileStatus} from "./GameBoard"
import {BlankLetter, type Direction, parseDirection, shuffleArray} from "../common/Common.ts";

export enum GameState
{
    NotWon,
    WonConfirmed,
    WonOriginal,
}

interface SaveTile
{
    x: number,
    y: number,
    letter: string,
    direction: Direction,
    boardPos: [number, number] | null,
}

interface SaveData
{
    tiles: Array<SaveTile>,
    gameString: string,
    solved: boolean,
}

export class Game
{
    public gameCanvas: HTMLCanvasElement;
    public ctx: CanvasRenderingContext2D;

    public gameId: string;
    public gameString: string;

    public solutionBoard: SolutionBoard;
    public board: GameBoard;
    public tiles: Array<Tile>;
    public gameState: GameState = GameState.NotWon;

    public scale = window.devicePixelRatio;

    public TILE_SIZE = 0;
    public TILE_RADIUS = 0;
    public TILE_BORDER = 0;
    public ARROW_WIDE = 0;
    public ARROW_LONG = 0;
    public TILE_TEXT_SIZE = 0;
    public BOARD_PAD = 0;
    public TILE_SPAWN_PAD = 0;

    public boardW = 0;
    public boardH = 0;
    public boardX = 0;
    public boardY = 0;

    public selectedTile: Tile | null = null;
    public snappedBoardPos: BoardSlot | null = null;
    public selectOffsetX: number | null = null;
    public selectOffsetY: number | null = null;
    
    private dictionary: Set<string>;

    public constructor(gameCanvas: HTMLCanvasElement, dictionary: Set<string>, gameId: string, gameString: string)
    {
        this.gameId = gameId;
        this.gameString = gameString;
        this.gameCanvas = gameCanvas;
        this.ctx = this.gameCanvas.getContext("2d") as CanvasRenderingContext2D;
        this.solutionBoard = SolutionBoard.deserialise(gameString);
        this.board = GameBoard.loadFromSolutionBoard(this.solutionBoard);
        this.tiles = new Array<Tile>();
        this.dictionary = dictionary;

        this.rescale();

        if (!this.tryLoadTilePositions())
        {
            this.spawnTiles();
            this.randomScatterTiles();
        }
    }

    private spawnTiles()
    {
        for (let y = 0; y < this.board.h; y++)
        {
            for (let x = 0; x < this.board.w; x++)
            {
                const solutionSlot: SolutionBoardSlot = this.solutionBoard.get(x, y);

                if (solutionSlot.letter !== BlankLetter) {
                    this.tiles.push({
                        x: 0,
                        y: 0,
                        letter: solutionSlot.letter,
                        direction: parseDirection(solutionSlot.direction),
                        boardPos: null,
                    })
                }
            }
        }

        shuffleArray(this.tiles);
    }

    private randomScatterTiles(): void
    {
        let tileSpawnTop = this.boardY + this.boardH;
        let tileSpawnBottom = Math.min(tileSpawnTop + this.boardH, this.gameCanvas.height);

        if (tileSpawnBottom < this.gameCanvas.height - this.TILE_SPAWN_PAD)
        {
            tileSpawnTop += this.TILE_SPAWN_PAD;
            tileSpawnBottom += this.TILE_SPAWN_PAD;
        }
        let tileSpawnLeft = Math.max(0, this.boardX - this.TILE_SIZE * 2);
        let tileSpawnRight = Math.min(this.gameCanvas.width, this.boardX + this.boardW + this.TILE_SIZE * 2);

        const off = this.TILE_SIZE;
        tileSpawnTop += off;
        tileSpawnBottom -= off;
        tileSpawnLeft += off;
        tileSpawnRight -= off;

        
        function smoothstep(edge0: number, edge1: number, x: number): number {
            const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
            return t * t * (3 - 2 * t);
        }
        
        for (const tile of this.tiles)
        {
            tile.x = tileSpawnLeft + (tileSpawnRight-tileSpawnLeft)/2 + Math.random();
            tile.y = tileSpawnTop + (tileSpawnBottom-tileSpawnTop)/2 + Math.random();
        }
    
        // a few iterations of reverse flocking to push tiles apart
        for (let i = 0; i < 500; i++)
        {
            for (const tile of this.tiles)
            {
                let dir = [Math.random()*2-1,Math.random()*2-1];
    
                for (const other of this.tiles)
                {
                    if (other === tile)
                        continue;
    
                    const v = [tile.x - other.x, tile.y - other.y];
    
                    if (Math.abs(v[0]) > 0.000001 || Math.abs(v[1]) > 0.000001)
                    {
                        let mag = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
                        v[0] = v[0]/mag; v[1] = v[1]/mag; // v = normalize(v);
    
                        let alpha = smoothstep(0, this.TILE_SIZE*2, mag);
                        alpha = 1.0 - alpha;
    
                        dir[0] += v[0] * alpha;
                        dir[1] += v[1] * alpha;
                    }
                }
    
                tile.x += dir[0];
                tile.y += dir[1];
    
                if (tile.x < tileSpawnLeft)
                    tile.x = tileSpawnLeft;
                if (tile.x > tileSpawnRight)
                    tile.x = tileSpawnRight;
                if (tile.y < tileSpawnTop)
                    tile.y = tileSpawnTop;
                if (tile.y > tileSpawnBottom)
                    tile.y = tileSpawnBottom;
            }
        }
    }

    public confirmTiles()
    {
        const self = this;
        
        for (let y: number = 0; y < this.board.h; y++)
        {
            for (let x: number = 0; x < this.board.w; x++)
            {
                const boardPos: BoardSlot = this.board.get(x, y);
                boardPos.confirmed = TileStatus.Invalid;
            }
        }

        for (let y: number = 0; y < this.board.h; y++)
        {
            for (let x: number = 0; x < this.board.w; x++)
            {
                const boardPos: BoardSlot = this.board.get(x, y);

                if (boardPos.pointedAtByOtherPos.length !== 0)
                    continue;

                let confirmed = true;
                let word = "";

                {
                    function check(posToCheck: BoardSlot)
                    {
                        const solutionItem: SolutionBoardSlot = self.solutionBoard.get(posToCheck.pos);

                        if (posToCheck.tile)
                            word += posToCheck.tile.letter;
                        else
                            word += "-";

                        if (!posToCheck.tile || posToCheck.tile.letter !== solutionItem.letter || posToCheck.tile.direction !== solutionItem.direction)
                            confirmed = false;
                    }

                    let current = boardPos;
                    check(current);
                    while (current.pointAt)
                    {
                        current = this.board.get(current.pointAt);
                        check(current);
                    }
                }

                const valid = this.dictionary.has(word);

                if (confirmed || valid)
                {
                    const value: TileStatus = confirmed ? TileStatus.Confirmed : TileStatus.ValidWord;

                    let current = boardPos;
                    current.confirmed = Math.max(current.confirmed, value);
                    while (current.pointAt)
                    {
                        current = this.board.get(current.pointAt);
                        current.confirmed = Math.max(current.confirmed, value);
                    }
                }
            }
        }

        this.gameState = GameState.WonConfirmed;

        outer: for (let y = 0; y < this.board.h; y++)
        {
            for (let x = 0; x < this.board.w; x++)
            {
                const boardPos = this.board.get(x, y);

                if (boardPos.direction === 'x')
                    continue;

                if (boardPos.confirmed === TileStatus.ValidWord)
                    this.gameState = GameState.WonOriginal;

                if (boardPos.confirmed === TileStatus.Invalid)
                {
                    this.gameState = GameState.NotWon;
                    break outer;
                }
            }
        }
    }
        
    public rescale(): void
    {
        this.gameCanvas.width = this.gameCanvas.clientWidth * window.devicePixelRatio;
        this.gameCanvas.height = this.gameCanvas.clientHeight * window.devicePixelRatio;
    
        this.TILE_SIZE = 50;
        this.TILE_RADIUS = 8;
        this.TILE_BORDER = 5;
        this.ARROW_WIDE = 10;
        this.ARROW_LONG = 10;
        this.TILE_TEXT_SIZE = 30;
        this.BOARD_PAD = 15;
        this.TILE_SPAWN_PAD = this.TILE_SIZE/2 + this.BOARD_PAD;
    
        let mobile = this.gameCanvas.clientHeight > this.gameCanvas.clientWidth*1.5;
    
        if (mobile)
        {
            const boardTargetW = this.gameCanvas.clientWidth * window.devicePixelRatio * 0.8;
            this.scale = boardTargetW / (this.board.w * this.TILE_SIZE + (this.board.w + 1) * this.BOARD_PAD);
        }
        else
        {
            this.scale = window.devicePixelRatio;
        }
    
        this.TILE_SIZE *= this.scale;
        this.TILE_RADIUS *= this.scale;
        this.TILE_BORDER *= this.scale;
        this.ARROW_WIDE *= this.scale;
        this.ARROW_LONG *= this.scale;
        this.TILE_TEXT_SIZE *= this.scale;
        this.BOARD_PAD *= this.scale;
    
        this.boardW = this.board.w*this.TILE_SIZE + (this.board.w+1)*this.BOARD_PAD;
        this.boardH = this.board.h*this.TILE_SIZE + (this.board.h+1)*this.BOARD_PAD;
    
        let oldBoardX = this.boardX;
        let oldBoardY = this.boardY;
    
        this.boardX = Math.round(this.gameCanvas.width / 2 - this.boardW / 2);
        this.boardY = 60 * this.scale;
    
        for (const tile of this.tiles)
        {
            let relativeX = tile.x - oldBoardX;
            let relativeY = tile.y - oldBoardY;
    
            tile.x = this.boardX + relativeX;
            tile.y = this.boardY + relativeY;
        }
    
        for (const tile of this.tiles)
        {
            if (tile.boardPos)
            {
                const slotX = this.boardX + this.BOARD_PAD + tile.boardPos.pos.x * (this.TILE_SIZE + this.BOARD_PAD) + this.TILE_SIZE / 2;
                const slotY = this.boardY + this.BOARD_PAD + tile.boardPos.pos.y * (this.TILE_SIZE + this.BOARD_PAD) + this.TILE_SIZE / 2;
    
                tile.x = slotX;
                tile.y = slotY;
            }
            else
            {
                const left = this.TILE_SIZE/2;
                const right = this.gameCanvas.clientWidth*window.devicePixelRatio - this.TILE_SIZE/2;
                const top = this.TILE_SIZE/2;
                const bottom = this.gameCanvas.clientHeight*window.devicePixelRatio - this.TILE_SIZE/2;
    
                if (tile.x < left)
                    tile.x = left;
                if (tile.x > right)
                    tile.x = right;
                if (tile.y < top)
                    tile.y = top;
                if (tile.y > bottom)
                    tile.y = bottom;
            }
        }
    }

    private saveTilePositions()
    {
        const saveTiles: Array<SaveTile> = [];
        for (const tile of this.tiles) {
          const tileCopy: SaveTile = {
              x: tile.x - this.boardX,
              y: tile.y - this.boardY,
              letter: tile.letter,
              direction: tile.direction,
              boardPos: tile.boardPos ? [tile.boardPos.pos.x, tile.boardPos.pos.y] : null,
          };

          saveTiles.push(tileCopy);
        }

        const saveData: SaveData = {
            tiles: saveTiles,
            gameString: this.gameString,
            solved: this.gameState !== GameState.NotWon,
        }

        localStorage.setItem("saved_tiles_" + this.gameId, JSON.stringify(saveData));
    }

    private tryLoadTilePositions(): boolean
    {
        const dataString = localStorage.getItem("saved_tiles_" + this.gameId);
        if (dataString == null)
          return false;

        const saveData: SaveData = JSON.parse(dataString);
        if (saveData.gameString.replace(/ /g, "") !== this.gameString.replace(/ /g, ""))
          return false;

        this.tiles = [];
        for (const saveTile of saveData.tiles)
        {
            const tile: Tile = {
                x: saveTile.x + this.boardX,
                y: saveTile.y + this.boardY,
                letter: saveTile.letter,
                direction: saveTile.direction,
                boardPos: null,
            }

            if (saveTile.boardPos)
            {
                tile.boardPos = this.board.get(saveTile.boardPos[0], saveTile.boardPos[1]);
                tile.boardPos.tile = tile;
            }

            this.tiles.push(tile);
        }

        this.confirmTiles();
        return true;
    }


    public onMouseMove(mouseX: number, mouseY: number): void
    {
        if (!this.selectedTile)
            return;
    
        this.selectedTile.x = mouseX + this.selectOffsetX!;
        this.selectedTile.y = mouseY + this.selectOffsetY!;
    
        this.snappedBoardPos = null;
        for (let y = 0; y < this.board.h; y++)
        {
            for (let x = 0; x < this.board.w; x++)
            {
                const boardPos = this.board.get(x, y);
    
                if (this.selectedTile.direction !== boardPos.direction || (boardPos.tile !== null && boardPos.tile !== this.selectedTile))
                    continue;
    
                const slotX = this.boardX + this.BOARD_PAD + x * (this.TILE_SIZE + this.BOARD_PAD) + this.TILE_SIZE / 2;
                const slotY = this.boardY + this.BOARD_PAD + y * (this.TILE_SIZE + this.BOARD_PAD) + this.TILE_SIZE / 2;
    
                let distSqr = (slotX-this.selectedTile.x)*(slotX-this.selectedTile.x) + (slotY-this.selectedTile.y)*(slotY-this.selectedTile.y);
    
                if (distSqr < (this.TILE_SIZE/2)*(this.TILE_SIZE/2))
                {
                    this.selectedTile.x = slotX;
                    this.selectedTile.y = slotY;
                    this.snappedBoardPos = boardPos;
                }
            }
        }
    }

    public onMouseDown(mx: number, my: number): void
    {
        this.selectedTile = null;
        for (let i = this.tiles.length-1; i >= 0; i--)
        {
            const tile = this.tiles[i];
    
            const l = tile.x-this.TILE_SIZE/2;
            const r = tile.x+this.TILE_SIZE/2;
            const t = tile.y-this.TILE_SIZE/2;
            const b = tile.y+this.TILE_SIZE/2;
    
            if (mx >= l && mx <= r && my >= t && my <= b)
            {
                this.selectedTile = tile;
                if (this.selectedTile.boardPos)
                {
                    this.selectedTile.boardPos.tile = null;
                    this.selectedTile.boardPos = null;
                }
                this.tiles.splice(i, 1);
                this.tiles.push(this.selectedTile);
                this.selectOffsetX = this.selectedTile.x - mx;
                this.selectOffsetY = this.selectedTile.y - my
                this.confirmTiles();
                break;
            }
        }
    
        this.onMouseMove(mx, my);
    }

    public onMouseUp(): void
    {
        if (this.selectedTile)
        {
            this.selectedTile.boardPos = this.snappedBoardPos;
            if (this.snappedBoardPos)
                this.snappedBoardPos.tile = this.selectedTile;

            this.saveTilePositions();
        }
        this.selectedTile = null;
        this.snappedBoardPos = null;
    
        this.confirmTiles();
    }
}