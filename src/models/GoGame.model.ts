import { computed } from "mobx"
import { draft, Model, model, modelAction, prop } from "mobx-keystone"

type Color = "black" | "white"
type Stone = [number, number, Color]

const negateColor = (color: Color): Color => (color === "black" ? "white" : "black")

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
    if (afterActionDraft.data.computeGroupAndLiberties(...position, this.currentColor).liberties === 0) {
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
    let stonesToRemove: [number, number][] = []

    if (i > 1 && this.findStone(i - 1, j)?.[2] === this.opponentColor) {
      const { liberties, stones: group } = this.computeGroupAndLiberties(i - 1, j, this.opponentColor)
      if (liberties === 0) {
        stonesToRemove = [...stonesToRemove, ...group]
      }
    }
    if (j > 1 && this.findStone(i, j - 1)?.[2] === this.opponentColor) {
      const { liberties, stones: group } = this.computeGroupAndLiberties(i, j - 1, this.opponentColor)
      if (liberties === 0) {
        stonesToRemove = [...stonesToRemove, ...group]
      }
    }
    if (i < this.size && this.findStone(i + 1, j)?.[2] === this.opponentColor) {
      const { liberties, stones: group } = this.computeGroupAndLiberties(i + 1, j, this.opponentColor)
      if (liberties === 0) {
        stonesToRemove = [...stonesToRemove, ...group]
      }
    }
    if (j < this.size && this.findStone(i, j + 1)?.[2] === this.opponentColor) {
      const { liberties, stones: group } = this.computeGroupAndLiberties(i, j + 1, this.opponentColor)
      if (liberties === 0) {
        stonesToRemove = [...stonesToRemove, ...group]
      }
    }

    this.stones = this.stones.filter(
      (stone) => !stonesToRemove.some((toRemove) => stone[0] === toRemove[0] && stone[1] === toRemove[1]),
    )
  }

  private computeGroupAndLiberties(i: number, j: number, targetColor: Color, acc: [number, number][] = []) {
    acc = [...acc, [i, j]]

    let liberties = 0
    if (i > 1 && !acc.some(([i_acc, j_acc]) => i_acc === i - 1 && j_acc === j)) {
      const stone = this.findStone(i - 1, j)
      if (stone === undefined) {
        liberties++
      } else if (stone[2] === targetColor) {
        const group = this.computeGroupAndLiberties(i - 1, j, targetColor, acc)
        liberties += group.liberties
        acc = [...acc, ...group.stones]
      }
    }
    if (j > 1 && !acc.some(([i_acc, j_acc]) => i_acc === i && j_acc === j - 1)) {
      const stone = this.findStone(i, j - 1)
      if (stone === undefined) {
        liberties++
      } else if (stone[2] === targetColor) {
        const group = this.computeGroupAndLiberties(i, j - 1, targetColor, acc)
        liberties += group.liberties
        acc = [...acc, ...group.stones]
      }
    }
    if (i < this.size && !acc.some(([i_acc, j_acc]) => i_acc === i + 1 && j_acc === j)) {
      const stone = this.findStone(i + 1, j)
      if (stone === undefined) {
        liberties++
      } else if (stone[2] === targetColor) {
        const group = this.computeGroupAndLiberties(i + 1, j, targetColor, acc)
        liberties += group.liberties
        acc = [...acc, ...group.stones]
      }
    }
    if (j < this.size && !acc.some(([i_acc, j_acc]) => i_acc === i && j_acc === j + 1)) {
      const stone = this.findStone(i, j + 1)
      if (stone === undefined) {
        liberties++
      } else if (stone[2] === targetColor) {
        const group = this.computeGroupAndLiberties(i, j + 1, targetColor, acc)
        liberties += group.liberties
        acc = [...acc, ...group.stones]
      }
    }

    return { liberties, stones: acc as [number, number][] }
  }
}
