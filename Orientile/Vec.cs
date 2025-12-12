public struct Vec2i
{
    public int x;
    public int y;

    public Vec2i(int x, int y)
    {
        this.x = x;
        this.y = y;
    }

    public Vec2i(int both)
    {
        x = both;
        y = both;
    }

    public Vec2i(double x, double y)
    {
        this.x = (int)x;
        this.y = (int)y;
    }

    public Vec2i(double both)
    {
        x = (int)both;
        y = (int)both;
    }

    public static Vec2i operator +(Vec2i a, Vec2i b) => new Vec2i(a.x + b.x, a.y + b.y);
    public static Vec2i operator -(Vec2i a, Vec2i b) => new Vec2i(a.x - b.x, a.y - b.y);
    public static Vec2i operator *(Vec2i a, int b) => new Vec2i(a.x * b, a.y * b);
    public static Vec2i operator /(Vec2i a, int b) => new Vec2i(a.x / b, a.y / b);

    public static bool operator ==(Vec2i a, Vec2i b) => a.x == b.x && a.y == b.y;
    public static bool operator !=(Vec2i a, Vec2i b) => a.x != b.x || a.y != b.y;

    public override bool Equals(object other)
    {
        if (!(other is Vec2i))
            return false;

        return Equals((Vec2i)other);
    }

    public bool Equals(Vec2i other) => this == other;

    public override int GetHashCode() => (17 * 23 + x.GetHashCode()) * 23 + y.GetHashCode();
}