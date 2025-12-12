using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Numerics;
using System.Runtime.InteropServices;
using static System.Net.Mime.MediaTypeNames;

public static class Program
{
    static Random rand;
    static void Main(string[] args)
    {
        rand = new Random(Guid.NewGuid().GetHashCode());

        string[,] board = null;
        while (true)
        {
            board = generateBoard();
            int blankCount = 0;
            for (int y = 0; y < board.GetLength(0); y++)
            {
                for (int x = 0; x < board.GetLength(1); x++)
                {
                    if (board[y, x][0] == ' ')
                        blankCount++;
                }
            }

            if (blankCount <= 2)
                break;
        }

        List<string> tiles = new List<string>();
        for (int y = 0; y < board.GetLength(0); y++)
        {
            for (int x = 0; x < board.GetLength(1); x++)
            {
                if (board[y, x] != "  ")
                    tiles.Add(board[y, x]);
            }
        }

        rand.Shuffle(CollectionsMarshal.AsSpan(tiles));

        for (int line = 0; line < 3; line++)
        {
            for (int i = 0; i < tiles.Count; i++)
            {
                printCellLine(tiles[i], line);
            }
            Console.WriteLine();
        }

        printBoardLayout(board);
        Console.Write("Press enter to reveal solution...");
        Console.ReadLine();

        printBoard(board);
    }

    static string[,] generateBoard()
    {
        string[,] board = new string[4, 4];

        for (int y = 0; y < board.GetLength(0); y++)
        {
            for (int x = 0; x < board.GetLength(1); x++)
            {
                board[y, x] = "  ";
            }
        }

        Dictionary<int, List<string>> allWords = getWords();

        //{
        //    int pivot = 2;// rand.Next(0, 4);

        //    int startX = 0;
        //    int startY = 0;

        //    int endX = 3;
        //    int endY = 3;

        //    int currentX = startX;
        //    int currentY = startY;

        //    int len = 1;
        //    while (currentX != endX || currentY != endY)
        //    {
        //        if (currentY < pivot)
        //        {
        //            board[currentY, currentX] = "Xv";
        //            currentY++;
        //        }
        //        else
        //        {
        //            if (currentY == pivot && currentX < endX)
        //            {
        //                board[currentY, currentX] = "X>";
        //                currentX++;
        //            }
        //            else
        //            {
        //                board[currentY, currentX] = "Xv";
        //                currentY++;
        //            }
        //        }
        //        len++;
        //    }

        //    board[currentY, currentX] = "Xv";

        //    List<string> words = allWords[len];
        //    string word = words[rand.Next(words.Count)];
        //    placeWord(word, board, startX, startY);
        //}

        HashSet<string> seenWords = new HashSet<string>();

        for (int it = 0; it < 100; it++)
        {
            List<Vec2i> emptyEdgeSpaces = new List<Vec2i>();
            for (int y = 0; y < board.GetLength(0); y++)
            {
                if (board[y, 0] == "  ")
                    emptyEdgeSpaces.Add(new Vec2i(0, y));
                if (board[y, board.GetLength(1) - 1] == "  ")
                    emptyEdgeSpaces.Add(new Vec2i(board.GetLength(1) - 1, y));
            }
            for (int x = 0; x < board.GetLength(1); x++)
            {
                if (board[0, x] == "  ")
                    emptyEdgeSpaces.Add(new Vec2i(x, 0));
                if (board[board.GetLength(0) - 1, x] == "  ")
                    emptyEdgeSpaces.Add(new Vec2i(x, board.GetLength(0) - 1));
            }

            if (emptyEdgeSpaces.Count == 0)
                break;

            Vec2i start = emptyEdgeSpaces[rand.Next(emptyEdgeSpaces.Count)];
            int placedLen = placeRandomPath(board, start);
            int realLen = getLen(start, board);

            //printBoard(board);
            //Console.WriteLine(realLen);

            bool success = false;
            if (realLen >= 4 && realLen < 7)
            {
                string end = getLetters(start, board).TrimStart();
                //Console.WriteLine(end);

                List<string> lengthWords = allWords[realLen];
                List<string> possibleWords = new List<string>();
                foreach (string word in lengthWords)
                {
                    if (word.EndsWith(end) && !seenWords.Contains(word))
                        possibleWords.Add(word);
                }

                if (possibleWords.Count > 0)
                {
                    string word = possibleWords[rand.Next(possibleWords.Count)];
                    placeWord(word, board, start.x, start.y);
                    seenWords.Add(word);
                    success = true;
                }
            }

            if (!success)
            {
                clear(start, placedLen, board);
                //printBoard(board);
            }

            //Console.WriteLine("------------");
        }

        return board;
    }

