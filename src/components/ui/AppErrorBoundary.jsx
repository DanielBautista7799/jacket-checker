import { Component } from "react";
import ErrorState from "./ErrorState";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) {
      console.error("Unexpected UI error:", error);
    }
    window.dispatchEvent(new CustomEvent("jacketcheck:analytics", {
      detail: {
        eventName: "unexpected_ui_error",
        options: {
          success: false,
          metadata: { error_code: error?.name || "ui_error" },
        },
      },
    }));
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          title="The page hit an unexpected error"
          message="Your account data is safe. Reload the page to continue."
          onRetry={() => window.location.reload()}
        />
      );
    }
    return this.props.children;
  }
}
