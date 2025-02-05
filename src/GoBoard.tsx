import { FC, useState } from "react"

interface GoBoardProps {
  size: number
}
export const GoBoard: FC<GoBoardProps> = ({ size }) => {
  const [stones] = useState<[number, number, "black" | "white"][]>([
    [1, 1, "black"],
    [2, 1, "white"],
  ])

  //   const addStone = (position: [number, number], color: "black" | "white") =>
  //     setStones((stones) => [...stones, [...position, color]]);

  return (
    <div>
      <table className="absolute">
        <tbody>
          {[...Array(size).keys()].map((i) => (
            <tr key={i}>
              {[...Array(size).keys()].map((j) => (
                <td key={j} className="w-5 text-center">
                  ┼
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <table className="absolute">
        <tbody>
          {[...Array(size).keys()].map((i) => (
            <tr key={i}>
              {[...Array(size).keys()].map((j) => {
                const stone = stones.find(
                  ([row, col]) => row === i && col === j,
                )
                return (
                  <td key={j} className="w-5 text-center">
                    {stone !== undefined
                      ? stone[2] === "black"
                        ? "⚫"
                        : "⚪"
                      : undefined}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
