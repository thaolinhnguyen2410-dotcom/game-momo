import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

/* ---------------- FIREBASE CONFIG ---------------- */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function VocabLearningApp() {
  const [folders, setFolders] = useState([]);
  const [currentFolderIndex, setCurrentFolderIndex] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");

  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [example, setExample] = useState("");
  const [tag, setTag] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);

  const [search, setSearch] = useState("");

  /* ---------------- LOAD LOCAL ---------------- */
  useEffect(() => {
    const saved = localStorage.getItem("ieltsFolders");
    if (saved) setFolders(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("ieltsFolders", JSON.stringify(folders));
  }, [folders]);

  /* ---------------- FIREBASE SYNC ---------------- */
  const syncToFirebase = async () => {
    await addDoc(collection(db, "vocabData"), { folders });
    alert("Synced to Firebase ☁️");
  };

  const loadFromFirebase = async () => {
    const snapshot = await getDocs(collection(db, "vocabData"));
    const data = snapshot.docs.map(doc => doc.data());
    if (data.length > 0) setFolders(data[data.length - 1].folders);
  };

  /* ---------------- FOLDER ---------------- */
  const createFolder = () => {
    if (!newFolderName) return;
    setFolders([...folders, { name: newFolderName, vocabList: [] }]);
    setNewFolderName("");
  };

  /* ---------------- ADD / UPDATE WORD ---------------- */
  const addOrUpdateVocab = () => {
    if (!word || !meaning || currentFolderIndex === null) return;

    const updated = [...folders];

    if (editingIndex !== null) {
      updated[currentFolderIndex].vocabList[editingIndex] = {
        word,
        meaning,
        example,
        tag,
      };
      setEditingIndex(null);
    } else {
      updated[currentFolderIndex].vocabList.push({
        word,
        meaning,
        example,
        tag,
      });
    }

    setFolders(updated);
    setWord("");
    setMeaning("");
    setExample("");
    setTag("");
  };

  /* ---------------- EDIT ---------------- */
  const editVocab = (realIndex) => {
    const item = folders[currentFolderIndex].vocabList[realIndex];
    setWord(item.word);
    setMeaning(item.meaning);
    setExample(item.example);
    setTag(item.tag);
    setEditingIndex(realIndex);
  };

  /* ---------------- DELETE ---------------- */
  const deleteVocab = (realIndex) => {
    const updated = [...folders];
    updated[currentFolderIndex].vocabList.splice(realIndex, 1);
    setFolders(updated);
  };

  /* ---------------- EXPORT CSV ---------------- */
  const exportCSV = () => {
    const vocabList = folders[currentFolderIndex].vocabList;
    const header = "Word,Meaning,Example,Tag\n";
    const rows = vocabList
      .map(v => `${v.word},${v.meaning},${v.example},${v.tag}`)
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vocab.csv";
    a.click();
  };

  /* ---------------- SEARCH ---------------- */
  const filteredList =
    currentFolderIndex !== null
      ? folders[currentFolderIndex].vocabList
          .map((item, index) => ({ ...item, realIndex: index }))
          .filter(v =>
            v.word.toLowerCase().includes(search.toLowerCase()) ||
            v.tag?.toLowerCase().includes(search.toLowerCase())
          )
      : [];

  return (
    <div className="min-h-screen bg-neutral-100 p-8">
      <motion.h1 className="text-4xl font-bold mb-6">
        📘 IELTS Vocab Ultimate
      </motion.h1>

      {/* FOLDER */}
      <Card className="mb-6">
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Input
              placeholder="New Folder"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <Button onClick={createFolder}>Create</Button>
            <Button onClick={syncToFirebase}>Sync ☁️</Button>
            <Button onClick={loadFromFirebase}>Load ☁️</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {folders.map((folder, index) => (
              <Button
                key={index}
                variant={currentFolderIndex === index ? "default" : "outline"}
                onClick={() => setCurrentFolderIndex(index)}
              >
                {folder.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {currentFolderIndex !== null && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="font-semibold">
                {editingIndex !== null ? "Edit Vocabulary" : "Add Vocabulary"}
              </h2>
              <Input
                placeholder="Word"
                value={word}
                onChange={(e) => setWord(e.target.value)}
              />
              <Input
                placeholder="Meaning"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
              />
              <Input
                placeholder="Example"
                value={example}
                onChange={(e) => setExample(e.target.value)}
              />
              <Input
                placeholder="Tag (Environment, Education...)"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />
              <Button onClick={addOrUpdateVocab}>
                {editingIndex !== null ? "Update" : "Add"}
              </Button>
              <Button onClick={exportCSV} variant="outline">
                Export CSV 📤
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="font-semibold">Vocabulary List</h2>
              <Input
                placeholder="🔍 Search by word or tag"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {filteredList.map((item) => (
                <div key={item.realIndex} className="bg-white p-3 rounded-xl shadow space-y-2">
                  <div>
                    <strong>{item.word}</strong> — {item.meaning}
                    <p className="text-sm text-gray-500">{item.example}</p>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                      {item.tag}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => editVocab(item.realIndex)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteVocab(item.realIndex)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
