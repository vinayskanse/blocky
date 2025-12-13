import { useState } from "react";
import "./App.css";

import GroupsView from "./section/GroupsView";
import NewGroupModal from "./section/NewGroupModal";
import { useBlockyContext } from "./context/BlockyContext";
import LandingPage from "./section/LandingPage/LandingPage";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { groups } = useBlockyContext();
  return (
    <main className="container">
      {/* Header */}
      {groups.length === 0 ? <LandingPage /> : null}

      {/* Main Content Area */}
      <div className="w-full">

        {/* Actions Bar */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary btn-full"
          >
            <span style={{ fontSize: '1.2rem', }}>+</span> Create New Group
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
