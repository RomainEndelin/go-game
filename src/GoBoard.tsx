import { FC, useState } from "react"
import { createRootStore } from "./models/createRootStore"
import { observer } from "mobx-react"
import { Position } from "./models/Position.model"

interface GoBoardProps {
  size: number
}
export const GoBoard: FC<GoBoardProps> = observer(({ size }) => {
  const [goGame] = useState(() => createRootStore({ size }))

  return (
    <div>
      <table className="bg-[#C19A6C]">
        <tbody>
          {goGame.boardIterator.map((row, _i) => {
            const i = _i + 1
            return (
              <tr key={i}>
                {row.map((content, _j) => {
                  const j = _j + 1
                  return (
                    <td
                      key={`${i}-${j}`}
                      className="w-5 cursor-pointer text-center"
                      onClick={() => {
                        if (goGame.addStone(new Position({ i, j }))) {
                          goGame.nextTurn()
                        }
                      }}
                    >
                      {content !== undefined ? (content === "black" ? "⚫" : "⚪") : "┼"}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      {`Turn: ${goGame.turn} - ${goGame.currentPlayer.color === "black" ? "Black" : "White"} to play`}
    </div>
  )
})
