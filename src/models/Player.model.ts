import { getRoot, model, Model, modelAction, prop } from "mobx-keystone"
import { Position } from "./Position.model"
import { Color, GoGame } from "./GoGame.model"
import { computed } from "mobx"

type DirectionFn = (args: Position) => Position
const upDirection: DirectionFn = (position) => new Position({ i: position.i - 1, j: position.j })
const downDirection: DirectionFn = (position) => new Position({ i: position.i + 1, j: position.j })
const leftDirection: DirectionFn = (position) => new Position({ i: position.i, j: position.j - 1 })
const rightDirection: DirectionFn = (position) => new Position({ i: position.i, j: position.j + 1 })

@model("go/Player")
export class Player extends Model({
  color: prop<Color>(),
  stones: prop<Position[]>(() => []),
}) {
  hasStone(position: Position): boolean {
    return this.stones.some((otherPosition) => position.equal(otherPosition))
  }

  @modelAction
  rawAddStone(position: Position) {
    this.stones = [...this.stones, position]
  }

  @modelAction
  removeDeadStonesAroundPosition(position: Position) {
    this.removeDeadStonesInDirection(position, upDirection)
    this.removeDeadStonesInDirection(position, downDirection)
    this.removeDeadStonesInDirection(position, leftDirection)
    this.removeDeadStonesInDirection(position, rightDirection)
  }

  @modelAction
  removeDeadStonesInDirection(position: Position, direction: DirectionFn) {
    const targetPosition = direction(position)

    if (!position.isInBoard(this.board.size)) {
      return
    }
    if (!this.hasStone(targetPosition)) {
      return
    }

    const { liberties, stones: group } = this.computeGroupAndLiberties(targetPosition)
    if (liberties.length === 0) {
      this.stones = this.stones.filter((stone) => !group.some((toRemove) => stone.equal(toRemove)))
    }
  }

  computeGroupAndLiberties(
    position: Position,
    liberties: Position[] = [],
    acc: Position[] = [],
  ): { liberties: Position[]; stones: Position[] } {
    acc = [...acc, position]

    const directions = [upDirection, downDirection, leftDirection, rightDirection]
    return directions.reduce(
      ({ liberties, stones }, direction) =>
        this.searchGroupAndLibertiesInDirection(position, liberties, stones, direction),
      { liberties, stones: acc },
    )
  }

  private searchGroupAndLibertiesInDirection(
    position: Position,
    liberties: Position[],
    acc: Position[],
    direction: DirectionFn,
  ) {
    const targetPosition = direction(position)
    if (!targetPosition.isInBoard(this.board.size)) {
      return { liberties, stones: acc }
    }
    if (
      acc.some((accPosition) => targetPosition.equal(accPosition)) ||
      liberties.some((libertyPosition) => targetPosition.equal(libertyPosition))
    ) {
      return { liberties, stones: acc } // we already found a stone or a liberty in this position
    }

    if (this.hasStone(targetPosition)) {
      const { liberties: newLiberties, stones } = this.computeGroupAndLiberties(targetPosition, liberties, acc)
      return {
        liberties: newLiberties,
        stones: [...stones, targetPosition],
      }
    } else if (this.otherPlayer.hasStone(targetPosition)) {
      return { liberties, stones: acc }
    } else {
      return { liberties: [...liberties, targetPosition], stones: acc }
    }
  }

  @computed
  private get board() {
    return getRoot<GoGame>(this)
  }
  @computed
  private get otherPlayer() {
    return this.color === "white" ? this.board.blackPlayer : this.board.whitePlayer
  }
}
