import { FC, useState } from "react"
import { createRootStore } from "./models/createRootStore"
import { observer } from "mobx-react"

interface GoBoardProps {
  size: number
}
export const GoBoard: FC<GoBoardProps> = observer(({ size }) => {
  const [goGame] = useState(() => createRootStore({ size }))

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
                    const stone = goGame.findStone(i, j)
                    return (
                      <td
                        key={`${i}-${j}`}
                        className="w-5 cursor-pointer text-center"
                        onClick={() => {
                          if (goGame.addStone([i, j])) {
                            goGame.nextTurn()
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
      {`Turn: ${goGame.turn} - ${goGame.currentColor === "black" ? "Black" : "White"} to play`}
    </div>
  )
})
