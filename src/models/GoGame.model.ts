import { computed } from "mobx"
import { draft, Model, model, modelAction, prop } from "mobx-keystone"
import { Position } from "./Position.model"
import { Player } from "./Player.model"

export type Color = "black" | "white"

@model("go/GoGame")
export class GoGame extends Model({
  size: prop<number>(),
  turn: prop(1),
  blackPlayer: prop<Player>(() => new Player({ color: "black" })),
  whitePlayer: prop<Player>(() => new Player({ color: "white" })),
}) {
  // Turns
  @modelAction
  nextTurn() {
    this.turn++
  }

  @computed
  get currentPlayer(): Player {
    return this.turn % 2 === 0 ? this.whitePlayer : this.blackPlayer
  }
  @computed
  get opponentPlayer(): Player {
    return this.currentPlayer === this.whitePlayer ? this.blackPlayer : this.whitePlayer
  }

  // Stones
  @modelAction
  addStone(targetPosition: Position) {
    if (!targetPosition.isInBoard(this.size) || this.findStone(targetPosition) !== undefined) {
      return false
    }

    const afterActionDraft = draft(this)
    afterActionDraft.data.currentPlayer.rawAddStone(targetPosition)
    afterActionDraft.data.opponentPlayer.removeDeadStonesAroundPosition(targetPosition)

    if (afterActionDraft.data.currentPlayer.findStonesAndLibertiesFromPosition(targetPosition).liberties.length === 0) {
      return false // no suicide move
      // If we are about to take a stone, that's not a suicide
    }

    afterActionDraft.commit()
    return true
  }

  findStone(position: Position): Color | undefined {
    return this.blackPlayer.hasStone(position) ? "black" : this.whitePlayer.hasStone(position) ? "white" : undefined
  }
}
