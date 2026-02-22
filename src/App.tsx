import "./App.css";
import { ThemeProvider } from "./context/ThemeContext";
import { useDiff } from "./hooks/useDiff";
import Toolbar from "./components/Toolbar";
import FileTree from "./components/FileTree";
import DiffViewer from "./components/DiffViewer";

function DiffApp() {
  const { files, loading, error } = useDiff();

  return (
    <div className="app-layout">
      <Toolbar fileCount={files.length} />
      <div className="app-body">
        <FileTree files={files} />
        <main className="app-main">
          <DiffViewer files={files} loading={loading} error={error} />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DiffApp />
    </ThemeProvider>
  );
}
