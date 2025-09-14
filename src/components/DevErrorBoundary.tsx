import React from "react";

type State = { error?: Error };

export default class DevErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: any) {
    console.error("[DevErrorBoundary]", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          fontFamily: "ui-sans-serif,system-ui",
          padding: 16, color: "#0f172a", background: "#fff"
        }}>
          <h1 style={{fontSize: 18, fontWeight: 700, marginBottom: 8}}>
            Something crashed while rendering
          </h1>
          <pre style={{
            whiteSpace: "pre-wrap",
            padding: 12,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            lineHeight: 1.4
          }}>
            {String(this.state.error?.stack || this.state.error?.message)}
          </pre>
          <p style={{marginTop: 8, color: "#64748b"}}>
            Open the browser console for full stack & file/line.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
