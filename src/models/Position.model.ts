import { model, Model, prop } from "mobx-keystone"

@model("go/Position")
export class Position extends Model(
  {
    i: prop<number>(),
    j: prop<number>(),
  },
  {
    valueType: true,
  },
) {
  isInBoard(size: number) {
    return this.i >= 1 && this.i <= size && this.j >= 1 && this.j <= size
  }

  equal(other: Position) {
    return this.i === other.i && this.j === other.j
  }
}
