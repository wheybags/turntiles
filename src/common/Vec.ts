export class Vec2
{
    public x: number;
    public y: number;

    public constructor(x: number, y: number)
    {
        this.x = x;
        this.y = y;
    }

    public plus(other: Vec2): Vec2 { return new Vec2(this.x + other.x, this.y + other.y); }
    public minus(other: Vec2): Vec2 { return new Vec2(this.x - other.x, this.y - other.y); }
    public mulBy(other: Vec2): Vec2 { return new Vec2(this.x * other.x, this.y * other.y); }
    public divBy(other: Vec2): Vec2 { return new Vec2(this.x / other.x, this.y / other.y); }

    public equals(other: Vec2) { return this.x === other.x && this.y === other.y; }
}