    private static int placeRandomPath(string[,] board, Vec2i start)
    {
        HashSet<Vec2i> seen = new HashSet<Vec2i>();
        List<char> possibleDir = new List<char>();

        int place(Vec2i current)
        {
            seen.Add(current);

            if (board[current.y, current.x] != "  ")
                return 0;

            possibleDir.Clear();
            foreach (char dirChar in dirChars)
            {
                Vec2i directionVec = dirToVec(dirChar);
                Vec2i possibleNext = current + directionVec;
                if (seen.Contains(possibleNext))
                    continue;
                possibleDir.Add(dirChar);
            }

            if (possibleDir.Count == 0)
                return -1;

            char directionChar = possibleDir[rand.Next(possibleDir.Count)];
            Vec2i next = current + dirToVec(directionChar);

            board[current.y, current.x] = " " + directionChar;


            if (next.y >= board.GetLength(0) || next.y < 0 || next.x >= board.GetLength(1) || next.x < 0)
                return 1;

            int inner = place(next);
            if (inner == -1)
                return -1;
            return inner + 1;
        }

        return place(start);
    }

    private static char[] dirChars = new char[] { '^', 'v', '<', '>' };

    private static char randomDirectionChar()
    {
        switch (rand.Next(4))
        {
            case 0: return '^';
            case 1: return 'v';
            case 2: return '<';
            case 3: return '>';
        }
        throw new Exception("unreachable");
    }

    private static Vec2i dirToVec(char dirChar)
    {
        switch (dirChar)
        {
            case '^': return new Vec2i( 0, -1);
            case 'v': return new Vec2i( 0,  1);
            case '<': return new Vec2i(-1,  0);
            case '>': return new Vec2i( 1,  0);
        }
        throw new Exception("unreachable");
    }

    private static int getLen(Vec2i start, string[,] board)
    {
        Vec2i current = start;
        int len = 0;
        while (current.y >= 0 && current.y < board.GetLength(0) && current.x >= 0 && current.x < board.GetLength(1))
        {
            len++;
            current += dirToVec(board[current.y, current.x][1]);
        }
        return len;
    }

    private static string getLetters(Vec2i start, string[,] board)
    {
        Vec2i current = start;
        string letters = "";
        while (current.y >= 0 && current.y < board.GetLength(0) && current.x >= 0 && current.x < board.GetLength(1))
        {
            letters += board[current.y, current.x][0];
            current += dirToVec(board[current.y, current.x][1]);
        }
        return letters;
    }

    private static void clear(Vec2i start, int clearLen, string[,] board)
    {
        Vec2i current = start;
        for (int i = 0; i < clearLen; i++)
        {
            Vec2i off = dirToVec(board[current.y, current.x][1]);
            board[current.y, current.x] = "  ";
            current += off;
        }
    }

    private static void placeWord(string word, string[,] board, int startX, int startY)
    {
        int currentX = startX;
        int currentY = startY;
        for (int i = 0; i < word.Length; i++)
        {
            board[currentY, currentX] = word[i] + "" + board[currentY, currentX][1];
            switch(board[currentY, currentX][1])
            {
                case '^': currentY--; break;
                case 'v': currentY++; break;
                case '<': currentX--; break;
                case '>': currentX++; break;
            }
        }
    }

