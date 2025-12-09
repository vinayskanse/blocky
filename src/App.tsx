import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

import GroupsView from "./section/GroupsView";
import NewGroupModal from "./section/NewGroupModal";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [view, setView] = useState<'home' | 'groups'>('home');
  const [isModalOpen, setIsModalOpen] = useState(false);


  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main className="container">
      {view === 'home' ? (
        <>
          <h1>Control</h1>

          <div className="row">
            <a href="https://tauri.app" target="_blank">
              <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
            </a>
          </div>
          <p>Click on the Tauri, Vite, and React logos to learn more.</p>

          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              greet();
            }}
          >
            <input
              id="greet-input"
              onChange={(e) => setName(e.currentTarget.value)}
              placeholder="Enter a name..."
            />
            <button type="submit">Greet</button>
          </form>
          <p>{greetMsg}</p>

          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            justifyContent: "center",
            alignItems: "center",
          }}>
            <button onClick={() => setIsModalOpen(true)}>Create new group</button>
            <button onClick={() => setView('groups')}>View all groups</button>
            <button onClick={() => invoke('my_custom_command')}>Block</button>
          </div>
        </>
      ) : (
        <GroupsView onBack={() => setView('home')} />
      )}

      {isModalOpen && (
        <NewGroupModal onClose={() => setIsModalOpen(false)} />
      )}
    </main>
  );
}

export default App;
