import { getRoot, model, Model, modelAction, prop } from "mobx-keystone"
import { Position } from "./Position.model"
import { Color, GoGame } from "./GoGame.model"
import { computed } from "mobx"

type DirectionFn = (args: Position) => Position
const upDirection: DirectionFn = (position) => new Position({ i: position.i - 1, j: position.j })
const downDirection: DirectionFn = (position) => new Position({ i: position.i + 1, j: position.j })
const leftDirection: DirectionFn = (position) => new Position({ i: position.i, j: position.j - 1 })
const rightDirection: DirectionFn = (position) => new Position({ i: position.i, j: position.j + 1 })

const ALL_DIRECTIONS = [upDirection, downDirection, leftDirection, rightDirection]

interface StoneCluster {
  stones: Position[]
  liberties: Position[]
}

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
  private rawRemoveStones(positionsToRemove: Position[]) {
    this.stones = this.stones.filter((stone) => !positionsToRemove.some((toRemove) => stone.equal(toRemove)))
  }

  removeDeadStonesAroundPosition(position: Position) {
    this.rawRemoveStones([...ALL_DIRECTIONS.flatMap((direction) => this.detectDeadStones(direction(position)))])
  }

  detectDeadStones(position: Position) {
    if (!position.isInBoard(this.board.size) || !this.hasStone(position)) {
      return []
    }

    const { liberties, stones } = this.findStonesAndLibertiesFromPosition(position)
    if (liberties.length > 0) {
      return []
    }
    return stones
  }

  findStonesAndLibertiesFromPosition(
    position: Position,
    acc: StoneCluster = { liberties: [], stones: [position] },
  ): StoneCluster {
    return ALL_DIRECTIONS.reduce((acc, direction) => {
      const targetPosition = direction(position)

      if (
        acc.stones.some((stonePosition) => targetPosition.equal(stonePosition)) || // we already registered a stone in that position
        acc.liberties.some((libertyPosition) => targetPosition.equal(libertyPosition)) || // we already registered a liberty in that position
        !targetPosition.isInBoard(this.board.size) || // Out of board
        this.otherPlayer.hasStone(targetPosition) // Opponent stone
      ) {
        return acc // we already registered a stone or a liberty in this position
      }

      if (this.hasStone(targetPosition)) {
        // register a stone in group & lookup for nearby stones & liberties + register the current stone
        return this.findStonesAndLibertiesFromPosition(targetPosition, {
          liberties: acc.liberties,
          stones: [...acc.stones, targetPosition],
        })
      }

      // else, no stone from either player - register a liberty
      return { liberties: [...acc.liberties, targetPosition], stones: acc.stones }
    }, acc)
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
