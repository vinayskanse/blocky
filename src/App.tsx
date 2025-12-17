import { useState } from "react";
import "./App.css";

import GroupsView from "./section/GroupsView";
import NewGroupModal from "./section/NewGroupModal";
import { useBlockyContext } from "./context/BlockyContext";
import LandingPage from "./section/LandingPage/LandingPage";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { groups, addGroup } = useBlockyContext();
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <main className="container">
      {/* Header */}
      {groups.length === 0 ? <LandingPage /> : null}

      {/* Main Content Area */}
      <div className="w-full">

        {/* Actions Bar */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary btn-full"
            style={{ flex: 1 }}
          >
            <span style={{ fontSize: '1.2rem', }}>+</span> Create New Group
          </button>

          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(groups.map(grp => ({
                name: grp.name,
                enabled: grp.enabled,
                domains: grp.domains,
                schedule: grp.schedule
              })), null, 2));
              const downloadAnchorNode = document.createElement('a');
              downloadAnchorNode.setAttribute("href", dataStr);
              downloadAnchorNode.setAttribute("download", "groups.json");
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
              showNotification("Groups exported successfully to Downloads!");
            }}
            className="btn"
            style={{ padding: '0.8rem 1.5rem', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Export JSON
          </button>

          <div style={{ position: 'relative' }}>
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              id="import-json-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = async (event) => {
                  try {
                    const json = JSON.parse(event.target?.result as string);
                    if (Array.isArray(json)) {
                      for (const group of json) {
                        if (group.name && Array.isArray(group.domains)) {
                          const days = group.schedule?.days || [];
                          const startTime = group.schedule?.start || "09:00";
                          const endTime = group.schedule?.end || "17:00";

                          await addGroup({
                            name: group.name,
                            domains: group.domains,
                            days,
                            startTime,
                            endTime
                          });
                        }
                      }
                      showNotification("Groups imported successfully!");
                    } else {
                      alert("Invalid JSON format. Expected an array of groups.");
                    }
                  } catch (err) {
                    console.error("Failed to parse or import JSON:", err);
                    alert("Failed to import groups. Check console for details.");
                  }
                  e.target.value = '';
                };
                reader.readAsText(file);
              }}
            />
            <label
              htmlFor="import-json-input"
              className="btn"
              style={{ padding: '0.8rem 1.5rem', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'inline-block' }}
            >
              Import JSON
            </label>
          </div>
        </div>

        {/* Groups List */}
        <GroupsView />
      </div>

      {isModalOpen && (
        <NewGroupModal onClose={() => setIsModalOpen(false)} />
      )}

      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#333',
          color: '#fff',
          padding: '1rem 2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease-in-out'
        }}>
          {notification}
        </div>
      )}
    </main>
  );
}

export default App;
