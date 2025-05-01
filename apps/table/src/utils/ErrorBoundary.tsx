import { Component, ErrorInfo, ReactNode } from "react";
import { IS_DEV } from "../config";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * エラーをキャッチして適切に表示するためのエラーバウンダリコンポーネント
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    // エラーが発生したときにstateを更新
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラーログをサービスに送信するなどの処理を追加可能
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // カスタムのfallbackが提供されていればそれを使用、なければデフォルトのエラーUI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-2xl font-semibold text-red-600 mb-4">
              エラーが発生しました
            </h2>
            <p className="text-gray-600 mb-6">
              申し訳ありませんが、問題が発生しました。しばらくしてからもう一度お試しください。
            </p>
            {IS_DEV && this.state.error && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-left overflow-auto max-h-48">
                <pre className="text-xs text-red-800">
                  {this.state.error.toString()}
                </pre>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-[#e0815e] text-white rounded-md hover:bg-[#d3704f] transition-colors"
            >
              ページを再読み込み
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
