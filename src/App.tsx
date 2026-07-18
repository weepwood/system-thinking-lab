import { useEffect, useRef, useState } from 'react'
import {
  Download,
  FlaskConical,
  Github,
  Play,
  Redo2,
  Save,
  Undo2,
  Upload,
} from 'lucide-react'
import { getTemplate } from './models/templates'
import { useLabStore } from './store'
import type { SavedWorkspace } from './types/model'
import { Inspector } from './components/Inspector'
import { ModelCanvas } from './components/ModelCanvas'
import { ModelLibrary } from './components/ModelLibrary'
import { ParameterPanel } from './components/ParameterPanel'
import { ResultsPanel } from './components/ResultsPanel'
import './styles.css'

function App() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [toast, setToast] = useState<string>()
  const templateId = useLabStore((state) => state.templateId)
  const title = useLabStore((state) => state.title)
  const isDirty = useLabStore((state) => state.isDirty)
  const past = useLabStore((state) => state.past)
  const future = useLabStore((state) => state.future)
  const runSimulation = useLabStore((state) => state.runSimulation)
  const saveLocal = useLabStore((state) => state.saveLocal)
  const exportWorkspace = useLabStore((state) => state.exportWorkspace)
  const importWorkspace = useLabStore((state) => state.importWorkspace)
  const undo = useLabStore((state) => state.undo)
  const redo = useLabStore((state) => state.redo)
  const template = getTemplate(templateId)

  useEffect(() => {
    const raw = localStorage.getItem('stlab.workspace')
    if (!raw) return
    try {
      const workspace = JSON.parse(raw) as SavedWorkspace
      importWorkspace(workspace)
      setToast('已恢复上次保存的本地模型')
    } catch {
      localStorage.removeItem('stlab.workspace')
    }
  }, [importWorkspace])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(undefined), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const exportJson = () => {
    const workspace = exportWorkspace()
    const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${workspace.title.replace(/\s+/g, '-')}.stlab.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setToast('模型 JSON 已导出')
  }

  const importJson = async (file?: File) => {
    if (!file) return
    try {
      const workspace = JSON.parse(await file.text()) as SavedWorkspace
      importWorkspace(workspace)
      setToast('模型导入成功')
    } catch (error) {
      setToast(error instanceof Error ? error.message : '模型文件无法解析')
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const save = () => {
    saveLocal()
    setToast('已保存到当前浏览器')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><FlaskConical size={21} /></div>
          <div>
            <strong>System Thinking Lab</strong>
            <span>{title}</span>
          </div>
        </div>
        <div className="save-state"><i className={isDirty ? 'dirty' : ''} />{isDirty ? '有未保存修改' : '已保存'}</div>
        <div className="topbar-actions">
          <button type="button" className="icon-button" title="撤销" onClick={undo} disabled={!past.length}><Undo2 size={17} /></button>
          <button type="button" className="icon-button" title="重做" onClick={redo} disabled={!future.length}><Redo2 size={17} /></button>
          <span className="toolbar-divider" />
          <button type="button" className="button ghost" onClick={save}><Save size={16} /> 保存</button>
          <button type="button" className="button ghost" onClick={() => fileInput.current?.click()}><Upload size={16} /> 导入</button>
          <button type="button" className="button ghost" onClick={exportJson}><Download size={16} /> 导出</button>
          <a className="icon-button" href="https://github.com/weepwood/system-thinking-lab" target="_blank" rel="noreferrer" title="GitHub"><Github size={17} /></a>
          <button type="button" className="button primary" onClick={runSimulation}><Play size={16} fill="currentColor" /> 运行仿真</button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(event) => void importJson(event.target.files?.[0])} />
        </div>
      </header>

      <div className="workspace">
        <ModelLibrary />
        <main className="main-workspace">
          <section className="model-intro">
            <div>
              <span className="eyebrow">{template.category}</span>
              <h1>{template.name}</h1>
              <p>{template.summary}</p>
            </div>
            <div className="model-meta">
              <span>{template.nodes.length} 个变量</span>
              <span>{template.edges.length} 条关系</span>
              <span>本地优先</span>
            </div>
          </section>
          <ModelCanvas />
          <ParameterPanel />
          <ResultsPanel />
        </main>
        <Inspector />
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}

export default App
