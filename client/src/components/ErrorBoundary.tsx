import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * A blank screen is the one failure this app is not allowed to have.
 *
 * CLAUDE.md's rule is "last-known data with an age stamp — never a blank or
 * broken state", and an uncaught render exception violates it in the worst
 * possible way: a severe-weather warning that silently stops existing. So the
 * background layer and the card stack are each wrapped separately — a card that
 * throws takes out the card stack, not the warning banner above it.
 *
 * `fallback` should be something legible on its own, not an apology.
 */
interface Props {
  children: ReactNode;
  fallback: ReactNode;
  /** Shown in the console so the real error is never swallowed. */
  label: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Never swallow it — a silent boundary is how bugs like this one survive.
    console.error(`[Mausam] ${this.props.label} failed to render:`, error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    // Let a state change (new city, new condition) clear a previous failure,
    // so one bad combination does not permanently break the section.
    if (this.state.error && prev.children !== this.props.children) {
      this.setState({ error: null });
    }
  }

  render() {
    return this.state.error ? this.props.fallback : this.props.children;
  }
}
