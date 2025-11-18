import { IObservableValue, observable } from "mobx";

import { useState } from "react";

export function useConst<T>(factory: () => T) {
  const [value] = useState(factory);
  return value;
}

export type Box<T> = IObservableValue<T>;

export function useBox<T>(initial: T) {
  const box = useConst(() => observable.box(initial));

  return box;
}
