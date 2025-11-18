import { ReactNode, useRef } from "react";

import { Box } from "./hooks";
import { observer } from "mobx-react-lite";
import styled from "styled-components";

interface Props {
  $value: Box<number>;
  min: number;
  max: number;
  step?: number;
  renderPreview: (value: number) => ReactNode;
}

export const NumberSlider = observer(function NumberSlider({
  $value,
  min,
  max,
  step = 1,
  renderPreview,
}: Props) {
  const originalValue = $value.get();
  let value = originalValue;

  if (value === -Infinity) value = min;
  if (value === Infinity) value = max;

  const previewRef = useRef<HTMLDivElement>(null);

  return (
    <UIHolder>
      <UIInputHolder>
        <UIInput
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => $value.set(Number(e.target.value))}
        />
      </UIInputHolder>
      <UIPreview
        ref={previewRef}
        onClick={() => {
          window.getSelection()?.removeAllRanges();
          // select
          const preview = previewRef.current!;

          const textRange = document.createRange();

          textRange.selectNodeContents(preview);
          window.getSelection()?.addRange(textRange);
        }}
      >
        {renderPreview(originalValue)}
      </UIPreview>
    </UIHolder>
  );
});

const UIHolder = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
`;

const UIInputHolder = styled.div`
  width: 150px;
`;

const UIInput = styled.input`
  width: 100%;
`;

const UIPreview = styled.div`
  width: 100%;
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
