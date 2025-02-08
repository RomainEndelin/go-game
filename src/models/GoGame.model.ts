import { computed } from "mobx"
import { draft, Model, model, modelAction, prop } from "mobx-keystone"
import { Position } from "./Position.model"

type Color = "black" | "white"
type Stone = [Position, Color]

const negateColor = (color: Color): Color => (color === "black" ? "white" : "black")

type DirectionFn = (args: Position) => Position
const upDirection: DirectionFn = (position) => new Position({ i: position.i - 1, j: position.j })
const downDirection: DirectionFn = (position) => new Position({ i: position.i + 1, j: position.j })
const leftDirection: DirectionFn = (position) => new Position({ i: position.i, j: position.j - 1 })
const rightDirection: DirectionFn = (position) => new Position({ i: position.i, j: position.j + 1 })

@model("go/GoGame")
export class GoGame extends Model({
  size: prop<number>(),
  turn: prop(1),
  stones: prop<Stone[]>(() => []),
}) {
  // Turns
  @modelAction
  nextTurn() {
    this.turn++
  }

  @computed
  get currentColor(): Color {
    return this.turn % 2 === 0 ? "white" : "black"
  }
  @computed
  get opponentColor(): Color {
    return negateColor(this.currentColor)
  }

  // Stones
  @modelAction
  addStone(targetPosition: Position) {
    const afterActionDraft = draft(this)

    afterActionDraft.data.rawAddStone(targetPosition, this.currentColor)
    afterActionDraft.data.removeDeadStonesAroundPosition(targetPosition)

    if (this.findStone(targetPosition) !== undefined) {
      return false
    }
    if (afterActionDraft.data.computeGroupAndLiberties(targetPosition, this.currentColor).liberties.length === 0) {
      return false // no suicide move
      // If we are about to take a stone, that's not a suicide
    }

    afterActionDraft.commit()
    return true
  }

  @modelAction
  private rawAddStone(position: Position, color: Color) {
    this.stones = [...this.stones, [position, color]]
  }

  findStone(position: Position): Stone | undefined {
    return this.stones.find(([otherPosition]) => position.equal(otherPosition))
  }

  @modelAction
  removeDeadStonesAroundPosition(position: Position) {
    this.removeDeadStonesInDirection(position, upDirection)
    this.removeDeadStonesInDirection(position, downDirection)
    this.removeDeadStonesInDirection(position, leftDirection)
    this.removeDeadStonesInDirection(position, rightDirection)
  }

  @modelAction
  private removeDeadStonesInDirection(position: Position, direction: DirectionFn) {
    const targetPosition = direction(position)

    if (!position.isInBoard(this.size)) {
      return
    }
    const targetStone = this.findStone(targetPosition)
    if (targetStone === undefined || targetStone[1] !== this.opponentColor) {
      return
    }

    const { liberties, stones: group } = this.computeGroupAndLiberties(targetPosition, this.opponentColor)
    if (liberties.length === 0) {
      this.stones = this.stones.filter((stone) => !group.some((toRemove) => stone[0].equal(toRemove)))
    }
  }

  private computeGroupAndLiberties(
    position: Position,
    targetColor: Color,
    liberties: Position[] = [],
    acc: Position[] = [],
  ): { liberties: Position[]; stones: Position[] } {
    acc = [...acc, position]

    const directions = [upDirection, downDirection, leftDirection, rightDirection]
    return directions.reduce(
      ({ liberties, stones }, direction) =>
        this.searchGroupAndLibertiesInDirection(position, targetColor, liberties, stones, direction),
      { liberties, stones: acc },
    )
  }

  private searchGroupAndLibertiesInDirection(
    position: Position,
    targetColor: Color,
    liberties: Position[],
    acc: Position[],
    direction: DirectionFn,
  ) {
    const targetPosition = direction(position)
    if (!targetPosition.isInBoard(this.size)) {
      return { liberties, stones: acc }
    }
    if (
      acc.some((accPosition) => targetPosition.equal(accPosition)) ||
      liberties.some((libertyPosition) => targetPosition.equal(libertyPosition))
    ) {
      return { liberties, stones: acc } // we already found a stone or a liberty in this position
    }

    const targetStone = this.findStone(targetPosition)
    if (targetStone === undefined) {
      return { liberties: [...liberties, targetPosition], stones: acc }
    }
    if (targetStone[1] === targetColor) {
      const { liberties: newLiberties, stones } = this.computeGroupAndLiberties(
        targetPosition,
        targetColor,
        liberties,
        acc,
      )
      return {
        liberties: newLiberties,
        stones: [...stones, targetStone[0]],
      }
    }

    // if targetStone is the other color
    return { liberties, stones: acc }
  }
}
