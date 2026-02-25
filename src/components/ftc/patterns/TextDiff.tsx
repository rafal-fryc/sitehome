import { useMemo } from "react";
import { diffWords } from "diff";

interface Props {
  oldText: string;
  newText: string;
}

export default function TextDiff({ oldText, newText }: Props) {
  const changes = useMemo(
    () => diffWords(oldText, newText, { ignoreCase: false }),
    [oldText, newText]
  );

  return (
    <span className="whitespace-pre-line font-garamond leading-relaxed">
      {changes.map((change, i) => {
        if (change.added) {
          return (
            <ins
              key={i}
              className="bg-green-100/60 text-green-900 no-underline"
            >
              {change.value}
            </ins>
          );
        }
        if (change.removed) {
          return (
            <del key={i} className="bg-red-100/60 text-red-900 line-through">
              {change.value}
            </del>
          );
        }
        return <span key={i}>{change.value}</span>;
      })}
    </span>
  );
}
