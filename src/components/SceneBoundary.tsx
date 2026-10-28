'use client';
// If a scene ever throws while drawing, the learner keeps the lesson text and the rest of the page.
import { Component, type ReactNode } from 'react';

export default class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error('scene failed', error);
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <p className="max-w-[300px] text-[15px] leading-snug text-ink-2">This picture could not be drawn. The lesson text below still holds.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
