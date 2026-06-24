import { Component } from "react";
import RecoverableErrorPanel from "./RecoverableErrorPanel";
import safeClientError from "../utils/safeClientError";

export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetKey: 0 };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) console.error("Route error:", error);
  }

  reset = () => this.setState((state) => ({ error: null, resetKey: state.resetKey + 1 }));

  render() {
    if (this.state.error) {
      const safe = safeClientError(this.state.error);
      return <RecoverableErrorPanel title="This page could not load" message={safe.message} onRetry={this.reset} />;
    }
    return <div key={this.state.resetKey}>{this.props.children}</div>;
  }
}