    private static void loadBook(string path, Dictionary<string, int> wordHistogram)
    {
        string book = File.ReadAllText(path);
        string[] bookWords = book.Split();

        foreach (string word_ in bookWords)
        {
            string word = "";
            foreach (char c_ in word_)
            {
                int c = c_;
                if (c >= 'A' && c <= 'Z')
                    c += 'a' - 'A';
                if (c < 'a' || c > 'z')
                {
                    word = "";
                    break;
                }
                word += (char)c;
            }

            if (word.Length > 0)
            {
                int count = wordHistogram.GetValueOrDefault(word, 0);
                count++;
                wordHistogram[word] = count;
            }
        }
    }

    public static Dictionary<int, List<string>> getWords()
    {
        Dictionary<string, int> wordHistogram = new Dictionary<string, int>();

        string path = Directory.GetCurrentDirectory();
        while (!Directory.Exists(path + "/project_gutenberg_books"))
            path = Directory.GetParent(path).FullName;

        foreach (string file in Directory.GetFiles(path + "/project_gutenberg_books"))
            loadBook(file, wordHistogram);

        //List<KeyValuePair<string, int>> aliceWordFreqs = wordHistogram.ToList();
        //aliceWordFreqs.Sort((KeyValuePair<string, int> a, KeyValuePair<string, int> b) =>
        //{
        //    return b.Value.CompareTo(a.Value);
        //});


        string[] dictLines = File.ReadAllLines("words_alpha.txt");
        Dictionary<int, List<string>> words = new Dictionary<int, List<string>>();
        foreach (string line in dictLines)
        {
            int freq = wordHistogram.GetValueOrDefault(line, 0);
            if (freq < 20)
                continue;


            if (!words.TryGetValue(line.Length, out List<string> wordsLenList))
            {
                wordsLenList = new List<string>();
                words[line.Length] = wordsLenList;
            }

            wordsLenList.Add(line);
        }

        return words;
    }


    static void printBoard(string[,] board)
    {
        for (int y = 0; y < board.GetLength(0); y++)
        {
            for (int line = 0; line < 3; line++)
            {
                for (int x = 0; x < board.GetLength(1); x++)
                {
                    printCellLine(board[y, x], line);
                }
                Console.WriteLine();
            }
        }
    }

    static void printBoardLayout(string[,] board)
    {
        for (int y = 0; y < board.GetLength(0); y++)
        {
            for (int line = 0; line < 3; line++)
            {
                for (int x = 0; x < board.GetLength(1); x++)
                {
                    printCellLayoutLine(board[y, x], line);
                }
                Console.WriteLine();
            }
        }
    }


    static void printCellLine(string cell, int line)
    {
        switch (line)
        {
            case 0:
            {
                if (cell == "  ")
                    Console.Write("   ");
                else if (cell[1] == '^')
                    Console.Write("┌┴┐");
                else
                    Console.Write("┌─┐");
                break;
            }
            case 1:
            {
                if (cell == "  ")
                    Console.Write(" x ");
                else if (cell[1] == '<')
                    Console.Write("┤" + cell[0] + "│");
                else if (cell[1] == '>')
                    Console.Write("│" + cell[0] + "├");
                else
                    Console.Write("│" + cell[0] + "│");
                break;
            }
            case 2:
            {
                if (cell == "  ")
                    Console.Write("   ");
                else if (cell[1] == 'v')
                    Console.Write("└┬┘");
                else
                    Console.Write("└─┘");
                break;
            }
        }
    }

    static void printCellLayoutLine(string cell, int line)
    {
        switch (line)
        {
            case 0:
                {
                    if (cell == "  ")
                        Console.Write("   ");
                    else if (cell[1] == '^')
                        Console.Write("┌┴┐");
                    else
                        Console.Write("┌─┐");
                    break;
                }
            case 1:
                {
                    if (cell == "  ")
                        Console.Write(" x ");
                    else if (cell[1] == '<')
                        Console.Write("┤ │");
                    else if (cell[1] == '>')
                        Console.Write("│ ├");
                    else
                        Console.Write("│ │");
                    break;
                }
            case 2:
                {
                    if (cell == "  ")
                        Console.Write("   ");
                    else if (cell[1] == 'v')
                        Console.Write("└┬┘");
                    else
                        Console.Write("└─┘");
                    break;
                }
        }
    }
}
