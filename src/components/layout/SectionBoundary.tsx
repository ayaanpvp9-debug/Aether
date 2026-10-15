import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  name: string;
  children: ReactNode;
}

interface State {
  failed: boolean;
}

/**
 * Contains rendering failures to a single section so one broken widget can
 * never blank the whole page. Shows a calm, honest fallback instead.
 */
export class SectionBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[veltrix] The ${this.props.name} section failed to render.`, error, info.componentStack);
  }

  override render() {
    if (this.state.failed) {
      return (
        <div className="vx-container" role="alert" style={{ padding: '64px var(--gutter)', color: 'var(--text-2)' }}>
          <p className="vx-eyebrow">Section unavailable</p>
          <p style={{ marginTop: 12 }}>The {this.props.name} section hit an unexpected error. The rest of the site still works.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
