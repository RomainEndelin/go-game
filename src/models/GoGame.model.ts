import { computed } from "mobx"
import { draft, Model, model, modelAction, prop } from "mobx-keystone"

type Color = "black" | "white"
type Stone = [number, number, Color]

const negateColor = (color: Color): Color => (color === "black" ? "white" : "black")

type DirectionFn = (i: number, j: number) => [number, number]
const upDirection: DirectionFn = (i, j) => [i - 1, j]
const downDirection: DirectionFn = (i, j) => [i + 1, j]
const leftDirection: DirectionFn = (i, j) => [i, j - 1]
const rightDirection: DirectionFn = (i, j) => [i, j + 1]

const isInBoard = (i: number, j: number, size: number) => i >= 1 && i <= size && j >= 1 && j <= size

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
  addStone(position: [number, number]) {
    const afterActionDraft = draft(this)

    afterActionDraft.data.rawAddStone(position, this.currentColor)
    afterActionDraft.data.removeDeadStonesAroundPosition(...position)

    if (this.findStone(...position) !== undefined) {
      return false
    }
    if (afterActionDraft.data.computeGroupAndLiberties(...position, this.currentColor).liberties.length === 0) {
      return false // no suicide move
      // If we are about to take a stone, that's not a suicide
    }

    afterActionDraft.commit()
    return true
  }

  @modelAction
  private rawAddStone(position: [number, number], color: Color) {
    this.stones = [...this.stones, [...position, color]]
  }

  findStone(i: number, j: number): Stone | undefined {
    return this.stones.find(([row, col]) => row === i && col === j)
  }

  @modelAction
  removeDeadStonesAroundPosition(i: number, j: number) {
    this.removeDeadStonesInDirection(i, j, upDirection)
    this.removeDeadStonesInDirection(i, j, downDirection)
    this.removeDeadStonesInDirection(i, j, leftDirection)
    this.removeDeadStonesInDirection(i, j, rightDirection)
  }

  @modelAction
  private removeDeadStonesInDirection(i: number, j: number, direction: DirectionFn) {
    const targetPosition = direction(i, j)

    if (!isInBoard(...targetPosition, this.size)) {
      return
    }
    const targetStone = this.findStone(...targetPosition)
    if (targetStone === undefined || targetStone[2] !== this.opponentColor) {
      return
    }

    const { liberties, stones: group } = this.computeGroupAndLiberties(...targetPosition, this.opponentColor)
    if (liberties.length === 0) {
      this.stones = this.stones.filter(
        (stone) => !group.some((toRemove) => stone[0] === toRemove[0] && stone[1] === toRemove[1]),
      )
    }
  }

  private computeGroupAndLiberties(
    i: number,
    j: number,
    targetColor: Color,
    liberties: [number, number][] = [],
    acc: [number, number][] = [],
  ): { liberties: [number, number][]; stones: [number, number][] } {
    acc = [...acc, [i, j]]

    const directions = [upDirection, downDirection, leftDirection, rightDirection]
    return directions.reduce(
      ({ liberties, stones }, direction) =>
        this.searchGroupAndLibertiesInDirection(i, j, targetColor, liberties, stones, direction),
      { liberties, stones: acc },
    )
  }

  private searchGroupAndLibertiesInDirection(
    i: number,
    j: number,
    targetColor: Color,
    liberties: [number, number][],
    acc: [number, number][],
    direction: DirectionFn,
  ) {
    const targetPosition = direction(i, j)
    if (!isInBoard(...targetPosition, this.size)) {
      return { liberties, stones: acc }
    }
    if (
      acc.some(([i_acc, j_acc]) => i_acc === targetPosition[0] && j_acc === targetPosition[1]) ||
      liberties.some(([i_acc, j_acc]) => i_acc === targetPosition[0] && j_acc === targetPosition[1])
    ) {
      return { liberties, stones: acc } // we already found a stone or a liberty in this position
    }

    const targetStone = this.findStone(...targetPosition)
    if (targetStone === undefined) {
      return { liberties: [...liberties, targetPosition], stones: acc }
    }
    if (targetStone[2] === targetColor) {
      const { liberties: newLiberties, stones } = this.computeGroupAndLiberties(
        ...targetPosition,
        targetColor,
        liberties,
        acc,
      )
      return {
        liberties: newLiberties,
        stones: [...stones, [targetStone[0], targetStone[1]] as [number, number]],
      }
    }

    // if targetStone is the other color
    return { liberties, stones: acc }
  }
}
