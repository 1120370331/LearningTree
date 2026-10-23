import { useLayoutEffect, useRef, useState } from "react";

const keyOf = (props: { tree: { id: string }; compact?: boolean }) =>
  `${props.tree.id}:${props.compact ?? false}`;

/** Keep the same renderer mounted; swap its content while the transition is faded out. */
export function useTreeTransition<
  T extends { tree: { id: string }; compact?: boolean },
>(props: T) {
  const container = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  const displayed = useRef(props);
  const [stage, setStage] = useState<{
    key: string;
    phase: "idle" | "out" | "in";
    revision: number;
  }>({ key: keyOf(props), phase: "idle", revision: 0 });
  const desiredKey = keyOf(props);
  const reduced =
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const shownProps = desiredKey === stage.key ? props : displayed.current;

  useLayoutEffect(() => {
    latest.current = props;
    if (desiredKey === stage.key) displayed.current = props;
  }, [props, desiredKey, stage.key]);

  useLayoutEffect(() => {
    if (stage.phase !== "idle" || desiredKey === stage.key) return;
    if (reduced) {
      displayed.current = latest.current;
      setStage((previous) => ({
        key: keyOf(latest.current),
        phase: "idle",
        revision: previous.revision + 1,
      }));
    } else {
      setStage((previous) => ({
        ...previous,
        phase: "out",
        revision: previous.revision + 1,
      }));
    }
  }, [desiredKey, stage.key, stage.phase, reduced]);

  useLayoutEffect(() => {
    if (stage.phase === "idle") return;
    let active = true;
    const finish = () => {
      if (!active) return;
      if (stage.phase === "out") {
        const destination = latest.current;
        displayed.current = destination;
        setStage((previous) => ({
          key: keyOf(destination),
          phase: "in",
          revision: previous.revision + 1,
        }));
      } else {
        setStage((previous) => ({ ...previous, phase: "idle" }));
      }
    };
    if (reduced || !container.current?.animate) {
      finish();
      return;
    }
    const animation = container.current.animate(
      stage.phase === "out"
        ? [
            { opacity: 1, transform: "translateY(0)" },
            { opacity: 0, transform: "translateY(-4px)" },
          ]
        : [
            { opacity: 0, transform: "translateY(4px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
      {
        duration: stage.phase === "out" ? 100 : 160,
        easing: "cubic-bezier(0.2, 0, 0, 1)",
        fill: "both",
      },
    );
    void animation.finished.then(finish, () => {});
    return () => {
      active = false;
      animation.cancel();
    };
  }, [stage.phase, stage.revision, reduced]);

  return {
    props: shownProps,
    container,
    switching: stage.phase !== "idle" || desiredKey !== stage.key,
  };
}
