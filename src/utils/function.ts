type FunctionWithProps<
  Fn extends (...args: any[]) => any,
  Props extends Record<string, any>
> = Fn & Props;

export function createFunctionWithProps<
  Fn extends (...args: any[]) => any,
  Props extends Record<string, any>
>(fn: Fn, props: Props) {
  const functionWithProps = (...args: Parameters<Fn>) => {
    return fn(...args, props);
  };

  const descriptors = Object.getOwnPropertyDescriptors(props);

  Object.entries(descriptors).forEach(([key, descriptor]) => {
    Object.defineProperty(functionWithProps, key, descriptor);
  });

  return functionWithProps as FunctionWithProps<Fn, Props>;
}
