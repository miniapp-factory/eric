"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const GRID_SIZE = 4;
const TILE_VALUES = [2, 4];
const TILE_PROBABILITIES = [0.9, 0.1];

function getRandomTile() {
  const rand = Math.random();
  let cumulative = 0;
  for (let i = 0; i < TILE_VALUES.length; i++) {
    cumulative += TILE_PROBABILITIES[i];
    if (rand < cumulative) return TILE_VALUES[i];
  }
  return TILE_VALUES[0];
}

function cloneGrid(grid: number[][]) {
  return grid.map(row => [...row]);
}

export function Game2048() {
  const [grid, setGrid] = useState<number[][]>(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  // Initialize with two tiles
  useEffect(() => {
    const initGrid = cloneGrid(grid);
    addRandomTile(initGrid);
    addRandomTile(initGrid);
    setGrid(initGrid);
  }, []);

  const addRandomTile = useCallback((g: number[][]) => {
    const empty: [number, number][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (g[r][c] === 0) empty.push([r, c]);
      }
    }
    if (empty.length === 0) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    g[r][c] = getRandomTile();
  }, []);

  const move = useCallback((dir: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    const newGrid = cloneGrid(grid);
    let moved = false;
    let gained = 0;

    const iterate = (indices: number[]) => {
      const line = indices.map(i => newGrid[Math.floor(i / GRID_SIZE)][i % GRID_SIZE]);
      const filtered = line.filter(v => v !== 0);
      const merged: number[] = [];
      let skip = false;
      for (let i = 0; i < filtered.length; i++) {
        if (skip) { skip = false; continue; }
        if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
          merged.push(filtered[i] * 2);
          gained += filtered[i] * 2;
          skip = true;
        } else {
          merged.push(filtered[i]);
        }
      }
      while (merged.length < GRID_SIZE) merged.push(0);
      for (let i = 0; i < GRID_SIZE; i++) {
        if (newGrid[indices[i]] !== merged[i]) moved = true;
        newGrid[indices[i]] = merged[i];
      }
    };

    if (dir === "left") {
      for (let r = 0; r < GRID_SIZE; r++) iterate([...Array(GRID_SIZE).keys()].map(c => r * GRID_SIZE + c));
    } else if (dir === "right") {
      for (let r = 0; r < GRID_SIZE; r++) iterate([...Array(GRID_SIZE).keys()].map(c => r * GRID_SIZE + (GRID_SIZE - 1 - c)));
    } else if (dir === "up") {
      for (let c = 0; c < GRID_SIZE; c++) iterate([...Array(GRID_SIZE).keys()].map(r => r * GRID_SIZE + c));
    } else if (dir === "down") {
      for (let c = 0; c < GRID_SIZE; c++) iterate([...Array(GRID_SIZE).keys()].map(r => (GRID_SIZE - 1 - r) * GRID_SIZE + c));
    }

    if (moved) {
      addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(prev => prev + gained);
      if (newGrid.some(row => row.includes(2048))) setGameWon(true);
      if (!newGrid.some(row => row.includes(0)) && !canMove(newGrid)) setGameOver(true);
    }
  }, [grid, gameOver]);

  const canMove = (g: number[][]) => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (g[r][c] === 0) return true;
        if (c + 1 < GRID_SIZE && g[r][c] === g[r][c + 1]) return true;
        if (r + 1 < GRID_SIZE && g[r][c] === g[r + 1][c]) return true;
      }
    }
    return false;
  };

  const handleKey = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp": move("up"); break;
      case "ArrowDown": move("down"); break;
      case "ArrowLeft": move("left"); break;
      case "ArrowRight": move("right"); break;
    }
  }, [move]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold">2048</h1>
      <div className="grid grid-cols-4 gap-2">
        {grid.flat().map((val, idx) => (
          <div key={idx} className="w-16 h-16 flex items-center justify-center bg-gray-200 rounded">
            {val !== 0 && <span className="text-xl font-semibold">{val}</span>}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => move("up")}>↑</Button>
        <Button onClick={() => move("left")}>←</Button>
        <Button onClick={() => move("down")}>↓</Button>
        <Button onClick={() => move("right")}>→</Button>
      </div>
      <div className="text-lg">Score: {score}</div>
      {(gameOver || gameWon) && (
        <div className="flex flex-col items-center gap-2">
          <span className="text-xl font-semibold">
            {gameWon ? "You won!" : "Game Over"}
          </span>
          <Share text={`I scored ${score} in 2048! ${url}`} />
        </div>
      )}
    </div>
  );
}
