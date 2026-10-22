import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Home as HomeIcon,
  Leaf,
  Menu,
  Network,
  RotateCcw,
  Search,
  Settings2,
  Sprout,
  X,
} from "lucide-react";
import {
  blankData,
  dayKey,
  descendantIds,
  dueTopics,
  parseData,
  removeTopics,
  reviewTopic,
  type Data,
  type Tree,
  type Topic,
} from "./domain";
import { demoData } from "./demo";
import {
  downloadJson,
  loadData,
  readBackup,
  saveData,
  STORAGE_KEY,
} from "./storage";
import { Modal } from "./components";
import { SessionForm, TopicForm, TreeForm } from "./forms";
import { LearningRoom } from "./LearningRoom";
import {
  Feedback,
  Home,
  Journal,
  Reviews,
  Settings,
  Trees,
  type Actions,
  type Page,
} from "./pages";

type Dialog =
  | { kind: "tree"; tree?: Tree }
  | { kind: "topic"; treeId: string; topic?: Topic; parentId?: string }
  | { kind: "session"; nodeId?: string }
  | {
      kind: "confirm";
      title: string;
      description: string;
      label: string;
      run: () => boolean;
    }
  | null;
const nav = [
  { id: "trees", title: "技能树", icon: Network },
  { id: "home", title: "学习概览", icon: HomeIcon },
  { id: "reviews", title: "复习挑战", icon: RotateCcw },
  { id: "feedback", title: "学习反馈", icon: ChartNoAxesCombined },
  { id: "journal", title: "学习日志", icon: BookOpen },
] as const;
function initial() {
  try {
    return { data: loadData(), error: "" };
  } catch {
    return {
      data: blankData(),
      error:
        "当前浏览器的学习数据无法读取。原数据仍保留，尚未被覆盖。请先下载原始数据，或确认后从空白开始。",
    };
  }
}
function message(error: unknown) {
  if (error && typeof error === "object" && "issues" in error) {
    const issue = (error as { issues: { code: string; message: string }[] })
      .issues[0];
    return `数据校验失败：${issue && /[\u3400-\u9fff]/.test(issue.message) ? issue.message : "内容不完整或字段不正确，请检查填写内容或备份格式"}`;
  }
  if (error instanceof DOMException && error.name === "QuotaExceededError")
    return "浏览器存储空间不足，未保存。请先导出备份，再清理旧记录。";
  return error instanceof Error ? error.message : "操作失败，请重试";
}
export default function App() {
  const [boot] = useState(initial);
  const [data, setData] = useState<Data>(boot.data);
  const [loadError, setLoadError] = useState(boot.error);
  const [page, setPage] = useState<Page>("trees");
  const [treeId, setTreeId] = useState(data.trees[0]?.id ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(
    null,
  );
  const [, setTick] = useState(0);
  useEffect(() => {
    const searchShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.querySelector<HTMLInputElement>(".search-wrap input")?.focus();
      }
    };
    window.addEventListener("keydown", searchShortcut);
    return () => window.removeEventListener("keydown", searchShortcut);
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const handle = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      try {
        const incoming = event.newValue
          ? parseData(JSON.parse(event.newValue))
          : blankData();
        setData(incoming);
        setDialog(null);
        setToast({ text: "已同步另一个标签页的修改", error: false });
      } catch {
        setToast({
          text: "另一个标签页的数据无法读取，当前内容已保留",
          error: true,
        });
      }
    };
    window.addEventListener("storage", handle);
    return () => window.removeEventListener("storage", handle);
  }, []);
  function commit(next: Data, notification = "已保存到当前浏览器") {
    try {
      const valid = saveData(next);
      window.dispatchEvent(new Event("learningtree:saved"));
      setData(valid);
      setToast({ text: notification, error: false });
      return true;
    } catch (error) {
      const text = message(error);
      setToast({ text, error: true });
      window.dispatchEvent(
        new CustomEvent("learningtree:error", { detail: text }),
      );
      return false;
    }
  }
  function navigate(next: Page) {
    setPage(next);
    setSearch("");
    setMobileMenu(false);
    window.scrollTo({ top: 0 });
  }
  function select(id: string) {
    const node = data.nodes.find((n) => n.id === id);
    if (node) {
      setTreeId(node.treeId);
      setSelectedId(id);
      if (page !== "trees") navigate("trees");
      else setSearch("");
    }
  }
  function confirm(
    title: string,
    description: string,
    label: string,
    run: () => boolean,
  ) {
    setDialog({ kind: "confirm", title, description, label, run });
  }
  const actions: Actions = {
    navigate,
    select,
    learn: (id) => { const node=data.nodes.find(n=>n.id===id); if(node){setSelectedId(id);setTreeId(node.treeId);navigate("learn");} },
    saveNote: (id,note) => commit({...data,nodes:data.nodes.map(n=>n.id===id?{...n,note}:n)},"笔记已保存"),
    recordQuiz: session => commit({...data,sessions:[...data.sessions,session]},"测验成绩已保存，技能树已更新"),
    study: (id) => {
      if (!data.trees.length) {
        setDialog({ kind: "tree" });
        return;
      }
      if (!data.nodes.length) {
        setDialog({ kind: "topic", treeId: data.trees[0].id });
        return;
      }
      setDialog({ kind: "session", nodeId: id });
    },
    tree: (tree) => setDialog({ kind: "tree", tree }),
    topic: (treeId, topic, parentId) =>
      setDialog({ kind: "topic", treeId, topic, parentId }),
    deleteTopic: (id) => {
      const ids = descendantIds(data, id);
      confirm(
        "删除这个知识点？",
        `将删除「${data.nodes.find((n) => n.id === id)?.title}」及其子节点，共 ${ids.size} 个知识点，以及对应的学习和复习记录。此操作无法撤销。`,
        "确认删除",
        () => {
          const ok = commit(removeTopics(data, ids), "知识点及关联记录已删除");
          if (ok) setSelectedId(null);
          return ok;
        },
      );
    },
    deleteTree: (id) => {
      const ids = new Set(
        data.nodes.filter((n) => n.treeId === id).map((n) => n.id),
      );
      confirm(
        "删除整棵学习树？",
        `将删除「${data.trees.find((t) => t.id === id)?.title}」和 ${ids.size} 个知识点，以及对应的全部记录。此操作无法撤销。`,
        "删除学习树",
        () => {
          const next = {
            ...removeTopics(data, ids),
            trees: data.trees.filter((t) => t.id !== id),
          };
          const ok = commit(next, "学习树已删除");
          if (ok) {
            setTreeId(next.trees[0]?.id ?? "");
            setSelectedId(null);
          }
          return ok;
        },
      );
    },
    review: (id, rating, response) => {
      try {
        return commit(
          reviewTopic(data, id, rating, response),
          "回忆已记录，下次复习已安排",
        );
      } catch (error) {
        setToast({ text: message(error), error: true });
        return false;
      }
    },
    deleteSession: (id) =>
      confirm(
        "删除这条学习记录？",
        "该记录将从学习时长和自测统计中移除，反馈会重新计算。此操作无法撤销。",
        "删除记录",
        () =>
          commit(
            { ...data, sessions: data.sessions.filter((s) => s.id !== id) },
            "学习记录已删除，反馈已更新",
          ),
      ),
    export: () => {
      downloadJson(data, `LearningTree-${dayKey(new Date())}.json`);
      setToast({ text: "已导出完整备份", error: false });
    },
    import: async (file) => {
      try {
        const incoming = await readBackup(file);
        confirm(
          "恢复这份备份？",
          `备份包含 ${incoming.trees.length} 棵学习树、${incoming.nodes.length} 个知识点、${incoming.sessions.length} 条学习记录、${incoming.reviews.length} 条复习记录。恢复将替换当前全部数据，建议先导出当前备份。`,
          "确认恢复",
          () => {
            const ok = commit(incoming, "备份已恢复");
            if (ok) {
              setTreeId(incoming.trees[0]?.id ?? "");
              setSelectedId(null);
              navigate("home");
            }
            return ok;
          },
        );
      } catch (error) {
        setToast({ text: `无法导入：${message(error)}`, error: true });
      }
    },
    reset: () =>
      confirm(
        data.demo ? "开始自己的学习空间？" : "清空全部学习数据？",
        data.demo
          ? "将移除当前空间中的全部示例和已添加记录，然后开始空白学习空间。需要保留当前内容，请先导出备份。"
          : "将永久删除当前浏览器中所有学习树、记录和复习计划。偏好保留。请先导出备份，此操作无法撤销。",
        data.demo ? "清空并开始" : "确认清空",
        () => {
          const ok = commit(
            { ...blankData(), settings: data.settings },
            "你的新学习空间已准备好",
          );
          if (ok) {
            setTreeId("");
            setSelectedId(null);
            navigate("home");
          }
          return ok;
        },
      ),
    demo: () => {
      if (!data.trees.length) {
        const next = demoData();
        if (commit(next, "已进入示例空间")) {
          setTreeId(next.trees[0].id);
          navigate("home");
        }
      }
    },
    settings: (settings) => commit({ ...data, settings }, "偏好已保存"),
  };
  if (loadError)
    return (
      <div className="recovery">
        <Sprout size={42} />
        <h1>先把你的学习数据保管好</h1>
        <p role="alert">{loadError}</p>
        <button
          className="button"
          onClick={() => {
            try {
              downloadJson(
                { raw: localStorage.getItem(STORAGE_KEY) },
                "LearningTree-recovery.json",
              );
            } catch {
              setLoadError(
                "浏览器禁止访问本地存储。请允许此站点使用存储，或更换浏览器后再试。",
              );
            }
          }}
        >
          <ArrowDownToLine size={17} />
          下载原始数据
        </button>
        <button
          className="button primary"
          onClick={() => {
            if (
              window.confirm(
                "确定覆盖无法读取的原数据，并从空白开始？请先下载原始数据。",
              ) &&
              commit(blankData())
            )
              setLoadError("");
          }}
        >
          从空白重新开始
        </button>
      </div>
    );
  const result = search.trim()
    ? data.nodes
        .filter((n) =>
          `${n.title} ${n.note} ${n.question}`
            .toLowerCase()
            .includes(search.trim().toLowerCase()),
        )
        .slice(0, 8)
    : [];
  const due = dueTopics(data).length;
  return (
    <div className={`app-shell ${page === "trees" ? "tree-page" : ""} ${page === "learn" ? "learning-page" : ""}`}>
      <a className="skip-link" href="#main">
        跳到主内容
      </a>
      {mobileMenu && (
        <button
          className="sidebar-backdrop"
          aria-label="关闭导航"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
        <button className="brand" onClick={() => navigate("trees")}>
          <span className="brand-icon">
            <Network size={22} />
          </span>
          <span>
            LearningTree<small>YOUR PERSONAL SKILL MAP</small>
          </span>
        </button>
        <span className="nav-label">WORKSPACE</span>
        <nav>
          {nav.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? "active" : ""}
              onClick={() => navigate(item.id)}
              aria-current={page === item.id ? "page" : undefined}
            >
              <item.icon size={18} />
              <span>{item.title}</span>
              {item.id === "reviews" && due > 0 && <b>{due}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-grow">
          <div className="sidebar-note">
            <Network size={18} />
            <p>{data.trees.length} 条学习路线 · {data.nodes.length} 个节点</p>
            <span>探索 → 验证 → 巩固</span>
          </div>
        </div>
        <button
          className={`settings-nav ${page === "settings" ? "active" : ""}`}
          onClick={() => navigate("settings")}
        >
          <Settings2 size={18} />
          偏好与数据
        </button>
        <div className="profile">
          <span className="avatar">{data.settings.name.charAt(0)}</span>
          <div>
            <strong>{data.settings.name}</strong>
            <span>
              <i />
              {data.demo ? "示例学习空间" : "个人学习空间"}
            </span>
          </div>
          <button
            className="icon-button"
            aria-label="打开个人偏好"
            onClick={() => navigate("settings")}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button menu-toggle"
              aria-label="打开导航"
              onClick={() => setMobileMenu(true)}
            >
              <Menu size={20} />
            </button>
            <span>我的空间</span>
            <ChevronRight size={13} />
            <strong>
              {page==="learn"?"学习工作台":nav.find((n) => n.id === page)?.title ?? "偏好与数据"}
            </strong>
          </div>
          <div className="header-actions">
            <div className="search-wrap">
              <Search size={16} />
              <input
                aria-label="搜索知识点"
                placeholder="搜索知识点…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setSearch("");
                }}
              />
              {!search && <kbd className="search-shortcut">Ctrl K</kbd>}
              {search && (
                <button
                  className="icon-button"
                  aria-label="清空搜索"
                  onClick={() => setSearch("")}
                >
                  <X size={14} />
                </button>
              )}
              {search && (
                <div className="search-results">
                  {result.length ? (
                    result.map((n) => (
                      <button key={n.id} onClick={() => select(n.id)}>
                        <Leaf size={16} />
                        <span>
                          {n.title}
                          <small>
                            {data.trees.find((t) => t.id === n.treeId)?.title}
                          </small>
                        </span>
                        <ArrowRight size={14} />
                      </button>
                    ))
                  ) : (
                    <p>没有找到相关知识点</p>
                  )}
                </div>
              )}
            </div>
            <time>
              {new Intl.DateTimeFormat("zh-CN", {
                month: "long",
                day: "numeric",
                weekday: "long",
              }).format(new Date())}
            </time>
            <button
              className="icon-button help-button"
              aria-label="了解反馈和数据保存方式"
              onClick={() => navigate("settings")}
            >
              <CircleHelp size={19} />
            </button>
          </div>
        </header>
        {data.demo && (
          <div className="demo-banner">
            <span>
              <Sprout size={15} />
              示例路线 · 试着完成一个挑战，观察技能树如何点亮
            </span>
            <button onClick={actions.reset}>
              开始我的学习
              <ArrowRight size={14} />
            </button>
          </div>
        )}
        <main id="main" className="main-content">
          {page==="learn"&&<LearningRoom key={selectedId} data={data} nodeId={selectedId} actions={actions}/>}
          {page === "home" && (
            <Home
              data={data}
              actions={actions}
              treeId={treeId}
              setTreeId={setTreeId}
            />
          )}
          {page === "trees" && (
            <Trees
              data={data}
              actions={actions}
              treeId={treeId}
              setTreeId={(id) => {
                setTreeId(id);
                setSelectedId(null);
              }}
              selectedId={selectedId}
            />
          )}
          {page === "reviews" && <Reviews data={data} actions={actions} />}
          {page === "feedback" && <Feedback data={data} actions={actions} />}
          {page === "journal" && <Journal data={data} actions={actions} />}
          {page === "settings" && (
            <Settings
              key={data.settings.name + data.settings.dailyMinutes}
              data={data}
              actions={actions}
            />
          )}
        </main>
        <footer className="app-footer">
          <span>
            <Leaf size={13} />
            LearningTree <span className="footer-dot">·</span>{" "}
            用证据记录成长
          </span>
          <span>
            <i />
            数据仅保存在此浏览器
          </span>
        </footer>
      </div>
      {dialog?.kind === "tree" && (
        <TreeForm
          tree={dialog.tree}
          onClose={() => setDialog(null)}
          onSave={(tree) => {
            const next = {
              ...data,
              trees: dialog.tree
                ? data.trees.map((t) => (t.id === tree.id ? tree : t))
                : [...data.trees, tree],
            };
            const ok = commit(
              next,
              dialog.tree ? "学习树已更新" : "学习树已种下，添加第一个知识点吧",
            );
            if (ok) {
              setTreeId(tree.id);
              setSelectedId(null);
              navigate("trees");
            }
            return ok;
          }}
        />
      )}
      {dialog?.kind === "topic" && (
        <TopicForm
          data={data}
          treeId={dialog.treeId}
          topic={dialog.topic}
          parentId={dialog.parentId}
          onClose={() => setDialog(null)}
          onSave={(topic) => {
            const next = {
              ...data,
              nodes: dialog.topic
                ? data.nodes.map((n) => (n.id === topic.id ? topic : n))
                : [...data.nodes, topic],
            };
            const ok = commit(next, "知识点已保存");
            if (ok) {
              setTreeId(topic.treeId);
              setSelectedId(topic.id);
              navigate("trees");
            }
            return ok;
          }}
        />
      )}
      {dialog?.kind === "session" && (
        <SessionForm
          data={data}
          nodeId={dialog.nodeId}
          onClose={() => setDialog(null)}
          onSave={(next) => commit(next, "学习已记录，反馈已更新")}
        />
      )}
      {dialog?.kind === "confirm" && (
        <Modal title={dialog.title} onClose={() => setDialog(null)}>
          <p className="confirm-description">{dialog.description}</p>
          <div className="form-footer">
            <button className="button" onClick={() => setDialog(null)}>
              取消
            </button>
            <button
              className="button primary"
              onClick={() => {
                if (dialog.run()) setDialog(null);
              }}
            >
              {dialog.label}
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div
          className={`toast ${toast.error ? "error" : ""}`}
          role={toast.error ? "alert" : "status"}
        >
          {toast.error ? <CircleHelp size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.text}</span>
          <button
            className="icon-button"
            aria-label="关闭提示"
            onClick={() => setToast(null)}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
