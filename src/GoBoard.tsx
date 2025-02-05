import { FC, useState } from "react"

type Stone = [number, number, Color]
type Color = "black" | "white"

const negateColor = (color: Color): Color => (color === "black" ? "white" : "black")

interface GoBoardProps {
  size: number
}
export const GoBoard: FC<GoBoardProps> = ({ size }) => {
  const [stones, setStones] = useState<Stone[]>([])

  const [turn, setTurn] = useState(1)
  const currentColor: Color = turn % 2 === 0 ? "white" : "black"

  const findStone = (stones: Stone[], i: number, j: number) => stones.find(([row, col]) => row === i && col === j)

  const addStone = (position: [number, number], color: Color) => {
    const stonesWithAdded = [...stones, [...position, color]] as Stone[]
    const { stonesToRemove } = onStonePlaced(stonesWithAdded, ...position, color)

    if (findStone(stones, ...position) !== undefined) {
      return false
    }
    if (
      computeGroupAndLiberties(stonesAfterRemoving(stonesWithAdded, stonesToRemove), ...position, color).liberties === 0
    ) {
      return false // no suicide move
      // If we are about to take a stone, that's not a suicide
    }

    setStones(stonesAfterRemoving(stonesWithAdded, stonesToRemove))
    return true
  }

  const stonesAfterRemoving = (stones: Stone[], stonesToRemove: [number, number][]) => {
    return stones.filter(
      (stone) => !stonesToRemove.some((toRemove) => stone[0] === toRemove[0] && stone[1] === toRemove[1]),
    )
  }

  const computeGroupAndLiberties = (
    stones: Stone[],
    i: number,
    j: number,
    targetColor: Color,
    acc: [number, number][] = [],
  ) => {
    acc = [...acc, [i, j]]

    let liberties = 0
    if (i > 1 && !acc.some(([i_acc, j_acc]) => i_acc === i - 1 && j_acc === j)) {
      const stone = findStone(stones, i - 1, j)
      if (stone === undefined) {
        liberties++
      } else if (stone[2] === targetColor) {
        const group = computeGroupAndLiberties(stones, i - 1, j, targetColor, acc)
        liberties += group.liberties
        acc = [...acc, ...group.stones]
      }
    }
    if (j > 1 && !acc.some(([i_acc, j_acc]) => i_acc === i && j_acc === j - 1)) {
      const stone = findStone(stones, i, j - 1)
      if (stone === undefined) {
        liberties++
      } else if (stone[2] === targetColor) {
        const group = computeGroupAndLiberties(stones, i, j - 1, targetColor, acc)
        liberties += group.liberties
        acc = [...acc, ...group.stones]
      }
    }
    if (i < size && !acc.some(([i_acc, j_acc]) => i_acc === i + 1 && j_acc === j)) {
      const stone = findStone(stones, i + 1, j)
      if (stone === undefined) {
        liberties++
      } else if (stone[2] === targetColor) {
        const group = computeGroupAndLiberties(stones, i + 1, j, targetColor, acc)
        liberties += group.liberties
        acc = [...acc, ...group.stones]
      }
    }
    if (j < size && !acc.some(([i_acc, j_acc]) => i_acc === i && j_acc === j + 1)) {
      const stone = findStone(stones, i, j + 1)
      if (stone === undefined) {
        liberties++
      } else if (stone[2] === targetColor) {
        const group = computeGroupAndLiberties(stones, i, j + 1, targetColor, acc)
        liberties += group.liberties
        acc = [...acc, ...group.stones]
      }
    }

    return { liberties, stones: acc as [number, number][] }
  }

  const onStonePlaced = (stones: Stone[], i: number, j: number, currentColor: Color) => {
    let stonesToRemove: [number, number][] = []

    if (i > 1 && findStone(stones, i - 1, j)?.[2] === negateColor(currentColor)) {
      const { liberties, stones: group } = computeGroupAndLiberties(stones, i - 1, j, negateColor(currentColor))
      if (liberties === 0) {
        stonesToRemove = [...stonesToRemove, ...group]
      }
    }
    if (j > 1 && findStone(stones, i, j - 1)?.[2] === negateColor(currentColor)) {
      const { liberties, stones: group } = computeGroupAndLiberties(stones, i, j - 1, negateColor(currentColor))
      if (liberties === 0) {
        stonesToRemove = [...stonesToRemove, ...group]
      }
    }
    if (i < size && findStone(stones, i + 1, j)?.[2] === negateColor(currentColor)) {
      const { liberties, stones: group } = computeGroupAndLiberties(stones, i + 1, j, negateColor(currentColor))
      if (liberties === 0) {
        stonesToRemove = [...stonesToRemove, ...group]
      }
    }
    if (j > size && findStone(stones, i, j + 1)?.[2] === negateColor(currentColor)) {
      const { liberties, stones: group } = computeGroupAndLiberties(stones, i, j + 1, negateColor(currentColor))
      if (liberties === 0) {
        stonesToRemove = [...stonesToRemove, ...group]
      }
    }
    return { stonesToRemove }
  }

  return (
    <div>
      <table className="bg-[#C19A6C]">
        <tbody>
          {[...Array(size).keys()]
            .map((n) => n + 1)
            .map((i) => (
              <tr key={i}>
                {[...Array(size).keys()]
                  .map((n) => n + 1)
                  .map((j) => {
                    const stone = findStone(stones, i, j)
                    return (
                      <td
                        key={`${i}-${j}`}
                        className="w-5 cursor-pointer text-center"
                        onClick={() => {
                          if (addStone([i, j], currentColor)) {
                            setTurn((turn) => turn + 1)
                          }
                        }}
                      >
                        {stone !== undefined ? (stone[2] === "black" ? "⚫" : "⚪") : "┼"}
                      </td>
                    )
                  })}
              </tr>
            ))}
        </tbody>
      </table>
      {`Turn: ${turn} - ${currentColor === "black" ? "Black" : "White"} to play`}
    </div>
  )
}
