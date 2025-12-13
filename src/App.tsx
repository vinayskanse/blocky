import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

import GroupsView from "./section/GroupsView";
import NewGroupModal from "./section/NewGroupModal";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '3rem', gap: '1rem' }}>
        <img src="/logo.png" alt="Blocky Logo" className="logo-img" />
        <h1 style={{ fontSize: '3rem', letterSpacing: '-1px', margin: 0 }}>Blocky</h1>
      </div>

      {/* Main Content Area */}
      <div style={{ width: '100%' }}>

        {/* Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>+</span> Create New Group
          </button>
        </div>

        {/* Groups List */}
        <GroupsView />
      </div>

      {isModalOpen && (
        <NewGroupModal onClose={() => setIsModalOpen(false)} />
      )}
    </main>
  );
}

export default App;
