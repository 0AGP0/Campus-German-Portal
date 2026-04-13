"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };

type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.error(error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center text-zinc-300">
          <p className="text-lg font-medium text-white">Bir şeyler ters gitti</p>
          <p className="max-w-md text-sm text-zinc-500">Sayfayı yenileyin. Sorun sürerse tarayıcı önbelleğini temizleyin.</p>
          <button
            type="button"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
            onClick={() => globalThis.location.reload()}
          >
            Yenile
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
