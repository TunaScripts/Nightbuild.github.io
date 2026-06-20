import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// --- REPLACE WITH YOUR FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "tuna-scripts.firebaseapp.com",
  projectId: "tuna-scripts",
  storageBucket: "tuna-scripts.appspot.com",
  messagingSenderId: "123456789",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- APP STATE ---
let scriptsDatabase = [];
let currentScriptTitle = '';
let unsubscribeComments = null;

const grid = document.getElementById('scriptGrid');
const modal = document.getElementById('modal');
const commentsList = document.getElementById('commentsList');
const commentInput = document.getElementById('commentInput');

// --- INITIALIZE ---
async function initApp() {
    try {
        const response = await fetch('scripts.json');
        scriptsDatabase = await response.json();
        renderScripts();
    } catch (error) {
        console.error('Failed to load scripts:', error);
    }
}

function renderScripts() {
    grid.innerHTML = '';
    scriptsDatabase.forEach(script => {
        const card = document.createElement('div');
        card.className = 'script-card';
        card.onclick = () => openModal(script);
        card.innerHTML = `
            <div class="card-image-container">
                <div class="placeholder-img">
                    <span style="color: #00f0ff; font-size: 3rem;">&lt;/&gt;</span>
                </div>
                <div class="card-badges">
                    <span class="badge badge-views">👁️ ${script.views}</span>
                </div>
                <span class="badge badge-new">⚡ NEW</span>
            </div>
            <div class="card-info">
                <img src="logo.gif" class="author-avatar" alt="Author">
                <div class="card-text">
                    <span class="card-tag">${script.category}</span>
                    <h3 class="card-title">${script.title}</h3>
                    <p class="card-author">@${script.author}</p>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- MODAL & COMMENTS LOGIC ---
window.openModal = function(script) {
    document.getElementById('modalTitle').innerText = script.title;
    document.getElementById('modalDesc').innerText = script.description;
    document.getElementById('modalCode').innerText = script.code;
    
    currentScriptTitle = script.title;
    modal.style.display = 'flex';
    listenToComments(currentScriptTitle);
}

window.closeModal = function() {
    modal.style.display = 'none';
    if (unsubscribeComments) unsubscribeComments();
}

function listenToComments(scriptTitle) {
    if (unsubscribeComments) unsubscribeComments();
    commentsList.innerHTML = '<p class="text-muted">Loading network...</p>';

    const q = query(collection(db, `comments_${scriptTitle}`), orderBy("timestamp", "asc"));
    unsubscribeComments = onSnapshot(q, (snapshot) => {
        commentsList.innerHTML = '';
        if (snapshot.empty) {
            commentsList.innerHTML = '<p class="text-muted">No comments yet. Be the first!</p>';
            return;
        }
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const commentDiv = document.createElement('div');
            commentDiv.className = 'comment-box';
            commentDiv.innerHTML = `
                <div class="comment-text">${data.text}</div>
                <button class="btn-delete" onclick="deleteGlobalComment('${docSnap.id}')">Delete</button>
            `;
            commentsList.appendChild(commentDiv);
        });
    });
}

document.getElementById('postCommentBtn')?.addEventListener('click', async () => {
    const text = commentInput.value.trim();
    if (!text || !currentScriptTitle) return;
    commentInput.value = ''; 
    try {
        await addDoc(collection(db, `comments_${currentScriptTitle}`), { text: text, timestamp: serverTimestamp() });
    } catch (e) { console.error(e); }
});

window.deleteGlobalComment = async function(docId) {
    try { await deleteDoc(doc(db, `comments_${currentScriptTitle}`, docId)); } 
    catch (e) { console.error(e); }
}

window.copyCode = function() {
    navigator.clipboard.writeText(document.getElementById('modalCode').innerText)
    .then(() => alert('Source code copied to clipboard!'));
}

// Close modal on outside click
window.onclick = (e) => { if (e.target === modal) closeModal(); }

// Boot
if(document.getElementById('scriptGrid')) initApp();
