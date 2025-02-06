import { registerRootStore } from "mobx-keystone"
import { GoGame } from "./GoGame.model"

export function createRootStore(args: { size: number }): GoGame {
  const rootStore = new GoGame(args)

  // although not strictly required, it is always a good idea to register your root stores
  // as such, since this allows the model hook `onAttachedToRootStore` to work and other goodies
  registerRootStore(rootStore)

  return rootStore
}
